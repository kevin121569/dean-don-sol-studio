export const SAVE_SCHEMA = "harness.save/2";
export const PROGRESS_SCHEMA = "harness.progress/2";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

function safeParse(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = JSON.parse(value);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function safeStorage(backend) {
  return {
    get(key) {
      try { return backend?.getItem(key) ?? null; }
      catch { return null; }
    },
    set(key, value) {
      try {
        if (!backend) return false;
        backend.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try { backend?.removeItem(key); return true; }
      catch { return false; }
    }
  };
}

function normalizeManifest(manifest) {
  if (!isObject(manifest) || !Array.isArray(manifest.caseOrder) || !Array.isArray(manifest.cases)) {
    throw new TypeError("A campaign manifest with caseOrder and cases is required.");
  }
  const caseIds = manifest.cases.map((item) => item.id);
  if (caseIds.length === 0 || new Set(caseIds).size !== caseIds.length) {
    throw new TypeError("Campaign case ids must be non-empty and unique.");
  }
  if (manifest.caseOrder.length !== caseIds.length || !manifest.caseOrder.every((id) => caseIds.includes(id))) {
    throw new TypeError("caseOrder must contain every campaign case exactly once.");
  }
  return {
    ...manifest,
    progression: {
      completionKey: "harness-campaign:v2:completed",
      caseSavePrefix: "harness-campaign:v2:case:",
      ...(manifest.progression ?? {})
    }
  };
}

function validProgress(raw, caseIds) {
  if (!isObject(raw) || raw.schema !== PROGRESS_SCHEMA || !isObject(raw.cases)) return null;
  if (!Object.keys(raw.cases).every((id) => caseIds.includes(id))) return null;
  const cases = {};
  for (const id of caseIds) {
    const item = raw.cases[id];
    if (item === undefined) continue;
    if (!isObject(item) || typeof item.completed !== "boolean") return null;
    if (item.outcomeId !== null && typeof item.outcomeId !== "string") return null;
    cases[id] = {
      completed: item.completed,
      outcomeId: item.outcomeId ?? null,
      bestReached: Boolean(item.bestReached),
      contentVersion: item.contentVersion ?? null
    };
  }
  for (let index = 0; index < caseIds.length; index++) {
    const item = cases[caseIds[index]];
    if (!item?.completed) continue;
    if (typeof item.outcomeId !== "string" || item.outcomeId.length === 0) return null;
    if (index > 0 && cases[caseIds[index - 1]]?.completed !== true) return null;
  }
  return {schema: PROGRESS_SCHEMA, cases};
}

function validEnvelope(raw, expected) {
  if (!isObject(raw) || raw.schema !== SAVE_SCHEMA || !isObject(raw.session)) return null;
  if (raw.caseId !== expected.caseId || raw.episodeId !== expected.episodeId) return null;
  if (raw.contentVersion !== expected.contentVersion || raw.contentHash !== expected.contentHash) return null;
  if (raw.session.episodeId !== expected.episodeId || typeof raw.session.completed !== "boolean") return null;
  if (raw.session.outcomeId !== null && typeof raw.session.outcomeId !== "string") return null;
  return clone(raw);
}

export function createCampaignStore(manifestInput, backend) {
  const manifest = normalizeManifest(manifestInput);
  if (backend === undefined) {
    try { backend = globalThis.localStorage; }
    catch { backend = null; }
  }
  const storage = safeStorage(backend);
  const caseById = new Map(manifest.cases.map((item) => [item.id, item]));
  const caseIds = manifest.caseOrder.slice();
  const progressKey = manifest.progression.completionKey;
  const savePrefix = manifest.progression.caseSavePrefix;
  const saveKey = (caseId) => `${savePrefix}${caseId}`;

  function metadata(caseId, overrides = {}) {
    const item = caseById.get(caseId);
    if (!item) throw new RangeError(`Unknown campaign case: ${caseId}`);
    return {
      caseId,
      episodeId: overrides.episodeId ?? caseId,
      contentVersion: overrides.contentVersion ?? item.contentVersion ?? 1,
      contentHash: overrides.contentHash ?? item.runtime?.sourceHash ?? item.contentHash ?? `manifest:${manifest.version ?? 1}:${caseId}`
    };
  }

  function readProgressOnly() {
    return validProgress(safeParse(storage.get(progressKey)), caseIds);
  }

  function rebuildProgress() {
    const cases = {};
    for (const [index, caseId] of caseIds.entries()) {
      const item = caseById.get(caseId);
      const expected = metadata(caseId, {
        episodeId: item.episodeId ?? caseId,
        contentVersion: item.contentVersion ?? 1
      });
      const envelope = validEnvelope(safeParse(storage.get(saveKey(caseId))), expected);
      if (!envelope?.session.completed) continue;
      if (index > 0 && cases[caseIds[index - 1]]?.completed !== true) continue;
      cases[caseId] = {
        completed: true,
        outcomeId: envelope.session.outcomeId,
        bestReached: Boolean(envelope.bestReached),
        contentVersion: envelope.contentVersion
      };
    }
    const progress = {schema: PROGRESS_SCHEMA, cases};
    storage.set(progressKey, JSON.stringify(progress));
    return progress;
  }

  function loadProgress() {
    return clone(readProgressOnly() ?? rebuildProgress());
  }

  function writeProgress(progress) {
    const normalized = validProgress(progress, caseIds);
    if (!normalized) return false;
    return storage.set(progressKey, JSON.stringify(normalized));
  }

  function caseStatus(caseId) {
    const position = caseIds.indexOf(caseId);
    if (position < 0) throw new RangeError(`Unknown campaign case: ${caseId}`);
    const progress = loadProgress();
    const completed = progress.cases[caseId]?.completed === true;
    const unlocked = position === 0 || progress.cases[caseIds[position - 1]]?.completed === true;
    if (!unlocked) return "locked";
    if (completed) return "completed";
    return loadCase(caseId) === null ? "available" : "in_progress";
  }

  function listCases() {
    const progress = loadProgress();
    return caseIds.map((caseId, index) => {
      const entry = caseById.get(caseId);
      const completed = progress.cases[caseId]?.completed === true;
      const unlocked = index === 0 || progress.cases[caseIds[index - 1]]?.completed === true;
      const hasSave = loadCase(caseId) !== null;
      return {
        ...clone(entry),
        status: !unlocked ? "locked" : completed ? "completed" : hasSave ? "in_progress" : "available",
        unlocked,
        completed,
        outcomeId: progress.cases[caseId]?.outcomeId ?? null,
        bestReached: Boolean(progress.cases[caseId]?.bestReached)
      };
    });
  }

  function loadCase(caseId, overrides = {}) {
    const expected = metadata(caseId, overrides);
    return validEnvelope(safeParse(storage.get(saveKey(caseId))), expected);
  }

  function saveCase(caseId, session, options = {}) {
    const expected = metadata(caseId, options);
    if (caseStatus(caseId) === "locked") return false;
    if (!isObject(session) || session.episodeId !== expected.episodeId || typeof session.completed !== "boolean") return false;
    if (session.outcomeId !== null && typeof session.outcomeId !== "string") return false;
    const envelope = {
      schema: SAVE_SCHEMA,
      ...expected,
      session: clone(session),
      beat: Number.isInteger(options.beat) && options.beat >= 0 ? options.beat : 0,
      uxSignals: isObject(options.uxSignals) ? clone(options.uxSignals) : {},
      bestReached: Boolean(options.bestReached)
    };
    if (!storage.set(saveKey(caseId), JSON.stringify(envelope))) return false;
    if (session.completed) completeCase(caseId, session.outcomeId, options);
    return true;
  }

  function completeCase(caseId, outcomeId, options = {}) {
    if (!caseById.has(caseId) || typeof outcomeId !== "string" || outcomeId.length === 0) return false;
    const progress = loadProgress();
    const position = caseIds.indexOf(caseId);
    if (position > 0 && progress.cases[caseIds[position - 1]]?.completed !== true) return false;
    const prior = progress.cases[caseId];
    const expected = metadata(caseId);
    progress.cases[caseId] = {
      completed: true,
      outcomeId,
      bestReached: Boolean(options.bestReached || prior?.bestReached),
      contentVersion: expected.contentVersion
    };
    return writeProgress(progress);
  }

  function resetCase(caseId) {
    if (!caseById.has(caseId)) return false;
    return storage.remove(saveKey(caseId));
  }

  function resetCampaign() {
    for (const caseId of caseIds) storage.remove(saveKey(caseId));
    return storage.remove(progressKey);
  }

  return Object.freeze({
    manifest: clone(manifest),
    progressKey,
    saveKey,
    listCases,
    caseStatus,
    loadProgress,
    rebuildProgress,
    loadCase,
    saveCase,
    completeCase,
    resetCase,
    resetCampaign
  });
}

export function emitCaseCompleted(target, detail) {
  if (!target || typeof target.dispatchEvent !== "function") return false;
  if (!isObject(detail) || typeof detail.caseId !== "string" || typeof detail.outcomeId !== "string") return false;
  const EventClass = globalThis.CustomEvent;
  const event = typeof EventClass === "function"
    ? new EventClass("harness:case-completed", {detail: clone(detail)})
    : Object.freeze({type: "harness:case-completed", detail: clone(detail)});
  return target.dispatchEvent(event) !== false;
}
