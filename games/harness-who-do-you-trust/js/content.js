// Loads and validates episode content. Paths are relative so the same files work on GitHub Pages
// and from Capacitor's bundled web assets — no server, no absolute URLs.

export async function loadEpisode(path = 'data/episode-001.json') {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  const episode = await response.json();
  const problems = validateEpisode(episode);
  if (problems.length) throw new Error(`Episode content is invalid:\n${problems.join('\n')}`);
  return episode;
}

/** Structural checks shared by the loader and the test suite. Returns a list of problems. */
export function validateEpisode(ep) {
  const problems = [];
  const evidenceIds = new Set(ep.evidence?.map(e => e.id));
  const decisionIds = new Set(ep.decisions?.map(d => d.id));
  const need = (cond, msg) => { if (!cond) problems.push(msg); };

  need(ep.id && ep.version, 'missing id/version');
  need(ep.evidence?.length >= 3 && ep.evidence.length <= 5, 'evidence count out of range');
  for (const id of ep.advisorOrder ?? []) {
    need(ep.advisors?.[id], `advisor ${id} has no profile`);
    const variants = ep.advice?.[id] ?? [];
    need(variants.length, `advisor ${id} has no advice`);
    need(variants.length && Object.keys(variants.at(-1).when ?? {}).length === 0, `advisor ${id}: last advice variant must be unconditional`);
    for (const v of variants) {
      for (const e of [...(v.when?.inspected ?? []), ...(v.reveals ?? [])]) need(evidenceIds.has(e), `advice ${v.id} references unknown evidence ${e}`);
    }
  }
  for (const e of ep.hybridUnlock?.inspected ?? []) need(evidenceIds.has(e), `hybridUnlock references unknown evidence ${e}`);
  need(ep.decisions?.filter(d => d.requiresHybrid).length === 1, 'exactly one hybrid decision expected');
  for (const id of decisionIds) {
    const pm = ep.postmortem?.[id];
    need(pm?.unknown?.length, `decision ${id} has no "unknown" postmortem lines`);
    for (const a of ep.advisorOrder ?? []) need(pm?.advisors?.[a]?.text, `decision ${id} postmortem missing adviser ${a}`);
  }
  return problems;
}
