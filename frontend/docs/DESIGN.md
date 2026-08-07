# CyberGuard SME — Design System
### Complete spec. Fresh start. This is the only file you need.

---

## The Concept

**Design reference: Spotify.** Bold. Confident. Content-first. Generous whitespace. Nothing cluttered, nothing timid.

**Visual identity: The green wave particle image.** This is not just a background texture — the UI *lives inside* this world. Cards float above the wave. The wave breathes beneath everything.

**The two rules that govern every decision:**
1. Green is the only primary color. It owns buttons, active states, icons, highlights, brand elements.
2. Blue / Yellow / Red exist for ONE purpose only — showing risk level. Never used for anything else.

---

## Color System

```css
:root {
  /* ═══ DARK THEME (default) ═══════════════════════════════ */

  /* Backgrounds */
  --bg-root:        #050805;    /* page canvas — near black, faint green tint     */
  --bg-card:        #0C130C;    /* card surfaces                                  */
  --bg-card-hover:  #111A11;    /* card hover state                               */
  --bg-input:       #080D08;    /* input fields                                   */
  --bg-sidebar:     #030503;    /* sidebar — deepest black                        */
  --bg-overlay:     rgba(5, 8, 5, 0.85); /* backdrop over wave for readability   */

  /* Primary — GREEN. Used for: buttons, active states, icons, links, borders */
  --primary:        #00FF41;
  --primary-hover:  #00CC34;
  --primary-dim:    rgba(0, 255, 65, 0.10);
  --primary-border: rgba(0, 255, 65, 0.22);
  --primary-glow:   0 0 20px rgba(0, 255, 65, 0.25);

  /* Text */
  --text-primary:   #FFFFFF;
  --text-secondary: #A8BCA8;    /* muted — green-tinted grey                      */
  --text-muted:     #4D664D;    /* dimmer muted                                   */

  /* Borders */
  --border:         rgba(0, 255, 65, 0.07);
  --border-strong:  rgba(0, 255, 65, 0.18);

  /* ─── RISK COLORS — used ONLY on risk badges, result cards, log dots ─── */
  --risk-safe:      #38BDF8;    /* blue  — safe / normal / clean                  */
  --risk-safe-dim:  rgba(56, 189, 248, 0.12);
  --risk-moderate:  #FACC15;    /* yellow — moderate / warning                    */
  --risk-moderate-dim: rgba(250, 204, 21, 0.12);
  --risk-critical:  #FF4D4D;    /* red   — critical / danger                      */
  --risk-critical-dim: rgba(255, 77, 77, 0.12);
}

[data-theme="light"] {
  /* ═══ LIGHT THEME ════════════════════════════════════════ */

  --bg-root:        #FFFFFF;
  --bg-card:        #FFFFFF;
  --bg-card-hover:  #F4FBF4;
  --bg-input:       #F7FDF7;
  --bg-sidebar:     #F0FAF0;
  --bg-overlay:     rgba(255, 255, 255, 0.90);

  --primary:        #16A34A;
  --primary-hover:  #15803D;
  --primary-dim:    rgba(22, 163, 74, 0.08);
  --primary-border: rgba(22, 163, 74, 0.25);
  --primary-glow:   none;

  --text-primary:   #0A0A0A;
  --text-secondary: #374151;
  --text-muted:     #9CA3AF;

  --border:         rgba(0, 0, 0, 0.07);
  --border-strong:  rgba(0, 0, 0, 0.14);

  --risk-safe:      #1D6FE8;
  --risk-safe-dim:  rgba(29, 111, 232, 0.10);
  --risk-moderate:  #D97706;
  --risk-moderate-dim: rgba(217, 119, 6, 0.10);
  --risk-critical:  #DC2626;
  --risk-critical-dim: rgba(220, 38, 38, 0.10);
}
```

---

## Typography

```
Syne     — display, headings, numbers, logo, nav labels
DM Sans  — body, inputs, buttons, labels, everything else
```

```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap');
```

| Element                    | Font    | Size  | Weight | Color              |
|----------------------------|---------|-------|--------|--------------------|
| Logo wordmark              | Syne    | 22px  | 800    | --primary          |
| Page title                 | Syne    | 30px  | 700    | --text-primary     |
| Section heading            | Syne    | 13px  | 700    | --text-muted (uppercase + 1.5px tracking) |
| Hero stat number           | Syne    | 26px  | 700    | risk color         |
| Risk label (e.g. CRITICAL) | Syne    | 13px  | 700    | risk color         |
| Card title                 | Syne    | 16px  | 600    | --text-primary     |
| Body text                  | DM Sans | 15px  | 400    | --text-primary     |
| Secondary / subtitle       | DM Sans | 13px  | 400    | --text-secondary   |
| Button                     | DM Sans | 14px  | 600    | varies             |
| Input / placeholder        | DM Sans | 15px  | 400    | --text-muted       |
| Label / tag / timestamp    | DM Sans | 12px  | 500    | --text-muted       |
| Section tag (uppercase)    | DM Sans | 11px  | 600    | --text-muted (uppercase + 1.5px tracking) |

---

## The Wave Background

This is the soul of the app. Implement with `<canvas>` using Three.js or a raw `requestAnimationFrame` loop.

### What it is
Two particle mesh planes layered on top of each other, each shaped into slow sinusoidal waves. This is the exact aesthetic of the reference image.

### Technical spec
```
Canvas:         position fixed, full viewport, z-index 0
                pointer-events: none

Background:     #050805 — the dark base color fills the canvas first

Layer 1 (back):
  Color:        #00FF41 at 25-45% opacity (vary per particle)
  Size:         1.5 - 2.5px dots (random per particle)
  Wave:         amplitude 50px, frequency 0.008, scroll speed 0.0004
  Particle count: 2500

Layer 2 (front):
  Color:        #00FF41 at 40-70% opacity
  Size:         1.0 - 2.0px dots
  Wave:         amplitude 30px, frequency 0.012, scroll speed 0.0007 (opposite phase)
  Particle count: 1500

Bokeh spheres: 5 large blurred circles
  Size:         60-180px
  Color:        #00FF41 at 3-6% opacity
  Position:     random, move very slowly
  Blur:         40px CSS blur (use a separate div layer for these)

Wave position:
  The wave mesh sits in the BOTTOM 55% of the canvas.
  The top 45% is empty dark space — this is where cards and content live.
  A gradient fades the wave into the dark top:
    background: linear-gradient(to bottom, #050805 0%, transparent 35%)
  This overlay goes on top of the canvas but below the app layout.
```

