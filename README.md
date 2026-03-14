# Sound Control

A Chrome extension that lets you control the volume of each browser tab independently — boost a quiet tab up to 150% or silence one that's too loud, all without leaving your current tab.

## Features

- Per-tab volume control from 0% (mute) to 150% (boost)
- Lists all currently audible tabs so you can see and jump to them
- Volume adjustments take effect in real time
- Built on the Web Audio API — no native code or external dependencies

## Installation

### Easy install (recommended)

1. Go to the [Releases page](https://github.com/feissn/SoundControl/releases/latest) and download **sound-control.zip**.

2. Unzip the file. You'll get a folder called `SoundControl` — put it somewhere you won't accidentally delete it (e.g. your Documents folder).

3. Open Chrome and type `chrome://extensions` in the address bar, then press Enter.

4. Turn on **Developer mode** using the toggle in the top-right corner of the page.

   ![Developer mode toggle](https://developer.chrome.com/static/docs/extensions/get-started/tutorial/hello-world/image/extensions-page-e0d64d89a6acf_856.png)

5. Click **Load unpacked**, then select the `SoundControl` folder you unzipped in step 2.

6. Sound Control is now installed. Click the puzzle-piece icon (🧩) in the Chrome toolbar and pin Sound Control so it's always visible.

### Install from source (for developers)

```
git clone https://github.com/feissn/SoundControl.git
```

Then follow steps 3–6 above, selecting the cloned folder in step 5.

## Usage

1. Click the Sound Control icon in the toolbar while any tab is playing audio.
2. Drag the slider to set the volume for the currently active tab (0–150%).
3. The **Audible tabs** list shows every tab currently producing sound, along with its current volume level.
4. Click a tab title in the list to switch to that tab.

> **Note:** Volume changes only take effect after you move the slider for the first time on a given tab. The browser needs to capture the tab's audio stream before volume can be adjusted.

## How It Works

Sound Control uses the Chrome `tabCapture` API to obtain an audio stream from a tab, then routes it through the [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) gain node to adjust the volume before it reaches your speakers.

Because Manifest V3 service workers cannot access browser audio APIs, the audio processing runs inside a hidden [offscreen document](https://developer.chrome.com/docs/extensions/reference/api/offscreen) that stays alive in the background.

```
Popup → Service Worker → Offscreen Document
                              └── tabCapture stream → GainNode → speakers
```

## Project Structure

```
SoundControl/
├── manifest.json          # Extension manifest (Manifest V3)
├── html/
│   ├── popup.html         # Extension popup UI
│   └── offscreen.html     # Hidden document for audio processing
├── css/
│   └── popup.css          # Popup styles
├── js/
│   ├── background.js      # Service worker — message routing, tab capture coordination
│   ├── offscreen.js       # Audio capture and gain control via Web Audio API
│   └── popup.js           # Popup UI logic
└── image/
    ├── 48.png             # Toolbar icon
    └── 128.png            # Extension store icon
```

## Publishing a new release

Bump the version in `manifest.json`, then push a version tag:

```bash
git tag v2.0.1
git push origin v2.0.1
```

GitHub Actions will automatically build `sound-control.zip` and attach it to a new GitHub Release.

## Requirements

- Google Chrome 116 or later (for `chrome.tabCapture.getMediaStreamId` and offscreen document support)

## License

MIT
