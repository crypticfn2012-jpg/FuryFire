// Touch controller for FuryFire. It feeds the same input state as keyboard/mouse.
import input from '../utils/input.js';

const canvas = document.getElementById('game-canvas');
const root = document.createElement('div');
root.id = 'ff-mobile-controls';
root.setAttribute('aria-label', 'FuryFire touch controls');
root.innerHTML = `
    <div class="ff-rotate-prompt" role="status" aria-live="polite">
        <div><span class="ff-rotate-icon" aria-hidden="true">↻</span>ROTATE YOUR DEVICE<br>FURYFIRE IS DESIGNED FOR LANDSCAPE PLAY</div>
    </div>
    <div class="ff-look-zone" aria-label="Swipe to aim"></div>
    <div class="ff-stick" aria-label="Movement joystick" role="application">
        <div class="ff-stick-knob"></div>
    </div>
    <div class="ff-mobile-actions" aria-label="Combat controls">
        <div class="ff-mobile-control-stack">
            <div class="ff-weapon-row">
                <button type="button" data-action="weapon-prev" aria-label="Select previous available weapon">PREV</button>
                <button type="button" data-action="weapon-next" aria-label="Select next available weapon">NEXT</button>
            </div>
            <div class="ff-support-row">
                <button type="button" data-tap-key="KeyM" aria-label="Toggle map">MAP</button>
                <button type="button" data-hold-key="Tab" aria-label="Hold to view objectives">OBJ</button>
            </div>
            <div class="ff-action-row">
                <button type="button" class="ff-use" data-hold-key="KeyE" aria-label="Use or open door">USE</button>
                <button type="button" class="ff-fire" data-action="fire" aria-label="Fire weapon">FIRE</button>
            </div>
        </div>
    </div>
    <button type="button" class="ff-pause" data-action="pause" aria-label="Open pause and settings">PAUSE</button>
    <button type="button" class="ff-resume" data-action="resume">RESUME</button>
`;
document.body.append(root);

let currentState = -1;
let mobileEnabled = false;
let joystickPointer = null;
let joystickCenter = null;
let lookPointer = null;
let lastLookPoint = null;
const virtualKeysHeld = new Set();
const holdStartedAt = new WeakMap();
const stick = root.querySelector('.ff-stick');
const knob = root.querySelector('.ff-stick-knob');
const lookZone = root.querySelector('.ff-look-zone');
const fireButton = root.querySelector('[data-action="fire"]');

function getSystemInfo() {
    try { return window.CrazyGames?.SDK?.user?.systemInfo || null; }
    catch (_) { return null; }
}
function hasTouchDevice() {
    const info = getSystemInfo();
    const type = info?.device?.type;
    const app = info?.applicationType;
    return navigator.maxTouchPoints > 0 ||
        window.matchMedia?.('(pointer: coarse)').matches === true ||
        type === 'mobile' || type === 'tablet' ||
        app === 'google_play_store' || app === 'apple_store';
}
function applyViewportState() {
    const width = window.visualViewport?.width || window.innerWidth;
    const height = window.visualViewport?.height || window.innerHeight;
    root.classList.toggle('is-portrait', width < height);
}
function setMobileEnabled(enabled) {
    mobileEnabled = Boolean(enabled);
    root.classList.toggle('ff-mobile-device', mobileEnabled);
    window.FuryFireTouchEnabled = mobileEnabled;
    applyViewportState();
}
function releaseKey(code) {
    virtualKeysHeld.delete(code);
    input.setVirtualKey(code, false);
}
function holdKey(code) {
    if (!code) return;
    virtualKeysHeld.add(code);
    input.setVirtualKey(code, true);
}
function tapKey(code) {
    input.tapVirtualKey(code, 100);
}
function resetJoystick() {
    if (joystickPointer !== null) {
        for (const key of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) releaseKey(key);
    }
    joystickPointer = null;
    joystickCenter = null;
    if (knob) knob.style.transform = 'translate(-50%, -50%)';
}
function resetTouches() {
    resetJoystick();
    lookPointer = null;
    lastLookPoint = null;
    for (const code of [...virtualKeysHeld]) releaseKey(code);
    input.setVirtualMouseDown(false);
    fireButton?.classList.remove('is-pressed');
    root.querySelectorAll('button.is-pressed').forEach(button => button.classList.remove('is-pressed'));
}
function syncStateClasses(state) {
    root.classList.toggle('is-playing', state === 3);
    root.classList.toggle('is-paused', state === 4);
    root.classList.toggle('is-settings', state === 8);
}
function updateJoystick(clientX, clientY) {
    if (!stick || !joystickCenter) return;
    const rect = stick.getBoundingClientRect();
    const maxRadius = Math.min(rect.width, rect.height) * 0.34;
    let dx = clientX - joystickCenter.x;
    let dy = clientY - joystickCenter.y;
    const length = Math.hypot(dx, dy);
    if (length > maxRadius && length > 0) {
        dx = dx / length * maxRadius;
        dy = dy / length * maxRadius;
    }
    knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / maxRadius;
    const ny = dy / maxRadius;
    const threshold = 0.25;
    setJoystickKey('KeyA', nx < -threshold);
    setJoystickKey('KeyD', nx > threshold);
    setJoystickKey('KeyW', ny < -threshold);
    setJoystickKey('KeyS', ny > threshold);
}
function setJoystickKey(code, down) {
    if (down) holdKey(code);
    else releaseKey(code);
}

