// The skill catalog. Every skill belongs to one of the 50 fields (see fields.js).
// Icons: `icon` = devicon brand logo (copied into public/icons by scripts/copy-icons.mjs),
// `glyph` = a Lucide symbol drawn on a tile in the field's colour, `mono` = short letters (languages, tools without a logo).
// This file must stay free of React imports: the icon copy script runs it in plain Node.

const d = (id, name, field, icon) => ({ id, name, field, icon })
const g = (id, name, field, glyph) => ({ id, name, field, glyph })
const m = (id, name, field, mono) => ({ id, name, field, mono })

export const SKILLS = [
  // Software development
  d('javascript', 'JavaScript', 'frontend', 'javascript'), d('typescript', 'TypeScript', 'frontend', 'typescript'),
  d('html', 'HTML', 'frontend', 'html5'), d('css', 'CSS', 'frontend', 'css3'), d('react', 'React', 'frontend', 'react'),
  d('vue', 'Vue', 'frontend', 'vuejs'), d('angular', 'Angular', 'frontend', 'angular'), d('svelte', 'Svelte', 'frontend', 'svelte'),
  d('nextjs', 'Next.js', 'frontend', 'nextjs'), d('tailwind', 'Tailwind CSS', 'frontend', 'tailwindcss'), d('sass', 'Sass', 'frontend', 'sass'),
  d('redux', 'Redux', 'frontend', 'redux'), d('threejs', 'Three.js', 'frontend', 'threejs'), d('vite', 'Vite', 'frontend', 'vitejs'),
  d('python', 'Python', 'backend', 'python'), d('java', 'Java', 'backend', 'java'), d('csharp', 'C#', 'backend', 'csharp'),
  d('go', 'Go', 'backend', 'go'), d('rust', 'Rust', 'backend', 'rust'), d('php', 'PHP', 'backend', 'php'), d('ruby', 'Ruby', 'backend', 'ruby'),
  d('nodejs', 'Node.js', 'backend', 'nodejs'), d('express', 'Express', 'backend', 'express'), d('nestjs', 'NestJS', 'backend', 'nestjs'),
  d('django', 'Django', 'backend', 'django'), d('flask', 'Flask', 'backend', 'flask'), d('fastapi', 'FastAPI', 'backend', 'fastapi'),
  d('spring', 'Spring Boot', 'backend', 'spring'), d('laravel', 'Laravel', 'backend', 'laravel'), d('rails', 'Ruby on Rails', 'backend', 'rails'),
  d('dotnet', '.NET', 'backend', 'dotnetcore'), d('graphql', 'GraphQL', 'backend', 'graphql'), d('intellij', 'IntelliJ IDEA', 'backend', 'intellij'),
  g('webdev', 'Web development', 'fullstack', 'Globe'), d('wordpress', 'WordPress', 'fullstack', 'wordpress'), d('firebase', 'Firebase', 'fullstack', 'firebase'),
  d('supabase', 'Supabase', 'fullstack', 'supabase'), d('vscode', 'VS Code', 'fullstack', 'vscode'), d('npm', 'npm', 'fullstack', 'npm'), d('vim', 'Vim', 'fullstack', 'vim'),
  d('kotlin', 'Kotlin', 'mobile', 'kotlin'), d('swift', 'Swift', 'mobile', 'swift'), d('dart', 'Dart', 'mobile', 'dart'), d('android', 'Android', 'mobile', 'android'),
  d('flutter', 'Flutter', 'mobile', 'flutter'), d('reactnative', 'React Native', 'mobile', 'reactnative'), d('xcode', 'Xcode', 'mobile', 'xcode'),
  d('androidstudio', 'Android Studio', 'mobile', 'androidstudio'),
  d('unity', 'Unity', 'gamedev', 'unity'), d('unreal', 'Unreal Engine', 'gamedev', 'unrealengine'), d('godot', 'Godot', 'gamedev', 'godot'),
  d('lua', 'Lua', 'gamedev', 'lua'), d('opengl', 'OpenGL', 'gamedev', 'opengl'), g('gamedesign', 'Game design', 'gamedev', 'Puzzle'),

  // Systems & security
  d('git', 'Git', 'devops', 'git'), d('github', 'GitHub', 'devops', 'github'), d('gitlab', 'GitLab', 'devops', 'gitlab'), d('docker', 'Docker', 'devops', 'docker'),
  d('kubernetes', 'Kubernetes', 'devops', 'kubernetes'), d('aws', 'AWS', 'devops', 'amazonwebservices'), d('azure', 'Azure', 'devops', 'azure'),
  d('gcp', 'Google Cloud', 'devops', 'googlecloud'), d('linux', 'Linux', 'devops', 'linux'), d('bash', 'Bash', 'devops', 'bash'), d('nginx', 'Nginx', 'devops', 'nginx'),
  d('terraform', 'Terraform', 'devops', 'terraform'), d('ghactions', 'GitHub Actions', 'devops', 'githubactions'), d('jenkins', 'Jenkins', 'devops', 'jenkins'),
  d('ansible', 'Ansible', 'devops', 'ansible'),
  d('kali', 'Kali Linux', 'security', 'kalilinux'), d('burp', 'Burp Suite', 'security', 'burpsuite'), g('wireshark', 'Wireshark', 'security', 'Activity'),
  g('pentest', 'Pen testing', 'security', 'Bug'), g('cryptography', 'Cryptography', 'security', 'KeyRound'),
  g('networking', 'Computer networking', 'networking', 'Network'), g('ccna', 'Cisco CCNA', 'networking', 'Router'), g('itsupport', 'IT support', 'networking', 'Wrench'),
  d('windows', 'Windows admin', 'networking', 'windows11'), d('ubuntu', 'Ubuntu server', 'networking', 'ubuntu'),
  d('c', 'C', 'embedded', 'c'), d('cpp', 'C++', 'embedded', 'cplusplus'), d('arduino', 'Arduino', 'embedded', 'arduino'), d('raspberrypi', 'Raspberry Pi', 'embedded', 'raspberrypi'),
  d('embeddedc', 'Embedded C', 'embedded', 'c'), g('robotics', 'Robotics', 'embedded', 'Bot'), d('labview', 'LabVIEW', 'embedded', 'labview'),
  d('jest', 'Jest', 'qa', 'jest'), d('cypress', 'Cypress', 'qa', 'cypressio'), d('selenium', 'Selenium', 'qa', 'selenium'), d('playwright', 'Playwright', 'qa', 'playwright'),
  d('postman', 'Postman', 'qa', 'postman'), d('pytest', 'pytest', 'qa', 'pytest'),

  // Data & AI
  g('llmapps', 'LLM apps', 'ai', 'BotMessageSquare'), g('promptengineering', 'Prompt engineering', 'ai', 'Sparkles'), g('aiagents', 'AI agents', 'ai', 'Bot'),
  d('huggingface', 'Hugging Face', 'ai', 'huggingface'),
  d('pytorch', 'PyTorch', 'ml', 'pytorch'), d('tensorflow', 'TensorFlow', 'ml', 'tensorflow'), d('sklearn', 'scikit-learn', 'ml', 'scikitlearn'),
  d('opencv', 'OpenCV', 'ml', 'opencv'), d('numpy', 'NumPy', 'ml', 'numpy'), d('googlecolab', 'Google Colab', 'ml', 'googlecolab'), d('kaggle', 'Kaggle', 'ml', 'kaggle'),
  d('pandas', 'pandas', 'dataanalysis', 'pandas'), d('matplotlib', 'Matplotlib', 'dataanalysis', 'matplotlib'), d('jupyter', 'Jupyter', 'dataanalysis', 'jupyter'),
  d('r', 'R', 'dataanalysis', 'r'), g('powerbi', 'Power BI', 'dataanalysis', 'ChartColumn'), g('tableau', 'Tableau', 'dataanalysis', 'ChartPie'),
  g('dataviz', 'Data visualization', 'dataanalysis', 'ChartLine'),
  m('sql', 'SQL', 'databases', 'SQL'), d('postgresql', 'PostgreSQL', 'databases', 'postgresql'), d('mysql', 'MySQL', 'databases', 'mysql'),
  d('mongodb', 'MongoDB', 'databases', 'mongodb'), d('redis', 'Redis', 'databases', 'redis'), d('sqlite', 'SQLite', 'databases', 'sqlite'),
  g('dbdesign', 'Database design', 'databases', 'Database'),
  g('excel', 'Excel', 'excel', 'Sheet'), g('googlesheets', 'Google Sheets', 'excel', 'Table2'), g('pivottables', 'Pivot tables', 'excel', 'ChartNoAxesCombined'),
  g('vba', 'VBA macros', 'excel', 'SquareFunction'),

  // Design
  d('figma', 'Figma', 'uiux', 'figma'), d('xd', 'Adobe XD', 'uiux', 'xd'), d('sketch', 'Sketch', 'uiux', 'sketch'), g('uxresearch', 'UX research', 'uiux', 'SearchCheck'),
  g('prototyping', 'Prototyping', 'uiux', 'MousePointerClick'), g('designsystems', 'Design systems', 'uiux', 'SwatchBook'),
  d('photoshop', 'Photoshop', 'graphic', 'photoshop'), d('illustrator', 'Illustrator', 'graphic', 'illustrator'), d('canva', 'Canva', 'graphic', 'canva'),
  d('gimp', 'GIMP', 'graphic', 'gimp'), d('inkscape', 'Inkscape', 'graphic', 'inkscape'), g('typography', 'Typography', 'graphic', 'Type'), g('logodesign', 'Logo design', 'graphic', 'Shapes'),
  d('blender', 'Blender', '3d', 'blender'), d('maya', 'Maya', '3d', 'maya'), m('houdini', 'Houdini', '3d', 'Ho'), m('cinema4d', 'Cinema 4D', '3d', 'C4'),
  g('3dprinting', '3D printing', '3d', 'Cuboid'),
  g('drawing', 'Drawing', 'illustration', 'Pencil'), g('digitalpainting', 'Digital painting', 'illustration', 'Brush'), g('procreate', 'Procreate', 'illustration', 'Paintbrush'),
  g('characterdesign', 'Character design', 'illustration', 'Smile'),
  g('autocad', 'AutoCAD', 'cad', 'DraftingCompass'), g('revit', 'Revit', 'cad', 'Building2'), g('sketchup', 'SketchUp', 'cad', 'Box'), g('solidworks', 'SolidWorks', 'cad', 'Hammer'),
  g('interiordesign', 'Interior design', 'cad', 'House'),

  // Video, photo & audio
  d('premiere', 'Premiere Pro', 'videoediting', 'premierepro'), m('davinci', 'DaVinci Resolve', 'videoediting', 'DR'), g('finalcut', 'Final Cut Pro', 'videoediting', 'Film'),
  g('capcut', 'CapCut', 'videoediting', 'Scissors'), g('colorgrading', 'Color grading', 'videoediting', 'Contrast'),
  g('cinematography', 'Camera work', 'videography', 'Video'), g('lighting', 'Lighting', 'videography', 'Lamp'), g('drone', 'Drone filming', 'videography', 'Drone'),
  g('filmmaking', 'Short filmmaking', 'videography', 'Clapperboard'),
  g('photobasics', 'Photography basics', 'photography', 'Camera'), g('lightroom', 'Lightroom', 'photography', 'Aperture'), g('portraits', 'Portrait photography', 'photography', 'Focus'),
  g('productphoto', 'Product photography', 'photography', 'Image'), g('photoediting', 'Photo editing', 'photography', 'Crop'),
  d('aftereffects', 'After Effects', 'motion', 'aftereffects'), m('lottie', 'Lottie', 'motion', 'Lo'), g('animation2d', '2D animation', 'motion', 'Spline'),
  g('kinetictype', 'Kinetic typography', 'motion', 'LetterText'),
  g('flstudio', 'FL Studio', 'audio', 'AudioWaveform'), g('ableton', 'Ableton Live', 'audio', 'AudioLines'), g('logicpro', 'Logic Pro', 'audio', 'Disc3'),
  g('mixing', 'Mixing & mastering', 'audio', 'SlidersHorizontal'), g('podcasting', 'Podcasting', 'audio', 'Podcast'),

  // Communication & leadership
  g('publicspeaking', 'Public speaking', 'publicspeaking', 'Mic'), g('presentations', 'Presentations', 'publicspeaking', 'Presentation'),
  g('debate', 'Debate', 'publicspeaking', 'Swords'), g('speechwriting', 'Speech writing', 'publicspeaking', 'ScrollText'),
  g('teamleadership', 'Team leadership', 'leadership', 'Flag'), g('feedback', 'Giving feedback', 'leadership', 'MessageSquareText'),
  g('decisionmaking', 'Decision making', 'leadership', 'Crosshair'), g('emotionalintel', 'Emotional intelligence', 'leadership', 'HeartHandshake'),
  g('activelistening', 'Active listening', 'communication', 'Ear'), g('conflictresolution', 'Conflict resolution', 'communication', 'Scale'),
  g('businessemail', 'Professional email', 'communication', 'Mail'), g('interviewing', 'Job interviews', 'communication', 'Briefcase'),
  g('negotiation', 'Negotiation', 'negotiation', 'Handshake'), g('persuasion', 'Persuasion', 'negotiation', 'Target'), g('sales', 'Sales', 'negotiation', 'CircleDollarSign'),
  g('pronetworking', 'Professional networking', 'negotiation', 'Users'),
  g('mentoring', 'Mentoring', 'mentoring', 'HandHeart'), g('coaching', 'Coaching', 'mentoring', 'Trophy'), g('lessonplanning', 'Lesson planning', 'mentoring', 'NotebookPen'),
  g('tutoring', 'Tutoring', 'mentoring', 'GraduationCap'),

  // Business & marketing
  g('seo', 'SEO', 'marketing', 'Search'), d('googleads', 'Google Ads', 'marketing', 'google'), g('emailmarketing', 'Email marketing', 'marketing', 'Send'),
  g('branding', 'Branding', 'marketing', 'Gem'),
  g('contentcreation', 'Content creation', 'socialmedia', 'Megaphone'), g('shortvideo', 'Short-form video', 'socialmedia', 'Smartphone'),
  g('communitymgmt', 'Community management', 'socialmedia', 'MessagesSquare'), d('linkedin', 'LinkedIn growth', 'socialmedia', 'linkedin'),
  g('socialstrategy', 'Social media strategy', 'socialmedia', 'Hash'),
  g('businessplan', 'Business plans', 'entrepreneurship', 'ClipboardList'), g('pitching', 'Pitching', 'entrepreneurship', 'Rocket'), g('mvp', 'Building an MVP', 'entrepreneurship', 'Lightbulb'),
  g('ecommerce', 'E-commerce', 'entrepreneurship', 'Store'),
  g('agile', 'Agile & Scrum', 'projectmgmt', 'Workflow'), d('jira', 'Jira', 'projectmgmt', 'jira'), d('trello', 'Trello', 'projectmgmt', 'trello'), d('notion', 'Notion', 'projectmgmt', 'notion'),
  g('planning', 'Project planning', 'projectmgmt', 'ChartGantt'),
  g('accounting', 'Accounting', 'finance', 'Calculator'), g('budgeting', 'Budgeting', 'finance', 'PiggyBank'), g('finmodeling', 'Financial modeling', 'finance', 'Landmark'),
  g('bookkeeping', 'Bookkeeping', 'finance', 'Receipt'),

  // Writing & languages
  g('copywriting', 'Copywriting', 'writing', 'PenLine'), g('blogging', 'Blogging', 'writing', 'BookOpenText'), g('proofreading', 'Proofreading', 'writing', 'SpellCheck'),
  g('uxwriting', 'UX writing', 'writing', 'WholeWord'),
  g('research', 'Research methods', 'academic', 'Library'), g('citations', 'Citations & APA', 'academic', 'Quote'), d('latex', 'LaTeX', 'academic', 'latex'),
  g('thesis', 'Thesis writing', 'academic', 'Notebook'),
  m('english', 'English', 'languages', 'EN'), m('arabic', 'Arabic', 'languages', 'AR'), m('kurdish', 'Kurdish', 'languages', 'KU'), m('turkish', 'Turkish', 'languages', 'TR'),
  m('persian', 'Persian', 'languages', 'FA'), m('french', 'French', 'languages', 'FR'), m('german', 'German', 'languages', 'DE'), m('spanish', 'Spanish', 'languages', 'ES'),
  m('korean', 'Korean', 'languages', 'KO'), m('japanese', 'Japanese', 'languages', 'JA'), m('chinese', 'Chinese', 'languages', 'ZH'), m('russian', 'Russian', 'languages', 'RU'),
  g('translation', 'Translation', 'translation', 'Languages'), g('interpreting', 'Interpreting', 'translation', 'Speech'), g('subtitling', 'Subtitling', 'translation', 'Captions'),
  g('localization', 'Localization', 'translation', 'Earth'),
  g('storytelling', 'Storytelling', 'storytelling', 'BookOpen'), g('scriptwriting', 'Scriptwriting', 'storytelling', 'Scroll'), g('creativewriting', 'Creative writing', 'storytelling', 'Feather'),

  // Science & study
  g('algebra', 'Algebra', 'math', 'Variable'), g('calculus', 'Calculus', 'math', 'Sigma'), g('statistics', 'Statistics', 'math', 'Percent'),
  g('linearalgebra', 'Linear algebra', 'math', 'Braces'), d('matlab', 'MATLAB', 'math', 'matlab'),
  g('mechanics', 'Mechanics', 'physics', 'Orbit'), g('electricity', 'Electricity & circuits', 'physics', 'Zap'), g('magnetism', 'Electromagnetism', 'physics', 'Magnet'),
  g('astronomy', 'Astronomy', 'physics', 'Telescope'),
  g('biology', 'Biology', 'biology', 'Dna'), g('chemistry', 'Chemistry', 'biology', 'FlaskConical'), g('anatomy', 'Anatomy', 'biology', 'Bone'), g('labwork', 'Lab skills', 'biology', 'TestTube'),
  g('timemanagement', 'Time management', 'studyskills', 'Timer'), g('notetaking', 'Note-taking', 'studyskills', 'Highlighter'), g('memory', 'Memory techniques', 'studyskills', 'Brain'),
  g('focus', 'Focus & deep work', 'studyskills', 'Hourglass'),
  g('ielts', 'IELTS', 'examprep', 'ClipboardCheck'), g('toefl', 'TOEFL', 'examprep', 'ClipboardCheck'), g('sat', 'SAT', 'examprep', 'ClipboardCheck'),

  // Arts & lifestyle
  g('guitar', 'Guitar', 'music', 'Guitar'), g('piano', 'Piano', 'music', 'Piano'), g('oud', 'Oud', 'music', 'Music'), g('drums', 'Drums', 'music', 'Drum'),
  g('musictheory', 'Music theory', 'music', 'Music2'),
  g('singing', 'Singing', 'singing', 'MicVocal'), g('voicetraining', 'Voice training', 'singing', 'Waves'), g('voiceover', 'Voice-over', 'singing', 'Radio'),
  g('strength', 'Strength training', 'fitness', 'Dumbbell'), g('running', 'Running', 'fitness', 'Footprints'), g('football', 'Football', 'fitness', 'Goal'),
  g('yoga', 'Yoga', 'fitness', 'PersonStanding'), g('cycling', 'Cycling', 'fitness', 'Bike'),
  g('cooking', 'Everyday cooking', 'cooking', 'CookingPot'), g('baking', 'Baking', 'cooking', 'Croissant'), g('mealprep', 'Meal prep', 'cooking', 'Salad'),
  g('coffee', 'Coffee brewing', 'cooking', 'Coffee'),
  g('meditation', 'Meditation', 'wellbeing', 'Flower2'), g('journaling', 'Journaling', 'wellbeing', 'NotebookPen'), g('habits', 'Habit building', 'wellbeing', 'CalendarCheck'),
  g('stress', 'Stress management', 'wellbeing', 'HeartPulse'), g('sleep', 'Better sleep', 'wellbeing', 'Moon'),
]

export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s]))

export const LEVELS = [
  { n: 1, name: 'Basics', hint: 'I can explain the fundamentals' },
  { n: 2, name: 'Comfortable', hint: 'I use it in my own projects' },
  { n: 3, name: 'Proficient', hint: 'I use it at work or in big projects' },
  { n: 4, name: 'Expert', hint: 'I could teach a full course' },
]

export const levelName = (n) => LEVELS[Math.max(1, Math.min(4, n)) - 1].name
