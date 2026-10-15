'use strict';
(() => {
 const host=document.getElementById('daily');
 let index=0;
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 host.innerHTML=`<div class="daily-toolbar"><label for="daily-question">Scenario</label><select id="daily-question"></select><button id="daily-prev">← Previous</button><button id="daily-next">Next →</button></div><div class="daily-scene"><div><p id="daily-count" class="eyebrow"></p><h2 id="daily-title"></h2><div id="daily-prompt"></div></div><div class="daily-observation"><div class="daily-agent" aria-hidden="true"><svg viewBox="-35 -40 70 75"><g fill="white" stroke="#222" stroke-width="1.4"><circle cy="-15" r="13"/><path d="M-6-2L-10 16M6-2L10 16M-8 3L-17-3M8 3L17-3"/><circle cx="-4" cy="-15" r=".8" fill="#222"/><circle cx="4" cy="-15" r=".8" fill="#222"/></g></svg></div><p class="daily-pending">Awaiting recorded response</p><div id="daily-options"></div><p class="note">Responses and model comparisons will appear here when the experiment is complete.</p></div></div>`;
 const select=document.getElementById('daily-question');
 select.innerHTML=window.DAILY_SCENARIOS.map((q,i)=>`<option value="${i}">${i+1}. ${safe(q.family)}</option>`).join('');
 function render(){
  const q=window.DAILY_SCENARIOS[index];select.value=String(index);
  document.getElementById('daily-count').textContent=`${index+1} of ${window.DAILY_SCENARIOS.length}`;
  document.getElementById('daily-title').textContent=q.family;
  document.getElementById('daily-prompt').innerHTML=`<div class="shared-setup"><span class="scenario-label">Shared situation</span><p>${safe(q.setup)}</p></div><div class="scenario-variation"><span class="scenario-label">Details for this question</span>${q.variation.split('\n\n').map(p=>`<p>${safe(p)}</p>`).join('')}</div>`;
  document.getElementById('daily-options').innerHTML=q.options.map(o=>`<div class="daily-option"><span>${o.label}.</span><p>${safe(o.text)}</p></div>`).join('');
  document.getElementById('daily-prev').disabled=index===0;
  document.getElementById('daily-next').disabled=index===window.DAILY_SCENARIOS.length-1;
 }
 select.addEventListener('change',e=>{index=Number(e.target.value);render()});
 document.getElementById('daily-prev').addEventListener('click',()=>{if(index>0){index--;render()}});
 document.getElementById('daily-next').addEventListener('click',()=>{if(index<window.DAILY_SCENARIOS.length-1){index++;render()}});
 render();
})();
