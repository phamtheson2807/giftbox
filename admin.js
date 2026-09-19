(() => {
  const MESSAGE_KEY = 'giftbox-orbit-messages';
  const PHOTO_KEY = 'giftbox-love-photo';
  const defaults = ['YÊU EM', 'MÃI BÊN NHAU', 'YOU ARE MY UNIVERSE'];
  const form = document.getElementById('messageForm');
  const textarea = document.getElementById('messages');
  const preview = document.getElementById('preview');
  const lineCount = document.getElementById('lineCount');
  const saveStatus = document.getElementById('saveStatus');
  const resetButton = document.getElementById('resetButton');
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('giftbox-admin') : null;
  const photoForm = document.getElementById('photoForm');
  const photoInput = document.getElementById('photoInput');
  const photoPreview = document.getElementById('photoPreview');
  const photoPicker = document.querySelector('.photo-picker');
  const photoStatus = document.getElementById('photoStatus');
  const removePhoto = document.getElementById('removePhoto');
  let pendingPhoto = '';

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

  function showPhoto(dataUrl) {
    pendingPhoto = dataUrl;
    photoPreview.src = dataUrl;
    photoPicker.classList.toggle('has-photo', Boolean(dataUrl));
  }

  function resizePhoto(file) {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) return reject(new Error('Ảnh phải nhỏ hơn 10 MB'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Không thể đọc ảnh'));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ'));
        image.onload = () => {
          const maxSide = 1200;
          const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
          const output = document.createElement('canvas');
          output.width = Math.round(image.width * ratio);
          output.height = Math.round(image.height * ratio);
          const outputContext = output.getContext('2d');
          outputContext.fillStyle = '#08030b';
          outputContext.fillRect(0, 0, output.width, output.height);
          outputContext.drawImage(image, 0, 0, output.width, output.height);
          resolve(output.toDataURL('image/jpeg', .86));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
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

  try { showPhoto(localStorage.getItem(PHOTO_KEY) || ''); }
  catch (_) { photoStatus.textContent = 'Trình duyệt đang chặn lưu ảnh'; }
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files[0];
    if (!file) return;
    photoStatus.textContent = 'Đang xử lý ảnh…';
    try {
      showPhoto(await resizePhoto(file));
      photoStatus.textContent = 'Ảnh đã sẵn sàng, hãy nhấn Lưu';
    } catch (error) {
      photoStatus.textContent = error.message;
      photoInput.value = '';
    }
  });
  photoForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!pendingPhoto) { photoStatus.textContent = 'Hãy chọn một tấm ảnh trước'; return; }
    try {
      localStorage.setItem(PHOTO_KEY, pendingPhoto);
      channel?.postMessage({ type: 'photo-updated' });
      photoStatus.textContent = 'Đã lưu — click đúp vào trái tim để xem ✓';
    } catch (_) {
      photoStatus.textContent = 'Ảnh quá lớn để lưu, hãy chọn ảnh nhỏ hơn';
    }
  });
  removePhoto.addEventListener('click', () => {
    localStorage.removeItem(PHOTO_KEY);
    photoInput.value = '';
    showPhoto('');
    channel?.postMessage({ type: 'photo-updated' });
    photoStatus.textContent = 'Đã xóa ảnh';
  });
})();
