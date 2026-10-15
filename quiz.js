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
  function clear() { host.replaceChildren(); document.getElementById('daily-results-view').hidden=true; }
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
    top.append(button('See results so far', () => showResults(true), 'quiz-text-button'), button('End and clear', endQuiz, 'quiz-text-button'));
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
    controls.append(previous, next, button('Skip', () => { responses.delete(q.id); moveForward(); }, 'quiz-text-button'));
    host.append(controls);
    host.append(make('p', 'Your answers are not submitted or saved.', 'quiz-note'));
    focusHeading(title);
  }
  function renderReview() { showResults(true); }
  function showResults(personal) {
    clear();
    const count=personal?responses.size:0;
    const title=heading(count?'Agreement with your choices':'Model results');
    if(count){
      host.append(make('p', `${count} of ${questions.length} questions answered. Skipped questions are excluded.`, 'quiz-note'));
      const rates=window.DAILY_RESULTS.choice_rates;
      Object.entries(window.DAILY_RESULTS.models).forEach(([provider,model])=>{
        const values=[...responses].map(([id,action])=>rates.find(r=>r.provider===provider&&r.analysis==='initial_only'&&r.scenario_id===id&&r.action===action)?.estimate).filter(Number.isFinite);
        const score=values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
        const row=make('div',undefined,'agreement-row');
        row.append(make('p',({openai:'GPT-6 Astra',anthropic:'Claude Opus 5.5',xai:'Grok 4.7',jev:'Jev 1.13 (exploratory)'})[provider]||model));
        const track=make('div',undefined,'agreement-track'),fill=make('span');
        fill.style.width=`${score??0}%`; track.append(fill);
        row.append(track,make('strong',score===null?'Unavailable':`${score.toFixed(1)}%`)); host.append(row);
      });
      host.append(make('p', 'Agreement averages each model’s response percentage for the action you chose, giving each answered question equal weight. It measures agreement on these questions, not moral correctness.', 'quiz-note'));
    }else if(personal){host.append(make('p','No questions answered yet. Model results appear below.','quiz-note'));}
    const controls=make('div',undefined,'quiz-controls');
    controls.append(button(count?'Review or edit answers':'Take the quiz',()=>{current=0;renderQuestion();}),button('Start again',endQuiz,'quiz-text-button')); host.append(controls);
    host.append(make('p','Answers stay only in this page. They are not submitted or saved; reloading clears them.','quiz-note'));
    document.getElementById('daily-results-view').hidden=false;
    document.dispatchEvent(new CustomEvent('daily-comparison',{detail:count?Object.fromEntries(responses):{}}));
    focusHeading(title);
  }
  intro();
})();
