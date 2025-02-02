# vector-pose

A vector-based skeletal rigging tool built with Electron and React.

## Features

- Vector-based skeletal rigging system
- Real-time preview and manipulation
- Node-based hierarchy system
- Undo/redo functionality
- Custom file format (.fab.json) for saving poses and animations
- Keyboard shortcuts for common operations

## Installation

Windows releases can be found on the [Releases](https://github.com/bluehexagons/vector-pose/releases) page.

## Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher

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

# Create distributables
npm run make

# Publish a new release
npm run publish

# Run linting
npm run lint
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

MIT License - See LICENSE file for details
