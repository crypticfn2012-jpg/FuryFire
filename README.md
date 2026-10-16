# FuryFire — PixelForge Studios

FuryFire is a retro first-person shooter built with vanilla JavaScript and HTML5 Canvas. It uses a custom raycasting engine, five connected campaign missions, seven weapon slots, enemy AI, objectives, pickups, and a multi-phase boss fight.

FuryFire's startup screen uses the same black PixelForge Studios logo/progress intro as Stack Shift. The game also uses original synthesised sound effects and an original generated background-music loop.

## Run locally

Serve the folder over HTTP because the game uses JavaScript ES modules. Do not open `index.html` directly with `file://`.

    python -m http.server 8000

Then open `http://localhost:8000` in a modern browser.

## Controls

| Input | Action |
|---|---|
| WASD | Move and strafe |
| Mouse | Aim / look |
| Left click | Fire; click the title screen to start |
| Enter or Space | Start the campaign / continue screens |
| E | Interact with doors, pickups and objectives |
| 1–7 | Switch weapon slots |
| M | Toggle minimap |
| Tab | Show objective hints |
| Escape | Pause / resume |
| F | Toggle fullscreen where the browser/host allows it |

## Campaign

- Five missions with progressive objectives and enemy types.
- Pistol, shotgun, machine gun, rocket launcher, plasma rifle, sniper rifle and knife weapon slots.
- Grunts, soldiers, scouts, brutes and the multi-phase Commander boss.
- Procedural pixel-art textures, weapon effects and enemy sounds.
- Focus-loss handling pauses active gameplay and clears held inputs to prevent stuck movement or firing.

## CrazyGames SDK

The page loads the official CrazyGames HTML5 SDK v3 before the game modules. `src/platform/crazygames.js` handles SDK initialisation, loading start/stop, gameplay start/stop, a victory celebration, and one optional midgame ad at the natural break after mission 3. The game proceeds to the next mission if the ad cannot be shown.

SDK functionality is only active when the CrazyGames SDK is available. Local and other-host builds remain playable without it. Ad placements, permissions, preview testing and the final listing still need to be configured/checked in the CrazyGames Developer Portal; SDK integration cannot guarantee acceptance.

## Project structure

- `index.html` — game entry, SDK include, and PixelForge intro.
- `src/branding/boot-screen.js` — intro progress and transition.
- `src/platform/crazygames.js` — SDK v3 lifecycle and midgame-ad adapter.
- `src/main.js` — game loop and campaign state.
- `src/engine/` — camera, raycasting renderer and sprites.
- `src/game/` — player, weapons, enemies, projectiles, doors and pickups.
- `src/levels/` — five campaign missions.
- `src/ui/` — HUD, menus, minimap, objectives and transitions.
- `src/audio/` — procedural sound effects and generated music.
- `tests/` — browser test harness and gameplay/system test suites.

## Upstream and licensing note

This repository descends from the Retro Fury browser FPS project at https://github.com/bencivjan/retro-fury. Its upstream README describes the project as MIT-licensed, but the upstream repository did not contain a separate `LICENSE` file when checked. The branding and generated music have been changed here; verify the upstream licence notice and all third-party rights before commercial release.

## Checks before submission

- Run `tests/index.html` over a local HTTP server.
- Test mouse lock, pause/resume, fullscreen, every mission objective and the final boss in a modern browser and the CrazyGames preview iframe.
- Test the ad break in CrazyGames' SDK test environment and verify game audio is restored when an ad finishes or errors.
- Review the Developer Portal's technical requirements, game content policy, and performance checks before submitting.