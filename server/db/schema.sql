-- ════════════════════════════════════════════════════════════════════════════
--  OREN · Learn together. Grow together.
--  A skill-for-skill exchange: you teach what you know and learn what you want,
--  one hour for one hour. PostgreSQL 17.
--
--  Sections
--    1. Catalog       areas → fields → skills (50 fields, 282 skills)
--    2. Members       users, languages, education, skills they teach or want, availability
--    3. Connecting    swipes, matches (a view), messages
--    4. Swapping      swap sessions, what each person learned, endorsements, confidence
--    5. Skill tree    lessons (the "failure museum"), reviews
--    6. Sign-in       auth sessions
--    7. Views         member counts, member stats, the skill tree's growth
--    8. Functions     trade fit between two members, three-way swap loops
--    9. Triggers      checks and demo behaviour that lives in the database
--
--  Run through `npm run db:reset` in server/ (it runs this file, then seed.sql).
-- ════════════════════════════════════════════════════════════════════════════

-- ───────────────────────────── 1. Catalog ─────────────────────────────

CREATE TABLE areas (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z]+$'),
  name        text NOT NULL UNIQUE,
  short_name  text NOT NULL,
  hue         smallint NOT NULL CHECK (hue BETWEEN 0 AND 360),
  position    smallint NOT NULL UNIQUE
);

CREATE TABLE fields (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+$'),
  area_id     text NOT NULL REFERENCES areas(id) ON UPDATE CASCADE,
  name        text NOT NULL UNIQUE,
  short_name  text NOT NULL,
  blurb       text NOT NULL,
  hue         smallint NOT NULL CHECK (hue BETWEEN 0 AND 360),
  position    smallint NOT NULL
);
CREATE INDEX fields_area_idx ON fields(area_id);

CREATE TABLE skills (
  id          text PRIMARY KEY CHECK (id ~ '^[a-z0-9]+$'),
  field_id    text NOT NULL REFERENCES fields(id) ON UPDATE CASCADE,
  name        text NOT NULL UNIQUE,
  -- how the website draws its icon: a brand logo, a symbol, or its initials
  icon_kind   text NOT NULL CHECK (icon_kind IN ('brand', 'symbol', 'letters')),
  icon        text
);
CREATE INDEX skills_field_idx ON skills(field_id);

-- ───────────────────────────── 2. Members ─────────────────────────────

CREATE TABLE users (
  id               bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  handle           text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9._]{3,24}$'),
  email            text,
  password_hash    text,                        -- bcrypt; sample members have none and cannot sign in
  name             text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 60),
  headline         text CHECK (length(headline) <= 80),
  bio              text CHECK (length(bio) <= 600),
  teach_style      text CHECK (length(teach_style) <= 200),
  city             text,
  country          text,
  tz_offset        numeric(3, 1) NOT NULL DEFAULT 0 CHECK (tz_offset BETWEEN -12 AND 14),
  main_field       text REFERENCES fields(id),
  meets_online     boolean NOT NULL DEFAULT true,
  meets_in_person  boolean NOT NULL DEFAULT false,
  github           text,
  avatar_seed      text,                        -- the generated avatar; defaults to the handle
  member_no        text NOT NULL UNIQUE,
  joined_on        date NOT NULL DEFAULT current_date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- sample members fill the site for the demo; their history before joining OREN is kept as numbers
  is_sample        boolean NOT NULL DEFAULT false,
  likes_newcomers  boolean NOT NULL DEFAULT false,
  prior_taught     smallint NOT NULL DEFAULT 0,
  prior_learned    smallint NOT NULL DEFAULT 0,
  prior_rating     numeric(2, 1) CHECK (prior_rating BETWEEN 1 AND 5),
  reply_time       text,
  CHECK (meets_online OR meets_in_person),
  CHECK (is_sample OR (email IS NOT NULL AND password_hash IS NOT NULL))
);
CREATE UNIQUE INDEX users_email_key ON users (lower(email));

CREATE TABLE user_languages (
  user_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  language  text NOT NULL,
  PRIMARY KEY (user_id, language)
);

