import {legacyUsabilityScript} from "./legacy-usability.mjs";

const CHANNEL = "harness-campaign/v2";
const STATE_MESSAGE = "case-state";
export const LEGACY_OBSERVER_SCRIPT_ID = "campaign-progress-script";

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} is required.`);
  return value;
}

function removeScriptById(source, id) {
  const marker = `<script id="${id}">`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Approved compatibility marker is missing: ${id}.`);
  if (source.indexOf(marker, start + marker.length) >= 0) throw new Error(`Expected one compatibility marker: ${id}.`);
  const end = source.indexOf("</script>", start + marker.length);
  if (end < 0) throw new Error(`Compatibility script is not closed: ${id}.`);
  return source.slice(0, start) + source.slice(end + "</script>".length);
}

function replaceOnce(source, before, after, label) {
  const start = source.indexOf(before);
  if (start < 0) throw new Error(`Approved compatibility marker is missing: ${label}.`);
  if (source.indexOf(before, start + before.length) >= 0) throw new Error(`Expected one compatibility marker: ${label}.`);
  return source.slice(0, start) + after + source.slice(start + before.length);
}

function applyServer4Art(source, evidenceArt) {
  const evidenceIds = ["e_monitor", "e_controller", "e_technician", "e_protocol", "e_clocksync"];
  if (!isObject(evidenceArt) || !evidenceIds.every((id) => typeof evidenceArt[id] === "string" && evidenceArt[id].length > 0)) {
    throw new Error("Server 4 requires one approved art asset for every evidence record.");
  }
  const before = "const img={e_monitor:'v34/ledger.jpg',e_controller:'v34/hub.jpg',e_technician:'v34/hub.jpg',e_protocol:'v34/audit.jpg',e_clocksync:'v34/audit.jpg'};";
  const after = `const img={${evidenceIds.map((id) => `${id}:${JSON.stringify(evidenceArt[id])}`).join(",")}};`;
  return replaceOnce(source, before, after, "Server 4 evidence-art map");
}

function repairServer4PhoneText(source) {
  const clamped = ".mc-clue small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}";
  const readable = ".mc-clue small{display:block;-webkit-line-clamp:unset;-webkit-box-orient:initial;overflow:visible}";
  let repaired = replaceOnce(source, clamped, readable, "Server 4 phone evidence text");
  const close = repaired.indexOf("</head>");
  if (close < 0) throw new Error("Server 4 phone repair requires a closing head tag.");
  const css = `<style id="harness-server4-phone-text-repair">dialog{overflow-y:auto;overscroll-behavior:contain}@media(max-width:760px){#panel{padding-bottom:max(24px,calc(env(safe-area-inset-bottom) + 18px))}.selectors{position:relative;z-index:1}}</style>`;
  return repaired.slice(0, close) + css + repaired.slice(close);
}

function injectAssetOverrides(source, overrides) {
  if (!isObject(overrides) || Object.keys(overrides).length === 0) return source;
  for (const [name, value] of Object.entries(overrides)) {
    if (!/^server4\/[a-z0-9-]+\.jpg$/.test(name)) throw new Error(`Unsafe Server 4 asset name: ${name}`);
    if (typeof value !== "string" || !value.startsWith("data:image/jpeg;base64,")) throw new Error(`Invalid Server 4 asset payload: ${name}`);
  }
  const episodeMarker = "window.HarnessEpisode = ";
  const episodeAt = source.indexOf(episodeMarker);
  const scriptAt = source.lastIndexOf("<script", episodeAt);
  if (episodeAt < 0 || scriptAt < 0) throw new Error("Legacy episode payload marker is missing.");
  const encoded = JSON.stringify(overrides).replaceAll("<", "\\u003c");
  const script = `<script id="harness-server4-art">Object.assign(window.HarnessEmbeddedAssets,${encoded});</script>\n`;
  return source.slice(0, scriptAt) + script + source.slice(scriptAt);
}

