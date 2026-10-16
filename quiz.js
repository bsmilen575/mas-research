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
  function intro() {
    if (questions.length) renderQuestion();
    else { clear(); host.append(make('p', 'Questions are not available yet.', 'quiz-note')); }
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
    top.append(button('Skip to model results', () => showResults(false), 'quiz-text-button'));
    if (responses.size) top.append(button('Start again', endQuiz, 'quiz-text-button'));
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
    if (!document.getElementById("daily").hidden) {
      focusHeading(title);
      title.scrollIntoView({block: "start"});
    }
  }
  function renderReview() { showResults(true); }
  function showResults(personal) {
    if(personal && responses.size!==questions.length) return;
    clear(); host.classList.add('quiz-results');
    window.renderDailyProfile(host,personal?Object.fromEntries(responses):null);
    const title=host.querySelector('h2');
    const controls=make('div',undefined,'quiz-controls');
    if(!personal)controls.append(button('Take the quiz',()=>{responses.clear();current=0;renderQuestion();}));
    controls.append(button('Start again',endQuiz));host.append(controls);
    host.append(make('p','Answers stay only in this page. They are not submitted or saved; reloading clears them.','quiz-note'));
    if (!document.getElementById("daily").hidden) {
      focusHeading(title);
      title.scrollIntoView({block: "start"});
    }
  }
  intro();
})();
