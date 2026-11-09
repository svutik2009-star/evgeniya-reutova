(() => {
  'use strict';
  const content = window.SITE_CONTENT;
  if (!content) return;
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const money = (value) => value == null ? 'Стоимость уточняется' : new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  const priceMarkup = (service) => `${service.oldPrice ? `<del class="old-price" aria-label="Прежняя стоимость ${money(service.oldPrice)}">${money(service.oldPrice)}</del>` : ''}<span class="current-price">${money(service.price)}</span>${service.priceNote ? `<small class="price-note">${escape(service.priceNote)}</small>` : ''}`;
  const safeLink = (value) => {
    try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''; } catch { return ''; }
  };
  const withTelegramDraft = (value, message) => {
    const link = safeLink(value);
    if (!link || !message) return link;
    const url = new URL(link);
    if (!['t.me', 'telegram.me'].includes(url.hostname)) return link;
    url.searchParams.delete('profile');
    url.searchParams.set('text', message);
    return url.href;
  };
  const safeImage = (value) => {
    if (!value) return '';
    try { const url = new URL(value, location.href); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
  };

  $('#year').textContent = new Date().getFullYear();
  const clarity = content.services.find((service) => service.id === 'clarity');
  if (clarity) {
    document.querySelectorAll('.button-price').forEach((element) => { element.textContent = money(clarity.price); });
    const description = document.querySelector('meta[name="description"]');
    description.content = `Евгения Реутова — психолог. Онлайн-консультации для женщин: тревога, отношения, сложные решения и контакт с собой. ${clarity.name} — ${money(clarity.price)}.`;
  }
  const portrait = safeImage(content.images.portrait);
  if (portrait) $('#hero-portrait').src = portrait;
  if (safeImage(content.images.family)) $('#family-photo').innerHTML = `<img src="${escape(safeImage(content.images.family))}" alt="Евгения с детьми" loading="lazy">`;
  const flowerImages = (Array.isArray(content.images.flowers) ? content.images.flowers : [content.images.flowers]).filter(safeImage);
  $('#flowers-photos').innerHTML = flowerImages.map((src, index) => `<img src="${escape(safeImage(src))}" alt="Евгения ${index === 0 ? 'с букетом розовых и белых цветов' : 'с красными розами'}" loading="lazy">`).join('');

  $('#services').innerHTML = content.services.map((service, index) => `
    <article class="service-card">
      <h3>${escape(service.name)}</h3><p class="service-meta">${escape(service.meta)}</p>
      <p class="service-description">${escape(service.description)}</p>
      <details class="service-details"><summary>Подробнее о формате</summary><p>${escape(service.details)}</p></details>
      <div class="service-bottom"><p class="service-price ${service.price == null ? 'pending' : ''}">${priceMarkup(service)}</p>
      <button class="button ${index === 0 ? 'button-primary' : 'button-secondary'}" data-book="${escape(service.id)}">${escape(service.button)} <span aria-hidden="true">↗</span></button></div>
    </article>`).join('');

  const validDiplomas = content.diplomas.filter((item) => safeImage(item.image));
  if (validDiplomas.length) {
    $('#diplomas').innerHTML = `<div class="diploma-track" id="diploma-track" role="region" aria-label="Дипломы и сертификаты" tabindex="0">${validDiplomas.map((item, index) => `<button class="diploma-button" data-gallery="diplomas" data-index="${index}" aria-label="Увеличить: ${escape(item.title)}"><img src="${escape(safeImage(item.image))}" alt="${escape(item.title)}" loading="lazy"><span>${escape(item.title)} ↗</span></button>`).join('')}</div><div class="diploma-controls"><button id="diploma-prev" aria-label="Предыдущий документ" disabled>←</button><p id="diploma-status" aria-live="polite">1 из ${validDiplomas.length}</p><button id="diploma-next" aria-label="Следующий документ" ${validDiplomas.length < 2 ? 'disabled' : ''}>→</button></div>`;
    const track = $('#diploma-track');
    let activeDiploma = 0;
    const step = () => track.querySelector('.diploma-button').getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || '0');
    const updateDiploma = () => {
      activeDiploma = Math.max(0, Math.min(validDiplomas.length - 1, Math.round(track.scrollLeft / step())));
      $('#diploma-status').textContent = `${activeDiploma + 1} из ${validDiplomas.length}`;
      $('#diploma-prev').disabled = activeDiploma === 0;
      $('#diploma-next').disabled = activeDiploma === validDiplomas.length - 1;
    };
    const moveDiploma = (index) => track.scrollTo({left:Math.max(0,Math.min(validDiplomas.length - 1,index))*step(),behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    track.addEventListener('scroll', updateDiploma, {passive:true});
    $('#diploma-prev').addEventListener('click', () => moveDiploma(activeDiploma - 1));
    $('#diploma-next').addEventListener('click', () => moveDiploma(activeDiploma + 1));
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();moveDiploma(activeDiploma + (event.key === 'ArrowRight'?1:-1));}
    });
    window.addEventListener('resize', () => track.scrollTo({left:activeDiploma*step(),behavior:'instant'}));
  }

  const reviewsContainer = $('#reviews-content');
  const reviewImages = content.reviews.filter((item) => safeImage(item.image));
  if (reviewImages.length) {
    reviewsContainer.innerHTML = `<div class="review-photo-grid">${reviewImages.map((item, index) => `<button class="review-photo" data-gallery="reviews" data-index="${index}" aria-label="Открыть отзыв ${index + 1}"><img src="${escape(safeImage(item.image))}" alt="Отзыв клиентки ${index + 1}, личные данные скрыты" loading="lazy"><span>Читать отзыв <span aria-hidden="true">↗</span></span></button>`).join('')}</div><p class="gallery-hint">Нажмите на отзыв, чтобы прочитать его целиком.</p>`;
  } else if (content.reviews.length) {
    reviewsContainer.innerHTML = `<div class="reviews-track" id="review-track" tabindex="0" role="region" aria-label="Отзывы клиенток">${content.reviews.map((review) => `<article class="review-card"><blockquote>${escape(review.text)}</blockquote><cite>${escape(review.author || 'Анонимно')}</cite></article>`).join('')}</div>${content.reviews.length > 1 ? '<div class="review-controls"><button data-review-direction="-1" aria-label="Предыдущий отзыв">←</button><button data-review-direction="1" aria-label="Следующий отзыв">→</button></div>' : ''}`;
  } else {
    reviewsContainer.innerHTML = '<div class="reviews-empty"><span aria-hidden="true">“</span><h3>У каждой истории —<br>свой темп.</h3><p>В этом разделе появятся настоящие отзывы клиенток. Только с их согласия и с сохранением конфиденциальности.</p></div>';
  }

  const protocol = content.protocol;
  if (protocol) {
    const protocolContact = withTelegramDraft(protocol.url, content.telegramMessages?.protocol);
    const protocolButton = protocolContact
      ? `<a class="button button-primary" href="${escape(protocolContact)}" target="_blank" rel="noopener noreferrer">Получить протокол <span aria-hidden="true">↗</span></a>`
      : '<button class="button button-primary" data-protocol>Получить протокол <span aria-hidden="true">↗</span></button>';
    $('#protocol-title').textContent = protocol.name;
    $('#protocol-content').innerHTML = `<article class="service-card protocol-card"><img class="protocol-cover" src="${escape(safeImage(protocol.image))}" alt="Иллюстрация «Импульс — действие»" loading="lazy"><div class="protocol-copy"><h3>${escape(protocol.name)}</h3><p class="service-meta">${escape(protocol.meta)}</p><p class="service-description">${escape(protocol.description)}</p><details class="service-details protocol-details"><summary>Подробнее о формате</summary><p>${escape(protocol.details)}</p><ul>${protocol.benefits.map(item => `<li>${escape(item)}</li>`).join('')}</ul><p>${escape(protocol.closing)}</p></details>${protocolButton}</div></article>`;
  }

  // Telegram and VK: Simple Icons (CC0). MAX: the official monochrome brand mark.
  const socialIcons = {
    max: '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path d="M50.7571 0.261719C78.2929 0.261719 99.8857 22.5974 99.8857 50.1474C99.8857 77.6974 77.6071 99.4903 51.0214 99.4903C41.5857 99.4903 37.0143 98.1617 29.65 92.9474C29.1429 92.5903 28.45 92.6831 28.0214 93.1403C22.3571 99.1831 7.85 103.426 7.18571 95.176C7.18571 80.7903 0 71.4474 0 49.876C0 21.5546 23.2214 0.261719 50.7571 0.261719ZM51.5286 24.8117C38.4643 24.126 28.2643 33.1974 26.0143 47.3831C24.15 59.1332 27.45 73.4546 30.2786 74.176C31.4786 74.4832 34.3571 72.276 36.4571 70.2974C36.85 69.926 37.45 69.8617 37.9071 70.1474C41.1786 72.1474 44.8786 73.6474 48.9571 73.8617C62.3714 74.5617 74.2571 64.0617 74.9643 50.6474C75.6643 37.2331 64.9429 25.5046 51.5286 24.8046V24.8117Z"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
    vk: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z"/></svg>'
  };
  const footerContacts = content.footerContacts || {};
  const socials = [['max', 'MAX'], ['telegram', 'Telegram'], ['vk', 'ВКонтакте']];
  $('#social-links').innerHTML = socials.map(([key, label]) => {
    const url = key === 'telegram'
      ? withTelegramDraft(footerContacts[key], content.telegramMessages?.contact)
      : safeLink(footerContacts[key]);
    const icon = `<span class="social-icon">${socialIcons[key]}</span><span>${label}</span>`;
    return url
      ? `<a class="social-link" href="${escape(url)}" target="_blank" rel="noopener noreferrer" aria-label="Написать ${key === 'vk' ? 'во' : 'в'} ${label}">${icon}</a>`
      : `<button class="social-link" disabled aria-label="${label} — контакт пока не добавлен">${icon}</button>`;
  }).join('');

  const menu = $('.menu-toggle');
  const closeMenu = () => {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Открыть меню');
    $('#navigation').classList.remove('is-open');
  };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    $('#navigation').classList.toggle('is-open', open);
  });
  $('#navigation').addEventListener('click', (event) => { if (event.target.closest('a, [data-book]')) closeMenu(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
  window.addEventListener('resize', () => { if (window.innerWidth > 620) closeMenu(); });
  const header = $('.site-header');
  const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 15);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  let previousFocus;
  const openDialog = (dialog) => {
    previousFocus = document.activeElement;
    document.body.classList.add('dialog-open');
    dialog.showModal();
  };
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      previousFocus?.focus({ preventScroll: true });
    });
  });

  const choice = $('#service-choice');
  const servicePicker = $('#service-picker');
  const serviceOptions = $('#service-options');
  let selectedServiceId = content.services[0].id;
  let activeServiceIndex = 0;
  let serviceSearch = '';
  let serviceSearchTimer;
  serviceOptions.innerHTML = content.services.map((service, index) => `<div class="service-option" id="service-option-${index}" role="option" aria-selected="${index === 0}" data-service-index="${index}"><span class="service-option-copy"><span class="service-option-title">${escape(service.name)}</span><span class="service-option-meta">${escape(service.meta)} · ${money(service.price)}</span></span><svg class="service-option-check" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="m4 10 4 4 8-8"/></svg></div>`).join('');
  const optionElements = Array.from(serviceOptions.children);
  const servicePickerOpen = () => !serviceOptions.hidden;
  const syncServiceChoice = () => {
    const selected = content.services.find(service => service.id === selectedServiceId);
    $('#service-choice-value').textContent = selected.name;
    optionElements.forEach((option, index) => option.setAttribute('aria-selected', String(content.services[index].id === selectedServiceId)));
  };
  const highlightService = (index) => {
    activeServiceIndex = Math.max(0, Math.min(optionElements.length - 1, index));
    optionElements.forEach((option, i) => option.classList.toggle('is-active', i === activeServiceIndex));
    choice.setAttribute('aria-activedescendant', optionElements[activeServiceIndex].id);
    optionElements[activeServiceIndex].scrollIntoView({block:'nearest'});
  };
  const closeServicePicker = (restoreFocus = false) => {
    serviceOptions.hidden = true;
    choice.setAttribute('aria-expanded', 'false');
    choice.removeAttribute('aria-activedescendant');
    optionElements.forEach(option => option.classList.remove('is-active'));
    serviceSearch = '';
    clearTimeout(serviceSearchTimer);
    if (restoreFocus) choice.focus({preventScroll:true});
  };
  const openServicePicker = () => {
    serviceOptions.hidden = false;
    choice.setAttribute('aria-expanded', 'true');
    highlightService(content.services.findIndex(service => service.id === selectedServiceId));
  };
  const updateBooking = () => {
    const selected = content.services.find((service) => service.id === selectedServiceId) || content.services[0];
    syncServiceChoice();
    $('#booking-meta').textContent = selected.meta;
    $('#booking-price').innerHTML = priceMarkup(selected);
    $('#booking-price').classList.toggle('price-pending', selected.price == null);
    $('#booking-description').textContent = selected.result;
    const payment = selected.payment;
    $('#booking-payment').hidden = !payment;
    $('#booking-payment').innerHTML = payment ? `<h3>Оплата поэтапно</h3><p><strong>${money(payment.upfront)}</strong> — вносите сразу.</p><p>Затем <strong>${money(payment.perSession)}</strong> перед каждой из ${payment.sessionCount} сессий.</p><p>Всего — ${money(selected.price)} за ${payment.sessionCount} сессий.</p><p class="payment-saving">${escape(selected.savingNote)}</p>` : '';
    const message = selected.bookingMessage || `Здравствуйте! Меня интересует ${selected.name}. Хочу записаться на встречу.`;
    const messengerLinks = socials.map(([key, label]) => {
      const contact = safeLink(content.contacts[key]) || safeLink(footerContacts[key]);
      const target = key === 'telegram' ? withTelegramDraft(contact, message) : contact;
      if (!target) return '';
      return `<a class="booking-messenger" href="${escape(target)}" target="_blank" rel="noopener noreferrer" data-booking-messenger="${key}" aria-label="Написать ${key === 'vk' ? 'во' : 'в'} ${label}"><span class="booking-messenger-icon">${socialIcons[key]}</span><span>${label}</span></a>`;
    }).join('');
    $('#booking-next').innerHTML = `<h3 class="booking-contact-title">Куда вам удобно написать?</h3><div class="booking-messengers">${messengerLinks}</div>`;
  };
  const selectActiveService = (restoreFocus = true) => {
    selectedServiceId = content.services[activeServiceIndex].id;
    updateBooking();
    closeServicePicker(restoreFocus);
  };
  choice.addEventListener('click', () => servicePickerOpen() ? closeServicePicker() : openServicePicker());
  serviceOptions.addEventListener('mousedown', event => event.preventDefault());
  serviceOptions.addEventListener('click', event => {
    const option = event.target.closest('[data-service-index]');
    if (!option) return;
    activeServiceIndex = Number(option.dataset.serviceIndex);
    selectActiveService();
  });
  choice.addEventListener('keydown', event => {
    const open = servicePickerOpen();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (open && event.altKey && event.key === 'ArrowUp') {selectActiveService();return;}
      if (!open) openServicePicker();
      else highlightService(activeServiceIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (['Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      if (!open) openServicePicker();
      highlightService(event.key === 'Home' || event.key === 'PageUp' ? 0 : optionElements.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) selectActiveService();
      else openServicePicker();
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      event.stopPropagation();
      closeServicePicker(true);
    } else if (event.key === 'Tab' && open) {
      selectActiveService(false);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!open) openServicePicker();
      clearTimeout(serviceSearchTimer);
      serviceSearch += event.key.toLocaleLowerCase('ru-RU');
      const repeated = Array.from(serviceSearch).every(character => character === serviceSearch[0]);
      const query = repeated ? serviceSearch[0] : serviceSearch;
      const start = repeated ? activeServiceIndex + 1 : 0;
      for (let offset = 0; offset < content.services.length; offset++) {
        const index = (start + offset) % content.services.length;
        if (content.services[index].name.toLocaleLowerCase('ru-RU').startsWith(query)) {highlightService(index);break;}
      }
      serviceSearchTimer = setTimeout(() => {serviceSearch = '';}, 700);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (servicePickerOpen() && !servicePicker.contains(event.target)) closeServicePicker();
  });
  document.addEventListener('focusin', event => {
    if (servicePickerOpen() && !servicePicker.contains(event.target)) closeServicePicker();
  });
  $('#booking-dialog').addEventListener('cancel', event => {
    if (servicePickerOpen()) {event.preventDefault();closeServicePicker(true);}
  });
  $('#booking-dialog').addEventListener('close', () => closeServicePicker());
  syncServiceChoice();

  const legalTitles = { privacy: 'Политика конфиденциальности', consent: 'Согласие на обработку данных', offer: 'Договор-оферта', terms: 'Условия консультаций' };
  const galleries = {
    diplomas: validDiplomas,
    reviews: reviewImages.map((item, index) => ({image:item.image,title:`Отзыв ${index + 1}`}))
  };
  let activeGallery = [];
  let imageIndex = 0;
  const renderGalleryImage = () => {
    const selected = activeGallery[imageIndex];
    $('#enlarged-image').src = safeImage(selected.image);
    $('#enlarged-image').alt = selected.title;
    $('#gallery-caption').textContent = `${selected.title} · ${imageIndex + 1} из ${activeGallery.length}`;
    $('#gallery-prev').disabled = imageIndex === 0;
    $('#gallery-next').disabled = imageIndex === activeGallery.length - 1;
    $('#image-viewer').classList.remove('is-zoomed');
    $('#gallery-zoom').setAttribute('aria-pressed', 'false');
    $('#gallery-zoom').setAttribute('aria-label', 'Увеличить изображение');
    $('#gallery-zoom').textContent = '＋';
  };
  $('#gallery-zoom').addEventListener('click', () => {
    const zoomed = $('#image-viewer').classList.toggle('is-zoomed');
    $('#gallery-zoom').setAttribute('aria-pressed', String(zoomed));
    $('#gallery-zoom').setAttribute('aria-label', zoomed ? 'Уменьшить изображение' : 'Увеличить изображение');
    $('#gallery-zoom').textContent = zoomed ? '−' : '＋';
  });
  $('#gallery-prev').addEventListener('click', () => { if (imageIndex > 0) { imageIndex--; renderGalleryImage(); } });
  $('#gallery-next').addEventListener('click', () => { if (imageIndex < activeGallery.length - 1) { imageIndex++; renderGalleryImage(); } });
  $('#image-dialog').addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' && imageIndex > 0) { event.preventDefault(); imageIndex--; renderGalleryImage(); }
    if (event.key === 'ArrowRight' && imageIndex < activeGallery.length - 1) { event.preventDefault(); imageIndex++; renderGalleryImage(); }
  });
  document.addEventListener('click', (event) => {
    const book = event.target.closest('[data-book]');
    if (book) {
      closeServicePicker();
      selectedServiceId = content.services.some((service) => service.id === book.dataset.book) ? book.dataset.book : content.services[0].id;
      updateBooking();
      openDialog($('#booking-dialog'));
    }
    const legal = event.target.closest('[data-legal]');
    if (legal) {
      const url = safeLink(content.legal[legal.dataset.legal]);
      if (url) { window.open(url, '_blank', 'noopener,noreferrer'); return; }
      $('#info-title').textContent = legalTitles[legal.dataset.legal];
      $('#info-text').textContent = 'Документ готовится. По вопросам записи и условий консультаций напишите Евгении в удобном мессенджере. Персональные данные на сайте не собираются.';
      openDialog($('#info-dialog'));
    }
    const galleryButton = event.target.closest('[data-gallery]');
    if (galleryButton) {
      activeGallery = galleries[galleryButton.dataset.gallery] || [];
      imageIndex = Number(galleryButton.dataset.index);
      if (!activeGallery[imageIndex]) return;
      renderGalleryImage();
      openDialog($('#image-dialog'));
    }
    if (event.target.closest('[data-protocol]')) {
      $('#protocol-next').innerHTML = '<div class="booking-unavailable" role="status"><strong>Получение в Telegram</strong><p>Получить протокол можно в личной переписке с Евгенией. Контакт для связи скоро появится здесь.</p></div>';
      openDialog($('#protocol-dialog'));
    }
    const reviewControl = event.target.closest('[data-review-direction]');
    if (reviewControl) {
      const track = $('#review-track');
      const card = track.querySelector('.review-card');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollBy({ left: (card.getBoundingClientRect().width + 20) * Number(reviewControl.dataset.reviewDirection), behavior: reducedMotion ? 'instant' : 'smooth' });
    }
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('animate-in'); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-heading, .about-copy, .approach-top, .permission-copy, .formats-heading, .steps-intro, .reviews-heading, .final-invite h2').forEach((element) => observer.observe(element));
  }
})();
