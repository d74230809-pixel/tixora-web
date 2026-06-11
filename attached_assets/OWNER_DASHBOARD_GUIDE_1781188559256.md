# 👑 Tixora Owner Dashboard — Full Build Guide
### (For AI with direct file access — read everything before touching a single file)

---

## WHO YOU ARE BUILDING FOR

The owner's Discord ID is `1416209242838401064`. This is the one and only person who gets this treatment. Every other user sees the normal dashboard. When this specific Discord ID logs in, the entire experience transforms — different colors, different layout feel, exclusive tabs, exclusive powers. When he's live streaming on Discord and opens the site, his chat should go absolutely insane reacting to what they see on screen.

---

## STEP 0 — READ THE CODEBASE FIRST

Before writing a single line, do this:

1. Read `package.json` — find out if this is Next.js, React (CRA/Vite), plain HTML, etc.
2. Find the dashboard file — search for `dashboard` in `/src`, `/pages`, `/app`, `/components`
3. Find where auth/user session is stored — look for Discord OAuth, `useUser`, `session`, `getServerSideProps`, JWT decode, or similar
4. Find where user roles or IDs are checked — search for any existing `isOwner`, `isAdmin`, `role`, or Discord ID comparisons
5. Read any existing CSS/Tailwind config — note the current color palette so you can make the owner palette completely different
6. Check if there's a Discord bot integration — look for `discord.js`, bot commands, guild/member fetching
7. Check the existing nav/sidebar for what tabs already exist

Do NOT guess the stack. Read it.

---

## STEP 1 — OWNER DETECTION

Create a utility that identifies the owner. This should be the single source of truth used everywhere.

```js
// utils/isOwner.js (or .ts)
export const OWNER_DISCORD_ID = "1416209242838401064";

export function isOwner(userId) {
  return userId === OWNER_DISCORD_ID;
}
```

If the app uses sessions (NextAuth, express-session, etc.), make sure the Discord user ID is available on the session object. If it's not, find where the Discord OAuth callback is and add `discord_id` to the session.

If the app is purely frontend with no backend, check where the Discord user object is stored (localStorage, context, Zustand, Redux, etc.) and pull the `id` field from it.

---

## STEP 2 — OWNER THEME / COLOR SYSTEM

The owner gets a completely different visual identity. Not just a badge — the entire dashboard transforms.

### Color Palette (owner only)

Do NOT use the site's normal colors for the owner theme. Use this palette:

```css
:root[data-owner="true"], .owner-theme {
  /* Background layers */
  --bg-primary: #0a0a0f;
  --bg-secondary: #0f0f1a;
  --bg-card: #13131f;
  --bg-card-hover: #1a1a2e;

  /* Signature accent — deep electric violet to gold gradient */
  --accent-primary: #7c3aed;      /* violet */
  --accent-secondary: #f59e0b;    /* gold */
  --accent-glow: rgba(124, 58, 237, 0.4);
  --accent-gold-glow: rgba(245, 158, 11, 0.3);

  /* Gradient — the main signature */
  --owner-gradient: linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #f59e0b 100%);
  --owner-gradient-subtle: linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(245,158,11,0.08) 100%);

  /* Text */
  --text-primary: #f5f3ff;
  --text-secondary: #a78bfa;
  --text-muted: #6b7280;

  /* Borders */
  --border: rgba(124, 58, 237, 0.25);
  --border-glow: rgba(124, 58, 237, 0.6);

  /* Crown gold */
  --crown: #f59e0b;
  --crown-glow: 0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2);
}
```

Normal users should NEVER see these CSS variables activated. Gate them strictly behind the owner check.

### Applying the theme

Wrap the dashboard in a component that conditionally applies the class:

```jsx
<div className={isOwner(user.id) ? "owner-theme" : ""}>
  {/* dashboard content */}
</div>
```

Or set a `data-owner` attribute on `<html>` or `<body>` when the owner logs in.

