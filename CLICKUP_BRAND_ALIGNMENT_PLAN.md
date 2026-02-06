# ClickUp Brand Alignment Plan (Colors + Themes)

Reference palette (source): [ClickUp Brand Color Codes](https://www.brandcolorcode.com/clickup)

## Brand goal

Make the app feel unmistakably **ClickUp-aligned** in both light and dark mode by:

- Using ClickUp colors for **primary actions, highlights, and visual identity**
- Keeping semantic UI states **accessible** (contrast + clarity)
- Removing “dual brand” behavior (same primary hue in both themes)

---

## ClickUp brand colors (canonical)

| Color | Hex | Preview |
| --- | --- | --- |
| Purple | `#7B68EE` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#7B68EE;border:1px solid rgba(0,0,0,.15)"></span> |
| Pink | `#FD71AF` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FD71AF;border:1px solid rgba(0,0,0,.15)"></span> |
| Blue | `#49CCF9` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#49CCF9;border:1px solid rgba(0,0,0,.15)"></span> |
| Yellow | `#FFC800` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FFC800;border:1px solid rgba(0,0,0,.15)"></span> |

---

## How these colors should be used (rules)

- **Purple (`#7B68EE`) = Primary**
  - Primary CTA buttons, progress fill, active tab, selected state, focus ring
- **Blue (`#49CCF9`) = Information / secondary accent**
  - Secondary highlights, links, info badges, subtle “active” indicators
- **Pink (`#FD71AF`) = Destructive / “attention” accent**
  - Delete affordances, destructive hover backgrounds, “needs attention” chips
  - (Use a darker derived variant for text/icon on light surfaces; see tokens below.)
- **Yellow (`#FFC800`) = Warning / priority highlight**
  - High priority chips, warnings, “due soon” highlight

Important: **Never** swap the app’s primary accent between light/dark mode. If purple is primary, it’s primary everywhere.

---

## Token plan (recommended)

This keeps ClickUp colors as *brand tokens* and maps UI to *semantic tokens*.

### 1) Brand tokens (shared)

| Token | Hex | Preview |
| --- | --- | --- |
| `--brand-purple` | `#7B68EE` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#7B68EE;border:1px solid rgba(0,0,0,.15)"></span> |
| `--brand-pink` | `#FD71AF` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FD71AF;border:1px solid rgba(0,0,0,.15)"></span> |
| `--brand-blue` | `#49CCF9` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#49CCF9;border:1px solid rgba(0,0,0,.15)"></span> |
| `--brand-yellow` | `#FFC800` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FFC800;border:1px solid rgba(0,0,0,.15)"></span> |

Derived (for usability/contrast):

| Token | Hex | Preview | Notes |
| --- | --- | --- | --- |
| `--brand-purple-hover` | `#6C5CE7` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#6C5CE7;border:1px solid rgba(0,0,0,.15)"></span> | slightly deeper purple |
| `--brand-pink-strong` | `#E83D8C` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#E83D8C;border:1px solid rgba(0,0,0,.15)"></span> | better for icons/text on light bg |
| `--brand-blue-strong` | `#12AEEA` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#12AEEA;border:1px solid rgba(0,0,0,.15)"></span> | better for icons/text on light bg |

### 2) Semantic tokens (map brand → meaning)

| Token | Hex | Preview | Meaning |
| --- | --- | --- | --- |
| `--primary` | `#7B68EE` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#7B68EE;border:1px solid rgba(0,0,0,.15)"></span> | primary CTAs, selected state |
| `--primary-hover` | `#6C5CE7` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#6C5CE7;border:1px solid rgba(0,0,0,.15)"></span> | hover/pressed for primary |
| `--info` | `#49CCF9` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#49CCF9;border:1px solid rgba(0,0,0,.15)"></span> | info/links/secondary accent |
| `--warning` | `#FFC800` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FFC800;border:1px solid rgba(0,0,0,.15)"></span> | warnings/high-priority |
| `--danger` | `#FD71AF` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FD71AF;border:1px solid rgba(0,0,0,.15)"></span> | destructive actions |
| `--danger-strong` | `#E83D8C` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#E83D8C;border:1px solid rgba(0,0,0,.15)"></span> | danger for icons/text on light bg |

### 3) Neutral tokens (light)

| Token | Hex | Preview |
| --- | --- | --- |
| `--bg` | `#FAFAFD` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FAFAFD;border:1px solid rgba(0,0,0,.15)"></span> |
| `--surface-1` | `#FFFFFF` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#FFFFFF;border:1px solid rgba(0,0,0,.15)"></span> |
| `--surface-2` | `#F3F4FA` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#F3F4FA;border:1px solid rgba(0,0,0,.15)"></span> |
| `--surface-3` | `#EEF0F8` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#EEF0F8;border:1px solid rgba(0,0,0,.15)"></span> |
| `--border` | `#DDE1F0` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#DDE1F0;border:1px solid rgba(0,0,0,.15)"></span> |
| `--text` | `#1F2430` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#1F2430;border:1px solid rgba(0,0,0,.15)"></span> |
| `--text-muted` | `#5B6272` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#5B6272;border:1px solid rgba(0,0,0,.15)"></span> |
| `--text-placeholder` | `#7B8397` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#7B8397;border:1px solid rgba(0,0,0,.15)"></span> |

### 4) Neutral tokens (dark)

| Token | Hex | Preview |
| --- | --- | --- |
| `--bg` | `#0C1020` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#0C1020;border:1px solid rgba(255,255,255,.18)"></span> |
| `--surface-1` | `#121833` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#121833;border:1px solid rgba(255,255,255,.18)"></span> |
| `--surface-2` | `#0F152D` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#0F152D;border:1px solid rgba(255,255,255,.18)"></span> |
| `--surface-3` | `#0D1329` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#0D1329;border:1px solid rgba(255,255,255,.18)"></span> |
| `--border` | `#273154` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#273154;border:1px solid rgba(255,255,255,.18)"></span> |
| `--text` | `#EEF2FF` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#EEF2FF;border:1px solid rgba(0,0,0,.15)"></span> |
| `--text-muted` | `#A9B3D4` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#A9B3D4;border:1px solid rgba(0,0,0,.15)"></span> |
| `--text-placeholder` | `#7F8AB0` | <span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#7F8AB0;border:1px solid rgba(0,0,0,.15)"></span> |

---

## Component-by-component mapping

### Primary buttons (“Add Task”, primary actions)

- Background: `--primary`
- Hover: `--primary-hover`
- Text/icon: `#FFFFFF`
- Focus ring: `rgba(123, 104, 238, 0.45)` (light) / `rgba(123, 104, 238, 0.60)` (dark)

### Toolbar/secondary buttons (“Export”, “Manage Groups”, profile switcher)

- Background: transparent / `--surface-2`
- Border: `--border` (keep crisp like ClickUp)
- Hover: subtle fill (`--surface-3`)

### Progress bar

- Track: neutral (`--surface-3` light, `--surface-2` dark)
- Fill: `--primary` (**purple**, not blue)

### Tabs (Active / Archived)

- Active indicator: `--primary`
- Active surface: `--surface-2`
- Inactive text: `--text-muted`

### Destructive actions (trash icon, delete buttons)

- Default icon: `--danger-strong` (light) / `--danger` (dark)
- Hover background: `rgba(253, 113, 175, 0.12)` (light) / `rgba(253, 113, 175, 0.16)` (dark)
- Optional: underline/outline on hover for clarity

### Warnings / priority

- “High priority” chip background: `rgba(255, 200, 0, 0.22)` (light) / `rgba(255, 200, 0, 0.18)` (dark)
- Chip text: `--text` (light) / `#FFF7CC` (dark)

### Info states (links, “selected” hints)

- Use `--info` for subtle emphasis, not for primary CTAs.

---

## Task “Color” palette (Coral/Peach/Lemon/etc.) under ClickUp branding

Recommendation: keep the palette (it’s a feature), but **visually subordinate** it to ClickUp brand:

- Always show a 1px border on pale swatches (Lemon/Silver) so they don’t disappear.
- Don’t use task colors for app-level UI (buttons/progress).
- Consider adding a ClickUp-style option: **“Brand (Purple/Blue/Pink/Yellow)”** as an additional color group, if you want a tighter brand feel.

---

## Rollout steps (practical)

### Phase 1 — Brand cohesion (1 day)

- Replace dark-mode primary blue CTA/progress with **ClickUp purple**.
- Update focus rings and selected states to use purple consistently.

### Phase 2 — Semantics + contrast (1–2 days)

- Update destructive icons to use **pink** with a stronger variant in light mode.
- Update priority styling to use **yellow** in a controlled, accessible way.
- Increase border contrast in light mode to match ClickUp’s crisp UI.

### Phase 3 — Polish (ongoing)

- Add/verify hover/active/focus states everywhere (especially icon buttons).
- Run a contrast sweep for muted/placeholder text and chips.

---

## Success criteria

- Light and dark mode feel like the **same brand**.
- Primary actions are clearly “ClickUp purple.”
- Warning/danger/info colors are consistent and readable.
- Task colors remain helpful without fighting the brand palette.

