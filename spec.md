# FaceAttend — Space/Sci-Fi Futuristic Redesign

## Current State

FaceAttend is a fully functional browser-based facial recognition attendance app with the following pages:
- **Face Scan** (landing) — camera viewfinder with AI face detection and manual fallback
- **Register** — camera at top, student/employee tabs with form fields below
- **Dashboard** — stat cards + Attendance Records + Manage People tabs with CSV export
- **Settings** — App Identity, Theme, Background, Typography, Data Export, Install on Phone

Current design: dark blue-indigo color palette (OKLCH), Bricolage Grotesque font, standard card/table layout with subtle borders. Functional but visually generic.

## Requested Changes (Diff)

### Add
- Animated 3D space/sci-fi background: deep starfield with parallax star particles using Canvas API (requestAnimationFrame)
- Subtle animated nebula/grid overlay behind all pages
- Holographic-style HUD panels for all cards/sections (glowing cyan/electric blue borders with corner bracket accents)
- 3D perspective hover effects on stat cards (CSS transform: perspective + rotateX/Y on hover)
- Animated scan line on camera viewfinder (existing, enhance intensity)
- Glowing neon button states with pulse animation on primary CTAs
- HUD-style navbar with translucent backdrop + neon active indicator
- Futuristic typography — Orbitron (Google Fonts) for headings and display text, Keep current Bricolage Grotesque for body
- Animated loading states: spinning ring/hex scanners instead of plain spinners
- "System online" / "Neural link established" style status labels with terminal flicker effect
- Planet/orbit SVG decorative motif near logo
- Subtle grid scanline overlay (CSS) on the background for HUD depth

### Modify
- Color palette: shift primary to electric cyan (OKLCH 0.75 0.20 205), accent to electric blue (OKLCH 0.60 0.22 250), background to near-black with deep space blue tint (OKLCH 0.07 0.02 250)
- Navbar: dramatic HUD-style header with neon underline for active tab, logo with animated orbit ring, full-width scan line separator
- All page containers: replace plain card outlines with HUD-style panels (corner brackets, glowing cyan borders, slightly translucent backgrounds)
- Stat cards: 3D tilt on hover using CSS perspective transforms, neon glow icons, large mono-font numbers
- Tables: terminal/HUD aesthetic — alternating row highlights, column headers in uppercase monospace, glowing row hover
- Buttons: neon glow on hover/active, sharp angular style, uppercase text for primary actions
- Status indicators: pulsing neon dot for active/live states
- Footer: slim terminal-style "DEVELOPED BY ATOTO VENYO" in monospace caps
- Face scan viewfinder: more dramatic HUD overlay with animated corner brackets, rotating scan reticle
- Slot pills: HUD-style active slot indicator

### Remove
- Generic rounded card shadows replaced by glowing border effects
- Soft pastel muted colors replaced by high-contrast neon accents on dark

## Implementation Plan

1. Update `index.css`:
   - New OKLCH token set: deep space background, electric cyan primary, electric blue accent
   - Add `@import` for Orbitron from Google Fonts
   - Add @font-face for Orbitron usage in headings
   - Add CSS: `.hud-panel` (translucent bg + cyan glow border + corner brackets via pseudo-elements)
   - Add CSS: `.neon-glow` (box-shadow neon effect), `.hud-text` (uppercase tracking-widest)
   - Add CSS: scanline overlay animation, hex-spinner animation, terminal-flicker animation
   - Add CSS: 3D card hover via `.card-3d` class

2. Update `tailwind.config.js`:
   - Register Orbitron in fontFamily
   - Update color tokens to match new OKLCH palette

3. Update `Navbar.tsx`:
   - Full-width HUD bar with animated bottom scan-line separator
   - Logo with mini SVG orbit ring animation around icon
   - Nav items: icon + label, neon cyan active indicator, angular hover state
   - Translucent deep-space backdrop

4. Update `App.tsx`:
   - Add `<StarfieldCanvas>` component as fixed background (z-index 0)
   - Add subtle CSS grid overlay
   - Footer: monospace uppercase styling

5. New `StarfieldCanvas.tsx` component:
   - Canvas-based animated starfield (200–300 stars, parallax speed layers)
   - requestAnimationFrame loop
   - Subtle slow-moving nebula smear using radial gradients

6. Update `FaceScan.tsx`:
   - Page: HUD panel layout
   - Camera viewfinder: enhanced animated corner brackets (expanding/pulsing), rotating scan reticle overlay
   - Status pill: neon-styled with terminal flicker on match
   - Mark Attendance button: full-width neon CTA with animated border pulse
   - Slot grid: HUD tile styling

7. Update `Register.tsx`:
   - Camera section: HUD-style panel at top with animated brackets
   - Tabs: angular selector, not rounded pills
   - Form fields: dark input with neon focus glow
   - Register button: neon primary CTA

8. Update `Dashboard.tsx`:
   - Stat cards: `card-3d` class, neon icon glow, Orbitron font for numbers
   - Tabs: HUD-style angular tabs
   - Table: terminal aesthetic with `font-mono` columns, glowing row hover
   - CSV button: neon outlined style

9. Update `Settings.tsx`:
   - All sections: `.hud-panel` style instead of plain cards
   - Section headers: neon icon + uppercase tracking-widest label
   - Save button: full-width primary neon CTA
