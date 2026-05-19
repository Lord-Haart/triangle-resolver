# Triangle Resolver

A single-page triangle geometry calculator for computing sides, angles, area,
altitudes, and altitude foot-point segments from structured side-and-angle
input modes. The app renders an interactive SVG diagram and presents precise
numeric results in a responsive layout.

## Current Milestone

This version is a usable milestone rather than a throwaway demo. The core
geometry calculations support fixed `SSS`, `SAS`, `ASA`, `AAS`, and `SSA`
input modes, ambiguous `SSA` input can expose multiple solutions, the SVG
interaction model is complete, result labels are consistent, SVG display layers
can be controlled independently, export metadata is optional, the layout adapts
to desktop and mobile screens, and the visual theme is centralized through CSS
variables.

## Features

- Calculates triangle area, angles, altitudes, and foot-point segment lengths
  from fixed `SSS`, `SAS`, `ASA`, `AAS`, and `SSA` input tabs.
- Uses canonical input layouts so each tab has exactly three numeric fields and
  no side/angle selector dropdowns.
- Shows solution tabs above the SVG when an ambiguous `SSA` input produces two
  valid triangles.
- Uses normalized side lengths internally to reduce overflow risk for large
  inputs.
- Rejects invalid triangles, non-finite inputs, non-positive side lengths,
  invalid angles, incompatible side-angle combinations, and side ratios that
  are too extreme to calculate reliably.
- Draws an SVG diagram with vertices, altitudes, foot points, extension lines,
  foot-point labels, and length labels.
- Supports panning by dragging the SVG.
- Supports wheel zooming around the current mouse position.
- Supports fitting the triangle back to the viewport.
- Supports independently showing or hiding axes, altitudes, foot-point labels,
  segment lengths, triangle fill, vertex labels, and extension lines.
- Provides display presets for construction, measurement, and clean
  presentation views.
- Persists the last display preset or custom display state in `localStorage`.
- Provides a small UI action to clear saved display preferences and restore the
  default construction view.
- Shows a lightweight confirmation after saved display preferences are reset.
- Supports rotating the diagram so side `a`, `b`, or `c` is parallel to the
  X-axis.
- Supports pressing `Enter` in any side or angle input to recalculate.
- Places SVG labels with direction-aware candidate positions and simple
  collision scoring.
- Optionally includes export metadata in SVG, TXT, and CSV output.
- Exports the current diagram as SVG.
- Exports the current diagram as PNG.
- Exports numeric results as TXT and CSV.
- Displays result sections in a four-column responsive grid.
- Includes a footer with copyright and tool context.

## Usage

Open `index.html` directly in a browser. No build step or local server is
required.

1. Choose an input tab:
   - `SSS`: sides `a`, `b`, and `c`.
   - `SAS`: sides `b`, `c`, and included angle `A`.
   - `ASA`: angle `A`, included side `c`, and angle `B`.
   - `AAS`: angle `A`, angle `B`, and side `a`.
   - `SSA`: angle `A`, opposite side `a`, and side `b`.
2. Click `Calculate & Draw`.
3. If two valid solutions exist, use the tabs above the SVG to switch between
   them.
4. Use the SVG controls:
   - `+` and `-` to zoom.
   - `Fit` to reset the view.
   - `↶` and `↷` to rotate between side alignments.
5. Use `Construction`, `Measurement`, or `Presentation` to apply a common SVG
   display preset.
6. Use `Reset Display Preferences` to clear the saved display state and return
   the current view to the default construction display.
7. Use the display checkboxes to show or hide axes, altitudes, foot-point
   labels, segment lengths, triangle fill, vertex labels, and extension lines
   independently. Manual changes are treated as a custom display state.
8. Use `Export metadata` when saved SVG, TXT, or CSV files should include
   generation time, provided inputs, resolved sides, solution index, display
   state, and view state.
9. Use `Export SVG` or `Export PNG` to save the current diagram.
10. Use `Export TXT` or `Export CSV` to save the numeric results.
11. Press `Enter` while focused in any side or angle input to recalculate
    immediately.

## Geometry Conventions

The app uses the following side and point definitions:

- `a = BC`
- `b = AC`
- `c = AB`
- `A` is opposite side `a`
- `B` is opposite side `b`
- `C` is opposite side `c`
- `H₁` is the foot point from `A` to `BC`
- `H₂` is the foot point from `B` to `AC`
- `H₃` is the foot point from `C` to `AB`

Foot-point segment names use the format `foot point + endpoint`:

- `H₁B`, `H₁C`
- `H₂A`, `H₂C`
- `H₃A`, `H₃B`

For obtuse triangles, when a foot point falls outside the side segment, the app
still displays distances from the foot point to each endpoint.

## Input Modes

The input panel is split into calculation modes:

- `SSS`: `a`, `b`, `c`.
- `SAS`: `b`, `c`, `A`.
- `ASA`: `A`, `c`, `B`.
- `AAS`: `A`, `B`, `a`.
- `SSA`: `A`, `a`, `b`.

`ASA` and `AAS` share the same law-of-sines implementation internally but are
separate UI tabs because their known side positions are different. `SSA` is the
only supported mode that can produce two valid triangles. In that case, the app
builds both solutions and shows solution tabs above the SVG. Results and
exports always use the active solution tab.

## Display Precision

- Result panel numbers are shown with 6 decimal places.
- SVG length labels are shown with 2 decimal places.

This keeps the diagram readable while preserving more precision in the data
panel.

## SVG Display Layers

The SVG display controls are independent:

