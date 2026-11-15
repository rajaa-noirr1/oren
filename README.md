# OREN

**Learn together. Grow together.** A skill-for-skill exchange website: you know Python, Dana knows public speaking, so you teach each other. No money, one hour for one hour, across 50 fields.

Database course project, Fall 2026. A React website (`client/`) on an Express API (`server/`) that keeps everything in PostgreSQL 17, written in plain SQL (no ORM).

## Run it

You need Node 20 or newer and PostgreSQL 17 (with pgAdmin, from the official installer).

1. Put the database passwords in `server/.env` (see `server/.env` on the demo laptop: `POSTGRES_PASSWORD` is the superuser's, `PGPASSWORD` the website's own database user).
2. Install and build the database once:

   ```bash
   npm --prefix client install
   npm --prefix server install
   npm run db:reset
   ```

3. Start the API and the website together, then open http://localhost:5173:

   ```bash
   npm run dev
   ```

The API listens on port 4000 (`API_PORT` in `server/.env`); the website on 5173 forwards `/api` to it. `npm run db:reset` rebuilds the `oren` database from `server/db/schema.sql` and `server/db/seed.sql` at any time. `npm test` (with `npm run dev` running) checks the API against the database.

For presentations, "Try the demo member" on the sign-in page (or "Use the demo member" when building a card) signs in as Ari Navarro, whose history is already in the database.

## Online version (GitHub Pages)

https://rajaa-noirr1.github.io/oren/

GitHub Pages can only serve files, so the online version runs the database inside the visitor's browser: [PGlite](https://pglite.dev) is PostgreSQL compiled to WebAssembly. It loads the same `server/db/schema.sql` and `seed.sql` and answers through the same API code (`shared/api.js`) as the laptop, so every query, view, function and trigger is identical.

- Each visitor gets a private copy, saved in their browser. Nobody sees anyone else's changes.
- Add `?reset-demo` to the address to start the demo over.
- The first visit downloads the database engine (about 6 MB compressed) and takes a few seconds.
- To publish changes: `npm run deploy:pages` (builds `client/` in `pages` mode and pushes it to the `gh-pages` branch).

For the presentation, use the laptop version (real PostgreSQL server, pgAdmin).

## What is in the site

| Page | Route | What it does |
|---|---|---|
| Home | `/` | Live trade network in the hero, trade board, how a swap works, the 50-field directory, sample cards, skill tree preview, swap loops, FAQ |
| Explore: swipe | `/explore` | Tinder-style deck of trading cards. Drag or use ← → ↑ and Z. Pick an area, then a field |
| Explore: browse | `/explore?mode=browse` | Search with skill suggestions, filters and sorting, by area or field |
| Profile | `/u/:handle` | Skills with icons and levels, wants with goals, education, availability, reviews, shared lessons, trade panel |
| Build your card | `/join` | Six-step sign-up with a live card preview. Creates a real account (email and password) |
| Sign in | `/signin` | Email and password, or the demo member |
| Skill tree | `/tree` | Private to the owner. See below |
| Swaps | `/swaps` | Matches with chat, requests, session invites, logging what you learned, and three-way swap loops |

## Fields

10 areas × 5 fields = 50 fields (`client/src/data/fields.js`), from frontend development and cybersecurity to public speaking, video editing, languages, finance, physics, music and cooking. 282 skills (`skills.js`) each belong to one field. A person appears in a field if it is their main field or they teach a skill in it.

## The skill tree

One connected tree at dusk, drawn in SVG. Every skill is a strand that starts at a root tip, runs up through the trunk (the trunk is the bundle of all your strands, which is what draws its wood grain), follows a bough, a branch and a twig, and ends in a hanging lantern. Each area of life grows on a bough of its own. The scene is seeded from your username, so your tree looks the same every visit.