---

## STEP 3 — OWNER DASHBOARD LAYOUT

Replace the owner's normal dashboard layout with this structure. Keep the normal dashboard untouched for other users.

### Header / Hero Banner

The owner's dashboard should open with a banner that makes it unmistakably clear this is the god-tier view:

- Full-width banner with the `--owner-gradient` as background
- Animated particle effect or subtle floating orbs in the background (CSS only is fine, no heavy libraries)
- Large crown emoji or SVG crown icon with `--crown-glow` drop shadow
- Text: **"TIXORA CONTROL CENTER"** in large bold display font
- Subtext: **"Owner Access — Full System Control"**
- A live pulsing green dot with text: **"System Online"**
- Owner's Discord avatar pulled from the session, displayed with a glowing violet ring border
- If the owner is currently streaming on Discord (if bot can detect this), show a red **"🔴 LIVE"** badge that pulses

Make this banner feel like the intro screen of a game — something that would make a stream audience react.

### Navigation Tabs

The owner sees these tabs that NO other user has:

1. **Overview** — system stats at a glance (see below)
2. **Bot Control** — manage the Discord bot live
3. **User Manager** — view/manage all users
4. **Analytics** — charts, graphs, traffic
5. **Broadcast** — send announcements
6. **System** — server health, logs, config
7. **Stream Mode** — special layout for when streaming

Each tab should have an icon (use lucide-react or heroicons, whichever the project already uses). Active tab should glow with `--accent-primary`.

---

## STEP 4 — TAB CONTENTS

### Tab 1: Overview

Stats grid showing:
- Total users registered
- Active users today
- Bot status (online/offline) with colored dot
- Total Discord servers the bot is in
- Commands run today
- Website uptime
- Latest 5 signups (user avatar, name, time)

Each stat in its own card with the `--bg-card` background, `--border` border, and a colored icon. Numbers should count up with a simple animation when the tab loads (CSS counter animation or a short JS interval).

### Tab 2: Bot Control

This is the crown jewel tab. Give the owner live control of the bot:

- **Bot Status toggle** — big switch, Online / Maintenance / Offline with color states (green/yellow/red)
- **Restart Bot button** — with a confirmation modal before firing (call your existing bot restart endpoint or websocket event)
- **Current bot activity** — editable field to change what the bot is "playing" / status message, with a Save button
- **Command list** — table showing every registered command, with enable/disable toggles per command
- **Guild list** — list of all servers the bot is in: server icon, name, member count, joined date
- **Recent bot logs** — scrollable log feed, auto-refreshing every 5 seconds, color coded (INFO=blue, WARN=yellow, ERROR=red)

If there's no existing API for these, create placeholder UI that shows the structure and add `// TODO: wire to /api/bot/...` comments so the owner knows where to connect it.

### Tab 3: User Manager

Table of all registered users:
- Columns: Avatar, Username, Discord ID, Role, Joined Date, Last Seen, Actions
- Search bar to filter by name or ID
- Role badge (color coded: owner=violet+gold, admin=red, mod=orange, user=gray)
- Actions: View Profile, Promote/Demote, Ban, Reset
- Clicking a user opens a side panel (slide in from right) with their full profile
- Owner's own row should be visually distinct — golden background, crown icon, "YOU" badge

### Tab 4: Analytics

Charts showing:
- Daily active users (line chart, last 30 days)
- New signups per day (bar chart, last 14 days)
- Bot commands used per day (line chart)
- Top 10 most used commands (horizontal bar chart)
- Traffic by hour of day (shows when the site is busiest)