function bridgeScript(config) {
  const encoded = JSON.stringify({
    channel: CHANNEL,
    type: STATE_MESSAGE,
    caseId: requireString(config.caseId, "caseId"),
    episodeId: requireString(config.episodeId, "episodeId"),
    inspector: requireString(config.inspector, "inspector")
  }).replaceAll("<", "\\u003c");

  return `<script id="harness-campaign-bridge">
(()=>{'use strict';
const CONFIG=${encoded};let previous='';
function publish(){
  try{
    const inspector=window[CONFIG.inspector];
    const snapshot=inspector&&typeof inspector.snapshot==='function'?inspector.snapshot():null;
    const state=snapshot&&snapshot.state;
    if(!state||state.episodeId!==CONFIG.episodeId||typeof state.completed!=='boolean')return;
    const outcomeId=state.outcomeId===null||typeof state.outcomeId==='string'?state.outcomeId:null;
    if(state.completed&&(!outcomeId||outcomeId.length===0))return;
    const message={channel:CONFIG.channel,type:CONFIG.type,caseId:CONFIG.caseId,state:{episodeId:state.episodeId,sceneId:typeof state.sceneId==='string'?state.sceneId:null,completed:state.completed,outcomeId},beat:Number.isInteger(snapshot.beat)&&snapshot.beat>=0?snapshot.beat:0};
    const serialized=JSON.stringify(message);
    if(serialized===previous)return;
    previous=serialized;
    parent.postMessage(message,'*');
  }catch{}
}
const timer=setInterval(publish,250);
window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
publish();
})();
</script>`;
}

export function prepareLegacyHtml(source, config) {
  if (typeof source !== "string" || source.length === 0) throw new TypeError("Legacy HTML source is required.");
  if (!isObject(config)) throw new TypeError("Legacy adapter configuration is required.");
  const inspector = requireString(config.inspector, "inspector");
  if (!source.includes(`window.${inspector}`)) throw new Error(`Approved inspector ${inspector} is missing.`);

  let html = source;
  const transforms = Array.isArray(config.transforms) ? config.transforms : [];
  for (const transform of transforms) {
    if (transform === "remove-legacy-campaign-observer") {
      html = removeScriptById(html, LEGACY_OBSERVER_SCRIPT_ID);
    } else if (transform === "server4-original-art") {
      html = applyServer4Art(html, config.evidenceArt);
    } else if (transform === "server4-phone-text-repair") {
      html = repairServer4PhoneText(html);
    } else {
      throw new Error(`Unknown legacy transform: ${transform}`);
    }
  }

  html = injectAssetOverrides(html, config.assetOverrides);

  const close = html.lastIndexOf("</body>");
  if (close < 0) throw new Error("Legacy HTML has no closing body tag.");
  return html.slice(0, close) + legacyUsabilityScript(config) + bridgeScript(config) + "\n" + html.slice(close);
}

export function normalizeLegacyMessage(value, expectedCaseId, expectedEpisodeId = expectedCaseId) {
  if (!isObject(value) || value.channel !== CHANNEL || value.type !== STATE_MESSAGE) return null;
  if (value.caseId !== expectedCaseId || !isObject(value.state)) return null;
  const state = value.state;
  if (state.episodeId !== expectedEpisodeId || typeof state.completed !== "boolean") return null;
  if (state.sceneId !== null && typeof state.sceneId !== "string") return null;
  if (state.outcomeId !== null && typeof state.outcomeId !== "string") return null;
  if (state.completed && (!state.outcomeId || state.outcomeId.length === 0)) return null;
  return {
    episodeId: state.episodeId,
    sceneId: state.sceneId,
    completed: state.completed,
    outcomeId: state.outcomeId,
    beat: Number.isInteger(value.beat) && value.beat >= 0 ? value.beat : 0
  };
}

export const LEGACY_BRIDGE_PROTOCOL = Object.freeze({channel: CHANNEL, type: STATE_MESSAGE});
