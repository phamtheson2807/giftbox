(() => {
  const MESSAGE_KEY = 'giftbox-orbit-messages';
  const defaults = ['YÊU EM', 'MÃI BÊN NHAU', 'YOU ARE MY UNIVERSE'];
  const form = document.getElementById('messageForm');
  const textarea = document.getElementById('messages');
  const preview = document.getElementById('preview');
  const lineCount = document.getElementById('lineCount');
  const saveStatus = document.getElementById('saveStatus');
  const resetButton = document.getElementById('resetButton');
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('giftbox-admin') : null;

  function parse(value) {
    return value.split('\n').map(line => line.trim()).filter(Boolean).slice(0, 8);
  }

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(MESSAGE_KEY));
      return Array.isArray(data) && data.length ? data.slice(0, 8) : defaults;
    } catch (_) {
      return defaults;
    }
  }

  function render() {
    const messages = parse(textarea.value);
    lineCount.textContent = `${messages.length} / 8 lời nhắn`;
    preview.replaceChildren(...messages.map(message => {
      const chip = document.createElement('span');
      chip.textContent = message;
      return chip;
    }));
  }

  function save(messages) {
    localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
    channel?.postMessage({ type: 'messages-updated' });
    saveStatus.textContent = 'Đã gửi vào vũ trụ ✓';
    setTimeout(() => { saveStatus.textContent = ''; }, 2400);
  }

  textarea.value = load().join('\n');
  render();
  textarea.addEventListener('input', render);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const messages = parse(textarea.value);
    if (!messages.length) {
      saveStatus.textContent = 'Hãy nhập ít nhất một lời nhắn';
      textarea.focus();
      return;
    }
    textarea.value = messages.join('\n');
    render();
    save(messages);
  });
  resetButton.addEventListener('click', () => {
    textarea.value = defaults.join('\n');
    render();
    save(defaults);
  });
})();