- **Files:** `client/src/lib/grove.js` grows the tree (crown layout, branches, strands, roots, lesson cards), `geo.js` holds the curve and ribbon helpers, `scenery.js` the sky, hills and soil, `useCamera.js` the zoom and drag. `components/SkillTree.jsx` draws it with the pieces in `components/grove/`.
- **Growing by itself:** the tree is never stored as a picture. It is regrown from your data (skills, sessions, wishes, lessons) every time, so a new skill grows a new branch automatically. Growth is stable:
  - Areas keep the order you first grew them in, with new ones added on the outside.
  - Each skill keeps its place from the day it first appeared, so a wish lights up where its bud already hangs.
  - A skill you add to your card later is dated.
  - Every part of the tree has its own fixed randomness, so the sky, roots and untouched branches never change.

  A simulated year (60 events, up to 31 skills) checks after every event that each branch grows from its parent, each lantern hangs from its twig, and nothing overlaps. `docs/tree-growth.png` shows six moments of that year in the real app.
- **Speed:** the drawing is two stacked SVG layers. The still scene (sky, tree, roots) is at the bottom, and a small live layer on top holds everything that moves or can be clicked, so animations never repaint the big scene. While you drag or zoom, both layers (drawn with a margin around the view) just slide and scale, and they are redrawn sharp when you stop. Animations pause while the tree is scrolled out of sight. Keep anything that animates in the live layer.
- **Moving around:** hold and drag to move, Ctrl + scroll (or pinch) to zoom toward the pointer, double-click to zoom in, and the Whole tree / Crown / Roots buttons to jump. Full screen fills the display; there, plain scrolling zooms. Zooming in reveals extra lines: sessions and teacher under a lantern, what a lesson taught under its photo.
- **The route:** pick a lantern and light travels from its root tip, through the trunk and every fork, to the lantern. The branches on the way catch the light and the rest of the tree dims. Pick a lesson and the light runs from its photo to the skill it fed.
- **Lanterns:** orange = skills you already knew, cobalt = skills other people taught you, dashed = wishes.
- **Growth:** a learned skill grows Sprout → Growing → Endorsed → Mastered as you log sessions. Your partner endorses you, and mastery also needs your own confidence.
- **Fruit:** the badge on a lantern counts the people you taught that skill.
- **Roots:** lessons from things that went wrong (the failure museum). Each lesson is an old photograph held by a rootlet of the root that feeds its skill, with its date, a lock or eye badge for who can see it, and the skill it fed. Plant one from the empty frame in the roots, then edit, share or delete it from its details. Photos are turned into old photographs in the browser.
- **Growth rings:** achievements, such as First swap, Teacher and Polyglot.
- **Inner self:** placeholder for the AI companion (spring semester). It shows "In progress" only.
- **Time slider:** replays how the tree grew month by month. Branches that did not exist yet are not drawn.
- **Feeding it:** log a session in Swaps ("Session done · log what you learned") and the tree grows.

## The database

`server/db/schema.sql` is the whole design, in nine sections. Highlights for the course:

| Kind | Name | What it does |
|---|---|---|
| Tables | `areas` → `fields` → `skills` | The catalog: 10 areas, 50 fields, 282 skills |
| Tables | `users`, `user_languages`, `education`, `user_skills`, `availability` | Members and their cards. A skill is either taught (with a level) or wanted (with a goal), enforced by a CHECK |
| Tables | `swipes`, `messages` | Swap, pass or save; conversations between two members |
| Tables | `swap_sessions`, `learning_log`, `endorsements`, `skill_confidence` | One hour for one hour, what each person learned, partners vouching for each other |
| Tables | `lessons`, `reviews`, `auth_sessions` | The failure museum (tree roots), reviews, sign-in tokens (stored only as SHA-256 hashes) |
| Views | `matches` | Two members who liked each other (a self-join on `swipes`) |
| Views | `field_members`, `field_counts`, `area_counts` | The "17 people" counts on the home page (UNION, GROUP BY) |
| Views | `session_sides`, `skill_progress`, `taught_people`, `member_stats` | Each session from both sides; every skill's stage on the tree (Sprout → Mastered) with a CASE |
| Views | `member_cards` | A whole member card as JSON (jsonb_build_object, jsonb_agg), exactly what the website draws |
| Functions | `skill_tree(member)` | A member's whole skill tree as JSON |
| Functions | `trade_fit(viewer)` | The match score between the viewer and every member (perfect swap, can teach you, …) |
| Functions | `swap_loops(viewer, max_people)` | A recursive query that finds chains like you → A → B → you |
| Triggers | `learning_log_check` | A note must belong to a real session you took part in; it fills in the skill and completes the session |
| Triggers | `swap_sessions_match` | Only members who matched can book a session |
| Triggers | `learning_log_endorse`, `swap_sessions_sample_confirms`, `users_welcome` | Demo behaviour: sample members endorse after the third session, confirm invites and like newcomers |

