## Color + Theme Review Report — Custom Todo List (Light & Dark)

Reviewed app: `https://custom-todo-production.up.railway.app/` ([live app](https://custom-todo-production.up.railway.app/))  
Review focus: **Theme system, colors, contrast, and consistency across Light/Dark**  
Date: **2026-02-06**  

### Screens/components reviewed

- **Main app shell** (header, progress, task list, cards)
- **Filter & Sort** panel + dropdown menus (including **Color** dropdown)
- **Full task form** (inputs, selects, primary CTA)
- **Modals**: Export/Import, Manage Groups (overlay + surfaces + icons)

## Executive summary

The app already has a strong “soft-neon on glass” aesthetic, and **dark mode is especially cohesive**. The largest theme opportunity is **consistency**: Light mode uses a **violet** accent while dark mode’s primary affordances lean **blue**, so the product reads like two different brands depending on theme.

The other major improvement area is **contrast and semantic clarity**:

- In **light mode**, many secondary labels, placeholders, and destructive icons trend too light, risking **low contrast** on pale surfaces.
- In **both modes**, the “color” system (Coral/Peach/Lemon/etc.) is pleasant but needs **accessibility guardrails** (borders for pale swatches, consistent chip/text contrast, and a color token strategy).

## Current visual language (what you have today)

- **Light mode**
  - **Background**: very pale lavender/near-white
  - **Accent**: violet (progress fill, profile pill, primary CTA on form)
  - **Surfaces**: white cards/panels with subtle borders
  - **Destructive**: light red/pink trash icon (can be low contrast)

- **Dark mode**
  - **Background**: deep navy
  - **Accent**: blue (progress fill + primary CTA) with some violet retained in the profile pill border
  - **Surfaces**: layered navy panels with low-contrast borders (polished, but sometimes “too close”)
  - **Destructive**: red trash icon (clear, but could be slightly more legible on some surfaces)

## Theme consistency issues (high impact)

- **Primary action color changes between themes**
  - Light primary CTA: **violet**
  - Dark primary CTA: **blue**
  - **Recommendation**: pick one brand hue (suggest **violet**) and keep it consistent across themes; change only *lightness/saturation* per theme.

- **Progress bar color changes between themes**
  - Light: violet fill + mint/teal-ish track
  - Dark: blue fill + dark neutral track
  - **Recommendation**: keep progress track neutral (surface/border tone) in both themes; use brand accent for the fill.

## Light mode review

### What’s working

- **Modern, airy palette** with soft violet branding feels friendly and “personal tool” appropriate.
- **Card hierarchy** is clear: background → panels → task cards.
- **Color dropdown** is well-designed and readable; swatches are a nice touch.

### Risks / opportunities

- **Low-contrast secondary text**
  - Examples: helper text (“Press ⌘K…”) and some placeholder/input text read light on very pale backgrounds.
  - **Fix**: darken the “muted foreground” token slightly in light mode.

- **Destructive icon legibility**
  - The trash icon in light mode looks very light pink.
  - **Fix**: use a stronger error color for icons in light mode, or increase weight/opacity.

- **Borders are sometimes too subtle**
  - Because the background is already pale, very light borders reduce “clickability.”
  - **Fix**: raise border contrast a notch (especially for inputs/selects and card outlines).

## Dark mode review

### What’s working

- **Excellent readability** for primary text and key UI.
- The layered “navy surfaces” look cohesive and premium.
- Modal styling is strong: good separation with overlay + elevated surface.

### Risks / opportunities

- **Too many “nearby” dark surface values**
  - Some panels/cards/inputs are close in luminance, so structure can flatten when scanning quickly.
  - **Fix**: increase separation between `surface`, `surface-2`, and `surface-3` (or add clearer borders/shadows).

- **Accent mismatch (blue vs violet)**
  - Dark mode’s main CTA/progress is blue, while profile pill uses violet.
  - **Fix**: unify accent and reserve “secondary brand hue” only for rare highlights (or remove it).

## Color system (task colors) review

The palette names are good: **Coral, Peach, Lemon, Mint, Sky, Lavender, Rose, Silver**.

### Recommendations

- **Add a 1px border to swatches**, especially for light colors (Lemon/Silver) so they don’t disappear on white/light surfaces.
  - Light mode border: `rgba(17, 24, 39, 0.12)`
  - Dark mode border: `rgba(255, 255, 255, 0.14)`

- **Define “on-color” text rules** for chips/badges:
  - If the chip background is light (Lemon/Peach), use dark text.
  - If the chip background is saturated/dark, use white text.
  - Don’t rely on the same text color for all chips.

- **Keep task-color usage scoped**
  - Best use: subtle left border, small dot, or chip background.
  - Avoid using task colors as primary button colors (keeps brand consistent).

## Accessibility + contrast (AA guidance)

Targets (WCAG 2.2 AA as a practical baseline):

- **Body text**: contrast ≥ **4.5:1**
- **Large text (≥ 18pt or 14pt bold)**: contrast ≥ **3:1**
- **Icons & UI boundaries**: aim for ≥ **3:1** for essential affordances (borders, focus rings, destructive icons)

What to prioritize here:

- Light mode: **muted text**, **placeholder**, and **error/destructive icon** contrast.
- Dark mode: **surface separation** (panels vs cards vs inputs) and **focus ring** clarity on dark backgrounds.

## Proposed token palette (recommended)

Below is a tokenized palette you can implement so both themes stay consistent while still feeling “native.”

### Brand (shared)

- **brand/primary**: `#7C3AED` (violet 600)
- **brand/primary-hover**: `#6D28D9`
- **brand/primary-soft**: `#EDE9FE` (light) / `rgba(124,58,237,0.18)` (dark)

### Light tokens

- **bg**: `#FAF8FF`
- **surface-1** (cards): `#FFFFFF`
- **surface-2** (panels): `#F4F1FF`
- **border**: `#E6E0F2`
- **text**: `#1F1635`
- **muted-text**: `#5B5370`
- **placeholder**: `#7A7390`
- **error**: `#DC2626`
- **success**: `#16A34A`

### Dark tokens

- **bg**: `#0B1020`
- **surface-1** (cards): `#101A30`
- **surface-2** (panels): `#0E1628`
- **border**: `#22304A`
- **text**: `#EAF0FF`
- **muted-text**: `#A7B4D0`
- **placeholder**: `#7F8CAA`
- **error**: `#F87171`
- **success**: `#4ADE80`

## Component-level recommendations (practical)

- **Primary buttons**
  - Keep **one accent** (brand violet) across both themes.
  - Ensure text/icon on primary is always readable: use `primary-foreground` token (white in both themes works well with violet 600).

- **Inputs + selects**
  - Light: slightly darker border + clearer focus ring (brand with ~30–40% alpha).
  - Dark: either brighten borders on focus or add a subtle glow; avoid “focus is only color” when surfaces are similar.

- **Destructive actions**
  - Use a consistent `error` token (icon + hover background).
  - Consider adding a subtle error hover background (e.g., `rgba(220,38,38,0.08)` light, `rgba(248,113,113,0.12)` dark).

- **Dropdowns / menus**
  - Great structure already; add swatch borders (see above) and ensure active/selected row has sufficient contrast.

- **Modals**
  - Current overlay and elevation are good.
  - Ensure modal body text uses `muted-text` with enough contrast (especially in light mode).

- **Progress bar**
  - Use neutral track (`surface-2` or `border` token).
  - Use `brand/primary` for fill in both themes (no theme-specific hue shift).

## Priority checklist (implementation order)

- **P0 (same day)**
  - Unify primary accent across light/dark (choose violet).
  - Strengthen light mode: muted text + placeholder + destructive icon.
  - Add borders to light swatches (Lemon/Silver) so they remain visible.

- **P1 (1–2 days)**
  - Increase dark-mode surface separation (cards vs inputs vs panels).
  - Normalize progress bar track color in light mode (make it neutral).

- **P2 (polish)**
  - Add semantic hover/focus states using tokens (consistent across components).
  - Audit all chip/badge “on-color” text contrast rules.

