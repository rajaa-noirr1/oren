import {
  Code2, ShieldCheck, BrainCircuit, PenTool, Clapperboard, Users, Briefcase, Languages, GraduationCap, Sprout,
  PanelsTopLeft, Server, Layers, Smartphone, Gamepad2, Cloud, Network, Cpu, Bug, Sparkles, Brain, ChartColumn, Database,
  Sheet, Palette, Box, Brush, DraftingCompass, Film, Video, Camera, Shapes, AudioLines, Mic, Flag, MessagesSquare, Handshake,
  HandHeart, Megaphone, Hash, Rocket, SquareKanban, Wallet, PenLine, Library, ArrowLeftRight, Feather, Sigma, Atom,
  FlaskConical, Timer, ClipboardCheck, Guitar, MicVocal, Dumbbell, ChefHat, Flower2,
} from 'lucide-react'
import { SKILL } from './skills'

// 10 areas × 5 fields. Field hues are variations of their area's hue, so related fields share a colour family.
export const AREAS = [
  { id: 'software', name: 'Software development', short: 'Software', h: 226, Icon: Code2 },
  { id: 'systems', name: 'Systems & security', short: 'Systems', h: 194, Icon: ShieldCheck },
  { id: 'data', name: 'Data & AI', short: 'Data & AI', h: 264, Icon: BrainCircuit },
  { id: 'design', name: 'Design', short: 'Design', h: 316, Icon: PenTool },
  { id: 'media', name: 'Video, photo & audio', short: 'Media', h: 350, Icon: Clapperboard },
  { id: 'people', name: 'Communication & leadership', short: 'People skills', h: 30, Icon: Users },
  { id: 'business', name: 'Business & marketing', short: 'Business', h: 50, Icon: Briefcase },
  { id: 'words', name: 'Writing & languages', short: 'Words', h: 146, Icon: Languages },
  { id: 'study', name: 'Science & study', short: 'Study', h: 174, Icon: GraduationCap },
  { id: 'life', name: 'Arts & lifestyle', short: 'Lifestyle', h: 96, Icon: Sprout },
]

const F = (id, name, short, Icon, blurb, skills) => ({ id, name, short, Icon, blurb, skills })