Use whatever chart library is already in the project. If none, use recharts (it's lightweight and React-friendly). Pull data from your existing API or use realistic placeholder data with a clear `// TODO: replace with real API call` comment.

### Tab 5: Broadcast

Let the owner send messages/announcements:

- **Discord Announcement** — text area + channel selector dropdown (populated from bot's guild channels) + Send button — fires a message to the selected channel via bot
- **Site Banner** — toggle a site-wide banner on/off for all users. Text input for the message, color picker for severity (info=blue, warning=yellow, critical=red). When active, every user sees the banner at the top of the site.
- **DM Blast** — input a Discord User ID + message, send a DM via bot
- **Maintenance Mode** — big red toggle. When ON, redirects all non-owner users to a maintenance page

### Tab 6: System

- Server CPU and memory usage (if available from API, else placeholder with `// TODO`)
- Environment badge: PRODUCTION / DEVELOPMENT / STAGING
- Node.js version, framework version
- Connected services status: Database (green/red dot), Discord API (green/red dot), Bot (green/red dot)
- Recent error logs (last 10, red highlighted)
- Environment variables list (keys only, values masked as `••••••`) — just informational
- **Danger Zone** section at the bottom (red border card):
  - Clear site cache button
  - Rebuild/redeploy button (if CI/CD webhook exists)
  - Wipe test data button
  All with confirmation modals.

### Tab 7: Stream Mode

This tab exists purely for when he's live streaming and wants to show off. When activated:

- Hides all sensitive data (IDs, tokens, real user info replaced with fake display names)
- Enlarges the most visually impressive stats
- Activates an extra layer of CSS animations — floating particles, glowing borders, pulsing elements
- Shows a big "STREAM MODE ACTIVE" banner in the corner
- Puts a "TIXORA" watermark subtly in the corner
- Makes the color scheme even more dramatic — deeper blacks, more vibrant glows
- Adds a ticker at the bottom showing fake-but-realistic-looking live events: "User joined", "Command executed", "New server added" — cycling every few seconds to make the dashboard look alive on stream

Toggle button: **"🎥 Go Live"** / **"Exit Stream Mode"**

---

## STEP 5 — VISUAL EFFECTS (make chat go nuts)

These effects apply to the owner dashboard always, not just stream mode:

### Animated gradient border on cards
```css
.owner-theme .card {
  position: relative;
  border: 1px solid transparent;
  background-clip: padding-box;
}
.owner-theme .card::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  background: var(--owner-gradient);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;
}
.owner-theme .card:hover::before {
  opacity: 1;
}
```

### Crown header glow pulse
```css
@keyframes crownPulse {
  0%, 100% { filter: drop-shadow(0 0 8px rgba(245,158,11,0.8)); }
  50% { filter: drop-shadow(0 0 24px rgba(245,158,11,1)) drop-shadow(0 0 48px rgba(124,58,237,0.6)); }
}
.owner-crown {
  animation: crownPulse 2s ease-in-out infinite;
}
```

### Floating orbs background (CSS only)
```css
.owner-theme .dashboard-bg {
  position: relative;
  overflow: hidden;
}
.owner-theme .dashboard-bg::before,
.owner-theme .dashboard-bg::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
}
.owner-theme .dashboard-bg::before {
  width: 600px; height: 600px;
  background: #7c3aed;
  top: -200px; left: -200px;
  animation: orb1 20s ease-in-out infinite alternate;
}
.owner-theme .dashboard-bg::after {
  width: 400px; height: 400px;
  background: #f59e0b;
  bottom: -100px; right: -100px;
  animation: orb2 15s ease-in-out infinite alternate;
}
@keyframes orb1 { to { transform: translate(100px, 100px); } }
@keyframes orb2 { to { transform: translate(-80px, -80px); } }
```

### Tab active state
```css
.owner-theme .tab-active {
  background: var(--owner-gradient-subtle);
  border-bottom: 2px solid var(--accent-primary);
  box-shadow: 0 0 12px var(--accent-glow);
  color: var(--text-secondary);
}
```

---

## STEP 6 — OWNER PROFILE BADGE (visible site-wide)

Wherever the owner's name/avatar appears on the site (nav, comments, leaderboards, etc.), add:

- A gradient crown badge before their name: `👑`
- Username in gradient text using `background: var(--owner-gradient); -webkit-background-clip: text; color: transparent`
- A small glowing border on their avatar
- A tooltip on hover that says "Site Owner"

This makes him immediately recognizable to anyone browsing the site.

---

## STEP 7 — BUGS TO FIX WHILE YOU'RE IN THERE

While reading through the codebase, fix any of these common issues if you find them:

- Unhandled promise rejections in API calls (missing `.catch()` or `try/catch`)
- Missing loading states — any fetch call that renders data without a loading spinner
- Missing error states — any fetch call with no error handling shown to the user
- Hardcoded localhost URLs — replace with env variables (`process.env.NEXT_PUBLIC_API_URL` etc.)
- Console.log statements left in production code — remove them
- Any `key` prop warnings in React lists — add proper unique keys
- Any `useEffect` with missing dependency arrays
- Images without `alt` attributes
- Buttons without `type` attributes inside forms (should be `type="button"` or `type="submit"` explicitly)
- Any `href="#"` links that should be real routes
- Overly broad `catch` blocks that swallow errors silently

Document every bug you fix with a comment: `// FIXED: [description]`

---

## STEP 8 — FILE STRUCTURE TO CREATE

Create these new files (paths may vary based on your framework):

```
src/
  utils/
    isOwner.js              ← owner detection utility
  components/
    owner/
      OwnerDashboard.jsx    ← main wrapper, tab router
      OwnerHeader.jsx       ← crown banner hero section
      OwnerNav.jsx          ← tab navigation
      tabs/
        Overview.jsx
        BotControl.jsx
        UserManager.jsx
        Analytics.jsx
        Broadcast.jsx
        SystemTab.jsx
        StreamMode.jsx
  styles/
    owner-theme.css         ← all owner CSS variables and effects
```

Import `owner-theme.css` at the top of `OwnerDashboard.jsx` only — don't pollute the global stylesheet.

---

## STEP 9 — ROUTING

If the project uses file-based routing (Next.js pages/ or app/):
- The existing `/dashboard` route should check `isOwner(user.id)` and render `<OwnerDashboard />` instead of the normal dashboard
- Do NOT create a separate `/owner` route — the owner logs in normally and is automatically elevated

If client-side routing (React Router):
```jsx
// In your dashboard route component:
import { isOwner } from '../utils/isOwner';
import OwnerDashboard from '../components/owner/OwnerDashboard';
import NormalDashboard from '../components/NormalDashboard';

export default function Dashboard() {
  const { user } = useAuth(); // or however you get the current user
  if (isOwner(user?.id)) return <OwnerDashboard user={user} />;
  return <NormalDashboard user={user} />;
}
```

---

## STEP 10 — FINAL CHECKLIST BEFORE PUSHING

- [ ] Normal users see ZERO owner UI — test this by logging in as a non-owner account
- [ ] Owner detection uses the exact string `"1416209242838401064"` — no type coercion issues
- [ ] No owner CSS bleeds into global styles
- [ ] All new components have loading and error states
- [ ] Stream Mode hides all real sensitive data
- [ ] No hardcoded secrets or API keys committed
- [ ] All existing tests still pass (run `npm test` if tests exist)
- [ ] Run `npm run build` — zero build errors before pushing
- [ ] Push to main branch (or whatever branch deploys automatically)

---

## TONE / VIBE REMINDER

This dashboard needs to make a Twitch/Discord stream audience actually react out loud. Think: the moment he switches to this tab on stream, people in chat should be typing "W", "INSANE", "BRO WHAT". The design should feel like the backend of a billion-dollar SaaS, not a hobby project. Dark, glowing, premium, powerful. Every element should feel intentional. The owner isn't just a user with extra buttons — he's in a completely different universe from everyone else on the site.

Build it like that.
