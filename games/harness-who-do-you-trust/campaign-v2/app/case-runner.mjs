import {createCampaignStore, emitCaseCompleted} from "../runtime/campaign-store.mjs";
import {normalizeLegacyMessage, prepareLegacyHtml} from "../runtime/legacy-adapter.mjs";

const manifestUrl = new URL("../campaign.json", import.meta.url);
const frame = document.getElementById("caseFrame");
const runner = document.getElementById("runner");
const loading = document.getElementById("loading");
const errorPanel = document.getElementById("runnerError");
const errorText = document.getElementById("errorText");
const caseLabel = document.getElementById("caseLabel");
const caseTitle = document.getElementById("caseTitle");
const saveStatus = document.getElementById("saveStatus");
const returnLink = document.getElementById("returnLink");

function fail(message) {
  loading.hidden = true;
  frame.hidden = true;
  errorText.textContent = message;
  errorPanel.hidden = false;
  runner.setAttribute("aria-busy", "false");
  saveStatus.textContent = "BLOCKED";
}

async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error("This browser cannot verify the approved case fingerprint.");
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function loadJson(url) {
  const response = await fetch(url, {cache: "no-store"});
  if (!response.ok) throw new Error(`Campaign file failed to load (${response.status}).`);
  return response.json();
}

async function start() {
  const requestedId = new URL(location.href).searchParams.get("case");
  if (!requestedId) return fail("No case was selected.");

  try {
    const manifest = await loadJson(manifestUrl);
    const item = manifest.cases.find((entry) => entry.id === requestedId);
    if (!item) return fail("That case is not part of this campaign.");

    const store = createCampaignStore(manifest);
    if (store.caseStatus(item.id) === "locked") return fail("Complete the previous case before opening this one.");
    if (!item.runtime || item.runtime.kind !== "legacy-monolith") return fail("This case has not passed the playable integration gate yet.");

    caseLabel.textContent = `CASE ${item.level} OF ${manifest.cases.length}`;
    caseTitle.textContent = item.title;
    document.title = `HARNESS · Case ${item.level} · ${item.title}`;
    frame.title = `HARNESS Case ${item.level}: ${item.title}`;

    const sourceUrl = new URL(item.runtime.source, manifestUrl);
    const sourceResponse = await fetch(sourceUrl, {cache: "no-store"});
    if (!sourceResponse.ok) throw new Error(`Approved case source failed to load (${sourceResponse.status}).`);
    const source = await sourceResponse.text();
    const actualHash = await sha256(source);
    if (actualHash !== item.runtime.sourceHash) throw new Error("The case source fingerprint does not match the approved version.");

    let completionAnnounced = false;
    window.addEventListener("harness:case-completed", (event) => {
      const detail = event.detail ?? {};
      if (detail.caseId !== item.id) return;
      store.completeCase(item.id, detail.outcomeId, {bestReached: detail.bestReached});
      saveStatus.textContent = "CASE COMPLETE";
      saveStatus.dataset.complete = "true";
      returnLink.hidden = false;
    });

    window.addEventListener("message", (event) => {
      if (event.source !== frame.contentWindow) return;
      const snapshot = normalizeLegacyMessage(event.data, item.id, item.episodeId);
      if (!snapshot) return;
      store.saveCase(item.id, {
        episodeId: snapshot.episodeId,
        sceneId: snapshot.sceneId,
        completed: snapshot.completed,
        outcomeId: snapshot.outcomeId
      }, {beat: snapshot.beat});
      if (snapshot.completed && !completionAnnounced) {
        completionAnnounced = true;
        emitCaseCompleted(window, {caseId: item.id, outcomeId: snapshot.outcomeId, bestReached: false});
      } else if (!snapshot.completed) {
        saveStatus.textContent = "SAVED ON DEVICE";
      }
    });

    frame.srcdoc = prepareLegacyHtml(source, {
      caseId: item.id,
      episodeId: item.episodeId,
      inspector: item.runtime.inspector,
      transforms: item.runtime.transforms
    });
    loading.hidden = true;
    frame.hidden = false;
    runner.setAttribute("aria-busy", "false");
    saveStatus.textContent = "APPROVED SOURCE";

    window.HarnessCampaignRunner = Object.freeze({
      caseId: item.id,
      sourceHash: actualHash,
      snapshot: () => ({case: store.listCases().find((entry) => entry.id === item.id), save: store.loadCase(item.id)})
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : "The approved case could not start.");
  }
}

start();
