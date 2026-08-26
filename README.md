# vector-pose

A vector-based skeletal rigging tool built with Electron and React. The
Electron app is the primary editor, while a browser edition is available for
trying the tool without installing it.

## Features

- Vector-based skeletal rigging system
- Real-time preview and manipulation
- Node-based hierarchy system
- Undo/redo functionality
- Custom file format (.fab.json) for saving poses and animations
- Keyboard shortcuts for common operations

## Installation

Windows releases can be found on the [Releases](https://github.com/bluehexagons/vector-pose/releases) page.

The browser edition is published at
[bluehexagons.github.io/vector-pose](https://bluehexagons.github.io/vector-pose/).
It stores its workspace in the browser, starts with the bundled examples, and
can import images or prefab files. Use **Download...** to keep an external copy
of browser-created prefab files.

## Prerequisites

- Node.js 22.12 or higher
- npm 10.9 or higher

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/bluehexagons/vector-pose.git
cd vector-pose
npm install
```

Useful scripts:

```bash
# Start the application in development mode
npm start

# Package the application
npm run package

# Build the browser edition
npm run build:web

# Preview a completed browser build
npm run preview:web

# Create distributables
npm run make

# Publish a new release
npm run publish

# Run linting
npm run lint

# Run utility tests
npm test

# Apply safe lint fixes
npm run lint:fix

# Check formatting, linting, and types
npm run check

# Apply formatting
npm run format
```

## Project Structure

- `/src` - Source code
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/services` - Logic and services
  - `/shared` - Shared types and utilities
  - `/utils` - Utility functions and helpers

## File Format

vector-pose uses the .fab file format for storing pose and animation data. Files contain:

- Node hierarchy information
- Transform data (position, rotation, scale)
- Sprite references
- Animation keyframes

## Directory Structure

For now, uses a hardcoded directory structure. See the `example` directory.

Should target the renderer directory of the game.

- `/data/fabs/` - fab data
- `/gfx/` - graphics data (gfx: uri)
- `/gfx/sprite/` - sprite data (sprite: uri)

The Electron app reads this structure from a selected local directory. The
browser edition maintains the same logical structure in IndexedDB and never
requests access to a local directory. Browser storage belongs to the current
site and browser profile, so download important prefab files before clearing
site data.

## Keyboard Shortcuts

Global shortcuts:

- ctrl+z: Undo
- ctrl+y, ctrl+shift+z: Redo

Node controls:

- delete, backspace: Remove node and children
- p: Reparent node
- c: Create new child node
- h: Toggle node visibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

Apache License 2.0 - See LICENSE file for details
