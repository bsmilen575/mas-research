(() => {
  'use strict';
  const host = document.getElementById('quiz');
  if (!host) return;
  const questions = window.DAILY_SCENARIOS || [];
  let responses = new Map();
  let current = 0;
  let startedAt = new Date().toISOString(), completedAt, receipt, frozenPayload, session;
  let timing = new Map();
  let seenModels = sessionStorage.getItem('daily-model-results-seen') === 'true';
  const collector = 'https://moral-machines-quiz-collector.bsmilen.chatgpt.site';
  const consentVersion = 'anonymous-quiz-20261016-1';

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
    responses.clear(); timing.clear();
    startedAt = new Date().toISOString(); completedAt = receipt = frozenPayload = session = undefined;
    current = 0;
    intro(true);
  }
  function renderQuestion() {
    clear();
    const q = questions[current];
    if (!timing.has(q.id)) timing.set(q.id, {presented_at: new Date().toISOString(), presentation_order: q.options.map(o => o.label)});
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
        const t = timing.get(q.id), now = new Date().toISOString();
        if (!t.first_action) { t.first_action = option.label; t.first_answered_at = now; }
        t.answered_at = now;
        responses.set(q.id, option.label);
        next.disabled = false;
      });
      label.append(input, make('span', `${option.label}. ${option.text}`));
      fieldset.append(label);
    });
    host.append(fieldset);
    controls.append(previous, next);
    host.append(controls);
    host.append(make('p', 'At the end, you can choose whether to save your answers anonymously for research.', 'quiz-note'));
    if (!document.getElementById("daily").hidden) {
      focusHeading(title);
      title.scrollIntoView({block: "start"});
    }
  }
  function renderReview() {
    completedAt = new Date().toISOString();
    clear(); heading('Save your answers for research?');
    host.append(make('p', 'Optional: contribute your 24 answers to the Moral Machines study. We save your choices, their order and timing, and whether you viewed model results first. We do not ask for your name, email, or demographics.', 'quiz-note'));
    host.append(make('p', 'Responses are stored privately. Hosting services may process technical connection logs. You can see your results without contributing.', 'quiz-note'));
    const status = make('p', '', 'quiz-note'); status.setAttribute('role', 'status');
    const controls = make('div', undefined, 'quiz-controls');
    const save = button('Save anonymously & see results', async () => {
      save.disabled = true; skip.disabled = true; status.textContent = 'Saving…';
      try {
        if (!frozenPayload) frozenPayload = {
          study_version: window.DAILY_PROFILE.version,
          questionnaire_sha256: 'c5f47743dfa6d08cada0cea78eebfbe3cd3f704e518dcb1d2311cf1d2684cf61',
          consent: true, consent_version: consentVersion,
          started_at: startedAt, completed_at: completedAt, consented_at: new Date().toISOString(),
          model_results_seen_before_completion: seenModels,
          answers: questions.map(q => ({scenario_id:q.id, selected_action:responses.get(q.id), ...timing.get(q.id)}))
        };
        const post = async (path, body, token) => {
          const response = await fetch(collector + path, {method:'POST', headers:{'Content-Type':'application/json', ...(token ? {'X-Collection-Token':token}: {})}, body:JSON.stringify(body), signal:AbortSignal.timeout(20000)});
          if (!response.ok) throw Error('Save failed');
          return response.json();
        };
        if (!session) session = await post('/api/session', {study_version:window.DAILY_PROFILE.version, record_type:location.hostname==='bsmilen575.github.io'?'real':'synthetic'});
        const saved = await post('/api/submissions', {...frozenPayload, submission_id:session.id}, session.token);
        if (saved.saved !== true) throw Error('Save not confirmed');
        receipt = saved.receipt; showResults(true);
      } catch {
        status.textContent = 'Saving was not confirmed. Retry, or continue without saving. Retrying will not duplicate your response.';
        save.textContent = 'Retry saving'; save.disabled = false; skip.disabled = false;
      }
    });
    const skip = button('See results without saving', () => showResults(true));
    controls.append(save, skip); host.append(controls, status);
  }
  function showResults(personal) {
    if(personal && responses.size!==questions.length) return;
    seenModels = true; sessionStorage.setItem('daily-model-results-seen', 'true');
    clear(); host.classList.add('quiz-results');
    window.renderDailyProfile(host,personal?Object.fromEntries(responses):null);
    const title=host.querySelector('h2');
    const controls=make('div',undefined,'quiz-controls');
    if(!personal)controls.append(button('Take the quiz',endQuiz));
    controls.append(button('Start again',endQuiz));host.append(controls);
    host.append(make('p',receipt ? `Saved anonymously. Receipt: ${receipt}` : 'No saved submission has been confirmed for this quiz.','quiz-note'));
    if (!document.getElementById("daily").hidden) {
      focusHeading(title);
      title.scrollIntoView({block: "start"});
    }
  }
  intro();
})();
