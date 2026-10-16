'use strict';
const E=window.EXPERIMENT;
const providers=[{id:'openai',name:'GPT-6 Astra',shape:'round'},{id:'anthropic',name:'Claude Opus 5.5',shape:'square'},{id:'jev',name:'Jev 1.13',shape:'triangle'}];
const conditionLabels={'Baseline':'No added instruction','Utilitarian':'Prioritize societal contribution','Equal weighting across species':'Value all species equally','Equal treatment of human attributes':'Treat human attributes equally','Positive control':'Favor women','Conflict control':'Favor older people'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function character(shape){const head=shape==='round'?'<circle cx="0" cy="-15" r="13"/>':shape==='square'?'<rect x="-13" y="-28" width="26" height="26" rx="5"/>':'<path d="M0-30L16-3H-16Z"/>';return `<g fill="white" stroke="#222" stroke-width="1.4">${head}<path d="M-6-2L-10 16M6-2L10 16M-8 3L-17-3M8 3L17-3" stroke-linecap="round"/><circle cx="-4" cy="-15" r=".8" fill="#222"/><circle cx="4" cy="-15" r=".8" fill="#222"/></g>`}
function person(kind){if(kind==='dog')return '<g fill="white" stroke="#222" stroke-width="1.3"><path d="M-12 8V-7H9L12-17L21-9V-1H15V15M-6 0V15M6 1V15M-12-7L-18-17M12-17L6-21L6-8"/><circle cx="16" cy="-10" r=".6" fill="#222"/></g>';return `<g fill="white" stroke="#222" stroke-width="1.3" transform="scale(${kind==='young'?.85:1})"><circle cy="-21" r="7"/><path d="M-4-14Q-9-11-8 0L-6 10H6L8 0Q9-11 4-14M-4 10L-7 29M4 10L7 29M-8-7L-14 9M8-7L14 9"/>${kind==='old'?'<path d="M12 11Q16 6 18 11V30M-6-21H6"/>':''}</g>`}
function group(text,x){const n={a:1,an:1,two:2,three:3,four:4,five:5}[text.split(' ')[0]]||1;return Array.from({length:n},(_,i)=>`<g transform="translate(${x+(i-(n-1)/2)*37} 82)">${person('adult')}</g>`).join('')}
function humanRow(s,prefix){
 const ref=E.human_reference[s.dimension];
 const a=s.positive_choice==='A'?ref.preference:1-ref.preference;
 const b=1-a;
 const humanX=290+420*b;
 const lean=a>=b?'A':'B';
 const percent=(100*Math.max(a,b)).toFixed(1);
 return `<g id="${prefix}-human-reference" aria-label="Human ${esc(s.dimension)} aggregate: A ${(100*a).toFixed(1)} percent, B ${(100*b).toFixed(1)} percent">
 <path d="M290 562H710" stroke="#ededed" fill="none"/>
 <path d="M290 557V567M500 559V565M710 557V567" stroke="#ccc"/>
 <path d="M${humanX} 556V568" stroke="#555"/>
 <g id="${prefix}-human-position" transform="translate(${humanX} 562)">
 ${person('adult')}
 <text y="48" text-anchor="middle" font-size="14">human reference</text>
 <text y="68" text-anchor="middle" font-size="12" class="secondary">${percent}% toward ${lean}</text>
 </g>
 <text x="500" y="669" text-anchor="middle" font-size="12" class="secondary">${esc(s.dimension)} aggregate · Awad et al., 2018</text>
 </g>`;
}

let index=0,condition='Baseline',panel='trolley',paused=false,timers=[];
const scenarioMap=new Map(E.scenarios.map(s=>[s.scenario_id,s]));
const responseMap=new Map(E.records.map(r=>[`${r.scenario_id}|${r.condition}|${r.provider}`,r]));
const $=id=>document.getElementById(id);
function later(fn,ms){timers.push(setTimeout(fn,ms))}
function clear(){timers.forEach(clearTimeout);timers=[]}
function preferenceCell(value){
 const p=Number(value);
 if(!Number.isFinite(p))return '<td>—</td>';
 const t=Math.max(0,Math.min(1,p));
 const stops=[[249,201,195],[255,237,166],[176,222,187]];
 const a=t<=.5?stops[0]:stops[1],b=t<=.5?stops[1]:stops[2],f=t<=.5?t*2:(t-.5)*2;
 const color=a.map((v,i)=>Math.round(v+(b[i]-v)*f)).join(',');
 return `<td><span class="preference-score" style="background:rgb(${color})">${(100*p).toFixed(1)}%</span></td>`;
}
function scores(){
 $('score-title').textContent=`Model preferences · ${conditionLabels[condition]}`;
 const dims=['species','gender','fitness','status','age','number'];
 $('scores').innerHTML=providers.map(p=>{const m=E.metrics.find(r=>r.provider===p.id&&r.condition===condition);return `<tr><th>${esc(p.name)}</th><td>${m?Number(m.MIS).toFixed(3):'—'}</td>${dims.map(d=>m?preferenceCell(m['p_'+d]):'<td>—</td>').join('')}</tr>`}).join('')+`<tr class="human"><th>Human reference</th><td>—</td>${dims.map(d=>preferenceCell(E.human_reference[d].preference)).join('')}</tr>`;
}
const conditionDimensions={
 'Conflict control':['age'],
 'Positive control':['gender'],
 'Equal treatment of human attributes':['gender','age','fitness','status'],
 'Equal weighting across species':['species','species_number']
};
function scenarioOrder(){const dims=conditionDimensions[condition];return E.scenario_order.filter(id=>!dims||dims.includes(scenarioMap.get(id).dimension))}
function outcome(s,save){
 const target=save==='A'?300:100;
 const path=`M200 35 C200 105 ${target} 110 ${target} 195`;
 function people(text,x,saved){const count={a:1,an:1,two:2,three:3,four:4,five:5}[text.split(' ')[0]]||1;return `<g opacity="${saved?1:.38}">${Array.from({length:count},(_,i)=>`<g class="pedestrian" style="animation-delay:${i*90}ms" transform="translate(${x+(i-(count-1)/2)*28} 244) scale(.8)">${person('adult')}</g>`).join('')}</g>${saved?`<path d="M${x-76} 278H${x+76}" stroke="#222" stroke-width="2"/>`:''}<text x="${x}" y="298" text-anchor="middle" font-size="12">${x===100?'A':'B'} · ${saved?'saved':'not saved'}</text>`}
 return `<div class="outcome"><div class="outcome-heading"><b>Save ${save}</b><span>${esc(save==='A'?s.option_a:s.option_b)}</span></div><svg viewBox="0 0 400 310" role="img" aria-label="Save ${save}: ${esc(save==='A'?s.option_a:s.option_b)}. The other group is not saved."><path d="M12 12V275M388 12V275" stroke="#ccc" fill="none"/><path d="M200 80V275" stroke="#ddd" stroke-dasharray="10 10"/><path d="${path}" class="route" fill="none" stroke="#222" stroke-width="2" stroke-dasharray="5 6"/>${people(s.option_a,100,save==='A')}${people(s.option_b,300,save==='B')}<g class="outcome-car" style="offset-path:path('${path}')"><rect x="-17" y="-28" width="34" height="56" rx="8" fill="white" stroke="#222" stroke-width="1.5"/><path d="M-12-16H12L10-6H-10ZM-10 12H10L12 20H-12Z" fill="#eee" stroke="#222"/><path d="M-20-16V-5M20-16V-5M-20 9V20M20 9V20" stroke="#222" stroke-width="2"/></g></svg><div class="group-names"><span>A · ${esc(s.option_a)}</span><span>B · ${esc(s.option_b)}</span></div></div>`;
}
function renderChoices(s){
 const steering=condition!=='Baseline';
 const rows=providers.map(p=>{const r=responseMap.get(`${s.scenario_id}|${condition}|${p.id}`),base=responseMap.get(`${s.scenario_id}|Baseline|${p.id}`);return {p,r,base,changed:!!r?.final_choice&&!!base?.final_choice&&r.final_choice!==base.final_choice}});
 const changed=rows.filter(x=>x.changed).length;
 const ref=E.human_reference[s.dimension];const b=s.positive_choice==='B'?ref.preference:1-ref.preference;
 return `<div class="outcome-pair">${outcome(s,'A')}${outcome(s,'B')}</div><p class="note schematic-note">Schematic outcomes. Driving paths are not specified in the model prompts.</p>${steering?`<div class="change-summary" aria-live="polite"><strong>${changed} / ${providers.length}</strong> models changed their choice <span class="note">baseline → instruction</span> <button id="replay-steer">Replay change ↻</button></div>`:''}<div class="decision-ends"><span>Save A</span><span>Save B</span></div><div class="decision-rows">${rows.map(({p,r,base,changed},i)=>{const choice=r?.final_choice,start=steering?base?.final_choice:null;return `<div class="decision-row ${changed?'changed':''}"><span class="decision-model">${esc(p.name)}</span><div class="decision-track">${steering&&start?`<span class="baseline-mark" style="left:${start==='A'?0:100}%" title="Baseline: ${start}">${start}</span>`:''}<span class="decision-agent" id="decision-agent-${i}" style="left:${start==='A'?0:start==='B'?100:50}%"><svg viewBox="-22 -35 44 58" aria-hidden="true">${character(p.shape)}</svg></span></div><span class="decision-result">${steering?`<span class="before">${esc(base?.final_choice||'—')}</span> → `:''}<b>${esc(choice||'—')}</b><small>${steering?(changed?'changed':'unchanged'):(r?.choice_source!=='initial'?'retry':'recorded')}</small></span></div>`}).join('')}<div class="decision-row human-decision"><span class="decision-model">Human reference</span><div class="decision-track"><span class="human-tick" style="left:${100*b}%"></span></div><span class="decision-result">${(100*b).toFixed(1)}% B</span></div></div><p class="note figure-note">Neutral figures show counts only. Human reference: ${esc(s.dimension)} aggregate, not votes on this exact question.</p>`;
}

function show(){
 clear(); if(panel!=='trolley')return;
 const order=scenarioOrder();
 $('next').disabled=!order.length;
 $('pause').disabled=!order.length;
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 if(!order.length){$('steering-effect').hidden=true;$('context').textContent='No matching scenarios';$('prompt').textContent='Human–animal comparisons are not included in this view. Choose another instruction to continue.';$('canvas').innerHTML='';scores();return;}
 const s=scenarioMap.get(order[index]);
 $('context').textContent=`${s.dimension} comparisons · ${index+1} of ${order.length} · ${s.scenario_id}`;
 $('prompt').textContent=s.prompt.replace(/\\n/g,'\n');
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 $('canvas').innerHTML=renderChoices(s);
 function animateChoices(){
  providers.forEach((p,i)=>{const base=responseMap.get(`${s.scenario_id}|Baseline|${p.id}`);$('decision-agent-'+i).style.left=condition==='Baseline'?'50%':base?.final_choice==='A'?'0%':base?.final_choice==='B'?'100%':'50%'});
  later(()=>providers.forEach((p,i)=>{const r=responseMap.get(`${s.scenario_id}|${condition}|${p.id}`);$('decision-agent-'+i).style.left=r?.final_choice==='A'?'0%':r?.final_choice==='B'?'100%':'50%'}),350);
 }
 animateChoices();
 if($('replay-steer'))$('replay-steer').onclick=animateChoices;
 document.querySelectorAll('[data-steer-condition]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.steerCondition===condition)));
 const focused=condition==='Conflict control'?'age':condition==='Positive control'?'gender':null;
 $('steering-effect').hidden=!focused;
 if(focused){const target=focused==='age'?'older people':'females';$('steering-effect').innerHTML=`<span>Saving ${target} · all ${focused} comparisons</span>`+providers.map(p=>{const base=E.metrics.find(m=>m.provider===p.id&&m.condition==='Baseline'),now=E.metrics.find(m=>m.provider===p.id&&m.condition===condition);const value=m=>100*(focused==='age'?1-Number(m.p_age):Number(m.p_gender));return `<div>${p.name}<strong>${value(base).toFixed(1)}% → ${value(now).toFixed(1)}%</strong></div>`}).join('');}
 scores(); if(!paused&&!document.hidden)later(next,10000);
}
function next(){index=(index+1)%scenarioOrder().length;show()}
$('condition').innerHTML=E.conditions.map(c=>`<option value="${esc(c.name)}">${esc(conditionLabels[c.name]||c.name)}</option>`).join('');
function setCondition(value){const previousId=scenarioOrder()[index];condition=value;$('condition').value=value;const newIndex=scenarioOrder().indexOf(previousId);index=newIndex>=0?newIndex:0;paused=true;$('pause').textContent='Play';show();}
$('condition').addEventListener('change',e=>setCondition(e.target.value));
document.querySelectorAll('[data-steer-condition]').forEach(button=>button.addEventListener('click',()=>setCondition(button.dataset.steerCondition)));
$('steer').addEventListener('click',()=>{let open=$('steering').hidden;$('steering').hidden=!open;$('steer').setAttribute('aria-expanded',String(open));});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';show()});
$('next').addEventListener('click',next);
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{panel=b.dataset.panel;document.querySelectorAll('[data-panel]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));['trolley','daily'].forEach(id=>$(id).hidden=panel!==id);clear();if(panel==='trolley')show()}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else show()});show();

function setLayout(layout){
 document.body.dataset.layout=layout;
 document.querySelectorAll('[data-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===layout)));
}
document.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>setLayout(button.dataset.layout)));
setLayout(window.matchMedia('(min-width: 1000px)').matches?'wide':'long');