### Per-page wave intensity
```
/            (landing)      Full power. Wave is the hero.
/login                      Wave centered behind the card at 70%
/register                   Same as login
/forgot-password            Same as login
/reset-password             Same as login
/dashboard                  Wave reduced to bottom 25% of viewport, 40% opacity
/phishing                   Bottom 20%, 30% opacity
/ransomware                 Bottom 20%, 30% opacity
/upi                        Bottom 20%, 30% opacity
/reports                    Bottom 20%, 30% opacity
/profile                    Bottom 20%, 30% opacity
/404                        Full power
```

### Light theme wave
Same animation. Particle color changes to `#16A34A` at 6-12% opacity. It's barely visible — more texture than spectacle.

---

## Cards

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 24px;
  transition: border-color 200ms, box-shadow 200ms;
}

/* Dark theme: cards feel like they're floating over the wave */
[data-theme="dark"] .card {
  background: rgba(12, 19, 12, 0.92);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5),
              0 0 0 1px rgba(0, 255, 65, 0.04) inset;
}

[data-theme="dark"] .card:hover {
  border-color: var(--primary-border);
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.5),
              var(--primary-glow),
              0 0 0 1px rgba(0, 255, 65, 0.06) inset;
}

/* Light theme: clean elevated cards */
[data-theme="light"] .card {
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06);
}

[data-theme="light"] .card:hover {
  border-color: var(--primary-border);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.10);
}

/* Risk-bordered card variant */
.card--safe     { border-left: 3px solid var(--risk-safe);     }
.card--moderate { border-left: 3px solid var(--risk-moderate); }
.card--critical { border-left: 3px solid var(--risk-critical); }
```

---

## Buttons

**Primary** — green, used for the main action on every page:
```css
background: var(--primary);
color: #000000;              /* black on green */
font: DM Sans 14px 600;
padding: 12px 24px;
border-radius: 500px;        /* pill shape — Spotify style */
border: none;
width: 100%;
transition: background 150ms, transform 100ms, box-shadow 150ms;

hover:  background var(--primary-hover);
        box-shadow var(--primary-glow);
active: transform scale(0.98);
```

**Ghost** — for secondary actions:
```css
background: transparent;
color: var(--primary);
border: 1px solid var(--primary-border);
padding: 11px 22px;
border-radius: 500px;
font: DM Sans 14px 500;

hover: background var(--primary-dim);
       border-color var(--primary);
```

**Destructive** — for sign out only:
```css
background: transparent;
color: var(--risk-critical);
border: 1px solid rgba(255, 77, 77, 0.25);
padding: 11px 22px;
border-radius: 500px;
font: DM Sans 14px 500;

hover: background var(--risk-critical-dim);
```

**Disabled state** (any button type):
```css
opacity: 0.4;
cursor: not-allowed;
pointer-events: none;
```

**Loading state** (replaces label):
```
○  Analyzing...
```
Spinning ring + text. Button stays same size. Disabled.

---

## Input Fields

```css
background: var(--bg-input);
border: 1px solid var(--border-strong);
border-radius: 12px;
padding: 14px 18px;
font: DM Sans 15px 400;
color: var(--text-primary);
width: 100%;
transition: border-color 150ms, box-shadow 150ms;

focus:  border-color var(--primary);
        box-shadow 0 0 0 3px var(--primary-dim);
        outline none;
```

---

## Risk Badge

```css
display: inline-flex;
align-items: center;
gap: 5px;
padding: 3px 10px;
border-radius: 500px;
font: DM Sans 11px 600;
text-transform: uppercase;
letter-spacing: 0.8px;
```

| Badge     | Background             | Text color          |
|-----------|------------------------|---------------------|
| SAFE      | --risk-safe-dim        | --risk-safe         |
| MODERATE  | --risk-moderate-dim    | --risk-moderate     |
| CRITICAL  | --risk-critical-dim    | --risk-critical     |

---

## Sidebar

Spotify sidebar. Clean. Minimal. Never cluttered.

```css
width: 220px;
position: fixed;
height: 100vh;
background: var(--bg-sidebar);
border-right: 1px solid var(--border);
display: flex;
flex-direction: column;
padding: 0;
```

```
┌──────────────────────┐
│                      │
│  ⬡ CYBERGUARD  SME  │  ← logo block, 24px all-around padding
│                      │
├──────────────────────┤  ← border rgba(0,255,65,0.07)
│                      │
│  MENU                │  ← section label: DM Sans 10px 600 uppercase muted, px 20px, py 8px
│                      │
│  ▦  Dashboard        │  ← nav item
│  ⌕  Phishing         │
│  ⊛  Ransomware       │
│  ◈  UPI Verifier     │
│  ☰  Reports          │
│                      │
├──────────────────────┤
│                      │
│  ACCOUNT             │  ← section label
│                      │
│  ○  Profile          │
│  ←  Sign Out         │
│                      │
└──────────────────────┘
```

**Nav item:**
```css
height: 44px;
padding: 0 20px;
display: flex;
align-items: center;
gap: 12px;
cursor: pointer;
border-radius: 0;          /* no rounding — full width items */
transition: all 150ms;

/* Icon: 18px, --text-muted inactive / --primary active */
/* Label: DM Sans 14px 500, --text-secondary inactive / --text-primary active */

inactive:   background transparent;
hover:      background var(--primary-dim);
            icon + label color: --text-primary;
