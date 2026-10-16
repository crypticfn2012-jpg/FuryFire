const overlay = document.getElementById('pf-boot');
const bar = document.getElementById('pf-boot-bar');
const caption = document.getElementById('pf-boot-caption');
const startedAt = performance.now();

let progress = 4;
let finished = false;

const progressTimer = window.setInterval(() => {
    progress = Math.min(88, progress + 3 + Math.random() * 4);
    if (bar) bar.style.width = progress + '%';
}, 180);

window.addEventListener('pixelforge:game-ready', () => {
    if (finished) return;
    finished = true;
    window.clearInterval(progressTimer);

    if (bar) bar.style.width = '100%';
    if (caption) caption.textContent = 'Ready to deploy';

    // Keep the signature splash on screen long enough to be recognised.
    const remaining = Math.max(0, 1350 - (performance.now() - startedAt));
    window.setTimeout(() => {
        if (overlay) overlay.classList.add('done');
    }, remaining);
}, { once: true });