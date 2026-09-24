// ------------------------------------------------------------------
// All demo content lives here. The landing page and the app both read
// from this file, so editing a tutor here updates them everywhere.
// Names, bios, reviews and numbers are placeholders.
// ------------------------------------------------------------------

export const BRAND = {
  name: 'Tutora',
  currency: '$',
};

// Placeholder headshots. Swap for real tutor photos (any image URL works).
export const photo = (img, size = 300) => `https://i.pravatar.cc/${size}?img=${img}`;

export const LANGUAGES = [
  { id: 'english',    name: 'English',    glyph: 'Aa', tutors: 18420, tint: 'sky',   speech: 'en-GB' },
  { id: 'spanish',    name: 'Spanish',    glyph: 'Ñ',  tutors: 6310,  tint: 'sun',   speech: 'es-ES' },
  { id: 'french',     name: 'French',     glyph: 'Ç',  tutors: 2870,  tint: 'lilac', speech: 'fr-FR' },
  { id: 'german',     name: 'German',     glyph: 'ß',  tutors: 1940,  tint: 'mint',  speech: 'de-DE' },
  { id: 'italian',    name: 'Italian',    glyph: 'È',  tutors: 1210,  tint: 'peach', speech: 'it-IT' },
  { id: 'japanese',   name: 'Japanese',   glyph: 'あ', tutors: 1580,  tint: 'sky',   speech: 'ja-JP' },
  { id: 'portuguese', name: 'Portuguese', glyph: 'Ã',  tutors: 1120,  tint: 'mint',  speech: 'pt-BR' },
  { id: 'arabic',     name: 'Arabic',     glyph: 'ع',  tutors: 860,   tint: 'lilac', speech: 'ar-SA' },
];

export const langById = (id) => LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];

export const LEVELS = [
  { id: 'a1', name: 'Beginner',           hint: 'I know a few words, or none at all' },
  { id: 'a2', name: 'Pre-intermediate',   hint: 'I can handle simple, everyday exchanges' },
  { id: 'b1', name: 'Intermediate',       hint: 'I get by, but I search for words a lot' },
  { id: 'b2', name: 'Upper-intermediate', hint: 'I talk comfortably about most topics' },
  { id: 'c1', name: 'Advanced',           hint: 'I want to polish nuance and accent' },
];

export const GOALS = [
  { id: 'conversation', name: 'Everyday conversation', emoji: '💬' },
  { id: 'career',       name: 'Career & business',     emoji: '💼' },
  { id: 'travel',       name: 'Travel',                emoji: '✈️' },
  { id: 'exams',        name: 'Exams & certificates',  emoji: '📝' },
  { id: 'culture',      name: 'Culture & hobbies',     emoji: '🎬' },
  { id: 'relocation',   name: 'Moving abroad',         emoji: '🏡' },
];

