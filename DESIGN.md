# Soft-Emboss Design System

A reusable, color-agnostic design language. Bring your own palette — the *feel*
comes from how surfaces are lit, shadowed, and shaped, not from any particular
hue.

The core idea: **every interactive surface is either lifted or recessed.**
Buttons, cards, and CTAs sit *above* the page with a top rim-light and a
dropped shadow. Inputs, message bubbles, and info panels sit *inside* the page
with an inset shadow that makes them look pressed in. Hover lifts further;
active presses down. Nothing is flat.

---

## Foundations

### Typography
- **Sans (UI):** a geometric humanist sans — Outfit, Inter, Geist Sans, Manrope
  all work. Pick one with a strong **Black (900)** weight; the system relies on it.
- **Mono:** Geist Mono / JetBrains Mono / IBM Plex Mono — used sparingly for
  IDs, timestamps, and codes.
- **Hierarchy by weight, not size.** Most body text stays at one size; titles
  and labels get drama from `font-black`, not from being huge.
- **Tiny labels:** 10–11px, `uppercase`, `tracking-wider`/`tracking-widest`,
  `font-bold`. Used everywhere for metadata, statuses, section headers.
  This is the system's voice — small, loud, technical.

### Color (bring your own)
You only need to define **two color families**:

1. **Surface family** — `background`, `card`, `muted`, `border`, `foreground`
2. **Status family** — `primary`, `safe`, `warning`, `emergency` (each with a
   `-foreground` pair)

Use `oklch()` if you can — it makes lightness math predictable and dark-mode
inversion cleaner. Hex/HSL still works.

The system never mixes more than 2–3 hues per screen. Most surfaces are
neutral; color is reserved for status, CTAs, and accents.

### Radii
```
--radius-sm:   10px
--radius-md:   16px
--radius-lg:   24px
--radius-pill: 999px
```

Rule of thumb: small chips and inputs use `sm`/`md`. Cards and section panels
use `lg` (or `rounded-3xl`). Anything round and tappable uses `pill`.

---

## The Lifted/Recessed System

Every interactive surface picks one of two postures:

### Lifted — sits above the page
- Linear gradient on the surface (lighter top, base color middle, slightly
  darker bottom — ~10–20% lightness spread).
- **Top rim highlight** (`inset 0 1px 0 rgba(255,255,255, 0.5–0.9)`) — this is
  the magic; it simulates light hitting the top edge.
- **Inner base shadow** (`inset 0 -2px 4px rgba(0,0,0, 0.07–0.22)`) — softens
  the bottom edge so the surface feels rounded.
- **Outer drop shadow**, two-layer: a soft wide one + a tight short one.
- 1px border in the surface's own color, slightly lightened.

### Recessed — sits inside the page
- Background slightly *darker* than its container (mix in 2–4% black).
- **Inset shadow from above** (`inset 0 2px 5px rgba(0,0,0, 0.10–0.45)`) — the
  page is "casting a shadow" into the well.
- **Faint inset highlight from below** (`inset 0 -1px 0 rgba(255,255,255, 0.05–0.7)`)
  to suggest depth, not flatness.
- 1px hairline border, very low alpha.

### Press behavior
All lifted surfaces follow the same rule on interaction:

```
default →  translateY(0)    + medium shadow
hover   →  translateY(-2px) + larger shadow   (emergency: +scale 1.015)
active  →  translateY(0)    + smaller shadow  (emergency: +scale 0.98)
```

Transition: `200ms` on `transform` + `box-shadow`. No bouncy easing — just
ease-out. The point is *physical*, not playful.

---

## Variants

You only need these classes. Skin them with your own colors.

| Class             | Posture  | Job                                                          |
|-------------------|----------|--------------------------------------------------------------|
| `.lifted`         | Up       | Generic buttons, chips, secondary CTAs                       |
| `.lifted-primary` | Up       | Primary CTAs — gradient in your brand hue, glowing shadow    |
| `.lifted-emergency` | Up     | Destructive / panic actions — red gradient, biggest shadow   |
| `.lifted-safe`    | Up       | Confirm / resolved — green gradient                          |
| `.recessed`       | Down     | Inputs, message bubbles, info rows, list items inside cards  |
| `.pill`           | Shape    | `border-radius: 999px` — round buttons, badges, chips        |
| `.card-embossed`  | Up (big) | Section panels — `rounded-3xl` + lifted shadow + rim         |

