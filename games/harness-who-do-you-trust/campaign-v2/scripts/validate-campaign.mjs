import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const campaignRoot = resolve(here, "..");
const repoRoot = resolve(campaignRoot, "../../..");
const advisorIds = ["boy", "tooth", "darth", "donsol"];
const validRatings = new Set(["strong", "mixed", "weak"]);
const errors = [];

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    errors.push(`${path}: ${error.message}`);
    return null;
  }
}

function requireValue(condition, message) {
  if (!condition) errors.push(message);
}

function unique(values) {
  return new Set(values).size === values.length;
}

function sameMembers(actual, expected) {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function validateFrozenSources() {
  const manifestPath = join(campaignRoot, "frozen-sources.json");
  const manifest = loadJson(manifestPath);
  if (!manifest) return;

  for (const [id, source] of Object.entries(manifest)) {
    if (!source.repositoryPath) continue;
    const path = join(repoRoot, source.repositoryPath);
    try {
      requireValue(
        sha256(path) === source.sha256,
        `${id}: frozen source hash changed; expected ${source.sha256}`
      );
    } catch (error) {
      errors.push(`${id}: cannot read frozen source ${path}: ${error.message}`);
    }
  }
}

function validateCase(caseData, expectedId, expectedLevel) {
  const at = `${expectedId}`;
  if (!caseData) return;

  requireValue(caseData.id === expectedId, `${at}: id must be ${expectedId}`);
  requireValue(caseData.level === expectedLevel, `${at}: level must be ${expectedLevel}`);
  requireValue(caseData.series === "HARNESS: Who Do You Trust?", `${at}: series title mismatch`);
  requireValue(caseData.expectedMinutes >= 15 && caseData.expectedMinutes <= 25, `${at}: expectedMinutes must be 15-25`);
  requireValue(Array.isArray(caseData.briefing?.paragraphs) && caseData.briefing.paragraphs.length >= 2, `${at}: briefing needs at least two paragraphs`);

  requireValue(
    sameMembers(Object.keys(caseData.advisors ?? {}), advisorIds),
    `${at}: advisors must be exactly ${advisorIds.join(", ")}`
  );
  requireValue(
    JSON.stringify(caseData.advisorOrder) === JSON.stringify(advisorIds),
    `${at}: advisorOrder must preserve the approved order`
  );

  const evidence = caseData.evidence ?? [];
  const evidenceIds = evidence.map((item) => item.id);
  requireValue(evidence.length >= 5 && evidence.length <= 8, `${at}: evidence count must be 5-8`);
  requireValue(unique(evidenceIds), `${at}: evidence ids must be unique`);
  requireValue(evidence.some((item) => item.hidden), `${at}: at least one evidence item must be hidden`);
  for (const item of evidence) {
    requireValue(Boolean(item.proves), `${at}/${item.id}: missing proves statement`);
    requireValue(Boolean(item.doesNotProve), `${at}/${item.id}: missing doesNotProve statement`);
    requireValue(Array.isArray(item.body) && item.body.length > 0, `${at}/${item.id}: evidence body is empty`);
  }

  for (const advisorId of advisorIds) {
    const variants = caseData.advice?.[advisorId] ?? [];
    requireValue(variants.length >= 2, `${at}: ${advisorId} needs at least two advice variants`);
    for (const variant of variants) {
      for (const evidenceId of variant.when?.inspected ?? []) {
        requireValue(evidenceIds.includes(evidenceId), `${at}/${variant.id}: unknown inspected evidence ${evidenceId}`);
      }
      for (const evidenceId of variant.reveals ?? []) {
        requireValue(evidenceIds.includes(evidenceId), `${at}/${variant.id}: unknown revealed evidence ${evidenceId}`);
      }
    }
  }

  const trust = caseData.trustJudgment;
  requireValue(["select_one", "select_two", "weigh_each"].includes(trust?.mode), `${at}: invalid trust mode`);
  const trustAdvisorIds = (trust?.options ?? []).map((item) => item.advisorId);
  requireValue(sameMembers(trustAdvisorIds, advisorIds), `${at}: trust options must cover each adviser exactly once`);
  for (const option of trust?.options ?? []) {
    for (const evidenceId of option.reveals ?? []) {
      requireValue(evidenceIds.includes(evidenceId), `${at}/trust/${option.advisorId}: unknown revealed evidence ${evidenceId}`);
    }
  }

  const decisions = caseData.decisions ?? [];
  const decisionIds = decisions.map((item) => item.id);
  requireValue(decisions.length === 4, `${at}: exactly four decisions are required`);
  requireValue(unique(decisionIds), `${at}: decision ids must be unique`);
  for (const decision of decisions) {
    requireValue(Boolean(decision.outcome?.heading), `${at}/${decision.id}: missing outcome heading`);
    requireValue(Boolean(decision.outcome?.text), `${at}/${decision.id}: missing outcome text`);
    requireValue(
      sameMembers(Object.keys(decision.outcome?.trustVariants ?? {}), advisorIds),
      `${at}/${decision.id}: trustVariants must cover each adviser`
    );
    for (const evidenceId of decision.requires?.evidence ?? []) {
      requireValue(evidenceIds.includes(evidenceId), `${at}/${decision.id}: unknown required evidence ${evidenceId}`);
    }
    for (const advisorId of decision.requires?.trustedAdvisors ?? []) {
      requireValue(advisorIds.includes(advisorId), `${at}/${decision.id}: unknown trusted adviser ${advisorId}`);
    }
  }

  const postmortemIds = Object.keys(caseData.postmortem ?? {});
  requireValue(sameMembers(postmortemIds, decisionIds), `${at}: postmortem keys must match decision ids`);
  for (const decisionId of decisionIds) {
    const postmortem = caseData.postmortem?.[decisionId];
    requireValue(Array.isArray(postmortem?.known) && postmortem.known.length > 0, `${at}/${decisionId}: postmortem needs known facts`);
    requireValue(Array.isArray(postmortem?.unknown) && postmortem.unknown.length > 0, `${at}/${decisionId}: postmortem needs remaining unknowns`);
    requireValue(
      sameMembers(Object.keys(postmortem?.advisors ?? {}), advisorIds),
      `${at}/${decisionId}: adviser grades must cover all four advisers`
    );
    for (const advisorId of advisorIds) {
      const grade = postmortem?.advisors?.[advisorId];
      requireValue(validRatings.has(grade?.rating), `${at}/${decisionId}/${advisorId}: invalid rating`);
      requireValue(Boolean(grade?.text), `${at}/${decisionId}/${advisorId}: missing grade explanation`);
    }
  }

  requireValue((caseData.presentation?.tasks ?? []).length >= 4, `${at}: presentation needs at least four tasks`);
  requireValue(Object.keys(caseData.presentation?.glossary ?? {}).length >= 3, `${at}: glossary needs at least three definitions`);
}

const campaign = loadJson(join(campaignRoot, "campaign.json"));
if (campaign) {
  const expectedOrder = ["episode-001", "episode-002", "episode-003", "episode-004", "episode-005"];
  requireValue(JSON.stringify(campaign.caseOrder) === JSON.stringify(expectedOrder), "campaign: caseOrder must be episode-001 through episode-005");
  requireValue((campaign.cases ?? []).length === 5, "campaign: exactly five cases are required");

  for (const entry of campaign.cases ?? []) {
    requireValue(entry.episodeId === entry.id, `${entry.id}: episodeId must match the case id`);
    requireValue(Number.isInteger(entry.contentVersion) && entry.contentVersion > 0, `${entry.id}: contentVersion must be a positive integer`);
    requireValue(typeof entry.tagline === "string" && entry.tagline.length >= 20, `${entry.id}: campaign card needs a useful tagline`);
    requireValue(entry.launch === null || typeof entry.launch === "string", `${entry.id}: launch must be null or a route string`);
    try {
      const sourcePath = resolve(campaignRoot, entry.source);
      requireValue(sha256(sourcePath) === entry.contentHash, `${entry.id}: contentHash does not match ${entry.source}`);
    } catch (error) {
      errors.push(`${entry.id}: cannot hash campaign source ${entry.source}: ${error.message}`);
    }

    if (entry.launch !== null) {
      requireValue(entry.runtime?.kind === "legacy-monolith", `${entry.id}: connected launch must use the approved legacy-monolith adapter`);
      requireValue(typeof entry.runtime?.source === "string", `${entry.id}: runtime source is required`);
      requireValue(typeof entry.runtime?.sourceHash === "string" && entry.runtime.sourceHash.length === 64, `${entry.id}: runtime sourceHash is required`);
      requireValue(entry.runtime?.inspector === "HarnessV34", `${entry.id}: approved read-only inspector must be HarnessV34`);
      requireValue(Array.isArray(entry.runtime?.transforms), `${entry.id}: runtime transforms must be an array`);
      try {
        const runtimePath = resolve(campaignRoot, entry.runtime.source);
        requireValue(sha256(runtimePath) === entry.runtime.sourceHash, `${entry.id}: runtime fingerprint does not match ${entry.runtime.source}`);
      } catch (error) {
        errors.push(`${entry.id}: cannot hash runtime source ${entry.runtime?.source}: ${error.message}`);
      }
    }
  }

  const connected = (campaign.cases ?? []).filter((entry) => entry.launch !== null).map((entry) => entry.id);
  requireValue(JSON.stringify(connected) === JSON.stringify(["episode-001", "episode-002"]), "campaign: only approved Cases 1 and 2 may be connected at this checkpoint");
  const level1Runtime = campaign.cases?.find((entry) => entry.id === "episode-001")?.runtime;
  requireValue(
    JSON.stringify(level1Runtime?.transforms) === JSON.stringify(["remove-legacy-campaign-observer", "server4-original-art"]),
    "episode-001: only the observer repair and original-art map may transform the approved runtime"
  );
  const level1ArtIds = ["e_monitor", "e_controller", "e_technician", "e_protocol", "e_clocksync"];
  requireValue(
    JSON.stringify(Object.keys(level1Runtime?.art ?? {})) === JSON.stringify(level1ArtIds),
    "episode-001: original art must cover all five evidence records in order"
  );
  const artAssets = [];
  for (const evidenceId of level1ArtIds) {
    const art = level1Runtime?.art?.[evidenceId];
    requireValue(/^server4\/[a-z0-9-]+\.jpg$/.test(art?.asset ?? ""), `episode-001/${evidenceId}: unsafe runtime asset name`);
    requireValue(typeof art?.sourceHash === "string" && art.sourceHash.length === 64, `episode-001/${evidenceId}: art fingerprint is required`);
    if (art?.asset) artAssets.push(art.asset);
    try {
      const artPath = resolve(campaignRoot, art.source);
      requireValue(sha256(artPath) === art.sourceHash, `episode-001/${evidenceId}: original art fingerprint changed`);
    } catch (error) {
      errors.push(`episode-001/${evidenceId}: cannot read original art ${art?.source}: ${error.message}`);
    }
  }
  requireValue(unique(artAssets), "episode-001: every evidence record must have distinct original art");

  for (const level of [3, 4, 5]) {
    const id = `episode-00${level}`;
    const caseData = loadJson(join(campaignRoot, "data", `${id}.json`));
    validateCase(caseData, id, level);
    const expectedRequires = level === 3 ? "episode-002" : `episode-00${level - 1}`;
    const expectedUnlocks = level === 5 ? null : `episode-00${level + 1}`;
    requireValue(caseData?.progression?.requires === expectedRequires, `${id}: progression.requires must be ${expectedRequires}`);
    requireValue(caseData?.progression?.unlocks === expectedUnlocks, `${id}: progression.unlocks must be ${expectedUnlocks}`);
  }
}

validateFrozenSources();

if (errors.length) {
  console.error(`HARNESS campaign validation failed (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("HARNESS campaign validation passed: five-case manifest, two approved runtime ports, Levels 3-5 content, progression, and frozen-source fingerprints.");
