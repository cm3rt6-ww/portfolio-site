(() => {
  // Start every visit with motion enabled. Old browser settings must not freeze the site.
  let motionPaused = false;
  const motionButton = document.querySelector('.motion-toggle');
  const updateMotion = () => {
    document.documentElement.dataset.motion = motionPaused ? 'off' : 'on';
    motionButton?.setAttribute('aria-pressed', String(!motionPaused));
    if (motionButton) motionButton.title = motionPaused ? 'Включить анимации' : 'Остановить анимации до обновления страницы';
    document.dispatchEvent(new Event('motion-change'));
  };
  if (motionButton) {
    motionButton.hidden = false;
    motionButton.addEventListener('click', () => {
      motionPaused = !motionPaused;
      updateMotion();
    });
  }
  updateMotion();

  /* Glyph Portal © 2026 Christian Katzmann. MIT. Adapted for this portfolio. */
  const portal = document.querySelector('.portal-hero');
  if (portal) {
    const glyph = portal.querySelector('.portal-glyph');
    const clip = portal.querySelector('#portal-clip');
    const ink = portal.querySelector('.portal-ink');
    let raf = 0;
    let focusX = 180;
    const measureGlyph = () => {
      try {
        const first = glyph.getExtentOfChar(0);
        focusX = first.x + first.width / 2;
      } catch (_) { /* Use the fallback until the glyph is ready. */ }
    };
    measureGlyph();
    document.fonts?.ready.then(measureGlyph);
    const draw = () => {
      raf = 0;
      const height = portal.querySelector('.portal-pin').offsetHeight;
      const travel = Math.max(1, portal.offsetHeight - height);
      const progress = motionPaused ? 0 : Math.max(0, Math.min(1, -portal.getBoundingClientRect().top / travel));
      const t = Math.min(progress / .86, 1);
      const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const scale = Math.exp(Math.log(42) * eased);
      const x = 500 + (focusX - 500) * eased;
      const y = 500;
      clip.setAttribute('transform', `translate(500 500) scale(${scale}) translate(${-x} ${-y})`);
      ink.style.clipPath = t >= 1 ? 'none' : '';
      portal.style.setProperty('--portal-copy-opacity', String(1 - Math.min(1, progress * 6)));
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(draw); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { measureGlyph(); schedule(); });
    document.addEventListener('motion-change', schedule);
    draw();
  }

  const contactSection = document.querySelector('#contact');
  if (contactSection) {
    let contactFrame = 0;
    const updateContact = () => {
      contactFrame = 0;
      const rect = contactSection.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight * .7)));
      document.documentElement.style.setProperty('--contact-light', progress);
    };
    const scheduleContact = () => { if (!contactFrame) contactFrame = requestAnimationFrame(updateContact); };
    window.addEventListener('scroll', scheduleContact, { passive: true });
    window.addEventListener('resize', scheduleContact);
    updateContact();
  }
  const data = window.PORTFOLIO_CONTENT;
  if (!data || typeof data !== 'object') return;
  const clean = value => typeof value === 'string' ? value.trim() : '';
  const setText = (selector, value) => {
    if (clean(value)) document.querySelectorAll(selector).forEach(element => { element.textContent = value.trim(); });
  };
  setText('[data-person-name]', data.name);
  setText('[data-hero-intro]', data.heroIntro);
  setText('[data-about-lead]', data.aboutLead);
  setText('[data-about-text]', data.aboutText);
  if (clean(data.name)) document.title = `Портфолио — ${data.name.trim()}`;

  const safeUrl = value => {
    if (!clean(value)) return '';
    try {
      const url = new URL(value.trim(), document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  };
  const el = (tag, className, text) => {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text !== undefined) item.textContent = text;
    return item;
  };

  const touchLayout = matchMedia('(max-width: 700px), (pointer: coarse)');

  const videoDialog = document.querySelector('.video-dialog');
  const player = videoDialog.querySelector('video');
  const touchControls = videoDialog.querySelector('.video-touch-controls');
  let videoTrigger;

  const galleryItems = videoDialog.querySelector('.gallery-items');
  const galleryTitle = videoDialog.querySelector('.gallery-title');
  function openVideo(project, trigger) {
    videoTrigger = trigger;
    videoDialog.classList.toggle('touch-player', touchLayout.matches);
    touchControls.hidden = true;
    player.controls = true;
    galleryTitle.textContent = clean(project.title) || 'Материалы проекта';
    galleryItems.replaceChildren();
    const sources = [{ url: safeUrl(project.video), label: project.mobileVideo ? 'Видео для компьютера' : 'Видео' }];
    if (safeUrl(project.mobileVideo)) sources.push({ url: safeUrl(project.mobileVideo), label: 'Видео для телефона' });
    const items = [...sources];
    (Array.isArray(project.images) ? project.images : []).forEach((image, index) => {
      const url = safeUrl(typeof image === 'string' ? image : image.url);
      if (url) items.push({ url, image: true, label: clean(image.label) || `Фото ${index + 1}` });
    });
    const still = videoDialog.querySelector('.gallery-still');
    const select = (item, button) => {
      galleryItems.querySelectorAll('button').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
      player.pause();
      player.hidden = !!item.image;
      still.hidden = !item.image;
      if (item.image) { still.src = item.url; still.alt = item.label; return; }
      player.controls = item.time === undefined;
      player.onloadedmetadata = item.time === undefined ? null : () => {
        if (Number.isFinite(player.duration)) player.currentTime = player.duration * item.time;
      };
      player.src = item.url;
      player.load();
      if (item.time === undefined) player.play().catch(() => {});
    };
    items.forEach((item, index) => {
      const button = el('button', 'gallery-item', item.label);
      button.type = 'button';
      button.addEventListener('click', () => select(item, button));
      galleryItems.append(button);
      if (index === 0) button.setAttribute('aria-pressed', 'true');
    });
    galleryItems.hidden = items.length < 2;
    videoDialog.showModal();
    document.dispatchEvent(new Event('preview-update'));
    const initial = touchLayout.matches && sources.length > 1 ? 1 : 0;
    select(items[initial], galleryItems.children[initial]);
  }

  const list = document.querySelector('#projects-list');
  const carousel = document.querySelector('.project-carousel');
  const projectList = Array.isArray(data.projects) ? data.projects.filter(project => project && typeof project === 'object') : [];
  const projects = [];
  for (let left = 0, right = projectList.length - 1; left <= right; left++, right--) {
    projects.push(projectList[left]);
    if (left !== right) projects.push(projectList[right]);
  }
  if (list && carousel && projects.length) {
    list.replaceChildren();
    list.classList.add('curved-projects');
    list.setAttribute('aria-label', 'Лента проектов');
    const band = el('div', 'curved-band');
    band.setAttribute('aria-hidden', 'true');
    list.append(band);
    const picker = el('div', 'project-picker');
    picker.setAttribute('aria-label', 'Выбрать проект');
    const details = el('div', 'curved-details');
    const controls = carousel.querySelector('.carousel-controls');
    controls.hidden = true;
    controls.before(picker, details);
    const previews = projects.map(project => safeUrl(project.image));
    let selected = 0;
    let tiles = [];
    let columns = 0;
    let pitch = 0;
    let radius = 0;
    let limit = 0;
    let position = 0;
    let lastFrame = 0;
    let inView = !('IntersectionObserver' in window);
    let hover = false;
    const mod = (number, count) => ((number % count) + count) % count;
    const showProject = (index, trigger) => {
      const project = projects[index];
      const video = safeUrl(project.video);
      const url = safeUrl(project.url);
      if (video) openVideo(project, trigger);
      else if (url) window.location.href = url;
    };
    const selectProject = index => {
      selected = mod(index, projects.length);
      picker.querySelectorAll('button').forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
      const project = projects[selected];
      const title = el('h3', '', clean(project.title) || 'Без названия');
      const description = el('p', '', clean(project.description));
      const category = el('span', 'project-category', clean(project.category));
      details.replaceChildren(category, title, description);
      if (safeUrl(project.video) || safeUrl(project.url)) {
        const open = el('button', 'curved-open', safeUrl(project.video) ? 'Смотреть проект ↗' : 'Открыть проект ↗');
        open.type = 'button';
        open.addEventListener('click', () => showProject(selected, open));
        details.append(open);
      }
    };
    projects.forEach((project, index) => {
      const button = el('button', 'project-picker-button', clean(project.title) || `Проект ${index + 1}`);
      button.type = 'button';
      button.addEventListener('click', () => selectProject(index));
      picker.append(button);
    });
    selectProject(0);

    // A single frame from each video is shared by all its facets.
    projects.forEach((project, index) => {
      const src = safeUrl(project.video);
      if (previews[index] || !src) return;
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.addEventListener('loadeddata', () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = Math.max(1, Math.round(640 * video.videoHeight / video.videoWidth));
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          previews[index] = canvas.toDataURL('image/jpeg', .78);
          tiles.forEach(tile => { if (tile.projectIndex === index) paintTile(tile, index); });
        } catch (_) { /* External videos can prohibit frame extraction. */ }
        video.removeAttribute('src');
        video.load();
      }, { once: true });
      video.src = src;
      video.load();
    });
    function paintTile(tile, index) {
      tile.projectIndex = index;
      const image = previews[index];
      tile.element.setAttribute('aria-label', clean(projects[index].title) || `Проект ${index + 1}`);
      tile.slices.forEach(slice => {
        slice.style.backgroundImage = image ? `url("${image.replace(/["\\]/g, '\\$&')}")` : '';
      });
    }
    const bend = 80 * Math.PI / 180;
    const arc = (1.6 - 1 + Math.cos(bend)) / (2 * 1.6 * Math.sin(bend));
    const aspect = 16 / 9;
    const slices = matchMedia('(max-width: 700px), (pointer: coarse)').matches ? 4 : 16;
    const measure = () => {
      const width = list.clientWidth;
      const height = list.clientHeight;
      if (!width || !height) return;
      const tileHeight = Math.min(height * .52, width * .55 / aspect);
      radius = width * arc;
      const unit = tileHeight / radius * 180 / Math.PI;
      pitch = (aspect + .06) * unit;
      limit = bend * 180 / Math.PI + aspect * unit / 2;
      const count = Math.min(60, Math.max(2, Math.ceil(2 * limit / pitch) + 2));
      list.style.setProperty('--curve-perspective', `${radius * 1.6}px`);
      list.style.setProperty('--tile-width', `${tileHeight * aspect}px`);
      list.style.setProperty('--tile-height', `${tileHeight}px`);
      if (count !== columns) {
        columns = count;
        band.replaceChildren();
        tiles = Array.from({ length: columns }, () => {
          const element = el('button', 'curved-tile');
          element.type = 'button';
          element.tabIndex = -1;
          const parts = Array.from({ length: slices }, (_, k) => {
            const part = el('span', 'curved-slice');
            element.append(part);
            return part;
          });
          const tile = { element, slices: parts, projectIndex: -1 };
          element.addEventListener('click', () => {
            selectProject(tile.projectIndex);
            showProject(tile.projectIndex, picker.children[tile.projectIndex]);
          });
          band.append(element);
          return tile;
        });
      }
      tiles.forEach(tile => tile.slices.forEach((part, k) => {
        const share = aspect / slices;
        const angle = (aspect / 2 - (k + .5) * share) * unit;
        part.style.left = `${(aspect - share) / 2 / aspect * 100}%`;
        part.style.width = `${100 / slices + .3}%`;
        part.style.transform = `translateZ(${radius}px) rotateY(${angle}deg) translateZ(${-radius}px)`;
        part.style.backgroundSize = `${slices * 100}% 100%`;
        part.style.backgroundPosition = `${k / (slices - 1) * 100}% center`;
      }));
      render();
    };
    function render() {
      if (!columns) return;
      const first = Math.floor(position - columns / 2);
      tiles.forEach((tile, slot) => {
        const cell = first + slot;
        const angle = (cell - position) * pitch;
        const index = mod(cell, projects.length);
        if (tile.projectIndex !== index) paintTile(tile, index);
        tile.element.style.visibility = Math.abs(angle) > limit ? 'hidden' : 'visible';
        tile.element.style.transform = `translateZ(${radius}px) rotateY(${angle}deg) translateZ(${-radius}px)`;
      });
    }
    const animateBand = time => {
      if (lastFrame && inView && !document.hidden && !motionPaused && !hover && !videoDialog.open) {
        position += Math.min(time - lastFrame, 100) / 2800;
        render();
      }
      lastFrame = time;
      requestAnimationFrame(animateBand);
    };
    list.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hover = true; });
    list.addEventListener('pointerleave', () => { hover = false; });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(list);
    else window.addEventListener('resize', measure);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { threshold: .1 }).observe(list);
    measure();
    requestAnimationFrame(animateBand);
  }

  const playToggle = touchControls.querySelector('.video-play-toggle');
  const muteToggle = touchControls.querySelector('.video-mute-toggle');
  const seek = touchControls.querySelector('.video-seek');
  const updateSeek = () => {
    const duration = Number.isFinite(player.duration) ? player.duration : 0;
    seek.disabled = duration === 0;
    seek.max = duration;
    seek.value = duration ? player.currentTime : 0;
  };
  playToggle.addEventListener('click', () => {
    if (player.paused) player.play().catch(() => {});
    else player.pause();
  });
  player.addEventListener('play', () => { playToggle.textContent = 'Пауза'; });
  player.addEventListener('pause', () => { playToggle.textContent = 'Пуск'; });
  player.addEventListener('ended', () => { playToggle.textContent = 'Пуск'; });
  muteToggle.addEventListener('click', () => { player.muted = !player.muted; });
  player.addEventListener('volumechange', () => muteToggle.setAttribute('aria-pressed', String(player.muted)));
  seek.addEventListener('input', () => { player.currentTime = seek.valueAsNumber; });
  player.addEventListener('durationchange', updateSeek);
  player.addEventListener('timeupdate', updateSeek);
  videoDialog.querySelector('.video-close').addEventListener('click', () => videoDialog.close());
  videoDialog.addEventListener('close', () => {
    player.pause();
    player.onloadedmetadata = null;
    videoDialog.querySelector('.gallery-still').removeAttribute('src');
    player.removeAttribute('src');
    player.load();
    updateSeek();
    videoTrigger?.focus({ preventScroll: true });
    document.dispatchEvent(new Event('preview-update'));
  });

  const reviewList = document.querySelector('#reviews-list');
  function renderReviews(reviews) {
    if (!reviewList) return;
    reviewList.replaceChildren();
    if (!reviews.length) reviewList.append(el('p', 'reviews-empty', 'Пока отзывов нет. Будьте первым!'));
    reviews.forEach(review => {
      const item = el('div', 'review-item');
      const mark = el('div', 'quote-mark', '“');
      mark.setAttribute('aria-hidden', 'true');
      const footer = el('div', 'quote-footer');
      const avatar = el('span', 'quote-avatar', '✳');
      avatar.setAttribute('aria-hidden', 'true');
      const author = el('span');
      author.append(el('strong', '', clean(review.author)), el('small', '', clean(review.detail) || 'ОТЗЫВ'));
      footer.append(avatar, author);
      item.append(mark, el('blockquote', '', clean(review.text)), footer);
      reviewList.append(item);
    });
  }
  const reviewForm = document.querySelector('#review-form');
  const reviewStatus = reviewForm?.querySelector('.review-status');
  async function loadReviews() {
    const response = await fetch('/api/reviews');
    if (!response.ok) throw new Error('Не удалось загрузить отзывы');
    renderReviews(await response.json());
  }
  if (!document.documentElement.classList.contains('static-host')) loadReviews().catch(() => { if (reviewList) reviewList.textContent = 'Не удалось загрузить отзывы. Попробуйте позже.'; });
  reviewForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = reviewForm.querySelector('button');
    const form = new FormData(reviewForm);
    button.disabled = true;
    reviewStatus.textContent = 'Отправляем отзыв…';
    try {
      const response = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author: form.get('author'), text: form.get('text') }) });
      if (!response.ok) throw new Error(response.status === 429 ? 'Пожалуйста, подождите несколько секунд перед отправкой.' : 'Не удалось отправить отзыв. Попробуйте позже.');
      reviewForm.reset();
      reviewStatus.textContent = 'Спасибо! Ваш отзыв опубликован.';
      await loadReviews();
    } catch (error) { reviewStatus.textContent = error.message; }
    finally { button.disabled = false; }
  });

  const contacts = document.querySelector('#contact-details');
  const email = clean(data.email);
  const telegram = clean(data.telegram);
  const validEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email);
  let telegramUrl = '';
  try {
    const parsed = new URL(telegram);
    if (parsed.protocol === 'https:' && ['t.me', 'www.t.me'].includes(parsed.hostname) && parsed.pathname.length > 1) telegramUrl = parsed.href;
  } catch (_) { /* Optional contact is not configured. */ }
  if (contacts && (validEmail || telegramUrl)) {
    contacts.replaceChildren();
    if (validEmail) {
      contacts.append(el('span', 'contact-label', 'ПОЧТА ДЛЯ СВЯЗИ'));
      const mail = el('a', 'contact-address', email);
      mail.href = `mailto:${email}`;
      mail.append(el('span', '', '↗'));
      contacts.append(mail);
    }
    if (telegramUrl) {
      const link = el('a', 'contact-social', 'Написать в Telegram');
      link.href = telegramUrl;
      link.append(el('span', '', '↗'));
      contacts.append(link);
      for (let i = 1; i <= 2; i++) contacts.append(el('span', 'contact-social contact-placeholder-slot', `Профиль на бирже 0${i} — скоро`));
    }
  }

  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (menu && nav) {
    const close = () => { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
    document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  }
})();
