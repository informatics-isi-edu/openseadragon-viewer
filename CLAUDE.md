# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A 2D image viewer built on [OpenSeadragon](https://openseadragon.github.io/) with multi-channel image support, SVG annotation overlay, real-time color filtering, and an in-view scalebar. Primarily used inside an iframe within the [Chaise viewer app](https://github.com/informatics-isi-edu/chaise/tree/master/docs/user-docs/viewer/viewer-app.md) via `postMessage` cross-window communication.

## Build & Deploy

No build step — plain JavaScript with vendor libs committed in `vendor/`. No npm/node required for development.

```bash
make deploy          # rsync to /var/www/html/openseadragon-viewer/ (configurable via env vars)
make help            # list available targets
```

Deploy env vars (all must have trailing `/`):
- `WEB_URL_ROOT` (default `/`)
- `WEB_INSTALL_ROOT` (default `/var/www/html/`)
- `OSD_VIEWER_REL_PATH` (default `openseadragon-viewer/`)

## Architecture

**No module bundler or framework.** All JS files are loaded via `<script>` tags in `mview.html` (the entry point). Order matters — dependencies must appear before dependents.

### Core Layers

- **`js/app.js`** — Application singleton (`OSDViewer`). Initializes viewer + toolbar, routes events between them and the parent window (Chaise) via `dispatchEvent`/`receiveChaiseEvent` using `postMessage`.
- **`js/config.js`** — Global config object (`_config`) passed to `OSDViewer`. Contains OSD settings, scalebar config, and annotation constants.
- **`js/viewer/viewer.js`** — `Viewer` constructor. Manages OpenSeadragon instance, channels, SVG annotation overlays, zoom, image loading, and export.
- **`js/toolbar/toolbar.controller.js`** — `ToolbarController`. Orchestrates toolbar sub-components (annotation tool, channel list, z-plane list).
- **`js/toolbar/toolbar.view.js`** — `ToolbarView`. DOM rendering for toolbar menus and UI.

### Sub-systems

- **Channels** (`js/viewer/channel/`) — Multi-channel image compositing with per-channel color filters. `channel.js` manages individual channel state; `channel-filter.js` handles hue/intensity filtering.
- **Annotations** (`js/viewer/annotation/`) — SVG-based drawing system. `annotation-group.js` groups annotations; `annotation-svg.js` manages the SVG overlay. Shape types (rect, circle, polygon, polyline, line, arrowline, path, text) each extend `base.js`.
- **Toolbar components** (`js/toolbar/`) — `channel-list.js`/`channel-item.js` for channel UI, `annotation-tool.js` for drawing tools, `z-plane-list.js` for z-axis navigation. `ChannelList` owns a `collection` dict (`osdItemId → ChannelItem`). `hasMore` (more channels exist in the backend than are loaded) gates the remove-channel button, "Add channels" button, and empty-state copy; `totalCount` is the backend total used in the counter display. Each `ChannelItem` carries an `acls` object; `acls.canUpdateConfig` gates the save-settings button.

### Communication Pattern

OSD viewer communicates with its parent (Chaise) via `window.postMessage`. The `app.js` `dispatchEvent` switch statement is the central routing hub — toolbar/viewer events that need to reach Chaise are forwarded as `postMessage`, and incoming Chaise messages are handled in `receiveChaiseEvent`. This is the most important file to understand for adding new cross-window features.

### Vendor Libraries

All in `vendor/`, no package manager. Key deps: OpenSeadragon, D3.js, jQuery 3.4.1, Bootstrap, Tippy.js (tooltips), noUiSlider, SortableJS (drag-to-reorder in channel list), Font Awesome.

### CSS

CSS files mirror the JS component structure — `css/toolbar/channel-item.css` corresponds to `js/toolbar/channel-item.js`, etc. Toolbar styles are scoped under `#navMenuContent`; viewer styles under `#openseadragonDiv`.
