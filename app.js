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
function show(){
 clear(); if(panel!=='trolley')return;
 const order=scenarioOrder();
 $('next').disabled=!order.length;
 $('pause').disabled=!order.length;
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 if(!order.length){$('context').textContent='No matching scenarios';$('prompt').textContent='Human–animal comparisons are not included in this view. Choose another instruction to continue.';$('canvas').innerHTML='';scores();return;}
 const s=scenarioMap.get(order[index]);
 $('context').textContent=`${s.dimension} comparisons · ${index+1} of ${order.length} · ${s.scenario_id}`;
 $('prompt').textContent=s.prompt.replace(/\\n/g,'\n');
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 let drawing=`${group(s.option_a,290)}${group(s.option_b,710)}<text x="290" y="139" text-anchor="middle" font-size="15">A · ${esc(s.option_a)}</text><text x="710" y="139" text-anchor="middle" font-size="15">B · ${esc(s.option_b)}</text>`;
 providers.forEach((p,i)=>{let y=240+i*105;drawing+=`<path d="M290 ${y}H710" stroke="#ddd" fill="none"/><path d="M290 ${y-5}V${y+5}M710 ${y-5}V${y+5}" stroke="#aaa"/><g class="moving" id="agent-${i}" transform="translate(500 ${y})"><g class="idle">${character(p.shape)}</g><text y="40" text-anchor="middle" font-size="14">${esc(p.name)}</text><text id="answer-${i}" y="59" text-anchor="middle" font-size="12" class="secondary"></text></g>`});
 drawing+=humanRow(s,'main');
 $('canvas').innerHTML=`<svg viewBox="110 15 780 680" role="img" aria-label="Recorded model choices. A: ${esc(s.option_a)}. B: ${esc(s.option_b)}.">${drawing}</svg><p class="note figure-note">Neutral figures represent counts only. Human marker: dimension-level reference, not responses to this exact question.</p>`;
 later(()=>providers.forEach((p,i)=>{const r=responseMap.get(`${s.scenario_id}|${condition}|${p.id}`);let choice=r?.final_choice;const x=choice==='A'?290:choice==='B'?710:500; $('agent-'+i).style.transform=`translate(${x}px, ${240+i*105}px)`;$('answer-'+i).textContent=choice?`saves ${choice}${r.choice_source!=='initial'?' · retry':r.interface==='native_decision'?' · native choice':''}`:'No valid choice';}),500);
 scores(); if(!paused&&!document.hidden)later(next,10000);
}
function next(){index=(index+1)%scenarioOrder().length;show()}
$('condition').innerHTML=E.conditions.map(c=>`<option value="${esc(c.name)}">${esc(conditionLabels[c.name]||c.name)}</option>`).join('');
$('condition').addEventListener('change',e=>{condition=e.target.value;index=0;show()});
$('steer').addEventListener('click',()=>{let open=$('steering').hidden;$('steering').hidden=!open;$('steer').setAttribute('aria-expanded',String(open));});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';show()});
$('next').addEventListener('click',next);
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{panel=b.dataset.panel;document.querySelectorAll('[data-panel]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));['trolley','daily','quiz'].forEach(id=>$(id).hidden=panel!==id);clear();if(panel==='trolley')show()}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else show()});show();
