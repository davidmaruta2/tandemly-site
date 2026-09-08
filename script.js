const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const reveals = document.querySelectorAll('.reveal');

if (reduced || !('IntersectionObserver' in window)) {
  reveals.forEach((element) => element.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach((element) => observer.observe(element));
}

const form = document.querySelector('[data-interest-form]');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#email').value.trim();
  if (!email) return;

  const subject = 'Tandemly early access';
  const body = `Hello Tandemly,\n\nI would like to join early access.\n\nMy email: ${email}`;
  window.location.href = `mailto:admin@luxfordinteractive.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});
