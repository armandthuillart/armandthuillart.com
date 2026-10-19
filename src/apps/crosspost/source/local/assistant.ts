export type Reply = { text: string; stage?: Stage; versions?: Record<Platform, string> };
export type Turn = { role: 'user' | 'assistant'; text: string; stage?: Stage };
type Locale = 'en' | 'fr';

type Platform = 'x' | 'bluesky' | 'threads' | 'mastodon' | 'linkedin';
type Stage = 'ask-job' | 'ask-casual' | 'ask-formal' | 'ask-grow';

const LIMITS: Record<Platform, number> = {
  bluesky: 300,
  linkedin: 3000,
  mastodon: 500,
  threads: 500,
  x: 280,
};
const PLATFORMS: Platform[] = ['x', 'bluesky', 'threads', 'mastodon', 'linkedin'];
const PLATFORM_WORDS: [Platform, RegExp][] = [
  ['x', /\b(x|twitter|tweet|tweets)\b/i],
  ['linkedin', /\blinked\s?in\b/i],
  ['bluesky', /\bbluesky\b/i],
  ['threads', /\bthreads\b/i],
  ['mastodon', /\bmastodon\b/i],
];

const clip = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6))}…`;
};
const sentences = (text: string) =>
  text
    .match(/[^.!?\n]+[.!?]*/g)
    ?.map((s) => s.trim())
    .filter(Boolean) ?? [text];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pick = <T>(items: T[], seed: string) =>
  items[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % items.length];
const detectPlatform = (text: string) => PLATFORM_WORDS.find(([, re]) => re.test(text))?.[0];

const CONTRACTIONS: [RegExp, string][] = [
  [/\bcan't\b/gi, 'cannot'],
  [/\bwon't\b/gi, 'will not'],
  [/\bdon't\b/gi, 'do not'],
  [/\bdoesn't\b/gi, 'does not'],
  [/\bI'm\b/g, 'I am'],
  [/\bI've\b/g, 'I have'],
  [/\bI'll\b/g, 'I will'],
  [/\bit's\b/gi, 'it is'],
  [/\bwe're\b/gi, 'we are'],
  [/\bwe've\b/gi, 'we have'],
  [/\bthat's\b/gi, 'that is'],
  [/\bisn't\b/gi, 'is not'],
];
const SLANG_FORMAL: [RegExp, string][] = [
  [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'],
  [/\bkinda\b/gi, 'somewhat'],
  [/\bawesome\b/gi, 'excellent'],
  [/\bsuper\b/gi, 'very'],
  [/\bstuff\b/gi, 'work'],
  [/\bhuge\b/gi, 'significant'],
  [/\bhey\b/gi, 'Hello'],
  [/\bthanks\b/gi, 'thank you'],
  [/\bcool\b/gi, 'great'],
  [/\bfolks\b/gi, 'colleagues'],
  [/\bbig\b/gi, 'major'],
];
const CASUAL: [RegExp, string][] = [
  [/\bdo not\b/gi, "don't"],
  [/\bcannot\b/gi, "can't"],
  [/\bI am\b/g, "I'm"],
  [/\bI have\b/g, "I've"],
  [/\bit is\b/gi, "it's"],
  [/\bwe are\b/gi, "we're"],
  [/\bwill not\b/gi, "won't"],
  [/\butilize\b/gi, 'use'],
  [/\bleverage\b/gi, 'use'],
  [/\bapproximately\b/gi, 'about'],
  [/\bpurchase\b/gi, 'buy'],
  [/\bdelighted\b/gi, 'stoked'],
  [/\bpleased\b/gi, 'happy'],
  [/\bhowever\b/gi, 'but'],
  [/\bfurthermore\b/gi, 'plus'],
  [/\bexcellent\b/gi, 'great'],
  [/\bsignificant\b/gi, 'big'],
  [/\bsubsequently\b/gi, 'then'],
];

const formalize = (text: string) => {
  let out = text
    .replaceAll(/\p{Extended_Pictographic}️?/gu, '')
    .replaceAll(/!+/g, '.')
    .replaceAll(/\s{2,}/g, ' ')
    .trim();
  for (const [re, to] of [...CONTRACTIONS, ...SLANG_FORMAL]) out = out.replace(re, to);
  return sentences(out).map(capitalize).join(' ');
};
const casualize = (text: string) => {
  let out = text.trim();
  for (const [re, to] of CASUAL) out = out.replace(re, to);
  const parts = sentences(out);
  const last = parts.length - 1;
  return parts
    .map((s, i) => (i === last && s.endsWith('.') && s.length < 90 ? `${s.slice(0, -1)} :)` : s))
    .join(' ');
};

const hashtagsFrom = (text: string, max: number) =>
  [...new Set((text.match(/#\w+/g) ?? []).map((t) => t.toLowerCase()))].slice(0, max);

function adapt(body: string, locale: Locale, tags: string[] = []): Record<Platform, string> {
  const clean = body.replaceAll(/\s+\n/g, '\n').trim();
  const flat = clean.replaceAll(/\s*\n+\s*/g, ' ');
  const first = sentences(flat)[0] ?? flat;
  const tagLine = (n: number) => (tags.length ? ` ${tags.slice(0, n).join(' ')}` : '');
  const paragraphs = sentences(flat).reduce<string[]>((acc, s, i) => {
    if (i % 2 === 0) acc.push(s);
    else acc[acc.length - 1] += ` ${s}`;
    return acc;
  }, []);
  const cta = locale === 'fr' ? 'Et vous, qu’en pensez-vous ?' : 'What do you think?';
  return {
    bluesky: clip(flat, LIMITS.bluesky),
    linkedin:
      clip(
        `${paragraphs.join('\n\n')}\n\n${cta}${tags.length ? `\n\n${tags.join(' ')}` : ''}`,
        LIMITS.linkedin,
      ) || first,
    mastodon: clip(`${flat}${tags.length ? `\n\n${tags.join(' ')}` : ''}`, LIMITS.mastodon),
    threads: clip(`${flat}${tagLine(2)}`, LIMITS.threads),
    x: clip(flat + tagLine(1), LIMITS.x),
  };
}

function jobFacts(text: string) {
  const company = text.match(
    /\b(?:at|with|joined|joining|join|rejoint|rejoins|chez)\s+([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*){0,3})/,
  )?.[1];
  const role = text
    .match(
      /\b(?:as|become|became|new role[:\s]+|poste de|en tant que)\s+(?:an?\s+|the\s+|un\s+|une\s+)?([^,.!\n]+?)(?=\s+(?:at|with|chez)\b|[,.!\n]|$)/i,
    )?.[1]
    ?.trim();
  const lead = text
    .match(/^\s*(?:I(?:'m| am)\s+(?:an?\s+)?)?([^,.!\n]+?)\s+(?:at|chez)\s+[A-Z]/i)?.[1]
    ?.trim();
  return {
    company,
    role: role ?? lead,
  };
}

const T = {
  en: {
    ask: 'What should this post be about? Give me the idea in a sentence or two and I will turn it into drafts for every network.',
    askCasual:
      'Sure thing. Paste the tweet you want to loosen up and I will make it sound like a human wrote it over coffee.',
    askFormal:
      'Happy to. Share the post, and tell me which network it is for (LinkedIn, X, and so on) so I can match the right level of formality.',
    askGrow:
      'Good goal. Which network do you want to grow, and what is the account for (personal brand, a product, a newsletter)?',
    askJob:
      'Congrats in advance! To write something that sounds like you, tell me three things: your new role, the company, and one thing you are excited about.',
    casualIntro:
      'Here is a more relaxed take. I swapped the stiff phrasing for everyday words and kept your point intact.',
    draftIntro:
      'Here is your post adapted for each network. I trimmed it to fit the limits (280 on X, 300 on Bluesky, 500 on Mastodon and Threads) and gave LinkedIn some breathing room. Tweak anything you like.',
    draftLong:
      'I shortened it where needed so it fits every character limit. Check X and Bluesky first, since they cut the most.',
    formalIntro: (p: string) =>
      `Done. I removed slang, expanded contractions and tightened the tone${p ? `, with ${p} in mind` : ''}. Here are all the versions.`,
    greet: [
      'Hey! What are we posting today? Paste a draft and I will adapt it for each network, or tell me what you want to say.',
      'Hi! Got something you want to share? Give me the idea or a rough draft and I will shape it for every network.',
    ],
    grow: {
      linkedin:
        'For LinkedIn: post 3 times a week, lead with a specific story or lesson, answer every comment in the first hour, and spend 10 minutes a day commenting on people in your niche. Profile first: a clear headline and banner convert visitors into followers.',
      x: 'For X: reply to bigger accounts in your niche before you post your own takes, keep one topic per account, and turn your best posts into threads. Consistency beats volume: one good post a day for a month.',
      bluesky:
        'For Bluesky: join a starter pack in your field, post original takes rather than reposts, and engage in replies. The audience is small but very responsive, so early followers matter more.',
      threads:
        'For Threads: conversational questions do best. Post 1 to 3 times a day, reply to your own comments, and cross-post the best Instagram moments.',
      mastodon:
        'For Mastodon: pick an instance that matches your topic, write an intro post with hashtags, add alt text to images, and stay out of engagement-bait. Community norms matter a lot here.',
      generic:
        'Pick one network first and go deep. Post consistently on 2 or 3 recurring themes, reply to others as much as you post, and reuse your best content across networks with Crosspost. Tell me the network and I will get specific.',
    },
    jobBody: (r: string, c: string, extra: string) =>
      `Big news: I am joining ${c} as ${/^[aeiou]/i.test(r) ? 'an' : 'a'} ${r.charAt(0).toLowerCase()}${r.slice(1)}.${extra ? ` ${extra}` : ' I am excited about the team and what we are going to build together.'} Thank you to everyone who helped me get here.`,
    jobIntro: (r: string, c: string) =>
      `Nice, ${r} at ${c} is a solid move. Here is a draft for every network, with LinkedIn getting the longer story. Edit anything inline.`,
    jobMissing:
      'I caught part of it, but I am missing the company or the role. Could you give it in one line, like "Product designer at Acme, excited to work on onboarding"?',
    thanks: 'Anytime. Send me the next one whenever you are ready.',
    tips: {
      hashtags:
        'Keep hashtags rare: one or two on X and Threads, three to five on LinkedIn and Mastodon (where they drive discovery). Bluesky mostly ignores them, so skip them there.',
      hook: 'Open with the result or the surprise, not the setup. "We cut onboarding from 9 steps to 3" beats "Some thoughts on onboarding". The first line is all most people read.',
      length:
        'Aim for under 200 characters on X and Bluesky, 3 to 5 short paragraphs on LinkedIn. Short lines with blank space between them get read more on LinkedIn.',
      time: 'Weekday mornings in your audience time zone work best for LinkedIn and X. Test two slots for two weeks and keep whichever gets more replies.',
      thread:
        'Use a thread when the idea has steps or a story: hook first, one point per post, and a closing post with the takeaway. A single post is better for opinions.',
      fallback:
        'Good question. I am best at writing and rewriting posts: paste a draft or an idea and I will adapt it to every network. I can also give tips on hashtags, hooks, length or timing.',
    },
  },
  fr: {
    ask: 'Sur quoi porte ce post ? Donne-moi l’idée en une ou deux phrases et j’écris une version pour chaque réseau.',
    askCasual:
      'Bien sûr. Colle le tweet à détendre et je le rends plus naturel, comme à voix haute.',
    askFormal:
      'Avec plaisir. Partage le post et dis-moi pour quel réseau (LinkedIn, X, etc.) pour que j’ajuste le niveau de formalité.',
    askGrow:
      'Bon objectif. Quel réseau veux-tu développer, et pour quoi (marque personnelle, un produit, une newsletter) ?',
    askJob:
      'Félicitations d’avance ! Pour écrire quelque chose qui te ressemble, dis-moi trois choses : ton nouveau poste, l’entreprise, et ce qui t’enthousiasme.',
    casualIntro:
      'Voici une version plus décontractée. J’ai remplacé les tournures raides par des mots de tous les jours sans changer ton message.',
    draftIntro:
      'Voici ton post adapté à chaque réseau. Je l’ai raccourci pour respecter les limites (280 sur X, 300 sur Bluesky, 500 sur Mastodon et Threads) et laissé plus d’espace à LinkedIn. Modifie à ta guise.',
    draftLong:
      'Je l’ai raccourci là où il le fallait. Regarde d’abord X et Bluesky, ce sont eux qui coupent le plus.',
    formalIntro: (p: string) =>
      `C’est fait. J’ai retiré l’argot et resserré le ton${p ? `, en pensant à ${p}` : ''}. Voici toutes les versions.`,
    greet: [
      'Salut ! Qu’est-ce qu’on publie aujourd’hui ? Colle un brouillon et je l’adapte à chaque réseau, ou dis-moi ce que tu veux raconter.',
      'Hello ! Une idée à partager ? Donne-moi le sujet ou un brouillon et je m’occupe de chaque réseau.',
    ],
    grow: {
      linkedin:
        'Pour LinkedIn : publie 3 fois par semaine, commence par une histoire ou une leçon précise, réponds à chaque commentaire dans la première heure et commente 10 minutes par jour des gens de ta niche. Soigne d’abord ton profil : un titre clair et une bannière convertissent les visiteurs.',
      x: 'Pour X : réponds à de plus gros comptes de ta niche avant de publier tes avis, garde un sujet par compte et transforme tes meilleurs posts en fils. La régularité compte plus que le volume : un bon post par jour pendant un mois.',
      bluesky:
        'Pour Bluesky : rejoins un starter pack de ton domaine, publie des avis originaux plutôt que des reposts et participe aux réponses. L’audience est plus petite mais très réactive.',
      threads:
        'Pour Threads : les questions ouvertes marchent le mieux. Publie 1 à 3 fois par jour, réponds à tes commentaires et reprends tes meilleurs moments Instagram.',
      mastodon:
        'Pour Mastodon : choisis une instance qui colle à ton sujet, écris un post de présentation avec des hashtags, ajoute du texte alternatif aux images et évite l’appât à engagement.',
      generic:
        'Choisis d’abord un réseau et va en profondeur. Publie régulièrement sur 2 ou 3 thèmes récurrents, réponds autant que tu publies et réutilise tes meilleurs contenus avec Crosspost. Dis-moi le réseau et je serai plus précis.',
    },
    jobBody: (r: string, c: string, extra: string) =>
      `Grande nouvelle : je rejoins ${c} en tant que ${r}.${extra ? ` ${extra}` : ' Je suis ravi de rejoindre l’équipe et de construire des choses ensemble.'} Merci à toutes les personnes qui m’ont aidé à en arriver là.`,
    jobIntro: (r: string, c: string) =>
      `Joli, ${r} chez ${c}, c’est une belle étape. Voici une version pour chaque réseau, avec le récit le plus long sur LinkedIn. Modifie ce que tu veux directement.`,
    jobMissing:
      'J’ai compris une partie, mais il me manque l’entreprise ou le poste. Peux-tu me le donner en une ligne, par exemple « Designer produit chez Acme, ravi de travailler sur l’onboarding » ?',
    thanks: 'Quand tu veux. Envoie-moi le prochain dès que tu es prêt.',
    tips: {
      hashtags:
        'Garde les hashtags rares : un ou deux sur X et Threads, trois à cinq sur LinkedIn et Mastodon (où ils servent à la découverte). Bluesky les ignore presque, inutile d’en mettre.',
      hook: 'Commence par le résultat ou la surprise, pas le contexte. « On est passés de 9 étapes à 3 » vaut mieux que « Quelques réflexions sur l’onboarding ». La première ligne est souvent la seule lue.',
      length:
        'Vise moins de 200 caractères sur X et Bluesky, 3 à 5 courts paragraphes sur LinkedIn. Des lignes courtes aérées se lisent mieux sur LinkedIn.',
      time: 'Les matinées en semaine, dans le fuseau de ton audience, marchent le mieux sur LinkedIn et X. Teste deux créneaux pendant deux semaines et garde celui qui génère le plus de réponses.',
      thread:
        'Fais un fil quand l’idée a des étapes ou une histoire : accroche, un point par post, puis une conclusion. Pour une opinion, un seul post suffit.',
      fallback:
        'Bonne question. Je suis meilleur pour écrire et réécrire des posts : colle un brouillon ou une idée et je l’adapte à chaque réseau. Je peux aussi donner des conseils sur les hashtags, l’accroche, la longueur ou l’horaire.',
    },
  },
} as const;

const LABEL: Record<Platform, string> = {
  bluesky: 'Bluesky',
  linkedin: 'LinkedIn',
  mastodon: 'Mastodon',
  threads: 'Threads',
  x: 'X',
};

function detectIntent(prompt: string): null | Stage {
  const p = prompt.toLowerCase();
  if (p.includes('linkedin') && /(new job|nouveau job|new role|nouveau poste)/.test(p))
    return 'ask-job';
  if (
    /(casual|conversational|décontract|naturel)/.test(p) &&
    /(tweet|content|contenu)/.test(p) &&
    /(start by|commence)/.test(p)
  )
    return 'ask-casual';
  if (/(formal|formel)/.test(p) && /(start by|commence)/.test(p)) return 'ask-formal';
  if (
    /(grow|développer|growth)/.test(p) &&
    /(social|réseaux|presence|présence)/.test(p) &&
    /(start by|commence)/.test(p)
  )
    return 'ask-grow';
  return null;
}

const isGreeting = (p: string) =>
  /^(hi|hello|hey|yo|salut|bonjour|coucou|hola)\b[\s!.,]*$/i.test(p.trim());
const isThanks = (p: string) =>
  /^(thanks|thank you|thx|merci|cool|great|perfect|parfait|nice)\b[\s!.,]*$/i.test(p.trim());

export function reply(prompt: string, history: Turn[], localeInput: string): Reply {
  const locale: Locale = localeInput === 'fr' ? 'fr' : 'en';
  const t = T[locale];
  const text = prompt.trim();
  const lastStage = [...history].reverse().find((m) => m.role === 'assistant')?.stage;

  const started = detectIntent(text);
  if (started) {
    const ask = {
      'ask-casual': t.askCasual,
      'ask-formal': t.askFormal,
      'ask-grow': t.askGrow,
      'ask-job': t.askJob,
    }[started];
    return {
      stage: started,
      text: ask,
    };
  }

  if (lastStage === 'ask-job') {
    const { company, role } = jobFacts(text);
    if (!company || !role)
      return {
        stage: 'ask-job',
        text: t.jobMissing,
      };
    const clause =
      text
        .split(/[,.;!]|\band\b|\bet\b/)
        .map((c) => c.trim())
        .find(
          (c) =>
            /excit|love|passion|ravi|hâte|content|enthousiast/i.test(c) && !c.includes(company),
        ) ?? '';
    const extra =
      clause && clause.length < 120
        ? `${/^(super|so|very|really|trop|vraiment|ravi|excited|thrilled)/i.test(clause) ? (locale === 'fr' ? 'Je suis ' : 'I am ') : ''}${clause}.`
        : '';
    const body = t.jobBody(role, company, extra ? capitalize(extra) : '');
    return {
      text: t.jobIntro(role, company),
      versions: adapt(body, locale, ['#newjob', `#${company.replaceAll(/\W/g, '').toLowerCase()}`]),
    };
  }

  if (lastStage === 'ask-casual') {
    const body = casualize(text);
    return {
      text: t.casualIntro,
      versions: adapt(body, locale, hashtagsFrom(text, 2)),
    };
  }

  if (lastStage === 'ask-formal') {
    const platform = detectPlatform(text);
    const body = formalize(
      text
        .replaceAll(/\b(for|pour)\s+(linked\s?in|x|twitter|bluesky|threads|mastodon)\b\.?/gi, '')
        .trim() || text,
    );
    return {
      text: t.formalIntro(platform ? LABEL[platform] : ''),
      versions: adapt(body, locale, hashtagsFrom(text, 3)),
    };
  }

  if (lastStage === 'ask-grow') {
    const platform = detectPlatform(text);
    return { text: platform ? t.grow[platform] : t.grow.generic };
  }

  if (isGreeting(text)) return { text: pick([...t.greet], text) };
  if (isThanks(text)) return { text: t.thanks };

  const lower = text.toLowerCase();
  const asking =
    /\?\s*$/.test(text) ||
    /^(how|what|why|when|should|can|comment|quand|pourquoi|est-ce|quel)/i.test(text);
  if (asking || text.split(/\s+/).length < 5) {
    if (lower.includes('hashtag')) return { text: t.tips.hashtags };
    if (/(hook|opening|intro|accroche|start|begin|commenc)/.test(lower))
      return { text: t.tips.hook };
    if (/(long|length|short|characters|caractères|limit|court)/.test(lower))
      return { text: t.tips.length };
    if (/(when|time|schedule|quand|heure|horaire|best day)/.test(lower))
      return { text: t.tips.time };
    if (/(thread|fil)/.test(lower)) return { text: t.tips.thread };
    if (/(grow|follower|abonn|audience)/.test(lower)) return { text: t.grow.generic };
    if (asking) return { text: t.tips.fallback };
    return { text: t.ask };
  }

  const versions = adapt(text, locale, hashtagsFrom(text, 3));
  return {
    text: text.length > LIMITS.x ? `${t.draftIntro} ${t.draftLong}` : t.draftIntro,
    versions,
  };
}
