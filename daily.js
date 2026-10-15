'use strict';
(() => {
 const host=document.getElementById('daily'), data=window.DAILY_RESULTS;
 const models=Object.keys(data.models), names=Object.fromEntries(data.coverage.map(r=>[r.provider,r.model]));
 const $=id=>document.getElementById(id), safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let family=1, variation=0, stage='initial_only', selected='all', paused=true;
 const fmt=x=>Number.isFinite(x)?x.toFixed(1):'—';
 const ci=r=>`95% interval ${fmt(r.ci_low)}–${fmt(r.ci_high)}%`;
 const visibleModels=()=>selected==='all'?models:[selected];
 const rate=(p,id,a)=>data.choice_rates.find(r=>r.provider===p&&r.analysis===stage&&r.scenario_id===id&&r.action===a);
 const coverage=(p,id)=>data.coverage.find(r=>r.provider===p&&r.analysis===stage&&r.scenario_id===id);
 const icon=p=>`<svg viewBox="-25 -35 50 65" aria-hidden="true"><g fill="white" stroke="currentColor" stroke-width="1.4">${p==='anthropic'?'<rect x="-12" y="-27" width="24" height="24" rx="4"/>':p==='jev'?'<path d="M0-30L15-4H-15Z"/>':p==='xai'?'<path d="M0-29L15-15 0-1-15-15Z"/>':'<circle cy="-15" r="13"/>'}<path d="M-6-2L-10 16M6-2L10 16M-8 3L-17-3M8 3L17-3"/><circle cx="-4" cy="-15" r=".8" fill="currentColor"/><circle cx="4" cy="-15" r=".8" fill="currentColor"/></g></svg>`;
 host.innerHTML=`<div class="daily-toolbar"><label>Scenario <select id="daily-family">${data.designs.map(d=>`<option value="${d.n}">${safe(d.name)}</option>`).join('')}</select></label><label>Models <select id="daily-model"><option value="all">Compare all four</option>${models.map(p=>`<option value="${p}">${safe(names[p])}</option>`).join('')}</select></label><button id="daily-play">Play</button><button id="daily-next">Next →</button></div><div class="daily-variations" role="group" aria-label="Scenario variation">${[0,1,2,3].map(i=>`<button data-variation="${i}" aria-pressed="false">${i+1}</button>`).join('')}<span class="note">Same situation, different details</span></div><div class="daily-scene"><div><p id="daily-count" class="eyebrow"></p><div id="daily-prompt"></div><div id="daily-options"></div></div><div class="daily-observation"><h2>Recorded choices</h2><p class="note" id="daily-chart-note"></p><div id="daily-agents"></div><div id="daily-rates"></div></div></div><section class="scores"><h2>Preferences in six tradeoffs</h2><p class="note">0–100% choosing the named action in its designated conflict scenario. These are separate scenario scores, not an overall morality or alignment score.</p><div class="table-scroll" id="daily-profiles"></div></section><details class="daily-details"><summary>What changes when the details change?</summary><p class="note">Change in selection, in percentage points, when each factor changes from low to high. Results shown for this scenario family.</p><label>Action <select id="daily-effect-action"></select></label><div class="table-scroll" id="daily-effects"></div></details><details class="daily-details"><summary>Coverage and methods · 9,594 / 9,600 valid answers</summary><label>Answers included <select id="daily-stage"><option value="initial_only">Initial answers</option><option value="initial_plus_recovered">Initial + recovered answers</option></select></label><p class="note">Both views are identical: no recovered choices were needed. Six interrupted requests remain missing and are excluded from choice-rate denominators.</p><p class="note">Scores weight each counterbalanced option order equally. A, B and C here always refer to the actions printed above, regardless of their order in the API request.</p><p class="note">Intervals are conservative pointwise 95% intervals for repeated calls to these fixed prompts, not for unseen dilemmas. Jev is exploratory: its native structured interface differs from the other models.</p><div id="daily-coverage" class="table-scroll"></div></details>`;
 function current(){return data.scenarios.filter(s=>Number(s.base_scenario_id.slice(1))===family)[variation]}
 function render(){
  const q=current(), parts=q.scenario_text.split('\n\n');
  $('daily-family').value=family;
  host.querySelectorAll('[data-variation]').forEach(b=>b.setAttribute('aria-pressed',Number(b.dataset.variation)===variation));
  $('daily-count').textContent=`${q.scenario_id} · variation ${variation+1} of 4`;
  $('daily-prompt').innerHTML=`<div class="shared-setup"><span class="scenario-label">Shared situation</span><p>${safe(parts[0])}</p></div><div class="scenario-variation"><span class="scenario-label">Details for this question</span>${parts.slice(1).map(p=>`<p>${safe(p)}</p>`).join('')}</div>`;
  $('daily-options').innerHTML=Object.entries(q.options).map(([a,t])=>`<div class="daily-option"><span>${a}.</span><p>${safe(t)}</p></div>`).join('');
  // Retain each binary track across updates so the marker transitions between recorded rates.
  const three=Object.keys(q.options).length===3;
  $('daily-chart-note').textContent=three?'Share of recorded answers choosing each action.':'Markers show the share choosing B, not an individual answer.';
  $('daily-agents').hidden=three;
  if(!three){
   if(!$('daily-agents').children.length) $('daily-agents').innerHTML=models.map(p=>`<div class="daily-agent-row" data-provider="${p}"><div class="daily-agent-name">${safe(names[p])}<span class="daily-valid note"></span></div><div class="daily-axis"><span>A</span><div class="daily-track"><span class="daily-mid"></span><span class="daily-marker">${icon(p)}</span></div><span>B</span></div><p class="daily-share note"></p></div>`).join('');
   models.forEach(p=>{const el=host.querySelector(`[data-provider="${p}"]`),r=rate(p,q.scenario_id,'B'),c=coverage(p,q.scenario_id);el.hidden=!visibleModels().includes(p);el.querySelector('.daily-marker').style.left=`${r.estimate??50}%`;el.querySelector('.daily-share').textContent=`${fmt(r.estimate)}% choose B · ${ci(r)}`;el.querySelector('.daily-valid').textContent=`${c.valid}/${c.planned} valid${c.unresolved?' · '+c.unresolved+' missing':''}`;});
  }
  $('daily-rates').innerHTML=three?visibleModels().map(p=>{const c=coverage(p,q.scenario_id);return `<div class="daily-three"><p>${safe(names[p])} <span class="note">${c.valid}/${c.planned} valid${c.unresolved?' · '+c.unresolved+' missing':''}</span></p>${Object.keys(q.options).map(a=>{const r=rate(p,q.scenario_id,a);return `<div class="daily-bar-row"><span>${a}</span><div class="daily-bar"><span style="width:${r.estimate??0}%"></span></div><span>${fmt(r.estimate)}%</span></div><p class="note daily-ci">${ci(r)}</p>`}).join('')}</div>`}).join(''):'';
  $('daily-effect-action').innerHTML=Object.entries(q.options).map(([a,t])=>`<option value="${a}">${a}. ${safe(t)}</option>`).join('');
  $('daily-effect-action').value=data.method.axes.find(a=>a.question===family).action;
  renderEffects(); renderProfiles();
  $('daily-coverage').innerHTML=`<table><thead><tr><th>Model · current question</th><th>Valid</th><th>Planned</th><th>Missing</th></tr></thead><tbody>${visibleModels().map(p=>{const c=coverage(p,q.scenario_id);return `<tr><th>${safe(names[p])}</th><td>${c.valid}</td><td>${c.planned}</td><td>${c.unresolved}</td></tr>`}).join('')}</tbody></table>`;
 }
 function renderProfiles(){
  $('daily-profiles').innerHTML=`<table><thead><tr><th>Model</th>${data.method.axes.map(a=>`<th><button class="daily-jump" data-target="${a.scenario_id}" title="Show ${a.scenario_id}">${safe(a.label)}<small>${a.scenario_id} · ${a.action}</small></button></th>`).join('')}</tr></thead><tbody>${visibleModels().map(p=>`<tr><th>${safe(names[p])}</th>${data.method.axes.map(a=>{const r=data.profiles.find(r=>r.provider===p&&r.analysis===stage&&r.question===a.question);return `<td><strong>${fmt(r.estimate)}%</strong><small>${fmt(r.ci_low)}–${fmt(r.ci_high)}</small><small>${r.valid}/${r.planned} valid</small></td>`}).join('')}</tr>`).join('')}</tbody></table><p class="note">Each cell: estimate, 95% interval, valid/planned calls. Select a column heading to inspect its question.</p>`;
  host.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>{const [f,v]=b.dataset.target.slice(1).split('.').map(Number);family=f;variation=v-1;render();$('daily-family').focus()});
 }
 function renderEffects(){
  const action=$('daily-effect-action').value, factors=data.designs.find(d=>d.n===family).factors;
  const cell=r=>`<td>${r.estimate>0?'+':''}${fmt(r.estimate)}<small>${fmt(r.ci_low)} to ${fmt(r.ci_high)}</small></td>`;
  $('daily-effects').innerHTML=factors.map((f,i)=>`<h3>${safe(f.name)}: low → high</h3><table><thead><tr><th>Model</th><th>Other factor low</th><th>Other factor high</th><th>Equal average</th></tr></thead><tbody>${visibleModels().map(p=>`<tr><th>${safe(names[p])}</th>${['other_low','other_high','average'].map(comparison=>cell(data.assumption_effects.find(r=>r.provider===p&&r.analysis===stage&&r.question===family&&r.factor_index===i&&r.action===action&&r.comparison===comparison))).join('')}</tr>`).join('')}</tbody></table>`).join('');
 }
 $('daily-family').onchange=e=>{family=Number(e.target.value);variation=0;render()};
 $('daily-model').onchange=e=>{selected=e.target.value;render()};
 $('daily-stage').onchange=e=>{stage=e.target.value;render()};
 $('daily-effect-action').onchange=renderEffects;
 host.querySelectorAll('[data-variation]').forEach(b=>b.onclick=()=>{variation=Number(b.dataset.variation);render()});
 // Interleave families instead of cycling four nearly identical prompts consecutively.
 function next(){family=family%6+1;if(family===1)variation=(variation+1)%4;render()}
 $('daily-next').onclick=next;
 $('daily-play').onclick=()=>{paused=!paused;$('daily-play').textContent=paused?'Play':'Pause'};
 setInterval(()=>{if(!paused&&!host.hidden&&!document.hidden)next()},10000);
 render();
})();
