# vector-pose

A vector-based skeletal rigging tool built with Electron and React.

## Features

- Vector-based skeletal rigging system
- Real-time preview and manipulation
- Node-based hierarchy system
- Undo/redo functionality
- Custom file format (.fab.json) for saving poses and animations
- Keyboard shortcuts for common operations

## Prerequisites

- Node.js 18.0 or higher
- npm 8.0 or higher

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/bluehexagons/vector-pose.git
cd vector-pose
npm install
```

## Development

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
  - `/services` - Business logic and services
  - `/shared` - Shared types and utilities
  - `/utils` - Utility functions and helpers

## File Format

vector-pose uses the .fab file format for storing pose and animation data. Files contain:

- Node hierarchy information
- Transform data (position, rotation, scale)
- Sprite references
- Animation keyframes

## Keyboard Shortcuts

- Ctrl+Z: Undo
- Ctrl+Y/Ctrl+Shift+Z: Redo
- Delete: Remove selected node
- (...)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - See LICENSE file for details