CREATE TABLE education (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       text NOT NULL CHECK (kind IN ('Degree', 'Diploma', 'Bootcamp', 'Certificate', 'Self-taught')),
  title      text NOT NULL CHECK (length(btrim(title)) > 0),
  place      text,
  from_year  smallint CHECK (from_year BETWEEN 1950 AND 2100),
  to_year    smallint CHECK (to_year BETWEEN 1950 AND 2100),
  ongoing    boolean NOT NULL DEFAULT false,
  position   smallint NOT NULL DEFAULT 0,
  CHECK (to_year IS NULL OR from_year IS NULL OR to_year >= from_year),
  CHECK (NOT (ongoing AND to_year IS NOT NULL))
);
CREATE INDEX education_user_idx ON education(user_id);

-- What a member can teach (with a level) or wants to learn (with a goal). A skill is one or the other.
CREATE TABLE user_skills (
  user_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id   text NOT NULL REFERENCES skills(id),
  role       text NOT NULL CHECK (role IN ('teach', 'learn')),
  level      smallint CHECK (level BETWEEN 1 AND 4),   -- Basics, Comfortable, Proficient, Expert
  years      smallint CHECK (years BETWEEN 0 AND 80),
  goal       text CHECK (length(goal) <= 120),
  added_on   date NOT NULL DEFAULT current_date,       -- when it appeared on the card (the skill tree grows from here)
  position   smallint NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, skill_id),
  CHECK ((role = 'teach' AND level IS NOT NULL AND goal IS NULL) OR (role = 'learn' AND level IS NULL AND years IS NULL))
);
CREATE INDEX user_skills_skill_idx ON user_skills(skill_id, role);

-- When a member can meet: day of the week (0 = Sunday) and part of the day.
CREATE TABLE availability (
  user_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day      smallint NOT NULL CHECK (day BETWEEN 0 AND 6),
  part     char(1) NOT NULL CHECK (part IN ('m', 'a', 'e')),   -- morning, afternoon, evening
  PRIMARY KEY (user_id, day, part)
);

-- ──────────────────────────── 3. Connecting ────────────────────────────

CREATE TABLE swipes (
  swiper_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  decision    text NOT NULL CHECK (decision IN ('like', 'pass', 'save')),
  decided_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (swiper_id, target_id),
  CHECK (swiper_id <> target_id)
);
CREATE INDEX swipes_target_idx ON swipes(target_id, decision);

CREATE TABLE messages (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sender_id    bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body         text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 2000),
  sent_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> receiver_id)
);
-- one conversation = one pair of members, whoever wrote first
CREATE INDEX messages_pair_idx ON messages (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), sent_at);

-- ───────────────────────────── 4. Swapping ─────────────────────────────

-- One hour for one hour: in every session each person teaches the other one skill.
CREATE TABLE swap_sessions (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proposer_id       bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id        bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposer_teaches  text NOT NULL REFERENCES skills(id),
  partner_teaches   text NOT NULL REFERENCES skills(id),
  starts_at         timestamptz NOT NULL,
  minutes           smallint NOT NULL DEFAULT 60 CHECK (minutes BETWEEN 30 AND 240),   -- both halves together
  format            text NOT NULL DEFAULT 'online' CHECK (format IN ('online', 'in-person')),
  meeting_link      text,
  place             text,
  invite_note       text CHECK (length(invite_note) <= 300),
  status            text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'confirmed', 'completed', 'cancelled')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (proposer_id <> partner_id),
  CHECK (proposer_teaches <> partner_teaches)
);
CREATE INDEX swap_sessions_proposer_idx ON swap_sessions(proposer_id);
CREATE INDEX swap_sessions_partner_idx ON swap_sessions(partner_id);

-- After a session each person writes down what they learned. This is what grows the skill tree.
CREATE TABLE learning_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id  bigint NOT NULL REFERENCES swap_sessions(id) ON DELETE CASCADE,
  learner_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    text NOT NULL REFERENCES skills(id),
  note        text NOT NULL CHECK (length(btrim(note)) BETWEEN 1 AND 1000),
  logged_on   date NOT NULL DEFAULT current_date,
  UNIQUE (session_id, learner_id)
);
CREATE INDEX learning_log_learner_idx ON learning_log(learner_id, skill_id);