### When to combine
- **`pill recessed`** — input fields, status chips
- **`pill lifted-primary`** — round Send/Submit/CTA buttons
- **`pill lifted-emergency`** — SOS / panic buttons
- **`card-embossed`** wrapping a list of **`pill recessed`** rows — the
  signature dashboard pattern

---

## Token Set

Define these once per theme (light + dark). Names are the canonical ones — keep
them stable so you can copy-paste utility classes between projects.

```css
/* Rim highlights — top inner edge */
--emboss-rim:        inset 0 1px 0 rgba(255,255,255, 0.90);  /* strong  */
--emboss-rim-soft:   inset 0 1px 0 rgba(255,255,255, 0.55);  /* default */
--emboss-rim-faint:  inset 0 1px 0 rgba(255,255,255, 0.20);  /* pressed */

/* Base shadows — bottom inner edge */
--emboss-base:       inset 0 -2px 4px rgba(0,0,0, 0.07);
--emboss-base-soft:  inset 0 -1px 2px rgba(0,0,0, 0.04);

/* Recessed wells */
--recess:            inset 0 2px 5px rgba(0,0,0, 0.10),
                     inset 0 -1px 0 rgba(255,255,255, 0.70);

/* Drop shadows — neutral */
--lift-neutral:      0 4px 12px rgba(60,60,120, 0.14), 0 1px 3px rgba(0,0,0, 0.10);
--lift-neutral-hi:   0 8px 20px rgba(60,60,120, 0.20), 0 2px 6px rgba(0,0,0, 0.12);
--lift-neutral-lo:   0 2px 6px  rgba(60,60,120, 0.10), 0 1px 2px rgba(0,0,0, 0.08);

/* Drop shadows — colored (repeat for primary / emergency / safe) */
--lift-{tone}:       0 6px 18px rgba(R,G,B, 0.30), 0 2px 6px rgba(R,G,B, 0.18);
--lift-{tone}-hi:    0 10px 26px rgba(R,G,B, 0.42), 0 3px 8px rgba(R,G,B, 0.24);
--lift-{tone}-lo:    0 3px 10px rgba(R,G,B, 0.20), 0 1px 3px rgba(R,G,B, 0.14);
```