export const TUTORS = [
  {
    id: 'amelia-hart', name: 'Amelia Hart', img: 32, country: 'United Kingdom', flag: '🇬🇧',
    teaches: 'english', speaks: [['English', 'Native'], ['French', 'B2']],
    price: 24, rating: 4.9, reviews: 312, students: 1240, lessons: 6890, top: true, native: true,
    specialties: ['Conversation', 'Exam prep', 'Business'],
    headline: 'Certified teacher for confident conversation and IELTS',
    bio: 'I spent eight years teaching in language schools in Lyon and London before moving online. My lessons are relaxed but structured: we talk about things you actually care about, and I send you a short recap with every correction afterwards.',
    greeting: 'Hi! I am Amelia. Let us get you talking with confidence.',
    resume: [['2016', 'CELTA certificate', 'Cambridge Assessment'], ['2012–2016', 'BA English Literature', 'University of Leeds']],
  },
  {
    id: 'daniel-okafor', name: 'Daniel Okafor', img: 51, country: 'Nigeria', flag: '🇳🇬',
    teaches: 'english', speaks: [['English', 'Native'], ['Yoruba', 'Native']],
    price: 14, rating: 5.0, reviews: 148, students: 410, lessons: 2210, top: false, native: true,
    specialties: ['Conversation', 'Beginners', 'Interview prep'],
    headline: 'Relaxed, practical English for work and travel',
    bio: 'Former secondary-school teacher who loves helping nervous speakers relax. We will practise real situations — small talk, phone calls, job interviews — until they feel easy.',
    greeting: 'Hello, I am Daniel. No pressure here, just practice.',
    resume: [['2019', 'TEFL 120-hour certificate', 'International TEFL Academy'], ['2014–2018', 'BEd English Education', 'University of Ibadan']],
  },
  {
    id: 'sophie-martin', name: 'Sophie Martin', img: 5, country: 'United States', flag: '🇺🇸',
    teaches: 'english', speaks: [['English', 'Native'], ['Spanish', 'C1']],
    price: 30, rating: 5.0, reviews: 610, students: 1980, lessons: 9420, top: true, native: true,
    specialties: ['Business', 'Interview prep', 'Pronunciation'],
    headline: 'Business English coach for tech and finance professionals',
    bio: 'Ten years in corporate communications taught me what people really need at work. We will rehearse your presentations, sharpen your emails and work on the American accent if you want it.',
    greeting: 'Hey there, I am Sophie. Let us make your next meeting your best one.',
    resume: [['2018', 'TESOL certificate', 'Arizona State University'], ['2008–2017', 'Communications manager', 'Various tech companies']],
  },
  {
    id: 'kwame-mensah', name: 'Kwame Mensah', img: 70, country: 'Ghana', flag: '🇬🇭',
    teaches: 'english', speaks: [['English', 'Native'], ['Twi', 'Native'], ['French', 'B1']],
    price: 11, rating: 4.8, reviews: 64, students: 150, lessons: 890, top: false, native: true,
    specialties: ['Beginners', 'Grammar', 'Kids'],
    headline: 'Patient, beginner-friendly English from a retired headteacher',
    bio: 'Thirty years in classrooms and I still love the moment grammar clicks. Slow, clear and patient — perfect if you are starting from zero.',
    greeting: 'Welcome. We will go step by step, together.',
    resume: [['1990–2020', 'Headteacher', 'Accra Community School'], ['1986', 'Teaching diploma', 'University of Cape Coast']],
  },
  {
    id: 'lucia-fernandez', name: 'Lucía Fernández', img: 44, country: 'Spain', flag: '🇪🇸',
    teaches: 'spanish', speaks: [['Spanish', 'Native'], ['English', 'C1'], ['Catalan', 'Native']],
    price: 19, rating: 4.9, reviews: 540, students: 1630, lessons: 7310, top: true, native: true,
    specialties: ['Conversation', 'Travel', 'Grammar'],
    headline: 'Spanish from Barcelona — talk from lesson one',
    bio: 'I believe the fastest way to learn is to speak, make mistakes and laugh about them. Expect real-life topics, podcasts, and a vocabulary list after every lesson.',
    greeting: '¡Hola! Soy Lucía. ¿Empezamos a hablar hoy?',
    resume: [['2017', 'Acreditación de examinadora DELE', 'Instituto Cervantes'], ['2011–2015', 'Grado en Filología Hispánica', 'Universitat de Barcelona']],
  },
  {
    id: 'mateo-rojas', name: 'Mateo Rojas', img: 59, country: 'Colombia', flag: '🇨🇴',
    teaches: 'spanish', speaks: [['Spanish', 'Native'], ['English', 'B2']],
    price: 12, rating: 4.8, reviews: 96, students: 280, lessons: 1450, top: false, native: true,
    specialties: ['Conversation', 'Beginners', 'Travel'],
    headline: 'Latin American Spanish with a Colombian smile',
    bio: 'Music, football, food — we can talk about anything. I help beginners build the basics fast and intermediate learners finally understand native speed.',
    greeting: '¡Qué más! Soy Mateo. Vamos a aprender juntos.',
    resume: [['2020', 'ELE teaching certificate', 'Universidad de Antioquia'], ['2013–2018', 'Licenciatura en Idiomas', 'Universidad de Antioquia']],
  },
  {
    id: 'ana-reyes', name: 'Ana Reyes', img: 35, country: 'Mexico', flag: '🇲🇽',
    teaches: 'spanish', speaks: [['Spanish', 'Native'], ['English', 'C1']],
    price: 13, rating: 4.9, reviews: 203, students: 560, lessons: 2980, top: false, native: true,
    specialties: ['Kids', 'Beginners', 'Pronunciation'],
    headline: 'Fun, game-based Spanish for kids and families',
    bio: 'I taught primary school in Guadalajara for six years. Lessons use songs, pictures and games, so younger learners stay excited and parents see progress every week.',
    greeting: '¡Hola, hola! Soy Ana. ¡Vamos a jugar y aprender!',
    resume: [['2015–2021', 'Primary teacher', 'Colegio Guadalajara'], ['2014', 'Licenciatura en Educación', 'Universidad de Guadalajara']],
  },
  {
    id: 'camille-laurent', name: 'Camille Laurent', img: 45, country: 'France', flag: '🇫🇷',
    teaches: 'french', speaks: [['French', 'Native'], ['English', 'C2'], ['Italian', 'B1']],
    price: 26, rating: 5.0, reviews: 221, students: 690, lessons: 4120, top: true, native: true,
    specialties: ['Exam prep', 'Literature', 'Conversation'],
    headline: 'DELF/DALF prep and elegant everyday French',
    bio: 'Parisian, bookworm and former exam marker. I will help you pass DELF or DALF, or simply sound more natural at the boulangerie. Every lesson ends with three phrases to use that week.',
    greeting: 'Bonjour ! Je suis Camille. On commence ?',
    resume: [['2018', 'Habilitation correctrice DELF-DALF', 'France Éducation International'], ['2012–2017', 'Master FLE', 'Sorbonne Nouvelle']],
  },
  {
    id: 'chloe-dubois', name: 'Chloé Dubois', img: 26, country: 'Canada', flag: '🇨🇦',
    teaches: 'french', speaks: [['French', 'Native'], ['English', 'Native']],
    price: 20, rating: 4.8, reviews: 118, students: 340, lessons: 1760, top: false, native: true,
    specialties: ['Conversation', 'Business', 'Relocation'],
    headline: 'Quebec and European French for work and relocation',
    bio: 'Bilingual Montrealer who helps professionals prepare for moving to Canada or France. We cover workplace French, admin vocabulary and the accents you will actually hear.',
    greeting: 'Salut ! Moi, c’est Chloé. Prêt à parler français ?',
    resume: [['2019', 'Certificate in French as a second language', 'Université de Montréal'], ['2012–2016', 'BA Translation', 'Concordia University']],
  },
  {
    id: 'jonas-weber', name: 'Jonas Weber', img: 53, country: 'Germany', flag: '🇩🇪',
    teaches: 'german', speaks: [['German', 'Native'], ['English', 'C1'], ['Spanish', 'B1']],
    price: 22, rating: 4.9, reviews: 187, students: 520, lessons: 3340, top: true, native: true,
    specialties: ['Grammar', 'Exam prep', 'Relocation'],
    headline: 'German grammar that finally makes sense',
    bio: 'Berlin-based teacher and former engineer. I explain German like a system — clear rules, lots of patterns, then plenty of speaking so it sticks. Goethe and telc exam prep available.',
    greeting: 'Hallo! Ich bin Jonas. Lass uns Deutsch einfach machen.',
    resume: [['2019', 'DaF/DaZ Zertifikat', 'Goethe-Institut'], ['2010–2015', 'MSc Mechanical Engineering', 'TU Berlin']],
  },
  {
    id: 'leo-fischer', name: 'Leo Fischer', img: 13, country: 'Austria', flag: '🇦🇹',
    teaches: 'german', speaks: [['German', 'Native'], ['English', 'C2']],
    price: 20, rating: 4.8, reviews: 76, students: 190, lessons: 1020, top: false, native: true,
    specialties: ['Conversation', 'Travel', 'Pronunciation'],
    headline: 'Chatty German lessons from Vienna',
    bio: 'I love conversation-first lessons. Bring any topic and we will turn it into a lesson — with gentle corrections and a vocabulary sheet you can review later.',
    greeting: 'Servus! Ich bin Leo. Worüber möchtest du heute sprechen?',
    resume: [['2020', 'ÖSD examiner training', 'ÖSD Vienna'], ['2013–2018', 'BA German Philology', 'Universität Wien']],
  },
  {
    id: 'giulia-romano', name: 'Giulia Romano', img: 36, country: 'Italy', flag: '🇮🇹',
    teaches: 'italian', speaks: [['Italian', 'Native'], ['English', 'C1'], ['French', 'B2']],
    price: 18, rating: 4.9, reviews: 133, students: 410, lessons: 2460, top: false, native: true,
    specialties: ['Conversation', 'Travel', 'Culture'],
    headline: 'Italian through food, film and everyday life',
    bio: 'From Bologna with love. We will learn Italian the way Italians use it — ordering at the market, arguing about films, and understanding hand gestures.',
    greeting: 'Ciao! Sono Giulia. Pronti per parlare italiano?',
    resume: [['2018', 'DITALS certificate', 'Università per Stranieri di Siena'], ['2011–2016', 'Laurea in Lettere', 'Università di Bologna']],
  },
  {
    id: 'marco-bianchi', name: 'Marco Bianchi', img: 60, country: 'Italy', flag: '🇮🇹',
    teaches: 'italian', speaks: [['Italian', 'Native'], ['English', 'B2']],
    price: 16, rating: 4.7, reviews: 58, students: 140, lessons: 760, top: false, native: true,
    specialties: ['Beginners', 'Grammar', 'Conversation'],
    headline: 'Beginner Italian, step by step',
    bio: 'Former tour guide in Florence. Clear explanations, lots of repetition and a sense of humour. Great if Italian is your first new language.',
    greeting: 'Ciao a tutti! Sono Marco. Cominciamo piano piano.',
    resume: [['2021', 'Italian teaching certificate', 'Università per Stranieri di Perugia'], ['2012–2020', 'Licensed tour guide', 'Florence']],
  },
  {
    id: 'yuki-tanaka', name: 'Yuki Tanaka', img: 25, country: 'Japan', flag: '🇯🇵',
    teaches: 'japanese', speaks: [['Japanese', 'Native'], ['English', 'C1']],
    price: 21, rating: 5.0, reviews: 402, students: 980, lessons: 5650, top: true, native: true,
    specialties: ['Exam prep', 'Beginners', 'Culture'],
    headline: 'JLPT prep and friendly Japanese from Osaka',
    bio: 'From hiragana to JLPT N2. I use visual materials and anime-free real-world dialogues, and I adapt every lesson to your goal — travel, work or passing the test.',
    greeting: 'こんにちは！ユキです。一緒に日本語を楽しみましょう。',
    resume: [['2017', 'Japanese Language Teaching Competency Test', 'JEES'], ['2010–2014', 'BA Linguistics', 'Osaka University']],
  },
  {
    id: 'beatriz-costa', name: 'Beatriz Costa', img: 16, country: 'Brazil', flag: '🇧🇷',
    teaches: 'portuguese', speaks: [['Portuguese', 'Native'], ['English', 'C1'], ['Spanish', 'B2']],
    price: 15, rating: 4.9, reviews: 176, students: 450, lessons: 2870, top: false, native: true,
    specialties: ['Conversation', 'Business', 'Culture'],
    headline: 'Brazilian Portuguese with energy and music',
    bio: 'From São Paulo. Lessons are lively, full of real slang and music, and focused on getting you to speak confidently — whether for work, travel or your Brazilian partner’s family.',
    greeting: 'Oi! Eu sou a Beatriz. Vamos conversar?',
    resume: [['2018', 'Celpe-Bras examiner', 'INEP'], ['2011–2015', 'Letras — Português/Inglês', 'Universidade de São Paulo']],
  },
  {
    id: 'tomas-silva', name: 'Tomás Silva', img: 12, country: 'Portugal', flag: '🇵🇹',
    teaches: 'portuguese', speaks: [['Portuguese', 'Native'], ['English', 'C2'], ['French', 'B1']],
    price: 17, rating: 4.8, reviews: 89, students: 230, lessons: 1310, top: false, native: true,
    specialties: ['Relocation', 'Grammar', 'Conversation'],
    headline: 'European Portuguese for people moving to Portugal',
    bio: 'Lisbon local helping expats and digital nomads settle in. We will cover everyday admin, pronunciation and the phrases you need to make Portuguese friends.',
    greeting: 'Olá! Sou o Tomás. Vamos lá?',
    resume: [['2019', 'PLE teaching certificate', 'Universidade de Lisboa'], ['2012–2016', 'BA Modern Languages', 'Universidade de Lisboa']],
  },
  {
    id: 'layla-haddad', name: 'Layla Haddad', img: 47, country: 'Jordan', flag: '🇯🇴',
    teaches: 'arabic', speaks: [['Arabic', 'Native'], ['English', 'C1']],
    price: 18, rating: 4.9, reviews: 141, students: 380, lessons: 2140, top: true, native: true,
    specialties: ['Beginners', 'Conversation', 'Culture'],
    headline: 'Modern Standard and Levantine Arabic made approachable',
    bio: 'I help beginners learn to read the script in weeks, then move on to real conversation in Levantine dialect. Patient, structured and always encouraging.',
    greeting: 'مرحبا! أنا ليلى. أهلاً وسهلاً في درسنا.',
    resume: [['2016', 'Arabic as a Foreign Language certificate', 'University of Jordan'], ['2010–2014', 'BA Arabic Language', 'University of Jordan']],
  },
];

