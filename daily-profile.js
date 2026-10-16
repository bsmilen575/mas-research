/* Frozen LL/HH profile, shared by participant and model comparisons. */
(function(root){
 'use strict';
 function vector(answers,spec){
  for(let q=1;q<=6;q++)for(let v=1;v<=4;v++){
   if(!Object.hasOwn(spec.codebook[q],answers[`Q${q}.${v}`]))return null;
  }
  const contributions=Object.fromEntries(spec.value_order.map(v=>[v,[]]));
  for(const [q,actions] of Object.entries(spec.codebook)){
   const ids=spec.scored_scenario_ids.filter(id=>id.startsWith(`Q${q}.`));
   for(const [action,labels] of Object.entries(actions)){
    const mean=ids.reduce((sum,id)=>sum+(answers[id]===action?1:0),0)/ids.length;
    labels.forEach(label=>contributions[label].push(mean));
   }
  }
  return spec.value_order.map(label=>contributions[label].reduce((a,b)=>a+b,0)/contributions[label].length);
 }
 function mis(a,b){
  if(!a||!b||a.length!==10||b.length!==10||[...a,...b].some(x=>!Number.isFinite(x)||x<0||x>1))return null;
  return Math.sqrt(a.reduce((sum,x,i)=>sum+(x-b[i])**2,0));
 }
 root.DailyProfileScoring={vector,mis};
 if(typeof module!=='undefined')module.exports={vector,mis};
})(typeof window==='undefined'?globalThis:window);
