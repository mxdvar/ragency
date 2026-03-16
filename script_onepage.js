/**
 * One-page interactions:
 * - mobile menu
 * - open/close modal
 * - pickers inside modal
 * - phone validation + WhatsApp submission
 * - service-aware modal (shows cleaning fields only for "Клининг")
 */
const WA_NUMBER = "77776463333"; // <-- поменяйте на ваш номер WhatsApp (без +)

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// Mobile menu
const mobile = $('[data-mobile]');
const burger = $('[data-burger]');
burger?.addEventListener('click', () => mobile.classList.toggle('show'));
$$('.mobile__panel a').forEach(a => a.addEventListener('click', () => mobile.classList.remove('show')));

// Modal
const modal = $('#modal');
const openers = $$('[data-open-modal]');
const closers = $$('[data-close-modal]');
const cleaningFields = $('#cleaningFields');

function openModal(serviceFromButton){
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');

  // If opener passed a service - preselect it
  if (serviceFromButton) setService(serviceFromButton);
}
function closeModal(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

openers.forEach(b => b.addEventListener('click', () => {
  mobile?.classList.remove('show');
  openModal(b.getAttribute('data-service'));
}));
closers.forEach(b => b.addEventListener('click', closeModal));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// Pickers helper
function bindPicker(pickerName, inputName, onChange){
  const picker = document.querySelector(`[data-picker="${pickerName}"]`);
  const hidden = document.querySelector(`input[name="${inputName}"]`);
  if (!picker || !hidden) return;

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.pick');
    if (!btn) return;
    const value = btn.getAttribute('data-value');
    if (!value) return;

    picker.querySelectorAll('.pick').forEach(x => x.classList.remove('is-active'));
    btn.classList.add('is-active');
    hidden.value = value;

    if (typeof onChange === 'function') onChange(value);

    // clear validation if exists
    const err = document.querySelector('[data-err-cleaning]');
    if (inputName === 'cleaning' && err) err.textContent = '';
  });
}

function showCleaningFields(isShow){
  if (!cleaningFields) return;
  cleaningFields.style.display = isShow ? '' : 'none';
}

function setService(service){
  const picker = document.querySelector('[data-picker="service"]');
  const hidden = document.querySelector('input[name="service"]');
  if (!picker || !hidden) return;

  // normalize labels
  const map = {
    "Клининг": "Клининг",
    "Охрана": "Охрана",
    "Альпинисты / высотные работы": "Альпинисты",
    "Альпинисты": "Альпинисты",
    "Рекрутинг": "Рекрутинг",
    "Озеленение офиса": "Озеленение",
    "Озеленение": "Озеленение",
    "Грузчики": "Грузчики",
  };
  const v = map[service] || service;

  picker.querySelectorAll('.pick').forEach(x => {
    x.classList.toggle('is-active', x.getAttribute('data-value') === v);
  });
  hidden.value = v;

  showCleaningFields(v === 'Клининг');
}

bindPicker('service', 'service', (v) => {
  showCleaningFields(v === 'Клининг');
});
bindPicker('property', 'property');
bindPicker('cleaning', 'cleaning');

// WhatsApp helper
function openWhatsApp(text){
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener');
}

// Form validation
const form = $('#calcForm');
const errPhone = $('[data-err-phone]');
const errCleaning = $('[data-err-cleaning]');

function isValidKZPhone(v){
  return /^\+7\d{10}$/.test(String(v || '').trim());
}

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  errPhone.textContent = '';
  if (errCleaning) errCleaning.textContent = '';

  const fd = new FormData(form);
  const service = fd.get('service');
  const phone = fd.get('phone');
  const comment = fd.get('comment');

  let ok = true;
  if (!isValidKZPhone(phone)){
    errPhone.textContent = 'Введите номер в формате +77771122321';
    ok = false;
  }

  // validate cleaning type only if service is cleaning
  if (service === 'Клининг'){
    const cleaning = fd.get('cleaning');
    if (!cleaning){
      if (errCleaning) errCleaning.textContent = 'Пожалуйста выберите тип уборки';
      ok = false;
    }
  }

  if (!ok) return;

  let text = `Здравствуйте! Хочу рассчитать стоимость услуги: ${service}.\nТелефон: ${phone}`;

  if (service === 'Клининг'){
    const property = fd.get('property');
    const rooms = fd.get('rooms');
    const area = fd.get('area');
    const cleaning = fd.get('cleaning');

    text += `\nТип недвижимости: ${property || ''}`;
    if (rooms) text += `\nКомнат: ${rooms}`;
    if (area) text += `\nПлощадь: ${area} м²`;
    if (cleaning) text += `\nТип уборки: ${cleaning}`;
  }

  if (comment) text += `\nКомментарий: ${comment}`;

  openWhatsApp(text);
  closeModal();
});

// Footer year
const year = $('#year');
if (year) year.textContent = new Date().getFullYear();

// FAQ accordion (если есть на странице): открывается один — остальные закрываются
document.querySelectorAll('.faq details').forEach((d) => {
  d.addEventListener('toggle', () => {
    if (!d.open) return;
    document.querySelectorAll('.faq details').forEach((x) => { if (x !== d) x.open = false; });
  });
});