-- A partner confirms that you really know a skill they taught you.
CREATE TABLE endorsements (
  endorser_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id      bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id     text NOT NULL REFERENCES skills(id),
  endorsed_on  date NOT NULL DEFAULT current_date,
  PRIMARY KEY (endorser_id, user_id, skill_id),
  CHECK (endorser_id <> user_id)
);

-- "I feel confident with this skill": the last step to mastering it.
CREATE TABLE skill_confidence (
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    text NOT NULL REFERENCES skills(id),
  confident   boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);

-- ──────────────────────────── 5. Skill tree ────────────────────────────

-- Lessons from things that went wrong. They become the roots of the skill tree.
CREATE TABLE lessons (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id     text NOT NULL REFERENCES skills(id),
  title        text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 48),
  tried        text CHECK (length(tried) <= 600),
  why_failed   text CHECK (length(why_failed) <= 600),
  learned      text NOT NULL CHECK (length(btrim(learned)) BETWEEN 1 AND 600),
  photo        text CHECK (photo IS NULL OR (photo LIKE 'data:image/%' AND length(photo) <= 1500000)),  -- aged in the browser
  visibility   text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  happened_on  date NOT NULL DEFAULT current_date,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_user_idx ON lessons(user_id);

CREATE TABLE reviews (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_id   bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id  bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_id    text NOT NULL REFERENCES skills(id),
  body        text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 600),
  stars       smallint CHECK (stars BETWEEN 1 AND 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (author_id, subject_id, skill_id),
  CHECK (author_id <> subject_id)
);
CREATE INDEX reviews_subject_idx ON reviews(subject_id);

-- ────────────────────────────── 6. Sign-in ──────────────────────────────

-- Only a hash of each sign-in token is stored, so a leaked table cannot be used to sign in.
CREATE TABLE auth_sessions (
  token_hash  text PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);

-- ─────────────────────────────── 7. Views ───────────────────────────────

-- Two members who liked each other. Each match appears once from each side.
CREATE VIEW matches AS
SELECT a.swiper_id AS user_id, a.target_id AS partner_id, GREATEST(a.decided_at, b.decided_at) AS matched_at
FROM swipes a
JOIN swipes b ON b.swiper_id = a.target_id AND b.target_id = a.swiper_id
WHERE a.decision = 'like' AND b.decision = 'like';

-- A member belongs to a field if it is their main field or they teach a skill in it.
CREATE VIEW field_members AS
SELECT u.id AS user_id, u.main_field AS field_id FROM users u WHERE u.main_field IS NOT NULL
UNION
SELECT us.user_id, s.field_id FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.role = 'teach';

CREATE VIEW field_counts AS
SELECT f.id AS field_id, f.area_id, count(fm.user_id) AS members
FROM fields f LEFT JOIN field_members fm ON fm.field_id = f.id
GROUP BY f.id, f.area_id;

CREATE VIEW area_counts AS
SELECT a.id AS area_id, count(DISTINCT fm.user_id) AS members
FROM areas a
LEFT JOIN fields f ON f.area_id = a.id
LEFT JOIN field_members fm ON fm.field_id = f.id
GROUP BY a.id;

-- Each completed session seen from one side: who taught what to whom, and when.
CREATE VIEW session_sides AS
SELECT s.id AS session_id, s.proposer_id AS teacher_id, s.partner_id AS student_id, s.proposer_teaches AS skill_id, s.starts_at, s.status
FROM swap_sessions s
UNION ALL
SELECT s.id, s.partner_id, s.proposer_id, s.partner_teaches, s.starts_at, s.status
FROM swap_sessions s;

