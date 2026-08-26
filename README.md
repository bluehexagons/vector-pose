# vector-pose

A vector-based skeletal rigging tool built with Electron and React. The
Electron app is the primary editor, while a browser edition is available for
trying the tool without installing it.

## Features

- Vector-based skeletal rigging system
- Skeletal vector paths with fills, strokes, curves, and winding rules
- Drawing inspector for editing paint, layers, and point-based path commands
- Real-time preview and manipulation
- Node-based hierarchy system
- Undo/redo functionality
- Custom file format (.fab.json) for saving poses and animations
- Keyboard shortcuts for common operations
- Guided welcome screen with new/open actions, first-step instructions, and
  directly accessible learning projects

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

vector-pose uses the `.fab.json` format for storing pose and artwork data. Files contain:

- Node hierarchy information
- Transform data (position, rotation, scale)
- Sprite references
- Vector drawings whose commands reference skeletal node IDs

### Vector drawings

The optional top-level `drawings` array renders paths from the current world
positions of points in `skele`. Each `move`, `line`, `quadratic`, and `cubic`
command names skeletal nodes instead of embedding fixed coordinates. Moving the
nodes therefore changes the path. A `close` command closes the current contour.

```json
{
  "drawings": [
    {
      "id": "curved-shape",
      "sort": 1,
      "fill": "#ff6688",
      "fillRule": "evenodd",
      "stroke": "#441122",
      "strokeWidth": 0.025,
      "strokeLinecap": "round",
      "strokeLinejoin": "round",
      "commands": [
        {"type": "move", "point": "start"},
        {"type": "line", "point": "corner"},
        {
          "type": "quadratic",
          "control": "rounding-control",
          "point": "curve-end"
        },
        {
          "type": "cubic",
          "control1": "return-control-1",
          "control2": "return-control-2",
          "point": "start"
        },
        {"type": "close"}
      ]
    }
  ],
  "skele": {"angle": 0, "mag": 1}
}
```

Paint values use SVG syntax. Supported path styling includes `fill`,
`fillRule` (`nonzero` or `evenodd`), `fillOpacity`, `stroke`, `strokeWidth`,
`strokeOpacity`, `strokeLinecap`, `strokeLinejoin`, `strokeMiterlimit`,
`strokeDasharray`, `strokeDashoffset`, and overall `opacity`. Stroke widths and
dash lengths are measured in world units and zoom with the drawing. `sort`
orders drawings together with sprite nodes; `hidden` disables a drawing. A
drawing with a missing point reference is omitted instead of rendering a
partially connected path.

Use the **Drawings** tab in the right sidebar to create, duplicate, reorder,
hide, or delete drawings. Expanding a drawing exposes its paint and stroke
settings and its ordered path commands. Point fields autocomplete skeletal node
IDs and highlight references that do not exist in the current rig. Changes are
rendered immediately and included in save and export operations.

Six bundled examples are under `example/data/fabs/vector`:

- `shape-studies.fab.json` is a compact tour of straight segments, open
  quadratic strokes, cubic curves, stars, layered shapes, and a reversed inner
  contour.
- `gesture-figure.fab.json` is a simple humanoid skeleton with articulated
  shoulders, elbows, hips, and knees for learning pose hierarchy.
- `robot-puppet.fab.json` combines a second character skeleton with layered
  vector body parts, a face, and independently poseable mechanical limbs.

- `curves-and-strokes.fab.json` demonstrates filled cubic curves, an open
  quadratic line, nested control groups, caps, opacity, dashes, and ordered
  layers.
- `winding-rules.fab.json` compares matching and opposite contour directions,
  both fill rules, fill/stroke opacity, all line caps and joins, solid and
  dashed strokes, and group-local point layouts.
- `nested-control-motion.fab.json` shows an articulated node chain with Bézier
  handles owned by their joints, a rigid bloom point group, and a separately
  rotating leaf subtree. Rotate `stem_sway`, `stem_mid`, `bloom_shape`, and
  `leaf_shape` to see how each nesting level scopes motion for animation poses.

The welcome screen opens these vector examples directly in both editions. The
examples also appear automatically in the browser file explorer. In Electron,
choose the repository's `example` directory as the game directory to browse the
files alongside the sprite example. Clear **Show this screen on startup** if
you prefer to launch directly into the editor; the **Welcome** header button
always brings it back.

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
- ctrl+n (cmd+n on macOS): New project

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
