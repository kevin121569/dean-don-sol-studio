// Mission-report recognition: no new game rules, score, hidden telemetry, or save fields.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildMissionReport} from '../creative/mission-report.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const episode=JSON.parse(fs.readFileSync(path.join(root,'data/episode-001.json'),'utf8'));
const sample=(outcomeId, inspectedSources=[], consultationIds=[])=>({
  completed:true,outcomeId,inspectedSources,
  consultations:consultationIds.map(advisorId=>({advisorId,adviceId:'example'})),
});

test('mission report only renders for completed known decisions',()=>{
  assert.equal(buildMissionReport({completed:false,outcomeId:episode.decisions[0].id},episode),null);
  assert.equal(buildMissionReport({completed:true,outcomeId:'not-a-decision'},episode),null);
});

test('all decisions complete a mission; NONE is automatically called a victory',()=>{
  for(const d of episode.decisions){
    const r=buildMissionReport(sample(d.id),episode);
    assert.equal(r.label,'MISSION COMPLETE');
    assert.match(r.note,/not the same as being right/);
    assert.equal(r.decision.label,d.label);
    assert.equal(r.decision.risk,d.risk);
    assert(!Object.hasOwn(r,'score'));
    assert(!Object.hasOwn(r,'won'));
  }
});

test('awards recognise recorded actions, never lucky outcomes',()=>{
  const allEvidence=episode.evidence.map(e=>e.id);
  const allAdvisers=[...episode.advisorOrder];
  const d=episode.decisions.find(d=>!d.requiresHybrid);
  const r=buildMissionReport(sample(d.id,[...allEvidence,allEvidence[0],'bogus'],[...allAdvisers,allAdvisers[0],'bogus']),episode);
  assert.deepEqual(r.evidence,{done:allEvidence.length,total:allEvidence.length});
  assert.deepEqual(r.advisers,{done:allAdvisers.length,total:allAdvisers.length});
  assert.deepEqual(r.honours.map(h=>h.id),['evidence','perspectives']);
});

test('hidden strategy requires choosing its decision with the original evidence unlock',()=>{
  const d=episode.decisions.find(d=>d.requiresHybrid);
  assert(d,'Episode 1 must have an evidence-gated decision');
  const without=buildMissionReport(sample(d.id),episode);
  assert(!without.honours.some(h=>h.id==='strategy'));
  const withEvidence=buildMissionReport(sample(d.id,episode.hybridUnlock.inspected),episode);
  assert(withEvidence.honours.some(h=>h.id==='strategy'));
  const other=episode.decisions.find(x=>!x.requiresHybrid);
  const otherReport=buildMissionReport(sample(other.id,episode.hybridUnlock.inspected),episode);
  assert(!otherReport.honours.some(h=>h.id==='strategy'));
});

test('module cannot mutate state and remains deterministic',()=>{
  const s=sample(episode.decisions[0].id,[episode.evidence[0].id],['boy']);
  const before=structuredClone(s);
  assert.deepEqual(buildMissionReport(s,episode),buildMissionReport(s,episode));
  assert.deepEqual(s,before);
});

test('onboarding states the goal and postmortem renders the mission report without touching engine',()=>{
  const app=fs.readFileSync(path.join(root,'js/app.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'css/game.css'),'utf8');
  assert.match(app,/import \{buildMissionReport\} from '\.\.\/creative\/mission-report\.js'/);
  assert.match(app,/How do you win\?/);
  assert.match(app,/class="panel mission-report"/);
  assert.match(app,/What remained unknown/);
  assert.match(css,/\.mission-report/);
});
