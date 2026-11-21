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
  const projects = Array.isArray(data.projects) ? data.projects.filter(project => project && typeof project === 'object') : [];
  if (list && carousel && projects.length) {
    list.replaceChildren();
    list.classList.add('stack-projects');
    list.setAttribute('aria-label', 'Проекты. Используйте стрелки для переключения');
    list.setAttribute('tabindex', '0');
    const controls = carousel.querySelector('.carousel-controls');
    const count = controls.querySelector('.carousel-count');
    const prevButton = controls.querySelector('.carousel-prev');
    const nextButton = controls.querySelector('.carousel-next');
    const dots = el('div', 'stack-dots');
    dots.setAttribute('aria-label', 'Выбрать проект');
    controls.insertBefore(dots, nextButton);
    controls.hidden = false;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let active = 0;
    let inView = !('IntersectionObserver' in window);
    let hovering = false;
    let focusInside = false;
    let lastInteraction = 0;
    let wheelTotal = 0;
    let wheelTime = 0;
    let pointer = null;
    let suppressClick = false;
    const wrap = index => (index + projects.length) % projects.length;
    const showProject = (index, trigger) => {
      const project = projects[index];
      const video = safeUrl(project.video);
      const url = safeUrl(project.url);
      if (video) openVideo(project, trigger);
      else if (url) window.location.href = url;
    };
    const cards = projects.map((project, index) => {
      const card = el('button', 'stack-card');
      card.type = 'button';
      const image = safeUrl(project.image);
      if (image) {
        const img = el('img', 'stack-image');
        img.src = image;
        img.alt = '';
        img.draggable = false;
        card.append(img);
      }
      const caption = el('span', 'stack-caption');
      caption.append(el('span', 'stack-category', clean(project.category) || 'ПРОЕКТ'), el('strong', 'stack-title', clean(project.title) || `Проект ${index + 1}`));
      if (clean(project.description)) caption.append(el('span', 'stack-description', clean(project.description)));
      card.append(caption);
      card.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        lastInteraction = Date.now();
        if (index !== active) select(index);
        else showProject(index, card);
      });
      list.append(card);
      return card;
    });
    const dotButtons = projects.map((project, index) => {
      const dot = el('button', 'stack-dot');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Перейти к проекту ${clean(project.title) || index + 1}`);
      dot.addEventListener('click', () => select(index));
      dots.append(dot);
      return dot;
    });
    function select(index, automatic = false) {
      active = wrap(index);
      if (!automatic) lastInteraction = Date.now();
      cards.forEach((card, i) => {
        let offset = i - active;
        if (offset > projects.length / 2) offset -= projects.length;
        if (offset < -projects.length / 2) offset += projects.length;
        const distance = Math.abs(offset);
        card.style.setProperty('--offset', offset);
        card.style.setProperty('--distance', distance);
        card.style.zIndex = String(10 - distance);
        card.dataset.active = String(offset === 0);
        card.setAttribute('aria-label', `${clean(projects[i].title) || `Проект ${i + 1}`}${offset === 0 ? ' — открыть' : ' — выбрать'}`);
        card.tabIndex = offset === 0 ? 0 : -1;
        dotButtons[i].setAttribute('aria-pressed', String(i === active));
      });
      count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;
    }
    prevButton.addEventListener('click', () => select(active - 1));
    nextButton.addEventListener('click', () => select(active + 1));
    list.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        select(active + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    list.addEventListener('wheel', event => {
      if (event.ctrlKey || projects.length < 2) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) return;
      event.preventDefault();
      const now = Date.now();
      if (now - wheelTime > 450) wheelTotal = 0;
      wheelTotal += delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      if (Math.abs(wheelTotal) >= 40 && now - wheelTime > 300) {
        select(active + (wheelTotal > 0 ? 1 : -1));
        wheelTotal = 0;
        wheelTime = now;
      }
    }, { passive: false });
    list.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
      suppressClick = false;
    });
    list.addEventListener('pointermove', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      const dy = event.clientY - pointer.y;
      if (!pointer.dragging && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        pointer.dragging = true;
        list.setPointerCapture(event.pointerId);
      }
    });
    list.addEventListener('pointerup', event => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const dx = event.clientX - pointer.x;
      if (pointer.dragging) {
        suppressClick = true;
        if (Math.abs(dx) > 45) select(active + (dx < 0 ? 1 : -1));
        window.setTimeout(() => { suppressClick = false; }, 0);
      }
      pointer = null;
    });
    list.addEventListener('pointercancel', () => { pointer = null; });
    carousel.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') hovering = true; });
    carousel.addEventListener('pointerleave', () => { hovering = false; });
    carousel.addEventListener('focusin', () => { focusInside = true; });
    carousel.addEventListener('focusout', event => { if (!carousel.contains(event.relatedTarget)) focusInside = false; });
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; }, { threshold: .1 }).observe(list);
    window.setInterval(() => {
      if (projects.length > 1 && inView && !document.hidden && !motionPaused && !reduced.matches && !hovering && !focusInside && !videoDialog.open && Date.now() - lastInteraction > 5000) select(active + 1, true);
    }, 3500);
    select(0, true);
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
