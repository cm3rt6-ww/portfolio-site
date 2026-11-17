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

  // Drive the hero motion directly so mobile browsers do not drop CSS keyframes.
  const heroArt = document.querySelector('.hero-art');
  if (heroArt) {
    const rings = [...heroArt.querySelectorAll('.orbit')];
    const sphere = heroArt.querySelector('.sphere');
    const highlight = heroArt.querySelector('.sphere-highlight');
    const crosses = [...heroArt.querySelectorAll('.art-cross')];
    let lastFrame = 0;
    let elapsed = 0;
    const animateHero = now => {
      requestAnimationFrame(animateHero);
      if (document.hidden || motionPaused) { lastFrame = 0; return; }
      if (!lastFrame) lastFrame = now;
      elapsed += Math.min(now - lastFrame, 50);
      lastFrame = now;
      const seconds = elapsed / 1000;
      const rotations = [seconds * 20, -seconds * 360 / 26, -seconds * 360 / 20];
      rings.forEach((ring, index) => {
        const base = [-29, 48, 105][index] || 0;
        ring.style.transform = `translate3d(-50%,-50%,0) rotate(${base + rotations[index]}deg)`;
      });
      if (sphere) sphere.style.transform = `translate(-50%,-50%) scale(${1 + .0175 * (1 - Math.cos(seconds * Math.PI / 4)) / 2})`;
      if (highlight) {
        const phase = (1 - Math.cos(seconds * Math.PI * 2 / 7)) / 2;
        highlight.style.opacity = String(.5 + .5 * phase);
        highlight.style.transform = `translateY(${12 * phase}px) rotate(${-27 + 17 * phase}deg)`;
      }
      crosses.forEach((cross, index) => {
        const direction = index === 1 ? -1 : 1;
        const duration = index === 1 ? 22 : 16;
        cross.style.transform = `rotate(${direction * seconds * 360 / duration}deg)`;
      });
    };
    requestAnimationFrame(animateHero);
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
  if (list && Array.isArray(data.projects) && data.projects.length) {
    list.replaceChildren();
    data.projects.forEach((project, index) => {
      if (!project || typeof project !== 'object') return;
      const card = el('article', `project-card${index % 3 === 2 ? ' project-wide' : ''}`);
      const url = safeUrl(project.url);
      const videoUrl = safeUrl(project.video);
      const image = el(videoUrl ? 'button' : url ? 'a' : 'div', `project-image project-visual-${index % 3 + 1}`);
      if (videoUrl) {
        image.type = 'button';
        image.setAttribute('aria-label', `Смотреть видео: ${clean(project.title)}`);
        const preview = el('video', 'project-preview');
        preview.src = videoUrl;
        preview.muted = true;
        preview.playsInline = true;
        preview.setAttribute('playsinline', '');
        preview.setAttribute('webkit-playsinline', '');
        preview.loop = true;
        preview.preload = 'metadata';
        image.append(preview, el('span', 'project-play', 'СМОТРЕТЬ ↗'));
        let previewTimer;
        const stopPreview = () => {
          clearTimeout(previewTimer);
          preview.pause();
          if (preview.readyState) preview.currentTime = 0;
        };
        image.addEventListener('carousel-hide', stopPreview);
        image.addEventListener('pointerenter', event => {
          if (event.pointerType !== 'mouse' || document.documentElement.dataset.motion === 'off') return;
          previewTimer = setTimeout(() => {
            if (!videoDialog.open && !document.hidden) preview.play().catch(() => {});
          }, 700);
        });
        image.addEventListener('pointermove', event => {
          if (event.pointerType !== 'mouse') return;
          const bounds = image.getBoundingClientRect();
          image.style.setProperty('--cursor-x', `${event.clientX - bounds.left}px`);
          image.style.setProperty('--cursor-y', `${event.clientY - bounds.top}px`);
          image.classList.add('has-pointer');
        });
        image.addEventListener('pointerleave', () => {
          stopPreview();
          image.classList.remove('has-pointer');
        });
        document.addEventListener('visibilitychange', () => { if (document.hidden) stopPreview(); });
        image.addEventListener('click', event => {
          stopPreview();
          openVideo(project, image);
        });
      }
      if (url) {
        image.href = url;
        image.setAttribute('aria-label', `Открыть проект: ${clean(project.title) || 'без названия'}`);
      }
      const artwork = el('div', 'project-artwork');
      artwork.setAttribute('aria-hidden', 'true');
      artwork.append(el('span'), el('i'));
      if (!videoUrl) image.append(artwork);
      const imageUrl = safeUrl(project.image);
      if (imageUrl) {
        const img = el('img', 'project-photo');
        img.src = imageUrl;
        img.alt = clean(project.title) ? `Изображение: ${project.title.trim()}` : 'Изображение проекта';
        img.loading = 'lazy';
        image.append(img);
      }
      if (project.placeholder) image.append(el('span', 'project-image-label', 'ПРИМЕР ОФОРМЛЕНИЯ'));
      image.append(el('span', 'project-number', `${String(index + 1).padStart(2, '0')} / ${String(data.projects.length).padStart(2, '0')}`));
      const info = el('div', 'project-info');
      const details = el('div');
      if (clean(project.category)) details.append(el('div', 'project-category', clean(project.category)));
      const title = el('h3');
      if (url) {
        const titleLink = el('a', '', clean(project.title) || 'Без названия');
        titleLink.href = url;
        title.append(titleLink);
      } else title.textContent = clean(project.title) || 'Без названия';
      details.append(title);
      if (clean(project.description)) details.append(el('p', '', clean(project.description)));
      info.append(details);
      if (url) {
        const arrow = el('a', 'project-index', '↗');
        arrow.href = url;
        arrow.setAttribute('aria-label', `Открыть проект: ${clean(project.title) || 'без названия'}`);
        info.append(arrow);
      } else if (!videoUrl || clean(project.category)) {
        const arrow = el('span', 'project-index project-index-muted', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        info.append(arrow);
      }
      card.append(image, info);
      list.append(card);
    });
  }

  const carousel = document.querySelector('.project-carousel');
  const cards = list ? [...list.querySelectorAll('.project-card')] : [];
  if (carousel && cards.length > 1) {
    let current = 0;
    let wheelLocked = false;
    const count = carousel.querySelector('.carousel-count');
    const update = () => {
      cards.forEach((card, index) => {
        const offset = (index - current + cards.length) % cards.length;
        const position = offset === 0 ? 'active' : offset <= Math.floor(cards.length / 2) ? 'next' : 'previous';
        card.dataset.position = position;
        card.inert = position !== 'active';
        card.setAttribute('aria-hidden', String(position !== 'active'));
        if (position !== 'active') card.querySelector('.project-image')?.dispatchEvent(new Event('carousel-hide'));
      });
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      document.dispatchEvent(new Event('preview-update'));
    };
    const move = step => { current = (current + step + cards.length) % cards.length; update(); };
    carousel.querySelector('.carousel-prev').addEventListener('click', () => move(-1));
    carousel.querySelector('.carousel-next').addEventListener('click', () => move(1));
    list.addEventListener('wheel', event => {
      if (Math.abs(event.deltaY) < 8 && Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      if (wheelLocked) return;
      wheelLocked = true;
      move((Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX) > 0 ? 1 : -1);
      setTimeout(() => { wheelLocked = false; }, 650);
    }, { passive: false });
    let gesture;
    const resetGesture = () => {
      gesture = null;
      list.classList.remove('is-dragging');
      list.style.removeProperty('--drag-x');
    };
    list.addEventListener('pointerdown', event => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
      list.setPointerCapture?.(event.pointerId);
    });
    list.addEventListener('pointermove', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.dragging) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.2) { resetGesture(); return; }
        gesture.dragging = true;
        list.classList.add('is-dragging');
      }
      const limit = list.clientWidth * .75;
      list.style.setProperty('--drag-x', `${Math.max(-limit, Math.min(dx, limit))}px`);
    });
    list.addEventListener('pointerup', event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const shouldMove = gesture.dragging && Math.abs(dx) >= 45;
      resetGesture();
      if (shouldMove) move(dx < 0 ? 1 : -1);
    });
    list.addEventListener('pointercancel', resetGesture);
    list.addEventListener('lostpointercapture', resetGesture);
    update();
  }

  // Touch screens have no hover: animate the visible, active project instead.
  if (list && 'IntersectionObserver' in window) {
    let visible = false;
    const updateTouchPreview = () => {
      if (!touchLayout.matches) return;
      list.querySelectorAll('.project-card').forEach(card => {
        const preview = card.querySelector('.project-preview');
        if (!preview) return;
        if (visible && card.dataset.position === 'active' && !videoDialog.open && !document.hidden && !motionPaused) {
          preview.play().catch(() => {});
        } else preview.pause();
      });
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      updateTouchPreview();
    }, { threshold: 0.25 });
    observer.observe(list);
    document.addEventListener('preview-update', updateTouchPreview);
    document.addEventListener('motion-change', updateTouchPreview);
    document.addEventListener('visibilitychange', updateTouchPreview);
    touchLayout.addEventListener?.('change', updateTouchPreview);
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