-- The skill tree's cobalt lanterns: every skill a member logged learning in, with its stage.
--   Stage 1 Sprout · 2 Growing (3 sessions) · 3 Endorsed by a partner · 4 Mastered (endorsed, 5 sessions, confident)
CREATE VIEW skill_progress AS
WITH logged AS (
  SELECT l.learner_id AS user_id, l.skill_id,
         count(*) AS sessions,
         min(l.logged_on) AS since,
         array_agg(DISTINCT ss.teacher_id) AS teacher_ids
  FROM learning_log l
  JOIN session_sides ss ON ss.session_id = l.session_id AND ss.student_id = l.learner_id
  GROUP BY l.learner_id, l.skill_id
)
SELECT g.user_id, g.skill_id, g.sessions, g.since, g.teacher_ids,
       e.endorser_id AS endorsed_by, e.endorsed_on,
       COALESCE(c.confident, false) AS confident,
       CASE
         WHEN e.endorser_id IS NOT NULL AND g.sessions >= 5 AND COALESCE(c.confident, false) THEN 4
         WHEN e.endorser_id IS NOT NULL THEN 3
         WHEN g.sessions >= 3 THEN 2
         ELSE 1
       END AS stage
FROM logged g
LEFT JOIN LATERAL (
  SELECT en.endorser_id, en.endorsed_on FROM endorsements en
  WHERE en.user_id = g.user_id AND en.skill_id = g.skill_id
  ORDER BY en.endorsed_on LIMIT 1
) e ON true
LEFT JOIN skill_confidence c ON c.user_id = g.user_id AND c.skill_id = g.skill_id;

-- The skill tree's fruit: each person a member taught, per skill, from their first completed session.
CREATE VIEW taught_people AS
SELECT teacher_id AS user_id, skill_id, student_id, min(starts_at)::date AS first_on
FROM session_sides
WHERE status = 'completed'
GROUP BY teacher_id, skill_id, student_id;

-- Numbers on a member's card: sessions before OREN plus sessions on OREN, and their rating.
CREATE VIEW member_stats AS
SELECT u.id AS user_id,
       u.prior_taught + (SELECT count(*) FROM session_sides ss WHERE ss.teacher_id = u.id AND ss.status = 'completed') AS taught,
       u.prior_learned + (SELECT count(*) FROM learning_log l WHERE l.learner_id = u.id) AS learned,
       COALESCE((SELECT round(avg(r.stars), 1) FROM reviews r WHERE r.subject_id = u.id AND r.stars IS NOT NULL), u.prior_rating) AS rating,
       COALESCE(u.reply_time, 'New member') AS reply_time
FROM users u;

-- A member's whole card as JSON, in the shape the website draws it.
CREATE VIEW member_cards AS
SELECT u.id AS user_id, u.handle, u.is_sample,
  jsonb_build_object(
    'id', u.handle, 'handle', u.handle, 'name', u.name, 'field', u.main_field, 'headline', COALESCE(u.headline, ''),
    'city', COALESCE(u.city, ''), 'country', COALESCE(u.country, ''), 'tz', u.tz_offset, 'bio', COALESCE(u.bio, ''), 'style', COALESCE(u.teach_style, ''),
    'github', u.github, 'number', u.member_no, 'avatarSeed', COALESCE(u.avatar_seed, u.handle),
    'joined', to_char(u.joined_on, 'Mon YYYY'),
    'format', to_jsonb(array_remove(ARRAY[CASE WHEN u.meets_online THEN 'online' END, CASE WHEN u.meets_in_person THEN 'in-person' END], NULL)),
    'languages', COALESCE((SELECT jsonb_agg(l.language ORDER BY l.language) FROM user_languages l WHERE l.user_id = u.id), '[]'),
    'education', COALESCE((SELECT jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'place', COALESCE(e.place, ''),
                   'from', COALESCE(e.from_year::text, ''), 'to', CASE WHEN e.ongoing THEN 'now' ELSE COALESCE(e.to_year::text, '') END) ORDER BY e.position)
                 FROM education e WHERE e.user_id = u.id), '[]'),
    'teaches', COALESCE((SELECT jsonb_agg(jsonb_build_object('skill', s.skill_id, 'level', s.level, 'years', COALESCE(s.years, 0), 'added', s.added_on) ORDER BY s.position)
                 FROM user_skills s WHERE s.user_id = u.id AND s.role = 'teach'), '[]'),
    'wants', COALESCE((SELECT jsonb_agg(jsonb_build_object('skill', s.skill_id, 'goal', COALESCE(s.goal, ''), 'added', s.added_on) ORDER BY s.position)
                 FROM user_skills s WHERE s.user_id = u.id AND s.role = 'learn'), '[]'),
    'avail', COALESCE((SELECT jsonb_agg((ARRAY['sun','mon','tue','wed','thu','fri','sat'])[a.day + 1] || '-' || a.part ORDER BY a.day, a.part)
                 FROM availability a WHERE a.user_id = u.id), '[]'),
    'stats', (SELECT jsonb_build_object('taught', ms.taught, 'learned', ms.learned, 'rating', ms.rating, 'reply', ms.reply_time)
              FROM member_stats ms WHERE ms.user_id = u.id),
    'reviews', COALESCE((SELECT jsonb_agg(jsonb_build_object('by', a.handle, 'skill', r.skill_id, 'text', r.body) ORDER BY r.created_at)
                 FROM reviews r JOIN users a ON a.id = r.author_id WHERE r.subject_id = u.id), '[]'),
    'lessons', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', 'l' || l.id, 'title', l.title, 'skill', l.skill_id, 'tried', COALESCE(l.tried, ''),
                   'why', COALESCE(l.why_failed, ''), 'lesson', l.learned, 'at', l.happened_on, 'visibility', l.visibility, 'photo', l.photo) ORDER BY l.happened_on, l.id)
                 FROM lessons l WHERE l.user_id = u.id AND l.visibility = 'public'), '[]')
  ) AS card
