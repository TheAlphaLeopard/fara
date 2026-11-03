FARA - web version 0.18.36
==========================
Developer: BrianIsCreative
Retrieved from: https://playfara.com/numbers/ (the developer's official site)
Retrieved on: 2026-11-03

This is the complete, unmodified set of files served by the official site.
The web version here (0.18.36) is newer than the itch.io build (0.0.17.8).

FARA is free to play. If you enjoy it, support the developer:
  - itch.io:  https://brianiscreative.itch.io/fara
  - Patreon:  https://www.patreon.com/playfara
  - Discord / Reddit / X links on the itch page

HOW TO RUN
----------
Browsers restrict some features on file:// pages, so serve the folder
locally, e.g.:
  1. Unzip this folder.
  2. Open a terminal in the "fara-web" folder and run:
       python3 -m http.server 8000
  3. Open http://localhost:8000/ in your browser and click "Start Game".

FILES
-----
index.html        game page
o.js              main game engine (procedural graphics, no sprite assets)
data.js           world/map data
noise.js          noise generation helper
discord-auth.js   optional Discord rich-presence auth
game-discord.js   optional Discord integration
style.css         UI styles
font.woff2        pixel font
favicon.ico       site icon
assets/           cursor images (the only bitmap assets the game ships)
