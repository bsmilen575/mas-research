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

let index=0,condition='Baseline',panel='research-data',selectedProvider='openai',paused=false,timers=[];
const scenarioMap=new Map(E.scenarios.map(s=>[s.scenario_id,s]));
const responseMap=new Map(E.records.map(r=>[`${r.scenario_id}|${r.condition}|${r.provider}`,r]));
const $=id=>document.getElementById(id);
function later(fn,ms){timers.push(setTimeout(fn,ms))}
function clear(){timers.forEach(clearTimeout);timers=[]}
const conditionDimensions={
 'Conflict control':['age'],
 'Positive control':['gender'],
 'Equal treatment of human attributes':['gender','age','fitness','status'],
 'Equal weighting across species':['species','species_number']
};
function scenarioOrder(){const dims=conditionDimensions[condition];return E.scenario_order.filter(id=>!dims||dims.includes(scenarioMap.get(id).dimension))}
function outcome(s,save){
 const target=save==='A'?300:100;
 const path=`M200 40 L200 90 C200 145 ${target} 140 ${target} 213`;
 function people(text,x,saved){
  const count={a:1,an:1,two:2,three:3,four:4,five:5}[text.split(' ')[0]]||1;
  return `<g class="road-group ${saved?'surviving-group':'other-group'}">${Array.from({length:count},(_,i)=>`<g transform="translate(${x+(i-(count-1)/2)*26} ${282+(i%2)*5})"><g class="walking-person" style="animation-delay:${i*110}ms">${person('adult')}</g></g>`).join('')}</g>`;
 }
 return `<div class="outcome"><svg viewBox="0 0 400 350" role="img" aria-label="Recorded choice: save ${save}, ${esc(save==='A'?s.option_a:s.option_b)}.">
 <defs><marker id="route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#999"/></marker></defs>
 <path d="M22 5L12 335M378 5L388 335" stroke="#222" stroke-width="1.2" fill="none"/>
 <path d="M34 5L26 335M366 5L374 335" stroke="#ddd" fill="none"/>
 <path d="M200 0V230M200 325V350" stroke="#ccc" stroke-dasharray="12 14" fill="none"/>
 <g fill="#f0f0f0">${Array.from({length:10},(_,i)=>`<path d="M${39+i*33} 250h20v70h-20Z"/>`).join('')}</g>
 <path d="${path}" class="travel-guide" fill="none" stroke="#bbb" stroke-width="1.2" stroke-dasharray="3 7" marker-end="url(#route-arrow)"/>
 ${people(s.option_a,100,save==='A')}${people(s.option_b,300,save==='B')}
 <g class="driving-car" style="offset-path:path('${path}')"><g transform="rotate(90)"><rect x="-19" y="-32" width="38" height="64" rx="9" fill="white" stroke="#222" stroke-width="1.6"/><path d="M-13-21H13L11-9H-11ZM-11 14H11L13 24H-13Z" fill="#e6e6e6" stroke="#222" stroke-width="1"/><path d="M-14-4V10M14-4V10M-9-28H9" fill="none" stroke="#bbb"/><path d="M-22-20V-7M22-20V-7M-22 10V23M22 10V23" stroke="#222" stroke-width="3" stroke-linecap="round"/><path d="M-13 29H-7M7 29H13" stroke="#222" stroke-width="2"/></g></g>
 </svg><div class="group-names"><span>A · ${esc(s.option_a)}</span><span>B · ${esc(s.option_b)}</span></div></div>`;
}
function renderChoices(s){
 const r=responseMap.get(`${s.scenario_id}|${condition}|${selectedProvider}`);
 const choice=r?.final_choice;
 if(!['A','B'].includes(choice))return '<p class="no-answer">No recorded answer for this model and instruction.</p>';
 return outcome(s,choice)+`<div class="animation-caption"><span>${esc(providers.find(p=>p.id===selectedProvider).name)} · saves ${choice}${r.choice_source!=='initial'?' · recovered answer':''}</span><button id="replay">Replay ↻</button></div><p class="note schematic-note">Recorded choice. The car moves toward the group not saved; its path is illustrative.</p>`;
}

function show(){
 clear(); if(panel!=='trolley')return;
 const order=scenarioOrder();
 $('next').disabled=!order.length;
 $('pause').disabled=!order.length;
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 if(!order.length){$('context').textContent='No matching scenarios';$('prompt').textContent='Human–animal comparisons are not included in this view. Choose another instruction to continue.';$('canvas').innerHTML='';return;}
 const s=scenarioMap.get(order[index]);
 $('context').textContent=`${s.dimension} comparisons · ${index+1} of ${order.length} · ${s.scenario_id}`;
 $('prompt').textContent=s.prompt.replace(/\\n/g,'\n');
 $('instruction').textContent=E.conditions.find(c=>c.name===condition).instruction||'No added value instruction.';
 $('canvas').innerHTML=renderChoices(s);
 if($('replay'))$('replay').onclick=show;
 document.querySelectorAll('[data-steer-condition]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.steerCondition===condition)));
 if(!paused&&!document.hidden)later(next,10000);
}
function next(){index=(index+1)%scenarioOrder().length;show()}
$('model').innerHTML=providers.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
$('model').addEventListener('change',e=>{selectedProvider=e.target.value;show()});
$('condition').innerHTML=E.conditions.map(c=>`<option value="${esc(c.name)}">${esc(conditionLabels[c.name]||c.name)}</option>`).join('');
function setCondition(value){const previousId=scenarioOrder()[index];condition=value;$('condition').value=value;const newIndex=scenarioOrder().indexOf(previousId);index=newIndex>=0?newIndex:0;paused=true;$('pause').textContent='Play';show();}
$('condition').addEventListener('change',e=>setCondition(e.target.value));
document.querySelectorAll('[data-steer-condition]').forEach(button=>button.addEventListener('click',()=>setCondition(button.dataset.steerCondition)));
$('steer').addEventListener('click',()=>{let open=$('steering').hidden;$('steering').hidden=!open;$('steer').setAttribute('aria-expanded',String(open));});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Play':'Pause';show()});
$('next').addEventListener('click',next);
document.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{panel=b.dataset.panel;document.querySelectorAll('[data-panel]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));['research-data','trolley','daily'].forEach(id=>$(id).hidden=panel!==id);clear();if(panel==='trolley')show()}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else show()});show();

function setLayout(layout){
 document.body.dataset.layout=layout;
 document.querySelectorAll('[data-layout]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.layout===layout)));
}
document.querySelectorAll('[data-layout]').forEach(button=>button.addEventListener('click',()=>setLayout(button.dataset.layout)));
setLayout(window.matchMedia('(min-width: 1000px)').matches?'wide':'long');