FROM users u;


-- ───────────────────────────── 8. Functions ─────────────────────────────

-- How well a member (the viewer) can trade with everyone else. Mirrors the website's matching:
--   give: skills the viewer teaches that the other wants   get: skills the other teaches that the viewer wants
--   kind: perfect (both), get, give or none   score: 0–99
CREATE FUNCTION trade_fit(viewer bigint)
RETURNS TABLE (other_id bigint, give text[], get text[], kind text, score int, shared_slots int, shared_language boolean, tz_gap numeric)
LANGUAGE sql STABLE AS $$
  WITH me AS (SELECT id, tz_offset FROM users WHERE id = viewer),
  pairs AS (
    SELECT o.id AS other_id,
      ARRAY(SELECT w.skill_id FROM user_skills w JOIN user_skills t ON t.skill_id = w.skill_id AND t.user_id = viewer AND t.role = 'teach'
            WHERE w.user_id = o.id AND w.role = 'learn' ORDER BY w.position) AS give,
      ARRAY(SELECT t.skill_id FROM user_skills t JOIN user_skills w ON w.skill_id = t.skill_id AND w.user_id = viewer AND w.role = 'learn'
            WHERE t.user_id = o.id AND t.role = 'teach' ORDER BY t.position) AS get,
      (SELECT COALESCE(max(t.level), 0) FROM user_skills t JOIN user_skills w ON w.skill_id = t.skill_id AND w.user_id = viewer AND w.role = 'learn'
            WHERE t.user_id = o.id AND t.role = 'teach') AS best_level,
      (SELECT count(*) FROM availability a JOIN availability b ON b.day = a.day AND b.part = a.part AND b.user_id = o.id
            WHERE a.user_id = viewer)::int AS shared_slots,
      EXISTS (SELECT 1 FROM user_languages a JOIN user_languages b ON b.language = a.language AND b.user_id = o.id
            WHERE a.user_id = viewer) AS shared_language,
      abs(o.tz_offset - (SELECT tz_offset FROM me)) AS tz_gap
    FROM users o
    WHERE o.id <> viewer
  ),
  kinds AS (
    SELECT p.*, CASE
      WHEN cardinality(p.get) > 0 AND cardinality(p.give) > 0 THEN 'perfect'
      WHEN cardinality(p.get) > 0 THEN 'get'
      WHEN cardinality(p.give) > 0 THEN 'give'
      ELSE 'none' END AS kind
    FROM pairs p
  )
  SELECT k.other_id, k.give, k.get, k.kind,
    LEAST(99,
      CASE k.kind WHEN 'perfect' THEN 62 WHEN 'get' THEN 34 WHEN 'give' THEN 24 ELSE 4 END
      + LEAST(2, GREATEST(0, cardinality(k.get) + cardinality(k.give) - 1)) * 5
      + k.best_level * 3
      + LEAST(3, k.shared_slots) * 3
      + CASE WHEN k.shared_language THEN 4 ELSE 0 END
      + CASE WHEN k.tz_gap <= 2 THEN 5 WHEN k.tz_gap <= 5 THEN 2 ELSE 0 END
    )::int AS score,
    k.shared_slots, k.shared_language, k.tz_gap
  FROM kinds k