active:     background var(--primary-dim);
            border-left: 3px solid var(--primary);
            icon + label color: --primary;

/* Dark theme only: active item glows */
[dark] active: box-shadow: -3px 0 12px var(--primary);
```

**Logo block:**
```
⬡ icon: 24px, --primary color
"CYBERGUARD" Syne 800 18px --primary
"SME" Syne 700 18px --text-muted (same line, dimmer)
padding: 28px 20px 20px
```

---

## Top Bar (inner pages)

Not a fixed header. Scrolls with content.

```css
padding-bottom: 24px;
margin-bottom: 32px;
border-bottom: 1px solid var(--border);
display: flex;
justify-content: space-between;
align-items: flex-start;
```

Left: page title (Syne 700 30px) + subtitle (DM Sans 13px --text-muted) stacked  
Right: theme toggle icon button (moon ↔ sun, 20px, --text-muted)

---

## Result Card

Shared across all three tools.

```
Props: { risk, title, target, flags[], ai_explanation, actions[], onReset }

risk: "SAFE" | "MODERATE" | "CRITICAL"
```

```
┌── (3px left border, risk color) ──────────────────────────────────┐
│                                                                   │
│  [RISK BADGE]                                                     │
│                                                                   │
│  Title (Syne 600 16px)                                            │
│  target: url/filename (DM Sans 13px monospace --text-muted)       │
│                                                                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ (dashed divider)  │
│                                                                   │
│  WHAT WE FOUND          ← DM Sans 10px 600 uppercase muted       │
│  • Flag one             ← DM Sans 14px --text-secondary          │
│  • Flag two                                                       │
│                                                                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  "AI explanation in plain English. One or two sentences  │    │  ← slightly offset block
│  │   maximum. No jargon."                                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│  The block has --primary-dim background and --primary-border      │
│  left border. DM Sans 15px 400 italic --text-primary.            │
│                                                                   │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─                   │
│                                                                   │
│  WHAT TO DO NOW         ← DM Sans 10px 600 uppercase muted       │
│  →  Action one          ← DM Sans 14px --text-secondary          │
│  →  Action two                                                    │
│  →  Action three                                                  │
│                                                                   │
│  [  Scan Again  ]       ← ghost button, full width, bottom       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

Dividers: `1px dashed rgba(255,255,255,0.06)` dark / `1px dashed rgba(0,0,0,0.08)` light

---

## Drop Zone

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│              ↑                                               │
│         (upload icon, 36px, --primary)                       │
│                                                              │
│    Drop file here or click to upload                         │  ← DM Sans 15px --text-secondary
│                                                              │
│    .exe  ·  .zip  ·  .docx  ·  .pdf  ·  .xlsx  ·  .js       │  ← DM Sans 12px --text-muted
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
```css
border: 1.5px dashed var(--primary-border);
border-radius: 16px;
padding: 48px 24px;
text-align: center;
cursor: pointer;
transition: all 200ms;

hover, drag-over:
  background: var(--primary-dim);
  border-color: var(--primary);
  border-style: solid;
```

File selected state: replace contents with filename chip:
```
📄  invoice_final.exe    2.4 MB    [×]
```
DM Sans 14px, chip has --bg-card-hover background, 8px radius, --primary-border border.

---

---

# ALL PAGES

---

## 1. LANDING  `/`

