# Glass Tab Dashboard

A Chrome extension that replaces the new tab page with a glassmorphism-style dashboard.

## Features

- **Clock & date** — 24-hour format (HH:MM:SS), updates every second; date below
- **Time-based greeting** — Good morning / afternoon / evening
- **Weather** — Location-based (Open-Meteo); city + temperature
- **Shortcuts** — From Chrome’s most visited or your saved shortcuts; add/remove via + or Customize
- **Focus note** — “What’s your focus?” saved automatically
- **Focus timer** — Adjustable duration (+/− 5 min, 5–90 min); Start / Pause / Reset
- **Tip of the day** — Rotating tips
- **Custom background** — Upload an image or GIF from your device (Customize → pen icon)
- **Floating orbs** — Subtle animated gradient orbs on the default background
- **Press /** — Focus the search bar from anywhere
- **Glassmorphism UI** — Semi-transparent cards, blur, borders, hover animations
- **Responsive** — Works on desktop and mobile

## Installation (local / unpacked)

1. Open Chrome and go to `chrome://extensions/`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the folder containing this project (e.g. `Glass_Chrome_ETX`)
5. Open a new tab to see the dashboard


## Tech

- HTML, CSS, JavaScript (no frameworks)
- Google Fonts: Inter
- Chrome Manifest V3, new tab override
- Open-Meteo (weather), Nominatim (city name)
