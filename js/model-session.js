(function () {
  const panel = document.querySelector('[data-endpoint][data-title]');
  if (!panel) return;

  const endpoint = panel.dataset.endpoint;
  const form = panel.querySelector('[data-session-form]');
  const input = panel.querySelector('[data-session-input]');
  const messagesEl = panel.querySelector('[data-session-messages]');
  const emptyEl = panel.querySelector('[data-session-empty]');
  const systemEl = panel.querySelector('[data-system-prompt]');
  const submitButton = panel.querySelector('[data-session-submit]');
  const maxMessages = Number(panel.dataset.maxMessages || 12);
  const messages = [];

  function setBusy(isBusy) {
    panel.classList.toggle('is-loading', isBusy);
    panel.setAttribute('aria-busy', isBusy ? 'true' : 'false');
    if (submitButton) {
      submitButton.disabled = isBusy;
      submitButton.textContent = isBusy ? (submitButton.dataset.labelLoading || 'Sending') : (submitButton.dataset.labelIdle || 'Send');
    }
  }

  function renderMessage(role, content, state) {
    if (emptyEl) emptyEl.hidden = true;
    const item = document.createElement('div');
    item.className = `model-message model-message--${role}${state ? ` model-message--${state}` : ''}`;
    item.textContent = content;
    messagesEl.appendChild(item);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function pushMessage(role, content) {
    messages.push({ role, content });
    while (messages.length > maxMessages) messages.shift();
    renderMessage(role, content);
  }

  async function send(content) {
    if (!endpoint) {
      renderMessage('assistant', 'Model session endpoint is not configured.', 'error');
      return;
    }

    pushMessage('user', content);
    renderMessage('assistant', 'Thinking...', 'loading');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        system: systemEl ? systemEl.value : '',
        messages,
        page: {
          title: panel.dataset.title,
          url: panel.dataset.url || window.location.href
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Request failed with ${response.status}`);
    }

    const data = await response.json();
    const answer = data && data.message && data.message.content;
    const loading = messagesEl.querySelector('.model-message--loading');
    if (loading) loading.remove();
    pushMessage('assistant', answer || 'No response content.');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) return;
    input.value = '';
    setBusy(true);

    try {
      await send(content);
    } catch (error) {
      const loading = messagesEl.querySelector('.model-message--loading');
      if (loading) loading.remove();
      renderMessage('assistant', error.message || 'Model session request failed.', 'error');
    } finally {
      setBusy(false);
      input.focus();
    }
  });
})();