To open the database in pgAdmin 4 (installed with PostgreSQL): register a server at host `localhost`, port 5432, user `postgres`, with the `POSTGRES_PASSWORD` from `server/.env`, then open the `oren` database. Try these during a presentation:

```sql
SELECT * FROM skill_progress WHERE user_id = (SELECT id FROM users WHERE handle = 'arinavarro');
SELECT u.handle, f.kind, f.score FROM trade_fit((SELECT id FROM users WHERE handle = 'arinavarro')) f JOIN users u ON u.id = f.other_id ORDER BY f.score DESC LIMIT 10;
SELECT * FROM swap_loops((SELECT id FROM users WHERE handle = 'arinavarro'));
SELECT jsonb_pretty(skill_tree((SELECT id FROM users WHERE handle = 'arinavarro')));
```

`server/db/seed.sql` is generated from the website's data files by `npm --prefix server run db:seed:build`: the catalog, 54 sample members and the demo member's history (20 sessions, 15 learning notes, 3 lessons). Endorsements are not inserted; the triggers create them as the notes go in.

### The API

`server/src/index.js`, Express with plain parameterised SQL (`pg`). Passwords are hashed with bcrypt; the browser keeps an HttpOnly sign-in cookie.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/state` | Everything for the first screen: you, your tree, members, counts, swipes, sessions, messages |
| POST | `/api/auth/register`, `/login`, `/demo`, `/logout` | Accounts |
| PUT | `/api/me` | Save your card (one transaction) |
| PUT / DELETE | `/api/decisions/:handle` | Swap, pass or save; undo |
| POST | `/api/messages/:handle` | Send a message |
| POST / DELETE | `/api/sessions`, `/api/sessions/:id` | Invite to a session; cancel |
| POST | `/api/sessions/:id/log` | Write what you learned (grows the tree) |
| PUT | `/api/confidence/:skill` | "I feel confident" |
| POST / PATCH / DELETE | `/api/lessons` | Lessons in the roots |
| GET | `/api/fit`, `/api/loops` | The database's matching and swap loops |

## What is still simulated

- Sample members are not real people: they reply once in chat, confirm invites straight away and endorse you after the third session (database triggers do this).
- Sign-in is email and password only; Google sign-in is planned for spring.

## Project structure

```
package.json           npm run dev starts both parts (scripts/dev.mjs); npm run deploy:pages publishes the online version
shared/api.js          the API: every route and its SQL, used by the server and by the online version
server/
  db/schema.sql        tables, views, functions and triggers
  db/seed.sql          generated by scripts/build-seed.mjs
  scripts/             build-seed.mjs, db-reset.mjs
  src/                 index.js (routes), state.js (reading and saving), auth.js, db.js
  test/api.test.js     end-to-end tests against the database
client/
  public/icons/        119 brand icons (Devicon), copied by scripts/copy-icons.mjs
  src/data/            fields (50), skills (282), icon map, and the sample members the seed is built from
  src/lib/             API client (browser-api.js runs the database in the browser for GitHub Pages), app state, matching, skill tree logic and geometry, camera, photo ageing
  src/components/      trading card, swipe deck, browse view, pickers, skill tree (and grove/), hero network…
  src/pages/           Home, Explore, Profile, Join, Tree, Swaps, SignIn, NotFound
  src/styles/          design tokens (light and dark), page styles, refresh.css (backgrounds and buttons)
```

## Credits

Brand icons: [Devicon](https://devicon.dev) (MIT). Symbols: [Lucide](https://lucide.dev) (ISC). Fonts: Unbounded, Instrument Sans, JetBrains Mono (SIL Open Font License), bundled through Fontsource.
