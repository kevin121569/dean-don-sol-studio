// Local telemetry event interface (packet §10). Nothing leaves the device in v0.1.
// Events are kept separate from game state so analytics can be added later by adding a sink,
// without touching game logic. No personal data: only ids from episode content.

export const EVENT_TYPES = Object.freeze([
  'episode_start',
  'evidence_open',
  'advisor_consult',
  'decision_submit',
  'episode_complete',
  'help_open',
]);

/**
 * @param {{episodeId:string, sinks?:Array<(event:object)=>void>, now?:()=>number, limit?:number}} options
 */
export function createTelemetry({episodeId, sinks = [], now = () => Date.now(), limit = 200}) {
  const buffer = [];
  return {
    track(type, fields = {}) {
      if (!EVENT_TYPES.includes(type)) throw new Error(`Unknown telemetry event: ${type}`);
      const event = Object.freeze({...fields, type, episode: episodeId, timestamp: new Date(now()).toISOString()});
      buffer.push(event);
      if (buffer.length > limit) buffer.shift();
      for (const sink of sinks) { try { sink(event); } catch { /* a broken sink must never break play */ } }
      return event;
    },
    events: () => [...buffer],
    clear: () => { buffer.length = 0; },
  };
}

/** Browser sink: re-dispatches each event so dev tools or a future analytics adapter can listen. */
export const domEventSink = target => event => target.dispatchEvent(new CustomEvent('harness:telemetry', {detail: event}));