- `Axes` controls the coordinate axes.
- `Altitudes` controls altitude lines.
- `Foot labels` controls the `H₁`, `H₂`, and `H₃` labels.
- `Segment lengths` controls numeric length labels in the SVG.
- `Triangle fill` controls the polygon fill while keeping the triangle
  outline visible.
- `Vertex labels` controls the `A`, `B`, and `C` labels.
- `Extension lines` controls dashed helper lines for outside foot points.

The triangle outline and vertex points remain visible so the diagram keeps a
stable reference frame while helper layers are hidden.

## Display Presets

The preset buttons apply common layer configurations:

- `Construction` shows all SVG layers and is the default view.
- `Measurement` hides axes and triangle fill while keeping construction
  geometry, labels, extension lines, and length labels visible.
- `Presentation` keeps a clean outline with vertex labels and hides helper
  construction layers and measurements.

Changing any individual display checkbox after applying a preset marks the
display state as `custom` for export metadata.

The last preset or custom display state is saved in `localStorage` under
`triangleResolver.displayState.v1` and restored on the next browser session.
`Reset Display Preferences` removes that saved key and restores the current
display controls to the default `Construction` preset without persisting a new
state. A small inline confirmation appears after the reset action. Export
metadata remains opt-in and is not persisted.

## Export Metadata

`Export metadata` is off by default. When enabled:

- SVG exports include a `<metadata>` element.
- TXT exports append a `Metadata` section.
- CSV exports append `Metadata` rows.

The metadata records generation time, provided inputs, resolved sides, input
type, solution index/count, active display preset or `custom` state, display
toggle state, active rotation target, scale, and rotation angle.

## Interaction Model

The SVG transform model uses the triangle centroid as the rotation origin. This
prevents rotations from orbiting around vertex `A`.

Zoom behavior is split by control type:

- Mouse wheel zoom anchors to the current mouse position.
- Button zoom preserves the current view center.
- `Fit` recenters the triangle and resets the default side alignment.

Rotation cycles through side alignments:

- Initial view: `c = AB` parallel to the X-axis.
- Right rotation: `c -> b -> a -> c`.
- Left rotation: reverse order.

## Layout

The main application layout is responsive:

- Desktop: input controls and SVG share the first row, with the SVG taking the
  remaining width.
- Desktop: display checkboxes use a compact two-column layout in the control
  panel.
- Results occupy the next row and default to four columns.
- Medium screens reduce the results grid to two columns.
- Small/mobile screens use a single-column layout.

## Theme System

All core colors and sizes are centralized in the `:root` CSS variable block in
`styles.css`.

The centralized variables include:

- Page, panel, text, border, accent, success, danger, and footer colors.
- Spacing, radius, layout, and control sizes.
- SVG canvas dimensions.
- SVG stroke widths, radii, label colors, and font sizes.
- SVG label clearance and candidate spacing.

SVG drawing is generated by JavaScript, so the script reads the relevant CSS
variables through `getComputedStyle(document.documentElement)` and uses those
values when building SVG markup. This keeps CSS and SVG rendering aligned under
one theme source.

## Technical Notes

- The project is split into `index.html`, `styles.css`, and `app.js`.
- There is no build process.
- There are no runtime dependencies except an optional Ubuntu font loaded from
  a CDN.
- The app runs entirely client-side.
- SVG output is generated directly from the current rendered SVG state.
- PNG output is generated client-side by rendering the SVG into a canvas.
- TXT and CSV output are generated from the same active-solution calculation
  data used by the results panel.
- Display state persistence uses `localStorage` and does not require a server.
- Optional export metadata records generation time, provided inputs, resolved
  sides, input type, solution index/count, display toggles, and view transform
  state. SVG stores it in a `<metadata>` element; TXT and CSV append metadata
  rows.

## Tests

Run the lightweight Node test suite with:

```bash
node tests/app.test.js
```

The tests use a small DOM mock to cover geometry calculations, `SSS`, `SAS`,
`SSA`, `ASA`, `AAS`, input mode tabs, ambiguous-solution tabs, input validation,
side-ratio validation, side-alignment rotation, Enter-to-calculate behavior,
SVG label output, independent display toggles, display presets, `localStorage`
display state restoration, optional metadata, and SVG/PNG/TXT/CSV export paths.

## Current Quality Assessment

The application is in a usable milestone state:

- Core triangle math is stable for normal and large inputs.
- Fixed `SSS`, `SAS`, `ASA`, `AAS`, and `SSA` input modes are supported.
- Ambiguous `SSA` input can expose two selectable solutions.
- Invalid input paths produce explicit errors.
- SVG interaction is functional and consistent.
- SVG display layers can be controlled independently.
- Naming is now consistent between the SVG and results panel.
- SVG label placement now uses simple collision-aware positioning.
- Geometry, generalized input solving, ambiguous-solution tabs, rotation,
  keyboard, label, display-toggle, display-preset, persisted display-state,
  metadata, and export behavior have lightweight Node coverage.
- Layout and visual style are appropriate for a mathematical or engineering
  tool.
- Theme values are centralized enough for maintainable visual iteration.

## Known Limitations

- SVG label placement is heuristic. Some extreme triangles can still produce
  imperfect label placement.
- The app intentionally exposes only structured input modes. It does not offer
  free-form over-constrained combinations such as two sides plus two angles.
- The external font depends on CDN availability. The app still works offline,
  but typography may differ.

## Suggested Next Steps

- Consider a local or system-font-first typography path for better offline
  consistency.
- Add browser-level smoke tests for export downloads and responsive layout
  behavior.
