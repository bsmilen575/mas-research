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
  function clear() { host.replaceChildren(); }
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
    const title = heading('Daily decisions');
    host.append(make('p', 'Read each situation and select the response you would choose. Answer using the information given, even if you would prefer another option.'));
    host.append(make('p', `There are ${questions.length} situations. Some are similar but differ in important details. You can go back, skip a question, or stop at any time.`));
    host.append(make('p', 'This is a prototype. Responses stay in this page’s memory; they are not submitted or saved. Reloading the page or ending the quiz clears them.', 'quiz-note'));
    host.append(make('p', 'At the end, you can review your choices. Preference scoring and comparison with models are not available yet.', 'quiz-note'));
    const start = button('Begin', () => { responses = new Map(); current = 0; renderQuestion(); });
    start.disabled = !questions.length;
    host.append(start);
    if (!questions.length) host.append(make('p', 'Questions are not available yet.', 'quiz-note'));
    if (focus) focusHeading(title);
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
    controls.append(previous, next, button('Skip', () => { responses.delete(q.id); moveForward(); }, 'quiz-text-button'));
    host.append(controls);
    host.append(make('p', 'Your answers are not submitted or saved.', 'quiz-note'));
    focusHeading(title);
  }
  function renderReview() {
    clear();
    const title = heading('Your choices');
    host.append(make('p', `${responses.size} of ${questions.length} questions answered.`));
    host.append(make('p', 'Preference scoring and model comparison will appear here once the scoring method and model results are ready. These choices are not a measure of moral correctness.', 'quiz-note'));
    const list = make('div', undefined, 'quiz-review');
    questions.forEach((q, index) => {
      const details = document.createElement('details');
      const choice = q.options.find(option => option.label === responses.get(q.id));
      details.append(make('summary', `Question ${index + 1} · ${choice ? `Response ${choice.label}` : 'Skipped'}`));
      const prompt = make('div', undefined, 'quiz-prompt');
      const setup = make('div', undefined, 'shared-setup');
    setup.append(make('span', 'Shared situation', 'scenario-label'), make('p', q.setup));
    const variation = make('div', undefined, 'scenario-variation');
    variation.append(make('span', 'Details for this question', 'scenario-label'));
    q.variation.split(/\n\s*\n/).forEach(paragraph => variation.append(make('p', paragraph)));
    prompt.append(setup, variation);
      details.append(prompt);
      details.append(make('p', choice ? `${choice.label}. ${choice.text}` : 'No response.', 'quiz-review-answer'));
      details.append(button('Edit response', () => { current = index; renderQuestion(); }));
      list.append(details);
    });
    host.append(list);
    host.append(make('p', 'Nothing has been submitted or saved. Starting again or reloading clears these choices.', 'quiz-note'));
    host.append(button('Start again', endQuiz));
    focusHeading(title);
  }
  intro();
})();
