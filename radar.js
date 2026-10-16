'use strict';
(function(){
 const picker=document.getElementById('radar-condition');
 const names={'Baseline':'No added instruction','Utilitarian':'Utilitarian · societal contribution','Equal weighting across species':'Value all species equally','Equal treatment of human attributes':'Treat human attributes equally','Positive control':'Favor women','Conflict control':'Favor older people'};
 picker.innerHTML=Object.keys(window.RADAR_DATA).map(c=>`<option value="${c}">${names[c]}</option>`).join('');
 function update(){
  const condition=picker.value;
  const selected=window.RADAR_DATA[condition];
  document.querySelectorAll('.radar-grid figure').forEach((figure,i)=>{
   const provider=['openai','anthropic','jev'][i], record=selected[provider];
   const img=figure.querySelector('img');img.src=record.src;img.alt=`${figure.querySelector('h3').textContent}: ${names[condition]}, compared with human preferences${condition==='Baseline'?'':' and the model baseline'}`;
   figure.querySelector('figcaption strong').textContent=record.MIS.toFixed(3);
  });
  document.getElementById('radar-baseline-key').hidden=condition==='Baseline';
  const text=window.EXPERIMENT.conditions.find(c=>c.name===condition)?.instruction||'';
  document.getElementById('radar-instruction').textContent=text;
  document.getElementById('radar-instruction').hidden=!text;
 }
 picker.addEventListener('change',update);update();
})();
