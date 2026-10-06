// GHL posts ["set-sticky-contacts", "embedded_iframe_<id>", ...] to the parent only after a successful submit.
let submitted = false;
window.addEventListener('message', event => {
  const data = event.data;
  if (submitted || !/(^|\.)leadconnectorhq\.com$/.test(new URL(event.origin).hostname)) return;
  if (!Array.isArray(data) || data[0] !== 'set-sticky-contacts' || !String(data[1]).startsWith('embedded_iframe_')) return;
  const frame = [...document.querySelectorAll('.ghl-form-frame')].find(f => f.contentWindow === event.source);
  if (!frame) return;
  submitted = true;
  let left = false;
  const go = () => left || (left = true, location.assign('thank-you.html'));
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'ghl_form_submitted', form_id: frame.dataset.formId, form_name: frame.dataset.formName, eventCallback: go, eventTimeout: 1500 });
  setTimeout(go, 1500);
});

// Native overflow/scroll-snap carousel; no cloned cards or autoplay.
const track = document.querySelector('#review-track');
const cards = [...track.children];
const controls = document.querySelector('.review-controls');
const previous = controls.querySelector('[data-review-step="-1"]');
const next = controls.querySelector('[data-review-step="1"]');
const cardLeft = card => card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - track.clientLeft;
const inset = () => parseFloat(getComputedStyle(track).scrollPaddingLeft);
let firstVisible = 1;
const currentIndex = () => {
  const left = track.scrollLeft + inset();
  return cards.reduce((nearest, card, index) => Math.abs(cardLeft(card) - left) < Math.abs(cardLeft(cards[nearest]) - left) ? index : nearest, 0);
};
function updateControls() {
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  firstVisible = currentIndex();
}
function move(direction) {
  const index = Math.max(0, Math.min(cards.length - 1, currentIndex() + direction));
  track.scrollTo({ left: cardLeft(cards[index]) - inset() });
}
controls.addEventListener('click', event => {
  const button = event.target.closest('button[data-review-step]');
  if (button) move(Number(button.dataset.reviewStep));
});
track.addEventListener('keydown', event => {
  if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Home' || event.key === 'End') track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth });
  else move(event.key === 'ArrowLeft' ? -1 : 1);
});
track.addEventListener('scroll', updateControls, { passive: true });
new ResizeObserver(() => {
  track.scrollTo({ left: cardLeft(cards[firstVisible]) - inset(), behavior: 'instant' });
  updateControls();
}).observe(track);
controls.hidden = false;