$$;

-- Swap loops: chains of members where each teaches the next something they want, and the last
-- teaches the viewer. A recursive query walks the "teaches something you want" graph up to
-- `max_people` members away and keeps the chains that close back at the viewer.
-- With max_people = 2 this finds the three-way swaps: you → A → B → you.
CREATE FUNCTION swap_loops(viewer bigint, max_people int DEFAULT 2)
RETURNS TABLE (people bigint[], skills text[], weight int)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE
  edge AS (   -- "from" can teach "to" a skill "to" wants
    SELECT t.user_id AS from_id, w.user_id AS to_id, t.skill_id, t.level
    FROM user_skills t
    JOIN user_skills w ON w.skill_id = t.skill_id AND w.role = 'learn' AND w.user_id <> t.user_id
    WHERE t.role = 'teach'
  ),
  walk AS (
    -- first step: the viewer teaches someone
    SELECT ARRAY[e.to_id] AS people, ARRAY[e.skill_id] AS skills, 0 AS weight
    FROM edge e WHERE e.from_id = viewer
    UNION ALL
    -- next steps: that person teaches someone new
    SELECT w.people || e.to_id, w.skills || e.skill_id, w.weight + e.level
    FROM walk w
    JOIN edge e ON e.from_id = w.people[cardinality(w.people)]
    WHERE cardinality(w.people) < max_people
      AND e.to_id <> viewer
      AND NOT e.to_id = ANY (w.people)
  )
  -- close the loop: the last person teaches the viewer
  SELECT DISTINCT ON (w.people) w.people, w.skills || e.skill_id, w.weight + e.level
  FROM walk w
  JOIN edge e ON e.from_id = w.people[cardinality(w.people)] AND e.to_id = viewer
  WHERE cardinality(w.people) = max_people
  ORDER BY w.people, w.weight + e.level DESC
$$;

-- A member's whole skill tree as JSON: what they learned (with stage, teachers and notes), who they taught,
-- what they wish to learn, and the lessons in its roots. The website draws the tree from exactly this.
CREATE FUNCTION skill_tree(member bigint)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'start', u.joined_on,
    'learned', COALESCE((
      SELECT jsonb_object_agg(p.skill_id, jsonb_build_object(
        'from', (SELECT jsonb_agg(t.handle ORDER BY t.handle) FROM users t WHERE t.id = ANY (p.teacher_ids)),
        'sessions', p.sessions,
        'since', p.since,
        'stage', p.stage,
        'endorsedBy', (SELECT e.handle FROM users e WHERE e.id = p.endorsed_by),
        'confident', p.confident,
        'notes', (SELECT jsonb_agg(jsonb_build_object('at', l.logged_on, 'with', t.handle, 'text', l.note) ORDER BY l.logged_on, l.id)
                  FROM learning_log l
                  JOIN session_sides ss ON ss.session_id = l.session_id AND ss.student_id = l.learner_id
                  JOIN users t ON t.id = ss.teacher_id
                  WHERE l.learner_id = member AND l.skill_id = p.skill_id)))
      FROM skill_progress p WHERE p.user_id = member), '{}'),
    'taught', COALESCE((
      SELECT jsonb_object_agg(x.skill_id, x.people) FROM (
        SELECT tp.skill_id, jsonb_agg(jsonb_build_object('who', s.handle, 'at', tp.first_on) ORDER BY tp.first_on) AS people
        FROM taught_people tp JOIN users s ON s.id = tp.student_id
        WHERE tp.user_id = member GROUP BY tp.skill_id) x), '{}'),
    'wished', COALESCE((SELECT jsonb_object_agg(us.skill_id, us.added_on) FROM user_skills us WHERE us.user_id = member AND us.role = 'learn'), '{}'),
    'lessons', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', 'l' || l.id, 'title', l.title, 'skill', l.skill_id, 'tried', COALESCE(l.tried, ''),
        'why', COALESCE(l.why_failed, ''), 'lesson', l.learned, 'at', l.happened_on, 'visibility', l.visibility, 'photo', l.photo) ORDER BY l.happened_on, l.id)
      FROM lessons l WHERE l.user_id = member), '[]')
  )
  FROM users u WHERE u.id = member