No sidebar. No topbar. Full canvas.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [top bar: ⬡ CYBERGUARD SME (left)    Sign In  (right, ghost btn)] │
│                                                                      │
│                                                                      │
│                    Your business is a target.                        │  ← Syne 700 48px white, centered
│              Most don't find out until it's too late.                │  ← same, 2nd line, --text-secondary
│                                                                      │
│    CyberGuard checks your links, files, and UPI payments             │  ← DM Sans 16px --text-secondary
│    and tells you exactly what to do — in plain language.             │
│                                                                      │
│                  [  Get Started — It's Free  ]                       │  ← primary btn, centered, wide
│                                                                      │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────   │  ← divider
│                                                                      │
│     ⌕ Phishing        ⊛ Ransomware         ◈ UPI Fraud              │  ← 3 cols, centered
│     Check links       Scan files           Verify payments           │
│     before you        before you           before you pay            │
│     click             open them                                      │
│                                                                      │
│  ════════════════════ WAVE FILLS BOTTOM HALF ════════════════════    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Top bar (landing only):**
- Logo left, "Sign In" ghost button right
- No background — floats on dark canvas
- Padding: 24px 40px

**Hero text:**
- Centered, max-width 640px, centered horizontally
- The two headline lines: Syne 700, line 1 at 48px white, line 2 at 48px --text-muted
- Subtext: DM Sans 16px --text-secondary, max-width 480px
- "Get Started" button: 200px wide minimum, pill shape, padding 14px 40px

**Three feature columns:**
- Each: icon (24px --primary), name (Syne 600 14px white), description (DM Sans 13px --text-muted)
- Equal spacing, centered, no cards/borders around them
- Icons: use outline style

**Light theme landing:**
- Background white
- Headline: black
- Wave barely visible
- "Get Started" still green pill, white text (in light: primary is #16A34A so white text works)

---

## 2. LOGIN  `/login`

```
Full screen. Wave at 70%. Login card centered vertically and horizontally.

┌─────────────────────────────────────────────┐
│                                             │
│  ⬡ CYBERGUARD SME                          │  ← logo, centered above card
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │  Welcome back                         │  │  ← Syne 700 22px
│  │  Sign in to your account              │  │  ← DM Sans 13px --text-muted
│  │                                       │  │
│  │  Email                                │  │
│  │  [                                  ] │  │
│  │                                       │  │
│  │  Password                         👁  │  │
│  │  [                                  ] │  │
│  │                                       │  │
│  │  [  Sign In  ]                        │  │  ← primary button
│  │                                       │  │
│  │  Forgot password?          Sign up →  │  │  ← 2 links on same row, DM Sans 13px --primary
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  "Check Before You Click, Open, or Pay"     │  ← DM Sans 12px --text-muted italic, below card
│                                             │
└─────────────────────────────────────────────┘
```

Card: max-width 400px, --bg-card, backdrop-filter blur(12px), 20px radius, 36px padding  
Error state: DM Sans 13px --risk-critical below the button (no toasts)

---

## 3. REGISTER  `/register`

Same card layout as login.

```
┌───────────────────────────────────────┐
│                                       │
│  Create your account                  │  ← Syne 700 22px
│  Protect your business starting today │  ← DM Sans 13px muted
│                                       │
│  Business Name                        │
│  [                                  ] │
│                                       │
│  Email                                │
│  [                                  ] │
│                                       │
│  Password                         👁  │
│  [                                  ] │
│  ○ 8+ chars  ○ Number  ○ Special      │  ← password hints, fade in on focus
│                                       │
│  Confirm Password                 👁  │
│  [                                  ] │
│                                       │
│  Business Type                        │
│  [ ▾ Select type                    ] │  ← dropdown
│  "We use this for better security     │  ← DM Sans 11px --text-muted
│   advice tailored to your business"   │
│                                       │
│  [  Create Account  ]                 │  ← primary button (green)
│                                       │
│  Already have an account?  Sign in →  │  ← DM Sans 13px --primary link
│                                       │
└───────────────────────────────────────┘
```

Password hint chips: appear below password field on focus.  
Each chip: pill shape, --bg-input bg, --border border, DM Sans 11px.  
Unmet: --text-muted. Met: background --primary-dim, border --primary, text --primary, with ✓ icon.

Business type options: Retail / Kirana, Restaurant, Professional Services, E-commerce, Healthcare, Manufacturing, Other.

Success state: replace card body with:
```
✓  Account created.              ← Syne 600 18px --primary
   Heading to your dashboard...
   ○                             ← spinner
```
Auto-redirect to /dashboard after 1.5s.

Card has a 2px top border in --primary: `border-top: 2px solid var(--primary)`.

---

## 4. FORGOT PASSWORD  `/forgot-password`

```
┌───────────────────────────────────────┐
│                                       │
│  Reset your password                  │  ← Syne 700 22px
│  We'll send a reset link to your      │  ← DM Sans 13px muted
│  email address.                       │
│                                       │
│  Email                                │
│  [                                  ] │
│                                       │
│  [  Send Reset Link  ]                │
│                                       │
│  ← Back to sign in                    │  ← DM Sans 13px --primary link, left-aligned
│                                       │
└───────────────────────────────────────┘
```

After submit — same card, content replaced:
```
✓  Check your inbox                 ← Syne 600 18px --primary
   Sent to: rohan@business.com      ← DM Sans 13px muted
                                    
   Didn't get it?                   ← DM Sans 13px muted
   Resend in 0:52  →                ← countdown; becomes a link at 0:00
   
   ← Back to sign in
```

---

## 5. RESET PASSWORD  `/reset-password`

```
┌───────────────────────────────────────┐
│                                       │
│  Set a new password                   │
│                                       │
│  New Password                     👁  │
│  [                                  ] │
│                                       │
│  Confirm New Password             👁  │
│  [                                  ] │
│                                       │
│  [  Set New Password  ]               │
│                                       │
│  ← Back to sign in                    │
│                                       │
└───────────────────────────────────────┘
```

State 2 — success:
```
✓  Password updated.
   Redirecting to sign in...  ○
```

State 3 — expired link:
```
✗  This link has expired.             ← Syne 600 18px --risk-critical
   Links are only valid for 30 mins.  ← DM Sans 13px muted
   [  Request a new link  ]           ← primary button → /forgot-password
```

---

## 6. DASHBOARD  `/dashboard`

```
[Sidebar]  [Main content]

Main content layout:

  TopBar: "Security Dashboard" / "Your business protection overview"

  ┌── HERO CARD (full width, risk-bordered) ───────────────────────────┐
  │                                                                    │
  │  [Icon 44×44]  ⚠ MODERATE RISK          [Run New Scan →] (ghost) │
  │                3 threats need attention                            │
  │                                                                    │
  │  [████████████████░░░░░░░] 62%                                    │
  │                                                                    │
  │  ─────────────────────────────────────────────────────────────    │
  │                                                                    │
  │       3                  12                   2                   │
  │  THREATS FOUND       SCANS CLEAN        ALERTS ACTIVE             │
  │                                                                    │
  │  ─────────────────────────────────────────────────────────────    │
  │                                                                    │
  │  🕐 Last scan: 4 min ago  ·  Next recommended: Tomorrow 9:00 AM   │
  │                                                                    │
  └────────────────────────────────────────────────────────────────────┘

  QUICK ACTIONS                     ← section heading
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  ⌕           │  │  ⊛           │  │  ◈           │
  │  Phishing    │  │  Ransomware  │  │  UPI         │
  │  Checker     │  │  Scanner     │  │  Verifier    │
  │              │  │              │  │              │
  │  Check       │  │  Scan files  │  │  Verify      │
  │  suspicious  │  │  before you  │  │  payments    │
  │  links       │  │  open them   │  │  before pay  │
  │              │  │              │  │              │
  │  [Analyze →] │  │  [Scan →]    │  │  [Verify →]  │
  └──────────────┘  └──────────────┘  └──────────────┘

  RECENT ACTIVITY                   ← section heading
  ┌──────────────────────────────────────────────────────────────────┐
  │  ● paytm-secure.xyz              Phishing    14:22   [CRITICAL] ›│
  │  ● SERVER_RACK_04.exe            File Scan   12:05   [SAFE]     ›│
  │  ● MerchantID_7712@ybl           UPI Check   09:45   [MODERATE] ›│
  └──────────────────────────────────────────────────────────────────┘
```

**Hero card icon box (44×44px):**
- Background: risk-dim color
- Icon: risk color, 22px
- Risk text: Syne 700 18px, risk color
- Subtitle: DM Sans 13px --text-muted

**Risk bar:**
- Track: full width, 6px, --bg-card-hover, radius 999px
- Fill: width = risk_score%, gradient left-to-right: --risk-safe → --risk-moderate (for medium), or --risk-moderate → --risk-critical (for high)
- Percentage label: right end of fill, DM Sans 11px --text-muted

**Three stats:** Syne 700 26px, each their risk color. Labels: DM Sans 10px uppercase --text-muted.

**Quick action cards:** icon (36px circle with --primary-dim bg, icon --primary), title (Syne 600 15px), description (DM Sans 12px --text-secondary), ghost button.

**Recent activity rows:** colored dot (risk color, 8px), monospace target name, type, time, badge, chevron. Full-width. Hover: --bg-card-hover. Clicking goes to /reports.

**Three hero card versions:**

| Risk     | Left border         | Icon bg         | Status text          |
|----------|---------------------|-----------------|----------------------|
| SAFE     | --risk-safe         | --risk-safe-dim | "✓ ALL SYSTEMS CLEAR"|
| MODERATE | --risk-moderate     | --risk-moderate-dim | "⚠ MODERATE RISK" |
| CRITICAL | --risk-critical     | --risk-critical-dim | "🔴 CRITICAL RISK" |

---

## 7. PHISHING CHECKER  `/phishing`

```
TopBar: "Phishing Link Checker" / "Paste a suspicious link. We'll tell you if it's safe."

STATE 1 — IDLE:

  ┌────────────────────────────────────────────────────────────────┐
  │  [🔗 icon]  Paste suspicious link here...                      │  ← large input, 56px height
  └────────────────────────────────────────────────────────────────┘
  [  Analyze Threat  ]   ← primary button, full width

  WHAT WE LOOK FOR      ← section heading
  ● HDFC / SBI / UPI impersonation      ● Newly registered domains
  ● Lookalike URLs                       ● Known malware hosts

  (only shows if prior scans exist)
  RECENTLY CHECKED
  paytm-secure.xyz          [CRITICAL]   2 hrs ago   ›
  hdfc-verify.net           [MODERATE]   Yesterday   ›

STATE 2 — LOADING:
  Input stays, disabled.
  Button: ○  Analyzing...
  Below button (cycling, DM Sans 13px muted):
    "Checking URL reputation..."
    → "Scanning for impersonation..."
    → "Running AI analysis..."

STATE 3 — RESULT:
  Input stays above (enabled).
  ResultCard appears below with animation (fade up 250ms).
```

---

## 8. RANSOMWARE SCANNER  `/ransomware`

```
TopBar: "Ransomware Scanner" / "Upload a suspicious file. We'll check it before you open it."

STATE 1 — IDLE:
  [Drop zone — full spec above]
  [  Scan File  ]  ← disabled, primary button

  File selected:
  [Drop zone replaced by filename chip]
  [  Scan File  ]  ← enabled

STATE 2 — LOADING:
  Button: ○  Scanning...
  Cycling: "Extracting signature..." → "Checking threat database..." → "Running AI analysis..."

STATE 3 — RESULT:
  ResultCard

  ─── PORT SCANNER (always visible below, separate card) ─────────────
  
  PORT SCANNER          ← section heading
  ┌────────────────────────────────────────────────────────────────┐
  │  [  Enter IP or domain...  ]         [  Scan Ports  ]  (ghost) │
  │                                                                │
  │  (after scan:)                                                 │
  │  PORT   SERVICE   STATUS      NOTE                            │
  │  3389   RDP       [CRITICAL]  "WannaCry spread through here"  │
  │  443    HTTPS     [SAFE]      —                               │
  │  445    SMB       [CRITICAL]  "EternalBlue exploit path"      │
  └────────────────────────────────────────────────────────────────┘

  Table: DM Sans 13px. Risk column = Risk Badge component.
  Note: DM Sans 12px --text-muted italic.
```

---

## 9. UPI VERIFIER  `/upi`

```
TopBar: "UPI Payment Verifier" / "Verify a payment before you send money."

STATE 1 — IDLE:

  SCAN A QR CODE                     ← section heading
  [Drop zone]

  ── or ─────────────────────────────────────────────────────────
  (divider: 1px dashed --border, "or" centered in DM Sans 11px uppercase muted)

  UPLOAD A SCREENSHOT
  [Drop zone]

  ── or ──────────────────────────────────────────────────────────

  ENTER UPI ID
  ┌─────────────────────────────────────┐  ┌───────────────────┐
  │  @  merchant@upi or 987...@paytm    │  │  [Verify Payment] │  ← primary btn
  └─────────────────────────────────────┘  └───────────────────┘

STATE 2 — LOADING:
  ○  Verifying payment...
  "Extracting UPI ID..." → "Checking payment details..." → "Running AI analysis..."

STATE 3 — RESULT:
  ResultCard with UPI-specific content
```

---

## 10. REPORTS  `/reports`

```
TopBar: "Scan History" / "All your past security checks"

  ┌─────────────────────────────────────────────────────────────────┐
  │  [All] [Phishing] [Files] [UPI]   ·   [Today] [Week] [Month]  │
  │                                                    [Export PDF] │
  └─────────────────────────────────────────────────────────────────┘

  MON 19 MAY 2026                    ← DM Sans 11px uppercase --text-muted
  ────────────────────────────────────────────────────────────────
  ● paytm-secure.xyz        Phishing  14:22  [CRITICAL]  ›
  ● SERVER_RACK_04.exe      File      12:05  [SAFE]      ›
  ● MerchantID_7712@ybl     UPI       09:45  [MODERATE]  ›

  SUN 18 MAY 2026
  ────────────────────────────────────────────────────────────────
  ● invoice_march.pdf       File      16:30  [SAFE]      ›
  ● hdfc-update.com         Phishing  11:15  [CRITICAL]  ›
```

Clicking `›` expands inline (no navigation):
```
▾ ● paytm-secure.xyz        Phishing  14:22  [CRITICAL]
  ──────────────────────────────────────────────────────
  [Full ResultCard renders here — same component]
  [Collapse ▴]                                           ← DM Sans 12px --primary link
```

Filter pills: ghost style inactive, `--primary-dim` bg + `--primary` border when active.  
Export PDF: ghost button right-aligned.  

Empty state:
```
(centered)
No scans yet.
Head to a tool to run your first check.
[  Go to Phishing Checker  ]   ← primary button
```

---

## 11. USER PROFILE  `/profile`

```
TopBar: "Account Settings" / "Manage your profile"

┌── PROFILE CARD ─────────────────────────────────────────────────┐
│                                                                 │
│  ┌──────┐  Rohan Mehta                                          │
│  │  RM  │  rohan@mehtatextiles.com                              │  ← 52px avatar circle
│  └──────┘  Retail / Kirana Store  ·  Member since Jan 2024      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌── PERSONAL DETAILS ─────────────────────────────────────────┐ [Edit]
│  Business Name    Mehta Textiles                             │
│  Email            rohan@mehtatextiles.com                    │
│  Business Type    Retail / Kirana Store                      │
└──────────────────────────────────────────────────────────────┘
  (Edit → fields become inline inputs. "Edit" becomes "Save Changes")

┌── CHANGE PASSWORD ──────────────────────────────────────────┐
│  Current Password   [                        ]               │
│  New Password       [                        ]               │
│  Confirm New        [                        ]               │
│                          [Update Password] (ghost, right)    │
└──────────────────────────────────────────────────────────────┘

┌── SCAN SUMMARY ─────────────────────────────────────────────┐
│  15 total  ·  3 threats found  ·  12 clean                   │
│                              [View Full History →]  (link)   │
└──────────────────────────────────────────────────────────────┘

[  Sign Out  ]   ← destructive button, standalone, 32px top margin
```

Avatar: 52×52 circle, --primary-dim bg, --primary-border border, Syne 700 18px --primary initials.  
Label column: DM Sans 12px 500 uppercase --text-muted.  
Value column: DM Sans 14px --text-primary.

---

## 12. 404  `/404`

No sidebar. Wave at full power.

```
(centered vertically and horizontally)

ERROR_404             ← Syne 800 64px --primary, CSS glitch animation
                        (80ms flicker: translateX(3px) + color shift, every 3s)
Page not found.       ← Syne 700 24px --text-primary
This path doesn't     ← DM Sans 15px --text-secondary
exist in our system.

[  Return to Safety  ]   ← primary button
```

Glitch: brief horizontal offset + desaturate flicker.  
"Return to Safety" → /dashboard (logged in) or / (not logged in).

---

---

# COMPLETE BUTTON ROUTING

```
/  landing
  "Get Started"               → /register
  "Sign In" (top right)       → /login
  Feature icons (3)           → /register

/login
  "Sign In"                   → /dashboard ✓ or show error
  "Forgot password?"          → /forgot-password
  "Sign up →"                 → /register

/register
  "Create Account"            → /dashboard (1.5s delay after success msg)
  "Sign in →"                 → /login

/forgot-password
  "Send Reset Link"           → same page, show success state
  "← Back to sign in"        → /login
  "Resend →" (after timer)    → re-trigger send, restart timer

/reset-password
  "Set New Password"          → same page, show success state → /login after 2s
  "← Back to sign in"        → /login
  "Request a new link"        → /forgot-password

/dashboard
  All sidebar nav items       → respective routes
  "Run New Scan →"            → /phishing
  Quick card "Analyze →"      → /phishing
  Quick card "Scan →"         → /ransomware
  Quick card "Verify →"       → /upi
  Recent activity rows (›)    → /reports
  Theme toggle                → toggle dark/light, persist localStorage
  Sidebar "Profile"           → /profile
  Sidebar "Sign Out"          → clear token → /login

/phishing, /ransomware, /upi (all tool pages)
  Primary action button       → trigger scan, stay on page (loading → result state)
  "Scan Again" / "Verify Another" → reset to idle state (same page, no navigation)
  Theme toggle                → toggle theme
  All sidebar items           → respective routes

/reports
  Filter pills                → filter list (same page, no navigation)
  "Export PDF"                → download PDF
  Row (›)                     → expand inline, no navigation
  "Collapse ▴"               → collapse inline
  Empty state "Go to..."      → /phishing

/profile
  "Edit"                      → inline edit mode (same card)
  "Save Changes"              → save, return to display mode
  "Update Password"           → validate, save, show success inline
  "View Full History →"       → /reports
  "Sign Out"                  → clear localStorage → /login
  All sidebar items           → respective routes

/404
  "Return to Safety"          → /dashboard (if token exists) or / (if not)
  Logo                        → /
```

---

# LIGHT THEME SUMMARY

Same layout. Same components. These are the only differences:

| Element              | Dark                              | Light                           |
|----------------------|-----------------------------------|---------------------------------|
| Background           | #050805 + green wave              | #FFFFFF + barely-visible wave   |
| Cards                | rgba(12,19,12,0.92) + backdrop blur| #FFFFFF + soft box-shadow       |
| Sidebar              | #030503 + green-border right      | #F0FAF0 + border right          |
| Active nav           | --primary-dim bg + glow           | --primary-dim bg (no glow)      |
| Primary color        | #00FF41                           | #16A34A                         |
| Primary button text  | #000000 (black on bright green)   | #FFFFFF (white on dark green)   |
| Body text            | #FFFFFF                           | #0A0A0A                         |
| Secondary text       | #A8BCA8                           | #374151                         |
| Wave                 | Full intensity                    | 8% opacity, barely visible      |
| Risk colors          | bright (38BDF8 / FACC15 / FF4D4D) | slightly darker (1D6FE8 / D97706 / DC2626) |

---

# STITCH PROMPTS — RUN IN ORDER

---

### 1 — Color system and theme
```
Set up the complete design system. CSS variables in :root for dark theme: --bg-root #050805, --bg-card rgba(12,19,12,0.92), --bg-sidebar #030503, --primary #00FF41, --primary-hover #00CC34, --primary-dim rgba(0,255,65,0.10), --primary-border rgba(0,255,65,0.22), --primary-glow: 0 0 20px rgba(0,255,65,0.25), --text-primary #FFFFFF, --text-secondary #A8BCA8, --text-muted #4D664D, --border rgba(0,255,65,0.07), --border-strong rgba(0,255,65,0.18). Risk colors ONLY for status indicators: --risk-safe #38BDF8, --risk-moderate #FACC15, --risk-critical #FF4D4D, plus -dim variants at 12% opacity each. [data-theme="light"] overrides: --bg-root #FFFFFF, --bg-card #FFFFFF, --bg-sidebar #F0FAF0, --primary #16A34A, --text-primary #0A0A0A, --text-secondary #374151, risk colors at --risk-safe #1D6FE8, --risk-moderate #D97706, --risk-critical #DC2626. Fonts: Syne (700, 800) for headings/numbers, DM Sans (400, 500, 600) for everything else.
```

### 2 — Wave particle background
```
Create a full-viewport canvas element (position fixed, z-index 0, pointer-events none) that renders a flowing green particle wave matching this reference: two sinusoidal particle mesh layers stacked, bottom layer ~2500 particles at amplitude 50px, top layer ~1500 particles at amplitude 30px, opposite phase, very slow movement (8-20s cycles). Particles are #00FF41 at 25-70% opacity, size 1-2.5px. Add 5 large blurred bokeh circles (#00FF41 at 4% opacity, 60-180px, CSS blur 40px) as a separate div layer. The wave sits in the BOTTOM 55% of the screen. A gradient overlay (linear-gradient to bottom, #050805 0%, transparent 35%) fades the top of the canvas to clean dark. On inner app pages (/dashboard, /phishing, /ransomware, /upi, /reports, /profile) the wave is reduced to the bottom 20% at 35% opacity. On /login, /register, /forgot-password, /reset-password it is centered at 70% opacity. On / and /404 it runs at full power. In light mode, wave particles change to #16A34A at 8% opacity.
```

### 3 — Sidebar and layout shell
```
Create the main layout shell for protected pages. Fixed sidebar (220px wide, full height, --bg-sidebar, border-right 1px solid --border). Logo block (28px top padding): hex icon + "CYBERGUARD" Syne 800 18px --primary + "SME" same size --text-muted. Section labels inside sidebar: DM Sans 10px 600 uppercase --text-muted with 12px top padding, 8px bottom padding. Nav items: 44px height, 0 20px padding, icon (18px) + label (DM Sans 14px 500), icon and label are --text-muted when inactive, --primary when active. Active item has --primary-dim background, 3px solid --primary left border, and in dark mode: box-shadow -3px 0 12px rgba(0,255,65,0.4) glow. Hover: --primary-dim background, --text-primary color. Main content: margin-left 220px, min-height 100vh, transparent background, max inner-content width 860px centered, padding 36px 32px.
```

### 4 — All buttons, inputs, cards, badges
```
Implement the core component styles. Primary button: --primary background, black text, DM Sans 14px 600, padding 12px 24px, border-radius 500px (pill), full width within container, hover: --primary-hover + --primary-glow shadow, active: scale(0.98). Ghost button: transparent bg, --primary text, --primary-border border, same padding and radius, hover: --primary-dim bg. Destructive button: transparent bg, --risk-critical text, rgba(255,77,77,0.25) border, same padding/radius. Input fields: --bg-input background, --border-strong border, 12px radius, 14px 18px padding, DM Sans 15px, focus: --primary border + 0 0 0 3px var(--primary-dim) shadow. Cards: --bg-card background (with backdrop-filter blur(8px) in dark mode), --border border, 16px radius, 28px 24px padding. Risk cards have a 3px left border in the appropriate risk color. Risk badges: pill shape (500px radius), 3px 10px padding, DM Sans 11px 600 uppercase, background = risk-dim, text = risk color.
```

### 5 — Landing page /
```
Create the landing page (route /). No sidebar. Full screen canvas with wave at full power. Top bar: logo left (hex + CYBERGUARD SME), "Sign In" ghost button right, no background, 24px 40px padding. Center content: headline "Your business is a target." in Syne 700 48px white + second line "Most don't find out until it's too late." in same size --text-secondary; DM Sans 16px subtext about the three tools; a centered pill primary button "Get Started — It's Free" (min 200px wide). Below a dashed divider: three equal feature columns (no cards) each with a 24px --primary icon, Syne 600 14px white label, DM Sans 13px --text-muted description for Phishing/Ransomware/UPI. "Get Started" → /register. "Sign In" → /login. Feature icons → /register. Light theme: same layout, wave barely visible at 8%, green is #16A34A, headline black.
```

### 6 — Login /login and Register /register
```
Create /login and /register pages. Both use a centered card (max-width 400px, backdrop-blur in dark mode, 20px radius, 36px padding). Login: title "Welcome back" Syne 700 22px, subtitle DM Sans 13px muted, email input, password input with eye-toggle, "Sign In" primary button full width, "Forgot password?" and "Sign up →" as --primary links on same row below. /register: same card but with top 2px --primary border accent. Fields: Business Name, Email, Password with eye-toggle + inline hint chips (appear on focus, turn green when condition met), Confirm Password, Business Type dropdown. "Create Account" primary button. On register success, replace card content with checkmark + "Account created. Heading to your dashboard..." + spinner, then auto-redirect /dashboard after 1.5s. Both pages have the tagline "Check Before You Click, Open, or Pay" in small italic muted text below the card.
```

### 7 — Forgot password and Reset password
```
Create /forgot-password and /reset-password. Both use the same centered card aesthetic as login. /forgot-password: title "Reset your password", email input, "Send Reset Link" primary button, "← Back to sign in" --primary link. After submit, replace card body with: green checkmark, "Check your inbox", email address shown in muted text, countdown timer starting at 60s showing "Resend in 0:52", which becomes a clickable "Resend →" link when timer hits zero. /reset-password: fields for New Password and Confirm Password (both with eye toggles), "Set New Password" primary button, back link. Success state: checkmark + "Password updated. Redirecting to sign in..." + spinner + auto-redirect after 2s. Invalid token state: shows --risk-critical "This link has expired." message + "Request a new link" button → /forgot-password.
```

### 8 — Dashboard /dashboard
```
Create /dashboard with the standard sidebar layout. TopBar: "Security Dashboard" / "Your business protection overview". Full-width hero card with 3px left border in risk color. Inside: top row with 44×44 icon box (risk-dim bg, risk-colored icon) + status text (Syne 700 18px risk color) + description (DM Sans 13px muted) + "Run New Scan →" ghost button right. Below: risk bar (full width 6px track, colored fill with gradient, percentage label). Separator. Three stats (Syne 700 26px risk color each, DM Sans 10px uppercase label below). Separator. Timestamp. Three states: SAFE (--risk-safe colors, "✓ ALL SYSTEMS CLEAR"), MODERATE (--risk-moderate, "⚠ MODERATE RISK"), CRITICAL (--risk-critical, "🔴 CRITICAL RISK"). Below hero: "QUICK ACTIONS" section heading (DM Sans 11px uppercase muted), three equal cards (icon circle with --primary-dim bg, Syne 600 title, DM Sans 12px description, ghost button). Below: "RECENT ACTIVITY" section heading, 3 activity rows (colored dot, monospace target name, type, time, risk badge, ›). "Run New Scan →" → /phishing. Quick cards → /phishing, /ransomware, /upi. Activity rows → /reports.
```

### 9 — Tool pages /phishing /ransomware /upi
```
Create all three tool pages, each with three states (idle, loading, result). /phishing idle: large 56px height input with link icon placeholder, "Analyze Threat" primary button full width, "WHAT WE LOOK FOR" section with 4 bullet chips. Loading: input disabled, button shows "○ Analyzing..." with cycling status text below. Result: input stays, ResultCard appears with fade-up animation. /ransomware idle: drop zone (dashed --primary-border border, 48px padding, upload icon in --primary, DM Sans text, file type tags). File selected: replace drop zone with filename chip. Loading: button "○ Scanning...", cycling text. Result: ResultCard + separate Port Scanner card below (IP input + "Scan Ports" ghost button + results table with risk badges per port). /upi idle: three input sections separated by "── or ──" dashed dividers — QR drop zone, screenshot drop zone, UPI ID text input + "Verify Payment" primary button. Loading: "○ Verifying...", cycling text. Result: ResultCard with UPI-specific target info. All ResultCards: 3px risk-colored left border, RISK BADGE, title, target in monospace muted, "WHAT WE FOUND" section with bullet flags, AI explanation block (--primary-dim background, --primary left border, italic DM Sans 15px), "WHAT TO DO NOW" section with → prefixed actions, "Scan Again" ghost button at bottom.
```

### 10 — Reports /reports and Profile /profile
```
Create /reports: standard layout. TopBar "Scan History". Filter row: type pills (All/Phishing/Files/UPI) + time pills (Today/Week/Month), "Export PDF" ghost button right. Results grouped by date — date label (DM Sans 11px uppercase muted) + horizontal rule, then rows: colored dot + monospace target + type + time + risk badge + › chevron. Clicking › expands inline to show full ResultCard + "Collapse ▴" link. Empty state: centered message + primary button → /phishing. Create /profile: standard layout. TopBar "Account Settings". Profile header card: 52×52 circle (--primary-dim bg, --primary border, Syne 700 initials in --primary), name (Syne 600 18px), email + type + member-since (DM Sans 13px muted). Personal details card: label-value rows + "Edit" ghost button top-right — clicking makes values editable inline, "Edit" becomes "Save Changes". Change password card: three password inputs + "Update Password" ghost button right. Scan summary card: inline stats + "View Full History →" link → /reports. Standalone destructive "Sign Out" button (32px top margin) → clear localStorage + /login.
```

### 11 — 404 page and light theme pass
```
Create a /404 page: no sidebar, wave at full power, centered content: "ERROR_404" in Syne 800 64px --primary with a CSS glitch animation (every 3 seconds: brief translateX(3px) + opacity flicker for 80ms), "Page not found." Syne 700 24px, one line of muted description, primary button "Return to Safety" → /dashboard if localStorage has a token, else /. Then do a complete light theme pass across every page. In light mode: --bg-root #FFFFFF, cards white with box-shadow 0 2px 12px rgba(0,0,0,0.06), sidebar #F0FAF0, --primary #16A34A, primary button text is white (not black), wave at 8% opacity, no glows, body text #0A0A0A. A theme toggle (moon/sun icon, 20px, --text-muted) in the top-right of every page's topbar switches themes and persists in localStorage.
```

### 12 — Wire all navigation and QA
```
Final wiring pass. Ensure every button routes correctly: Landing "Get Started" → /register, "Sign In" → /login. Login "Forgot password?" → /forgot-password, "Sign up →" → /register. Register "Sign in →" → /login. Forgot password "Back to sign in" → /login. Reset password "Back to sign in" → /login. Dashboard quick cards → /phishing, /ransomware, /upi. Dashboard "Run New Scan →" → /phishing. Dashboard activity rows → /reports. All sidebar nav items → their routes. All tool page "Scan Again" buttons reset to idle state (NO navigation). Reports rows expand inline (NO navigation). Profile "View Full History →" → /reports. Profile "Sign Out" → clear localStorage + /login. 404 "Return to Safety" → /dashboard or /. Theme toggle on every inner page persists in localStorage. Verify all 12 routes exist: / /login /register /forgot-password /reset-password /dashboard /phishing /ransomware /upi /reports /profile /404.
```
