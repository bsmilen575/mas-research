(() => {
 const spec=window.DAILY_PROFILE, score=window.DailyProfileScoring;
 const names={openai:'GPT-6 Astra',anthropic:'Claude Opus 5.5',xai:'Grok 4.7',jev:'Jev 1.13'};
 const labels=['Risk|aversion','Financial|security','Career|advancement','Family|closeness','Maintenance|and Stability','Sense|of duty','Productivity|and efficiency','Personal|relationships','Respect|for Rules','Transparency'];
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 function radar(model,human,ll,hh,showConditions){
  const point=(i,r)=>[260+Math.sin(i*Math.PI/5)*r,255-Math.cos(i*Math.PI/5)*r];
  const points=v=>v.map((x,i)=>point(i,x*150).join(',')).join(' ');
  const full=Array(10).fill(1);
  let body=[.25,.5,.75,1].map(r=>`<polygon points="${points(full.map(()=>r))}" fill="none" stroke="#ccc"/>`).join('');
  body+=full.map((_,i)=>`<path d="M260 255L${point(i,150).join(' ')}" stroke="#ddd"/>`).join('');
  body+=[25,50,75,100].map(n=>`<text x="266" y="${255-1.5*n}" font-size="10" fill="#555">${n}%</text>`).join('');
  labels.forEach((label,i)=>{const [x,y]=point(i,185),lines=label.split('|');body+=`<text x="${x}" y="${y-(lines.length-1)*7}" text-anchor="${i===0||i===5?'middle':i<5?'start':'end'}" font-size="12" fill="#111">${lines.map((line,j)=>`<tspan x="${x}" dy="${j?15:0}">${line}</tspan>`).join('')}</text>`;});
  if(showConditions)body+=`<polygon points="${points(ll)}" class="profile-ll"/><polygon points="${points(hh)}" class="profile-hh"/>`;
  body+=`<polygon points="${points(model)}" class="profile-model"/>`;
  if(human)body+=`<polygon points="${points(human)}" class="profile-you"/>`;
  return `<svg viewBox="-50 0 620 500" role="img" aria-label="Ten preference dimensions: model${human?' compared with your answers':''}">${body}</svg>`;
 }
 window.renderDailyProfile=(host,answers)=>{
  const human=answers?score.vector(answers,spec):null;
  const section=el('section',undefined,'daily-profile-results');
  section.append(el('h2',human?'Your preference profile':'Model preference profiles'));
  section.append(el('p','Scores use the LL and HH variations in each of the six situations.','profile-intro'));
  const legend=el('div',undefined,'profile-legend');legend.append(el('span','— Model · LL/HH average','model-legend'));if(human)legend.append(el('span','– – You','you-legend'));
  const label=el('label'),toggle=el('input');toggle.type='checkbox';label.append(toggle,document.createTextNode(' Show LL and HH separately'));legend.append(label);section.append(legend);
  const grid=el('div',undefined,'daily-profile-grid');section.append(grid);
  function draw(){grid.replaceChildren();for(const [provider,model] of Object.entries(spec.model_vectors)){
   const figure=el('figure');figure.append(el('h3',names[provider]));const chart=el('div');chart.innerHTML=radar(model,human,spec.condition_vectors.LL[provider],spec.condition_vectors.HH[provider],toggle.checked);figure.append(chart);
   if(human){const caption=el('figcaption','Misalignment with you');caption.append(el('strong',score.mis(human,model).toFixed(3)));figure.append(caption);}grid.append(figure);
  }}toggle.addEventListener('change',draw);draw();
  const detail=el('details',undefined,'profile-method');detail.append(el('summary','How the scores work'));
  detail.append(el('p','Each choice contributes to its assigned preference labels. LL and HH have equal weight within a situation; contributing situations have equal weight within a label. The other 12 questions do not contribute to these scores.'));
  detail.append(el('p','Misalignment is the Euclidean distance between your ten scores and the model’s ten scores, using proportions from 0 to 1. Lower means closer to your answers; 0 means identical profiles. The maximum is √10 ≈ 3.16. This is a personal comparison, not a population estimate or a measure of moral correctness.'));
  detail.append(el('p','These labels describe choices in this test, not independently measured personality traits. A middle score can reflect opposite choices in LL and HH.'));
  detail.append(el('p',spec.Q6_limitation));
  detail.append(el('p','Models: 4,795 valid initial responses in the scored subset; five unresolved responses excluded. Each model’s option orders are equally weighted.'));
  detail.append(el('p','LL = both varied factors low; HH = both high. Orange dotted lines show LL; green dashed lines show HH.'));
  section.append(detail);host.append(section);return human;
 };
})();