export const tutorById = (id) => TUTORS.find((t) => t.id === id);

// Price for a 25-minute lesson is a little over half the 50-minute price.
export const priceFor = (tutor, minutes) => (minutes === 25 ? Math.round(tutor.price * 0.55 * 100) / 100 : tutor.price);

// ---- Deterministic "random" helpers so demo data looks stable ----
function hash(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
export function seeded(seed) {
  let a = hash(String(seed));
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Open time slots for a tutor on a given day (YYYY-MM-DD), as "HH:MM".
export function slotsFor(tutorId, day) {
  const rnd = seeded(tutorId + day);
  const slots = [];
  for (let h = 6; h < 23; h++) {
    for (const m of [0, 30]) {
      if (rnd() < 0.3) slots.push(`${String(h).padStart(2, '0')}:${m ? '30' : '00'}`);
    }
  }
  return slots;
}

const REVIEWERS = [
  ['Marta', 'Poland'], ['Kenji', 'Japan'], ['Olivia', 'Australia'], ['Ahmed', 'Egypt'], ['Sara', 'Sweden'],
  ['Lukas', 'Czechia'], ['Priya', 'India'], ['Tom', 'Ireland'], ['Fatima', 'Morocco'], ['Chen', 'Singapore'],
  ['Isabel', 'Chile'], ['Noah', 'Netherlands'], ['Aisha', 'Kenya'], ['Diego', 'Argentina'],
];
const REVIEW_TEXT = [
  'Every lesson feels like chatting with a friend, but I always leave with pages of notes. My confidence has gone way up.',
  'Super organised. I get a recap after each class with the mistakes I made and how to fix them.',
  'I was terrified of speaking and now I actually look forward to our lessons. Patient and encouraging.',
  'Passed my exam on the first try thanks to the mock tests and feedback. Highly recommend.',
  'Flexible with my messy schedule and always well prepared. Worth every penny.',
  'Explains grammar so clearly — things I struggled with for years finally make sense.',
  'Great mix of conversation and structure. I can follow podcasts now without subtitles.',
  'My kids ask when the next lesson is. That says everything.',
  'Helped me prepare for a job interview in two weeks. I got the job!',
  'Warm, funny and knows exactly when to push me a little harder.',
];
const AGO = ['2 days ago', '5 days ago', '1 week ago', '2 weeks ago', '3 weeks ago', '1 month ago', '2 months ago'];

export function reviewsFor(tutor, count = 5) {
  const rnd = seeded('rev' + tutor.id);
  const out = [];
  const used = new Set();
  while (out.length < count) {
    const r = REVIEWERS[Math.floor(rnd() * REVIEWERS.length)];
    const text = REVIEW_TEXT[Math.floor(rnd() * REVIEW_TEXT.length)];
    if (used.has(r[0]) || used.has(text)) continue;
    used.add(r[0]); used.add(text);
    out.push({ name: r[0], country: r[1], text, stars: rnd() < 0.85 ? 5 : 4, ago: AGO[out.length] });
  }
  return out;
}

// Short phrases used for "phrase of the day" and classroom vocabulary.
export const PHRASES = {
  english:    [['Break the ice', 'Start a conversation in a relaxed way'], ['On the same page', 'Agreeing on how things stand'], ['Touch base', 'Check in briefly with someone']],
  spanish:    [['¿Qué tal tu día?', 'How is your day going?'], ['Me apetece un café', 'I feel like a coffee'], ['Poco a poco', 'Little by little']],
  french:     [['Ça marche !', 'That works! / Deal!'], ['Je suis partant(e)', 'I’m up for it'], ['Petit à petit', 'Little by little']],
  german:     [['Das passt!', 'That works / fits!'], ['Ich hätte gern…', 'I would like…'], ['Na klar!', 'Of course!']],
  italian:    [['Che bello!', 'How lovely!'], ['Magari!', 'I wish! / If only!'], ['Piano piano', 'Slowly, step by step']],
  japanese:   [['よろしくお願いします', 'Nice to meet you / I’m in your care'], ['大丈夫です', 'I’m fine / It’s okay'], ['もう一度お願いします', 'Once more, please']],
  portuguese: [['Tudo bem?', 'All good? / How are you?'], ['Com certeza!', 'Definitely!'], ['Aos poucos', 'Little by little']],
  arabic:     [['كيف حالك؟', 'How are you?'], ['إن شاء الله', 'Hopefully / God willing'], ['شوية شوية', 'Little by little']],
};

export const AUTO_REPLIES = [
  'Sounds great! I’ll prepare something for our next lesson 😊',
  'Good question — let’s go through it together in class.',
  'Thanks for the message! See you soon.',
  'Of course. I’ll send you a few exercises before we meet.',
  'Perfect, that works for me!',
];