const BY_AREA = {
  software: [
    F('frontend', 'Frontend development', 'Frontend', PanelsTopLeft, 'Interfaces people touch: layout, state and speed.', ['react', 'javascript', 'css', 'nextjs']),
    F('backend', 'Backend development', 'Backend', Server, 'APIs, data models and servers that stay up.', ['python', 'java', 'nodejs', 'go']),
    F('fullstack', 'Full-stack development', 'Full-stack', Layers, 'From the database to the button, end to end.', ['webdev', 'nextjs', 'firebase', 'wordpress']),
    F('mobile', 'Mobile apps', 'Mobile', Smartphone, 'iOS, Android and cross-platform apps.', ['flutter', 'swift', 'kotlin', 'reactnative']),
    F('gamedev', 'Game development', 'Game dev', Gamepad2, 'Engines, gameplay code and game feel.', ['unity', 'unreal', 'godot', 'gamedesign']),
  ],
  systems: [
    F('devops', 'DevOps & cloud', 'DevOps', Cloud, 'Git, containers, pipelines and the cloud.', ['git', 'docker', 'kubernetes', 'aws']),
    F('security', 'Cybersecurity', 'Security', ShieldCheck, 'Breaking things on purpose, then fixing them.', ['kali', 'burp', 'pentest', 'cryptography']),
    F('networking', 'Networking & IT support', 'Networking', Network, 'Routers, servers and fixing what breaks.', ['networking', 'ccna', 'itsupport', 'windows']),
    F('embedded', 'Embedded & robotics', 'Embedded', Cpu, 'Firmware, sensors and robots close to the metal.', ['c', 'arduino', 'raspberrypi', 'robotics']),
    F('qa', 'Testing & QA', 'QA', Bug, 'Automation that catches bugs before users do.', ['playwright', 'cypress', 'selenium', 'postman']),
  ],
  data: [
    F('ai', 'Artificial intelligence', 'AI', Sparkles, 'LLM apps, prompts and AI agents.', ['llmapps', 'promptengineering', 'aiagents', 'huggingface']),
    F('ml', 'Machine learning', 'ML', Brain, 'Training models that learn from data.', ['pytorch', 'tensorflow', 'sklearn', 'opencv']),
    F('dataanalysis', 'Data analysis', 'Data analysis', ChartColumn, 'Turning raw data into clear answers.', ['pandas', 'powerbi', 'tableau', 'dataviz']),
    F('databases', 'Databases & SQL', 'Databases', Database, 'Designing tables and writing queries.', ['sql', 'postgresql', 'mysql', 'mongodb']),
    F('excel', 'Spreadsheets & Excel', 'Spreadsheets', Sheet, 'Formulas, pivot tables and dashboards.', ['excel', 'googlesheets', 'pivottables', 'vba']),
  ],
  design: [
    F('uiux', 'UI/UX design', 'UI/UX', PenTool, 'Research, flows and design systems.', ['figma', 'uxresearch', 'prototyping', 'designsystems']),
    F('graphic', 'Graphic design', 'Graphic design', Palette, 'Logos, posters and visual identities.', ['photoshop', 'illustrator', 'canva', 'typography']),
    F('3d', '3D modeling', '3D', Box, 'Modeling, texturing and rendering.', ['blender', 'maya', 'cinema4d', 'houdini']),
    F('illustration', 'Illustration & drawing', 'Illustration', Brush, 'Sketching, digital painting and characters.', ['drawing', 'digitalpainting', 'procreate', 'characterdesign']),
    F('cad', 'Architecture & CAD', 'CAD', DraftingCompass, 'Plans, models and technical drawings.', ['autocad', 'revit', 'sketchup', 'interiordesign']),
  ],
  media: [
    F('videoediting', 'Video editing', 'Video editing', Film, 'Cutting footage into stories people finish.', ['premiere', 'davinci', 'capcut', 'colorgrading']),
    F('videography', 'Videography', 'Videography', Video, 'Shooting, lighting and camera movement.', ['cinematography', 'lighting', 'drone', 'filmmaking']),
    F('photography', 'Photography', 'Photography', Camera, 'Composition, light and editing.', ['photobasics', 'lightroom', 'portraits', 'productphoto']),
    F('motion', 'Motion graphics', 'Motion', Shapes, 'Animation and titles that move well.', ['aftereffects', 'lottie', 'animation2d', 'kinetictype']),
    F('audio', 'Music & audio production', 'Audio', AudioLines, 'Recording, mixing and producing tracks.', ['flstudio', 'ableton', 'mixing', 'podcasting']),
  ],
  people: [
    F('publicspeaking', 'Public speaking', 'Speaking', Mic, 'Talks and presentations without shaking hands.', ['publicspeaking', 'presentations', 'debate', 'speechwriting']),
    F('leadership', 'Leadership', 'Leadership', Flag, 'Leading teams, giving feedback, making calls.', ['teamleadership', 'feedback', 'decisionmaking', 'emotionalintel']),
    F('communication', 'Communication skills', 'Communication', MessagesSquare, 'Listening, hard conversations and clear email.', ['activelistening', 'conflictresolution', 'businessemail', 'interviewing']),
    F('negotiation', 'Negotiation & sales', 'Negotiation', Handshake, 'Getting to yes without burning bridges.', ['negotiation', 'persuasion', 'sales', 'pronetworking']),
    F('mentoring', 'Teaching & mentoring', 'Mentoring', HandHeart, 'Explaining things well and helping others grow.', ['mentoring', 'coaching', 'lessonplanning', 'tutoring']),
  ],
  business: [
    F('marketing', 'Digital marketing', 'Marketing', Megaphone, 'SEO, ads and email that actually convert.', ['seo', 'googleads', 'emailmarketing', 'branding']),
    F('socialmedia', 'Social media & content', 'Social media', Hash, 'Growing an audience with good content.', ['contentcreation', 'shortvideo', 'communitymgmt', 'socialstrategy']),
    F('entrepreneurship', 'Entrepreneurship', 'Startups', Rocket, 'Validating ideas and starting something real.', ['businessplan', 'pitching', 'mvp', 'ecommerce']),
    F('projectmgmt', 'Project management', 'Projects', SquareKanban, 'Planning work and shipping on time.', ['agile', 'jira', 'notion', 'planning']),
    F('finance', 'Finance & accounting', 'Finance', Wallet, 'Budgets, bookkeeping and reading the numbers.', ['accounting', 'budgeting', 'finmodeling', 'bookkeeping']),
  ],
  words: [
    F('writing', 'Writing & copywriting', 'Writing', PenLine, 'Clear, persuasive words for the web and beyond.', ['copywriting', 'blogging', 'proofreading', 'uxwriting']),
    F('academic', 'Academic writing & research', 'Academic', Library, 'Papers, citations and research methods.', ['research', 'citations', 'latex', 'thesis']),
    F('languages', 'Languages', 'Languages', Languages, 'Speaking practice with people who grew up with it.', ['english', 'arabic', 'kurdish', 'turkish']),
    F('translation', 'Translation & interpreting', 'Translation', ArrowLeftRight, 'Moving meaning between languages.', ['translation', 'interpreting', 'subtitling', 'localization']),
    F('storytelling', 'Storytelling & scripts', 'Storytelling', Feather, 'Stories and scripts that hold attention.', ['storytelling', 'scriptwriting', 'creativewriting']),
  ],
  study: [
    F('math', 'Mathematics', 'Math', Sigma, 'From algebra to calculus, explained patiently.', ['algebra', 'calculus', 'statistics', 'linearalgebra']),
    F('physics', 'Physics', 'Physics', Atom, 'Mechanics, electricity and the why behind them.', ['mechanics', 'electricity', 'magnetism', 'astronomy']),
    F('biology', 'Biology & chemistry', 'Bio & chem', FlaskConical, 'Cells, reactions and lab work.', ['biology', 'chemistry', 'anatomy', 'labwork']),
    F('studyskills', 'Study skills & productivity', 'Study skills', Timer, 'Focus, notes and beating procrastination.', ['timemanagement', 'notetaking', 'memory', 'focus']),
    F('examprep', 'Exam prep', 'Exam prep', ClipboardCheck, 'IELTS, TOEFL, SAT and university exams.', ['ielts', 'toefl', 'sat']),
  ],
  life: [
    F('music', 'Musical instruments', 'Instruments', Guitar, 'Guitar, piano, oud and more.', ['guitar', 'piano', 'oud', 'drums']),
    F('singing', 'Singing & voice', 'Singing', MicVocal, 'Breathing, pitch and confidence on stage.', ['singing', 'voicetraining', 'voiceover']),
    F('fitness', 'Fitness & sports', 'Fitness', Dumbbell, 'Training plans, form and staying consistent.', ['strength', 'running', 'football', 'yoga']),
    F('cooking', 'Cooking & baking', 'Cooking', ChefHat, 'From everyday meals to proper bread.', ['cooking', 'baking', 'mealprep', 'coffee']),
    F('wellbeing', 'Mindfulness & wellbeing', 'Wellbeing', Flower2, 'Stress, sleep and habits that last.', ['meditation', 'journaling', 'habits', 'stress']),
  ],
}

export const FIELDS = AREAS.flatMap((a) => BY_AREA[a.id].map((f, i) => ({ ...f, area: a.id, h: (a.h + (i - 2) * 7 + 360) % 360 })))
export const FIELD = Object.fromEntries(FIELDS.map((f) => [f.id, f]))
export const AREA = Object.fromEntries(AREAS.map((a) => [a.id, a]))
export const fieldsOf = (areaId) => FIELDS.filter((f) => f.area === areaId)
export const fieldOfSkill = (skillId) => FIELD[SKILL[skillId]?.field]
export const areaOfSkill = (skillId) => AREA[fieldOfSkill(skillId)?.area]

// A person belongs to their main field and to every field they teach a skill in.
export const personFields = (p) => new Set([p.field, ...p.teaches.map((t) => SKILL[t.skill]?.field).filter(Boolean)])
export const inField = (p, fieldId) => personFields(p).has(fieldId)
export const inArea = (p, areaId) => [...personFields(p)].some((f) => FIELD[f]?.area === areaId)
