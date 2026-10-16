// CrazyGames HTML5 SDK v3 adapter.
// Safe to import on localhost or on other hosts where the SDK is not present.
let sdkReady = false;
let lastGameplayState = null;
let loadingActive = false;

export async function initCrazyGames() {
    const sdk = window.CrazyGames && window.CrazyGames.SDK;
    if (!sdk || typeof sdk.init !== 'function') {
        console.info('[CrazyGames] SDK unavailable; running in standalone mode.');
        return false;
    }

    let timeoutId = null;
    try {
        const initTask = Promise.resolve()
            .then(() => sdk.init())
            .then(() => true)
            .catch((error) => {
                console.warn('[CrazyGames] SDK initialisation failed:', error);
                return false;
            });
        const timeoutTask = new Promise((resolve) => {
            timeoutId = window.setTimeout(() => resolve(false), 2500);
        });

        sdkReady = await Promise.race([initTask, timeoutTask]);
        if (sdkReady) {
            console.info('[CrazyGames] SDK v3 initialised.');
            const game = window.CrazyGames.SDK.game;
            const applyPlatformSettings = (settings) => {
                window.dispatchEvent(new CustomEvent('furyfire:platform-mute', { detail: { muted: Boolean(settings && settings.muteAudio) } }));
            };
            if (game) {
                try { applyPlatformSettings(game.settings); } catch (_) { /* Settings may not be exposed in a portal build. */ }
                if (typeof game.addSettingsChangeListener === 'function') game.addSettingsChangeListener(applyPlatformSettings);
            }
        } else {
            console.warn('[CrazyGames] SDK did not initialise in time; continuing without platform features.');
        }
    } catch (error) {
        sdkReady = false;
        console.warn('[CrazyGames] SDK initialisation failed:', error);
    } finally {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
    }
    return sdkReady;
}

export function startCrazyGamesLoading() {
    if (!sdkReady || loadingActive) return;
    try {
        const game = window.CrazyGames.SDK.game;
        if (game && typeof game.loadingStart === 'function') {
            game.loadingStart();
            loadingActive = true;
        }
    } catch (error) {
        console.warn('[CrazyGames] Could not report loading start:', error);
    }
}

export function stopCrazyGamesLoading() {
    if (!sdkReady || !loadingActive) return;
    try {
        const game = window.CrazyGames.SDK.game;
        if (game && typeof game.loadingStop === 'function') game.loadingStop();
    } catch (error) {
        console.warn('[CrazyGames] Could not report loading stop:', error);
    } finally {
        loadingActive = false;
    }
}

export function syncCrazyGamesGameplay(active) {
    if (!sdkReady) return;
    const nextState = Boolean(active);
    if (lastGameplayState === nextState) return;
    if (lastGameplayState === null && !nextState) {
        lastGameplayState = false;
        return;
    }

    const game = window.CrazyGames.SDK.game;
    const method = nextState ? 'gameplayStart' : 'gameplayStop';
    if (!game || typeof game[method] !== 'function') {
        lastGameplayState = nextState;
        return;
    }
    try {
        game[method]();
        lastGameplayState = nextState;
    } catch (error) {
        console.warn('[CrazyGames] Gameplay state update failed:', error);
    }
}

export function celebrateCrazyGamesWin() {
    if (!sdkReady) return;
    try {
        const game = window.CrazyGames.SDK.game;
        if (game && typeof game.happytime === 'function') {
            const result = game.happytime();
            if (result && typeof result.catch === 'function') {
                result.catch((error) => console.warn('[CrazyGames] Celebration failed:', error));
            }
        }
    } catch (error) {
        console.warn('[CrazyGames] Celebration failed:', error);
    }
}

export function requestCrazyGamesMidgameAd({ onStarted = () => {}, onFinished = () => {}, onError = () => {} } = {}) {
    const sdk = window.CrazyGames && window.CrazyGames.SDK;
    if (!sdkReady || !sdk || !sdk.ad || typeof sdk.ad.requestAd !== 'function') {
        onError(new Error('CrazyGames midgame ads are unavailable.'));
        return Promise.resolve(false);
    }

    return new Promise((resolve) => {
        let settled = false;
        let timeoutId = null;
        const settle = (success, error) => {
            if (settled) return;
            settled = true;
            if (timeoutId !== null) window.clearTimeout(timeoutId);
            try {
                if (success) onFinished();
                else onError(error);
            } catch (callbackError) {
                console.warn('[CrazyGames] Ad completion callback failed:', callbackError);
            }
            resolve(success);
        };
        timeoutId = window.setTimeout(() => {
            settle(false, new Error('CrazyGames ad callback timed out.'));
        }, 20000);

        try {
            const result = sdk.ad.requestAd('midgame', {
                adStarted: () => {
                    try { onStarted(); } catch (error) { console.warn('[CrazyGames] adStarted callback failed:', error); }
                },
                adFinished: () => settle(true),
                adError: (error) => settle(false, error),
            });
            if (result && typeof result.catch === 'function') {
                result.catch((error) => settle(false, error));
            }
        } catch (error) {
            settle(false, error);
        }
    });
}