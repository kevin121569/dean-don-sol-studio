import {createCampaignStore} from "../runtime/campaign-store.mjs";

const statusCopy = {
  locked: "LOCKED",
  available: "AVAILABLE",
  in_progress: "IN PROGRESS",
  completed: "SOLVED"
};

const actionCopy = {
  locked: "COMPLETE THE PREVIOUS CASE",
  available: "BEGIN CASE",
  in_progress: "RESUME CASE",
  completed: "PLAY AGAIN"
};

const $ = (id) => document.getElementById(id);

async function loadManifest() {
  const response = await fetch("../campaign.json", {cache: "no-store"});
  if (!response.ok) throw new Error(`Campaign manifest failed to load (${response.status}).`);
  return response.json();
}

function showMessage(text) {
  const message = $("campaignMessage");
  message.textContent = text;
  message.hidden = false;
}

function routeToCase(item) {
  if (!item.launch) {
    showMessage(`${item.title} is not connected to the new renderer yet. This integration shell will not substitute an older game or package an incomplete APK.`);
    return;
  }
  location.assign(item.launch);
}

function render(store) {
  const cases = store.listCases();
  const solved = cases.filter((item) => item.completed).length;
  $("solvedCount").textContent = `${solved} / ${cases.length}`;
  $("progressBar").style.width = `${cases.length ? solved / cases.length * 100 : 0}%`;

  const list = $("caseList");
  const map = $("caseMapList");
  const template = $("caseTemplate");
  list.replaceChildren();
  map.replaceChildren();

  for (const item of cases) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.id = `case-card-${item.level}`;
    node.dataset.status = item.status;
    node.querySelector(".case-number").textContent = item.completed ? "✓" : item.level;
    node.querySelector(".case-label").textContent = `CASE ${item.level} OF ${cases.length}`;
    node.querySelector(".case-status").textContent = statusCopy[item.status];
    node.querySelector("h3").textContent = item.title;
    node.querySelector(".case-tagline").textContent = item.tagline;

    const button = node.querySelector(".case-action");
    button.textContent = item.unlocked && !item.launch ? "PLAYABLE PORT PENDING" : actionCopy[item.status];
    button.disabled = !item.unlocked || !item.launch;
    button.setAttribute("aria-label", `${button.textContent}: ${item.title}`);
    button.addEventListener("click", () => routeToCase(item));
    list.append(node);

    const mapItem = document.createElement("li");
    mapItem.dataset.status = item.status;
    const mapButton = document.createElement("button");
    mapButton.type = "button";
    mapButton.className = "case-map-button";
    mapButton.innerHTML = `<span>${item.completed ? "✓" : item.level}</span><small>CASE ${item.level}</small>`;
    mapButton.setAttribute("aria-label", `Show Case ${item.level}: ${item.title} (${statusCopy[item.status]})`);
    mapButton.addEventListener("click", () => node.scrollIntoView({behavior: "smooth", block: "start"}));
    mapItem.append(mapButton);
    map.append(mapItem);
  }
}

async function start() {
  try {
    const manifest = await loadManifest();
    const store = createCampaignStore(manifest);
    window.addEventListener("harness:case-completed", (event) => {
      const {caseId, outcomeId, bestReached = false, contentVersion} = event.detail ?? {};
      if (store.completeCase(caseId, outcomeId, {bestReached, contentVersion})) render(store);
    });
    window.HarnessCampaign = Object.freeze({
      snapshot: () => ({cases: store.listCases(), progress: store.loadProgress()}),
      refresh: () => render(store)
    });
    render(store);
  } catch (error) {
    showMessage(error instanceof Error ? error.message : "The campaign could not start.");
  }
}

start();
