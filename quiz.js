(() => {
  'use strict';
  const host = document.getElementById('quiz');
  if (!host) return;
  const questions = window.DAILY_SCENARIOS || [];
  let responses = new Map();
  let current = 0;

  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, action, className) => {
    const node = make('button', text, className);
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  function clear() { host.classList.remove('quiz-results'); host.replaceChildren(); document.getElementById('daily-results-view').hidden=true; }
  function focusHeading(node) {
    node.tabIndex = -1;
    node.focus({ preventScroll: true });
  }
  function heading(text) {
    const node = make('h2', text);
    host.append(node);
    return node;
  }
  function intro(focus = false) {
    clear();
    const start = button('Take the quiz', () => { responses = new Map(); current = 0; renderQuestion(); });
    start.disabled = !questions.length;
    host.append(start, button('Skip to model results', () => showResults(false))); 
    if (!questions.length) host.append(make('p', 'Questions are not available yet.', 'quiz-note'));
    if (focus) start.focus();
  }
  function endQuiz() {
    responses.clear();
    current = 0;
    intro(true);
  }
  function renderQuestion() {
    clear();
    const q = questions[current];
    const top = make('div', undefined, 'quiz-top');
    top.append(make('p', `Question ${current + 1} of ${questions.length}`, 'quiz-progress'));
    top.append(button('End and clear', endQuiz, 'quiz-text-button'));
    host.append(top);
    const title = heading('What would you choose?');
    const prompt = make('div', undefined, 'quiz-prompt');
    const setup = make('div', undefined, 'shared-setup');
    setup.append(make('span', 'Shared situation', 'scenario-label'), make('p', q.setup));
    const variation = make('div', undefined, 'scenario-variation');
    variation.append(make('span', 'Details for this question', 'scenario-label'));
    q.variation.split(/\n\s*\n/).forEach(paragraph => variation.append(make('p', paragraph)));
    prompt.append(setup, variation);
    host.append(prompt);
    const fieldset = make('fieldset', undefined, 'quiz-options');
    fieldset.append(make('legend', 'Select one response'));
    const controls = make('div', undefined, 'quiz-controls');
    const previous = button('Previous', () => { current--; renderQuestion(); });
    previous.disabled = current === 0;
    const moveForward = () => {
      if (current === questions.length - 1) renderReview();
      else { current++; renderQuestion(); }
    };
    const next = button(current === questions.length - 1 ? 'Finish' : 'Next', moveForward);
    next.disabled = !responses.has(q.id);
    q.options.forEach(option => {
      const label = make('label', undefined, 'quiz-option');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'daily-quiz-response';
      input.value = option.label;
      input.checked = responses.get(q.id) === option.label;
      input.addEventListener('change', () => {
        responses.set(q.id, option.label);
        next.disabled = false;
      });
      label.append(input, make('span', `${option.label}. ${option.text}`));
      fieldset.append(label);
    });
    host.append(fieldset);
    controls.append(previous, next);
    host.append(controls);
    host.append(make('p', 'Your answers are not submitted or saved.', 'quiz-note'));
    focusHeading(title);
    title.scrollIntoView({block: "start"});
  }
  function renderReview() { showResults(true); }
  function showResults(personal) {
    if(personal && responses.size!==questions.length) return;
    clear(); host.classList.add('quiz-results');
    const data=window.DAILY_RESULTS, providers=Object.keys(data.models);
    const names={openai:'GPT-6 Astra',anthropic:'Claude Opus 5.5',xai:'Grok 4.7',jev:'Jev 1.13'};
    const rates=(p,q)=>data.choice_rates.filter(r=>r.provider===p&&r.analysis==='initial_only'&&r.scenario_id===q);
    const winner=(rs)=>{const valid=rs.filter(r=>Number.isFinite(r.estimate));if(!valid.length)return null;const max=Math.max(...valid.map(r=>r.estimate));const best=valid.filter(r=>Math.abs(r.estimate-max)<1e-8);return best.length===1?best[0].action:'tie';};
    const title=heading(personal?'Your answers and the models':'How the models answered');
    host.append(make('p','24 questions · four models · 100 repeated calls per question','results-intro'));
    if(personal){
      const cards=make('div',undefined,'match-cards');
      providers.forEach(p=>{
        let matches=0,ties=0,missing=0;
        questions.forEach(q=>{const w=winner(rates(p,q.id));if(w==='tie')ties++;else if(w===null)missing++;else if(w===responses.get(q.id))matches++;});
        const card=make('div',undefined,'match-card');
        card.append(make('p',names[p]),make('strong',`${matches} / ${questions.length}`),make('p',`${(matches/questions.length*100).toFixed(1)}% answered the same`));
        if(ties||missing)card.append(make('small',`${ties} tied · ${missing} unavailable (not counted as matches)`));
        cards.append(card);
      });host.append(cards);
      host.append(make('p','A match means your answer equals the model’s most frequent choice for that question. Ties do not count as matches. This is agreement on this test, not moral correctness.','quiz-note'));
    }
    host.append(make('p','Select a question to read the scenario and answer options. Bars show how often each model chose each answer.','results-guide'));
    const legend=make('div',undefined,'choice-legend');['A','B','C'].forEach(a=>{const item=make('span');item.append(make('i',undefined,`choice-${a}`),document.createTextNode(a==='C'?'C · where available':a));legend.append(item);});host.append(legend);
    const wrap=make('div',undefined,'comparison-scroll'),table=make('table',undefined,'comparison-grid'),head=make('thead'),hr=make('tr');
    const cols=make('colgroup');[personal?26:28,...(personal?[6]:[]),...providers.map(()=>personal?17:18)].forEach(w=>{const col=make('col');col.style.width=`${w}%`;cols.append(col);});table.append(cols);
    hr.append(make('th','Question'));if(personal)hr.append(make('th','You'));providers.forEach(p=>hr.append(make('th',names[p])));head.append(hr);table.append(head);
    const body=make('tbody');
    questions.forEach((q,i)=>{
      const row=make('tr'),desc=make('th');desc.scope='row';
      const expansion=make('tr',undefined,'question-expansion'),expandedCell=make('td');
      expansion.hidden=true;expandedCell.colSpan=personal?6:5;expandedCell.id=`question-detail-${i}`;
      const questionButton=button(`${i+1}. ${q.family}`,()=>{expansion.hidden=!expansion.hidden;questionButton.setAttribute('aria-expanded',String(!expansion.hidden));},'question-toggle');
      questionButton.setAttribute('aria-expanded','false');questionButton.setAttribute('aria-controls',expandedCell.id);
      questionButton.append(make('small',`Variation ${i%4+1} · ${q.id}`));desc.append(questionButton);row.append(desc);
      const prompt=make('div',undefined,'expanded-question');
      const text=make('div',undefined,'expanded-scenario');q.prompt.split(/\n\s*\n/).forEach(t=>text.append(make('p',t)));
      const options=make('div',undefined,'expanded-options');q.options.forEach(o=>{const option=make('p');option.append(make('strong',`${o.label}. `),document.createTextNode(o.text));options.append(option);});
      prompt.append(text,options);expandedCell.append(prompt);expansion.append(expandedCell);
      if(personal)row.append(make('td',responses.get(q.id),'your-choice'));
      providers.forEach(p=>{
        const rs=rates(p,q.id),w=winner(rs),cell=make('td');
        cell.dataset.model=names[p];
        const match=personal&&w===responses.get(q.id);
        cell.append(make('strong',w==='tie'?'Tie':w||'Unavailable'));
        if(personal)cell.append(make('span',w==='tie'?' · tied':w===null?' · missing':match?' · same':' · different','match-label'));
        const bar=make('div',undefined,'choice-stack');
        rs.forEach(r=>{const part=make('span',r.estimate>=14?r.action:'',`choice-${r.action}`);part.style.width=`${r.estimate??0}%`;part.title=`${r.action}: ${r.estimate?.toFixed(1)}%`;bar.append(part);});cell.append(bar);
        cell.append(make('small',rs.map(r=>`${r.action} ${Number.isFinite(r.estimate)?r.estimate.toFixed(1):'—'}%`).join(' · ')));
        const cov=data.coverage.find(r=>r.provider===p&&r.scenario_id===q.id&&r.analysis==='initial_only');
        if(cov?.unresolved)cell.append(make('small',`${cov.valid}/${cov.planned} valid · ${cov.unresolved} missing`));
        row.append(cell);
      });body.append(row,expansion);
    });table.append(body);wrap.append(table);host.append(wrap);
    const methods=make('details',undefined,'results-methods');methods.append(make('summary','About these results'));methods.append(make('p','9,594 valid answers out of 9,600 planned calls. Six interrupted calls are excluded. Choice shares give equal weight to each option order. Jev used a different structured interface and remains exploratory.'));host.append(methods);
    const controls=make('div',undefined,'quiz-controls');
    if(!personal)controls.append(button('Take the quiz',()=>{responses.clear();current=0;renderQuestion();}));
    controls.append(button('Start again',endQuiz));host.append(controls);
    host.append(make('p','Answers stay only in this page. They are not submitted or saved; reloading clears them.','quiz-note'));
    focusHeading(title);
    title.scrollIntoView({block: "start"});
  }
  intro();
})();