stick.addEventListener('pointerdown', event => {
    if (!mobileEnabled || currentState !== 3 || (root.classList.contains('is-portrait'))) return;
    event.preventDefault();
    event.stopPropagation();
    joystickPointer = event.pointerId;
    const rect = stick.getBoundingClientRect();
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    try { stick.setPointerCapture(event.pointerId); } catch (_) {}
    stick.classList.add('is-pressed');
    updateJoystick(event.clientX, event.clientY);
});
stick.addEventListener('pointermove', event => {
    if (event.pointerId !== joystickPointer) return;
    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
});
function endJoystick(event) {
    if (event.pointerId !== joystickPointer) return;
    resetJoystick();
    stick.classList.remove('is-pressed');
}
stick.addEventListener('pointerup', endJoystick);
stick.addEventListener('pointercancel', endJoystick);
stick.addEventListener('lostpointercapture', endJoystick);

lookZone.addEventListener('pointerdown', event => {
    if (!mobileEnabled || currentState !== 3 || root.classList.contains('is-portrait')) return;
    event.preventDefault();
    lookPointer = event.pointerId;
    lastLookPoint = { x: event.clientX, y: event.clientY };
    try { lookZone.setPointerCapture(event.pointerId); } catch (_) {}
});
lookZone.addEventListener('pointermove', event => {
    if (event.pointerId !== lookPointer || !lastLookPoint) return;
    event.preventDefault();
    const dx = event.clientX - lastLookPoint.x;
    const dy = event.clientY - lastLookPoint.y;
    lastLookPoint = { x: event.clientX, y: event.clientY };
    // Slight touch-specific gain offsets the shorter travel distance on phones.
    input.addLookDelta(dx * 1.35, dy * 1.0);
});
function endLook(event) {
    if (event.pointerId !== lookPointer) return;
    lookPointer = null;
    lastLookPoint = null;
}
lookZone.addEventListener('pointerup', endLook);
lookZone.addEventListener('pointercancel', endLook);
lookZone.addEventListener('lostpointercapture', endLook);

root.querySelectorAll('button[data-tap-key]').forEach(button => {
    const code = button.dataset.tapKey;
    button.addEventListener('pointerdown', event => {
        if (!mobileEnabled || currentState !== 3) return;
        event.preventDefault();
        event.stopPropagation();
        button.classList.add('is-pressed');
        tapKey(code);
        try { button.setPointerCapture(event.pointerId); } catch (_) {}
    });
    const clearPressed = () => button.classList.remove('is-pressed');
    button.addEventListener('pointerup', clearPressed);
    button.addEventListener('pointercancel', clearPressed);
    button.addEventListener('lostpointercapture', clearPressed);
});

root.querySelectorAll('button[data-hold-key]').forEach(button => {
    const code = button.dataset.holdKey;
    button.addEventListener('pointerdown', event => {
        if (!mobileEnabled || currentState !== 3) return;
        event.preventDefault();
        event.stopPropagation();
        holdStartedAt.set(button, Date.now());
        holdKey(code);
        button.classList.add('is-pressed');
        try { button.setPointerCapture(event.pointerId); } catch (_) {}
    });
    const endHold = () => {
        const start = holdStartedAt.get(button) || Date.now();
        const elapsed = Date.now() - start;
        if (elapsed < 80) window.setTimeout(() => releaseKey(code), 100);
        else releaseKey(code);
        button.classList.remove('is-pressed');
    };
    button.addEventListener('pointerup', endHold);
    button.addEventListener('pointercancel', endHold);
    button.addEventListener('lostpointercapture', endHold);
});

function wireAction(button, action) {
    if (!button) return;
    button.addEventListener('pointerdown', event => {
        event.preventDefault();
        event.stopPropagation();
        button.classList.add('is-pressed');
        if (action === 'fire' && currentState === 3) input.setVirtualMouseDown(true);
        if (action === 'pause' && currentState === 3) tapKey('Escape');
        if (action === 'resume' && currentState === 4) tapKey('Escape');
        if (action === 'weapon-prev' && currentState === 3) {
            window.dispatchEvent(new CustomEvent('furyfire:cycle-weapon', { detail: { direction: -1 } }));
        }
        if (action === 'weapon-next' && currentState === 3) {
            window.dispatchEvent(new CustomEvent('furyfire:cycle-weapon', { detail: { direction: 1 } }));
        }
        try { button.setPointerCapture(event.pointerId); } catch (_) {}
    });
    const finish = () => {
        if (action === 'fire') input.setVirtualMouseDown(false);
        button.classList.remove('is-pressed');
    };
    button.addEventListener('pointerup', finish);
    button.addEventListener('pointercancel', finish);
    button.addEventListener('lostpointercapture', finish);
}
root.querySelectorAll('[data-action]').forEach(button => wireAction(button, button.dataset.action));

canvas?.addEventListener('pointerup', () => {
    if (!mobileEnabled) return;
    // Touch can advance briefing, mission-complete, death, and victory screens.
    // The title still uses its existing canvas-click start handler.
    if ([2, 5, 6, 7].includes(currentState)) tapKey('Enter');
});

window.addEventListener('furyfire:state', event => {
    const state = Number(event.detail?.state);
    currentState = Number.isFinite(state) ? state : -1;
    if (!mobileEnabled && hasTouchDevice()) setMobileEnabled(true);
    syncStateClasses(currentState);
    if (currentState !== 3) resetTouches();
});
window.addEventListener('resize', applyViewportState, { passive: true });
window.addEventListener('orientationchange', () => window.setTimeout(applyViewportState, 80), { passive: true });
window.visualViewport?.addEventListener('resize', applyViewportState, { passive: true });
document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetTouches();
});
document.addEventListener('contextmenu', event => {
    if (mobileEnabled) event.preventDefault();
});

// Detect a touch device before the first state event when possible.
setMobileEnabled(hasTouchDevice());
