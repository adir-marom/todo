# Theme + Color System Recommendations (Light & Dark)

Applies to: [Custom Todo List](https://custom-todo-production.up.railway.app/)  
Goal: **one cohesive brand** across light/dark with **AA-friendly contrast** and a **tokenized color system** that’s easy to maintain.

---

## Monday.com-inspired direction (recommended)

Reference inspiration: Monday’s **Vibe** design system and token approach (see [Vibe design system](https://developer.monday.com/apps/docs/vibe-design-system) and the public token registry [monday-ui-tokens](https://github.com/mondaycom/monday-ui-tokens)).

### What to borrow (the “Monday feel”)

- **Clean neutrals + crisp borders**: clearer outlines and slightly higher-contrast separators.
- **Vibrant semantic colors**: success/warning/error/status colors that pop (used in pills, dots, small accents).
- **Pill-shaped UI** for filters/status/labels (high scannability).
- **Consistent accent**: primary actions and focus states always use the same brand color.

### What not to copy (to keep your app “yours”)

- Don’t adopt multiple competing accents across themes (e.g., violet in light, blue in dark).
- Don’t overuse task colors as backgrounds for large surfaces (keep them as small accents).

### Monday-style semantic colors (suggested set)

If you want the same “bright, confident” semantics:

- **success**: `#00CA72`
- **warning**: `#FFCC00`
- **error**: `#FB275D`

Source: monday.com brand color references (see [Brand Color Code — monday.com](https://www.brandcolorcode.com/monday-com)).

### Brand accent choice (pick ONE)

You have two solid options:

- **Option A (recommended)**: keep your **violet** as the brand accent, and borrow Monday’s *structure + semantics*.
  - Primary accent: `#7C3AED`
- **Option B (most “Monday-like”)**: switch brand accent to a **clear product-blue** and move violet to a secondary highlight (profile chip only).
  - If you want this route, I’ll tailor an exact blue once we decide the new “brand primary.”

---

## What to change (high level)

- **Unify the brand accent** across themes (today: Light ≈ violet, Dark ≈ blue).
- **Increase light-mode contrast** for muted text, placeholders, borders, and destructive icons.
- **Increase dark-mode surface separation** (panel/card/input are sometimes too similar).
- **Add accessibility guardrails** for the “task color” palette (swatch borders + on-color text rules).

---

## Recommended direction (visual style)

### Brand identity

- **Primary brand hue**: Violet (keep it in both themes)
- **Supporting neutrals**: Slightly “cool” neutrals (lavender-tinted light, navy-tinted dark)
- **Accent usage rules**
  - Use the brand violet for **primary CTA, progress fill, focus ring, selected tab**, and **key highlights**
  - Avoid theme-specific hue swaps (don’t make dark-mode primary “blue”)

### Interaction philosophy

- **Light mode**: borders do the work (clear affordances, subtle shadows)
- **Dark mode**: surfaces do the work (layering + borders on focus/hover)

---

## Token set (drop-in design system)

If you already use CSS variables/tokens (Radix/ShadCN-style), this maps cleanly.

### Brand tokens (shared)

- `--brand-500`: `#7C3AED` (violet)
- `--brand-600`: `#6D28D9` (hover/pressed)
- `--brand-soft`: Light `#EDE9FE` / Dark `rgba(124,58,237,0.18)`

### Semantic tokens (light)

- `--bg`: `#FAF8FF`
- `--surface-1` (cards): `#FFFFFF`
- `--surface-2` (panels): `#F4F1FF`
- `--surface-3` (inputs): `#FBFAFF`
- `--border`: `#E6E0F2`
- `--text`: `#1F1635`
- `--text-muted`: `#5B5370`
- `--text-placeholder`: `#7A7390`
- `--focus`: `rgba(124,58,237,0.40)`
- `--shadow`: `rgba(31,22,53,0.08)`

- `--success`: `#16A34A`
- `--warning`: `#D97706`
- `--error`: `#DC2626`
- `--error-soft`: `rgba(220,38,38,0.10)`

### Semantic tokens (dark)

- `--bg`: `#0B1020`
- `--surface-1` (cards): `#101A30`
- `--surface-2` (panels): `#0E1628`
- `--surface-3` (inputs): `#0C1426`
- `--border`: `#22304A`
- `--text`: `#EAF0FF`
- `--text-muted`: `#A7B4D0`
- `--text-placeholder`: `#7F8CAA`
- `--focus`: `rgba(124,58,237,0.55)`
- `--shadow`: `rgba(0,0,0,0.35)`

- `--success`: `#4ADE80`
- `--warning`: `#FBBF24`
- `--error`: `#F87171`
- `--error-soft`: `rgba(248,113,113,0.14)`

---

## Component mapping (how tokens should be used)

### Primary button

- Background: `--brand-500` (hover: `--brand-600`)
- Text/icon: `#FFFFFF`
- Focus ring: `--focus`

### Secondary button / toolbar button

- Background: transparent or `--surface-2`
- Border: `--border`
- Text: `--text`
- Hover: slight fill (`--surface-2` in light, `rgba(255,255,255,0.04)` in dark)

### Inputs / selects

- Background: `--surface-3`
- Border: `--border`
- Placeholder: `--text-placeholder`
- Focus: border becomes `--brand-500` + ring `--focus`

### Tabs (Active / Archived)

- Active tab fill: `--surface-2`
- Active indicator/underline: `--brand-500` (optional)
- Inactive text: `--text-muted`

### Progress bar

- Track: `--border` (light) / `--surface-2` (dark)
- Fill: `--brand-500`

### Cards

- Card surface: `--surface-1`
- Border: `--border`
- Hover: raise shadow (light) / slightly brighten border (dark)

### Modals

- Overlay: `rgba(0,0,0,0.45)` (light) / `rgba(0,0,0,0.60)` (dark)
- Modal surface: `--surface-1`
- Border: `--border`

---

## Task color palette (Coral/Peach/Lemon/Mint/Sky/Lavender/Rose/Silver)

### Problem to solve

Some colors (especially **Lemon/Silver**) can visually disappear on light surfaces, and text readability on colored chips varies.

### Required guardrails

1) **Swatch border** (always)
- Light: `rgba(17, 24, 39, 0.12)`
- Dark: `rgba(255, 255, 255, 0.14)`

2) **On-color text rule** (chips/badges)
- If color background is “light” → use `--text`
- If color background is “dark/saturated” → use `#FFFFFF`

3) **Scope**
- Use task colors for **small accents** (dot, left border, subtle chip)
- Don’t use them as primary action colors (keeps brand consistent)

---

## Contrast targets (quick checklist)

- Body text: **≥ 4.5:1**
- Large text: **≥ 3:1**
- Icon affordances + borders for key UI: aim for **≥ 3:1**

Most likely wins:

- Light mode: darken `--text-muted` + strengthen `--border`
- Dark mode: increase delta between `--surface-1`, `--surface-2`, `--surface-3` (or strengthen borders)

---

## Rollout plan (lowest risk)

### P0 (same day)

- Unify primary accent to violet in dark mode (primary CTA + progress fill).
- Strengthen light-mode muted/placeholder text and destructive icon color.
- Add swatch borders for task colors (dropdown + chips).

### P1 (1–2 days)

- Tune dark-mode surface separation (cards vs inputs vs panels).
- Normalize progress track color to neutral in light mode.

### P2 (polish)

- Ensure focus states are consistent everywhere (buttons, inputs, icon buttons).
- Audit all chip/badge text colors using the on-color rule.

---

## “Done” definition (how you’ll know it’s improved)

- Light and dark modes feel like the **same product** (same brand accent).
- Users can scan UI structure quickly in dark mode (clear layering).
- Light mode looks crisp (borders/labels readable, destructive actions obvious).
- Task colors remain decorative/organizational without harming readability.