$$;


-- ───────────────────────────── 9. Triggers ─────────────────────────────

-- A learning note must belong to a real, uncancelled session the learner took part in,
-- and be about the skill their partner taught them. Logging also marks the session completed.
CREATE FUNCTION check_learning_log() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE s swap_sessions;
BEGIN
  SELECT * INTO s FROM swap_sessions WHERE id = NEW.session_id;
  IF s.status = 'cancelled' THEN
    RAISE EXCEPTION 'Session % was cancelled', NEW.session_id;
  END IF;
  IF NEW.learner_id = s.proposer_id THEN
    NEW.skill_id := s.partner_teaches;
  ELSIF NEW.learner_id = s.partner_id THEN
    NEW.skill_id := s.proposer_teaches;
  ELSE
    RAISE EXCEPTION 'Member % did not take part in session %', NEW.learner_id, NEW.session_id;
  END IF;
  UPDATE swap_sessions SET status = 'completed' WHERE id = NEW.session_id AND status <> 'completed';
  RETURN NEW;
END $$;
CREATE TRIGGER learning_log_check BEFORE INSERT ON learning_log
FOR EACH ROW EXECUTE FUNCTION check_learning_log();

-- Demo behaviour: sample members endorse a learner after the third logged session with them.
-- (Real members endorse each other themselves.)
CREATE FUNCTION sample_partner_endorses() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE teacher bigint;
BEGIN
  SELECT CASE WHEN s.proposer_id = NEW.learner_id THEN s.partner_id ELSE s.proposer_id END
    INTO teacher FROM swap_sessions s WHERE s.id = NEW.session_id;
  IF (SELECT is_sample FROM users WHERE id = teacher)
     AND (SELECT count(*) FROM learning_log l JOIN swap_sessions s ON s.id = l.session_id
          WHERE l.learner_id = NEW.learner_id AND l.skill_id = NEW.skill_id
            AND (s.proposer_id = teacher OR s.partner_id = teacher)) >= 3 THEN
    INSERT INTO endorsements (endorser_id, user_id, skill_id, endorsed_on)
    VALUES (teacher, NEW.learner_id, NEW.skill_id, NEW.logged_on)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER learning_log_endorse AFTER INSERT ON learning_log
FOR EACH ROW EXECUTE FUNCTION sample_partner_endorses();

-- Demo behaviour: a few friendly sample members like every newcomer, so new members get matches.
CREATE FUNCTION welcome_newcomer() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW.is_sample THEN
    INSERT INTO swipes (swiper_id, target_id, decision)
    SELECT u.id, NEW.id, 'like' FROM users u WHERE u.is_sample AND u.likes_newcomers;
  END IF;
  RETURN NULL;
END $$;
CREATE TRIGGER users_welcome AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION welcome_newcomer();

-- Only members who matched can book a session together.
CREATE FUNCTION check_session_match() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM matches WHERE user_id = NEW.proposer_id AND partner_id = NEW.partner_id) THEN
    RAISE EXCEPTION 'Members % and % have not matched', NEW.proposer_id, NEW.partner_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER swap_sessions_match BEFORE INSERT ON swap_sessions
FOR EACH ROW EXECUTE FUNCTION check_session_match();

-- Demo behaviour: sample members accept a session invite straight away.
CREATE FUNCTION sample_partner_confirms() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'proposed' AND (SELECT is_sample FROM users WHERE id = NEW.partner_id) THEN
    NEW.status := 'confirmed';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER swap_sessions_sample_confirms BEFORE INSERT ON swap_sessions
FOR EACH ROW EXECUTE FUNCTION sample_partner_confirms();
