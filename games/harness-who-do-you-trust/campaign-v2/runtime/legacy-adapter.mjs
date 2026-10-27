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
    } else {
      throw new Error(`Unknown legacy transform: ${transform}`);
    }
  }

  const close = html.lastIndexOf("</body>");
  if (close < 0) throw new Error("Legacy HTML has no closing body tag.");
  return html.slice(0, close) + bridgeScript(config) + "\n" + html.slice(close);
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