**Dark-mode rule of thumb:** rim highlights drop to ~50% of their light-mode
alpha (white isn't as bright on a dark surface), base shadows roughly *double*
in alpha (darkness reads stronger), and colored drop shadows get more saturated
because they're competing with a darker background.

---

## Reference Implementations

```css
.lifted {
  transition: transform 200ms, box-shadow 200ms;
  background: linear-gradient(160deg,
    color-mix(in oklch, var(--card) 100%, white 6%) 0%,
    var(--card) 100%);
  box-shadow: var(--lift-neutral), var(--emboss-rim-soft), var(--emboss-base);
  border: 1px solid var(--border);
}
.lifted:hover  { transform: translateY(-2px); box-shadow: var(--lift-neutral-hi), var(--emboss-rim-soft), var(--emboss-base); }
.lifted:active { transform: translateY(0);    box-shadow: var(--lift-neutral-lo), var(--emboss-rim-faint), var(--emboss-base-soft); }

.lifted-primary {
  transition: transform 200ms, box-shadow 200ms;
  color: var(--primary-foreground);
  background: linear-gradient(160deg,
    color-mix(in oklch, var(--primary) 80%, white 20%) 0%,
    var(--primary) 60%,
    color-mix(in oklch, var(--primary) 90%, black 10%) 100%);
  box-shadow: var(--lift-primary), var(--emboss-rim), var(--emboss-base);
  border: 1px solid color-mix(in oklch, var(--primary) 90%, white 10%);
}
/* :hover, :active follow the same pattern as .lifted */

.recessed {
  transition: transform 200ms, box-shadow 200ms;
  background: color-mix(in oklch, var(--input) 100%, black 2%);
  box-shadow: var(--recess);
  border: 1px solid rgba(0,0,0, 0.06);
}

.pill { border-radius: 999px; }

.card-embossed {
  border-radius: 24px;
  background: linear-gradient(160deg,
    color-mix(in oklch, var(--card) 100%, white 4%) 0%,
    var(--card) 100%);
  box-shadow: var(--lift-neutral), var(--emboss-rim-soft), var(--emboss-base);
  border: 1px solid var(--border);
}
```

---

## Layout Idioms

### Mobile-first, fixed bottom nav
- Bottom nav is a floating `pill` ~54px tall with ~24px bottom safe-area padding.
- Reserve `padding-bottom` on `<main>` so content never sits under the nav.
- Top nav (if any) is sticky/transparent with backdrop blur — never a solid bar.

### The dashboard pattern
Use it everywhere there's a list of things:

```
<section class="card-embossed p-6 space-y-4">
  <header class="flex items-center justify-between">
    <h2 class="font-black tracking-tight">Title</h2>
    <span class="text-[10px] uppercase tracking-widest text-muted">meta</span>
  </header>

  <ul class="space-y-3">
    <li class="pill recessed flex items-center gap-4 p-4">
      <!-- row content -->
      <button class="pill lifted-primary px-4 py-2 text-xs uppercase tracking-wider">
        Action
      </button>
    </li>
  </ul>
</section>
```

The card lifts. Each row recesses inside it. Action buttons lift again. Three
levels of depth on one screen.

### Headers and metadata strips
- Status badges sit on the same line as titles, not below them.
- Timestamps and IDs are mono, muted, 10–11px, often with a tiny icon
  (`Clock`, `MapPin`, `Hash`).
- Section headers pair an icon with a `font-black tracking-tight` title.

### Empty states
A centered `text-sm text-muted-foreground` paragraph with ~`py-12`. No
illustrations. The recessed surface around it carries the visual.

### Forms
- Inputs are `pill recessed` (or `rounded-md recessed` for textareas).
- Submit buttons are `pill lifted-primary`.
- Validation errors are inline 11px text in the emergency tone — no toast for
  field-level issues. Toasts are for *transient* outcomes.

---

## Motion

- **Default transition:** `200ms` on `transform` and `box-shadow`. Linear or
  ease-out. Not ease-in-out.
- **No bouncy springs.** This system is calm and physical, not playful.
- **Hover lift:** `translateY(-2px)` for most things, `translateY(-3px) scale(1.015)`
  for emergency CTAs only.
- **Active press:** `translateY(0)` + smaller shadow, same duration. Emergency
  buttons additionally `scale(0.98)`.
- **Page transitions:** none. Trust the layout to do the work.
- **Loading states:** three small dots bouncing with staggered delays (0ms,
  150ms, 300ms) inside a `recessed` pill — used for "AI is typing", "Loading",
  etc. Never a spinner.

---

## Voice & Tone Cues

These show up in the *copy*, but the design depends on them:

- **Tiny uppercase metadata strings** everywhere: `24/7 SUPPORT ACTIVE`,
  `LIVE · AUTO-REFRESHING`, `PRIORITY: CRITICAL`. Treat them as design
  elements, not text.
- Use real symbols: `·` between metadata, `—` for em-dashes, never `--`.
- Numbers and IDs are short and monospaced. Truncate UUIDs to 6–8 chars.

---

## Do / Don't

**Do**
- Combine utility classes — `pill recessed`, `card-embossed p-6`, etc.
- Reserve color for status. Most of the page should be neutral surfaces.
- Use depth (lifted inside recessed inside lifted) instead of borders to
  separate sections.
- Make every tappable thing physically respond to press.

**Don't**
- Stack `lifted` on `lifted` on `lifted`. Two levels max, with a `recessed`
  break between.
- Use flat-fill buttons. Even ghost buttons should have *some* depth on hover.
- Use shadows that are sharper than `0 2px 4px rgba(0,0,0,0.5)` — this system
  is soft, not Material.
- Use heavy borders. 1px hairlines only; let shadows do the separation.
- Animate longer than 250ms. The interaction should feel immediate.

---

## Quickstart Checklist

When porting this to a new app:

1. Pick your two color families (surface + status). Define them as CSS
   variables.
2. Copy the `--emboss-*`, `--recess`, and `--lift-*` token blocks. Tune the
   alpha values once for light mode, then again for dark mode.
3. Copy the `.lifted`, `.lifted-primary`, `.lifted-{status}`, `.recessed`,
   `.pill`, `.card-embossed` component classes.
4. Pick one geometric sans with a Black weight. Set it as `--font-sans`.
5. Build your first screen using the dashboard pattern above. If it doesn't
   feel right, you're probably missing the rim highlight or using too-sharp
   shadows.
