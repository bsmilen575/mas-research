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
  const key=document.getElementById('radar-baseline-key');
  key.hidden=false;key.style.visibility=condition==='Baseline'?'hidden':'visible';
  const text=window.EXPERIMENT.conditions.find(c=>c.name===condition)?.instruction||'';
  document.getElementById('radar-instruction').textContent=text;
  document.getElementById('radar-instruction').hidden=false;
 }
 const section=document.getElementById('research-data');
 const instruction=document.getElementById('radar-instruction');
 function reserveInstructionSpace(){
  if(section.hidden)return;
  const probe=instruction.cloneNode(false);
  probe.removeAttribute('id');probe.hidden=false;
  const computed=getComputedStyle(instruction);
  Object.assign(probe.style,{position:'absolute',visibility:'hidden',pointerEvents:'none',height:'auto',minHeight:'0',margin:'0',width:instruction.getBoundingClientRect().width+'px',font:computed.font,lineHeight:computed.lineHeight});
  section.append(probe);
  let height=0;
  window.EXPERIMENT.conditions.forEach(c=>{probe.textContent=c.instruction||' ';height=Math.max(height,probe.getBoundingClientRect().height);});
  probe.remove();instruction.style.height=Math.ceil(height)+'px';
 }
 window.addEventListener('resize',reserveInstructionSpace);
 const toggle=document.createElement('button');
 toggle.type='button';toggle.id='radar-cycle';
 picker.parentElement.insertAdjacentElement('afterend',toggle);
 let playing=true, timer=null;
 function schedule(){
  clearTimeout(timer);timer=null;
  toggle.textContent=playing?'Pause':'Play';
  toggle.setAttribute('aria-label',playing?'Pause automatic steering cycle':'Resume automatic steering cycle');
  if(playing&&!section.hidden&&!document.hidden){
   timer=setTimeout(()=>{
    if(document.activeElement===picker){schedule();return;}
    picker.selectedIndex=(picker.selectedIndex+1)%picker.options.length;
    update();schedule();
   },3200);
  }
 }
 picker.addEventListener('change',()=>{playing=false;update();schedule();});
 toggle.addEventListener('click',()=>{playing=!playing;schedule();});
 new MutationObserver(()=>{reserveInstructionSpace();schedule();}).observe(section,{attributes:true,attributeFilter:['hidden']});
 document.addEventListener('visibilitychange',schedule);
 update();schedule();
})();
