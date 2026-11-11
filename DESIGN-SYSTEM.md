# TFTC Design System

**Version:** 2.0  
**Status:** Applied to the shared demo stylesheet  
**Visual reference:** `design-references/WhatsApp Image 2026-11-11 at 2.21.53 AM.jpeg` and the companion reference image.

This system supersedes the earlier white / electric-blue treatment. It is intended for the TFTC public experience, contestant journeys, voting UI, leaderboard and staff demo.

## 1. Visual direction

A dark, editorial competition interface: near-black page canvas, charcoal surfaces, warm gold primary actions, crisp light typography and restrained status colours. Keep the interface confident and legible rather than decorative.

## 2. Colour tokens

| Token | Value | Use |
|---|---|---|
| Page background | `#0B0B0E` | Main canvas |
| Secondary background | `#111116` | Nested surfaces |
| Panel | `#17171D` | Cards and panels |
| Raised panel | `#1C1C23` | Inputs and nested content |
| Strong surface | `#25252E` | Hover and emphasis surfaces |
| Primary text | `#F6F4EF` | Headings and body text |
| Muted text | `#A5A3AD` | Supporting copy |
| Gold | `#D8AD27` | Primary actions, active states, ranks |
| Gold highlight | `#F0CA3D` | Hover and focus accents |
| Registration yellow | `#FFE31A` | Registration emphasis where needed |
| Purple | `#5728DC` | Secondary promotional action |
| Success | `#20A36C` | Paid / approved / confirmed |
| Danger | `#DC414B` | Rejected / failed / disqualified |

Use gold as the main action colour. Purple and bright yellow are accent colours, not competing primary colours.

## 3. Typography

- Use the existing Inter-first system sans-serif stack for the application.
- Use clear weight and size contrast: bold page headings, medium-weight labels and muted supporting copy.
- Use uppercase, letter-spaced gold eyebrow labels for section identifiers.
- Keep data, IDs, prices and vote totals easy to scan.

## 4. Components

- **Buttons:** minimum 48px height, 8px corner radius. Gold filled primary, gold outlined secondary, purple only for a distinct secondary action. Disabled controls must look disabled.
- **Badges:** compact outlined status pills. Preserve distinct semantic colours for pending, paid, approved, rejected, withdrawn, refunded, flagged and disqualified.
- **Inputs:** dark field surface, subtle charcoal border, readable light text, visible label and validation message. Focus must be unmistakable.
- **Navigation:** charcoal header, clear active link, gold Vote action. Keep Vote visible at narrow widths.
- **Notifications:** green success, amber pending, red failure. Never use colour as the only status cue; include text.
- **Contestant cards:** dark panel, portrait placeholder, contestant ID, name, category, verified vote count and one clear vote action.
- **Vote bundles:** selectable dark tiles with a gold border and gold text for the selected bundle. Keep all six official prices unchanged.
- **Leaderboard:** dark table/list, subtle row dividers, gold rank numbers and high-contrast vote totals.
- **Confirmation modal:** clear summary, gold Continue action and outlined Cancel action. State explicitly that the demo does not process payment.

## 5. Layout and responsive behaviour

- Use consistent charcoal panels, subtle borders and compact 8–10px radii.
- Preserve existing responsive grids and mobile navigation.
- Keep interactive targets at least 48px high where practical.
- At small widths, stack form fields and cards; allow wide tables to scroll horizontally rather than clipping content.

## 6. Accessibility and interaction

- Visible 3px yellow focus ring with offset for keyboard users.
- Respect reduced-motion preferences already defined in the stylesheet.
- Pair status colours with readable status text.
- Maintain clear disabled, hover, selected, invalid and success states.
- Keep labels associated with their inputs and preserve semantic buttons/links.

## 7. Implementation notes

- Design tokens and global component overrides live in `app/globals.css`.
- The reference images are retained in `design-references/`.
- This visual update does not change voting, registration, authentication, Supabase, payment or staff business logic.
- The repository is a demonstration: no real payments or production identity verification are introduced by this design update.
