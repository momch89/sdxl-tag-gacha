import { readFile, writeFile } from 'node:fs/promises';

const API = 'https://danbooru.donmai.us';
const HEADERS = { 'User-Agent': 'SDXLTagGacha/1.0 (SoreNuts taxonomy sync)' };
const [countCsvPath, translationCsvPath] = process.argv.slice(2);

const pageInfo = {
  hair:{ id:'hair', name:'髪', icon:'✂', color:'#ee765b' },
  outfit:{ id:'outfit', name:'服装', icon:'◇', color:'#5d78d6' },
  pose_body:{ id:'pose_body', name:'ポーズ・身体', icon:'⌁', color:'#8468c9' },
  action:{ id:'action', name:'動作・行動', icon:'↝', color:'#b260af' },
  species:{ id:'species', name:'職業・種族', icon:'◉', color:'#8d62b8' },
  background:{ id:'background', name:'背景', icon:'▧', color:'#3e9d74' },
  expression:{ id:'expression', name:'表情・目', icon:'☺', color:'#dc5d87' },
  camera:{ id:'camera', name:'カメラ・構図', icon:'⌾', color:'#3189b6' },
};

const excluded = /(?:masterpiece|quality|absurdres|highres|lowres|artist|artstyle|drawn_by|inspired_by|official_art|official_style|traditional_media|watercolor|oil_painting|pixel_art|sketch|lineart|realistic|photorealistic|3d|render|anime_coloring|flat_color|limited_palette|monochrome|greyscale|sepia|oekaki|vector_trace|ai-generated|painterly|fine_art|manga|comic|koma|screentone|hatching|dithering|halftone|film_grain|still_life|surreal|abstract|collage|glitch|artistic_error|bad_anatomy|bad_hands|bad_feet|bad_proportions|censored|uncensored|watermark|web_address|logo|outline|no_humans|outside_border|screenshot|typo|ranguage)/i;
const unsafe = /(?:sex|nude|naked|penis|vagina|anus|pussy|cum|semen|nipple|areola|masturbat|fellatio|paizuri|rape|bondage|guro|corpse|decapitat|vore|urine|feces|ass(?:$|_)|breast|pubic|erection|testicle|clitoris|groin|cervix|uterus|perineum|foreskin|phimosis|mons|cameltoe|bulge|cleavage|underboob|sideboob|no_bra|groping|fondling|molestation|aroused|in_heat|fucked|ahegao|torogao)/i;
const unsafePlacement = /女性器|男性器|性器|胸揉み|乳合わせ|性的|性交|成人向け/;
const unsafeJapanese = /胸揉み|乳合わせ|裏乳|胸部を揉/;
const structural = /^(?:tag_group:|list_of_|help:|howto:|topic:|template:)/;

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      fields.push(value); value = '';
    } else value += char;
  }
  fields.push(value);
  return fields;
}

async function loadCsvReference() {
  if (!countCsvPath || !translationCsvPath) return null;
  const counts = new Map();
  const translations = new Map();
  const countText = await readFile(countCsvPath, 'utf8');
  for (const line of countText.split(/\r?\n/)) {
    if (!line) continue;
    const [name, category, count] = parseCsvLine(line);
    if (name && category === '0') counts.set(name, Math.max(0, Math.round(Number(count) || 0)));
  }
  const translationText = await readFile(translationCsvPath, 'utf8');
  for (const line of translationText.split(/\r?\n/)) {
    if (!line) continue;
    const [name, labels = ''] = parseCsvLine(line);
    const first = labels.split(/[、,]/).map(item => item.trim()).find(Boolean);
    if (name && first && /[ぁ-んァ-ヶ一-龠]/.test(first)) translations.set(name, first);
  }
  return { counts, translations };
}

function cleanLabel(value, fallback = 'その他') {
  const cleaned = (value || '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/\s*[（(][A-Za-z0-9 &/\-]+[）)]/g, '')
    .replace(/（アーカイブ）/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallback;
}

function taxonomyFor(placement) {
  const info = pageInfo[placement.page];
  if (!info) return null;
  let subcategory = cleanLabel(placement.section);
  let microcategory = cleanLabel(placement.microcategory || placement.section);
  if (/タグ管理ツール移動しました/.test(subcategory)) subcategory = microcategory;
  if (placement.page === 'action' && /ランキング 24時間集計/.test(subcategory)) subcategory = '運動・スポーツ';
  if (placement.page === 'camera') subcategory = 'カメラ・構図';
  if (placement.page === 'species') {
    const column = cleanLabel(placement.column, '職業・種族');
    microcategory = column.replace(/\s*[（(](?:日本語訳|英語)[）)]/g, '').replaceAll('/', '・');
  }
  return { info, subcategory, microcategory };
}

function placementScore(placement) {
  if (!pageInfo[placement.page] || unsafePlacement.test(`${placement.section} ${placement.microcategory}`)) return -100;
  let score = 10;
  if (/タグ管理ツール移動しました|ランキング 24時間集計/.test(placement.section || '')) score -= 5;
  if (/未分類/.test(placement.microcategory || '')) score -= 1;
  if (placement.column && /英語/.test(placement.column)) score += 1;
  return score;
}

function shortJapanese(sorenuts, csv) {
  const source = (sorenuts || '').trim();
  const csvLabel = (csv || '').trim();
  const suspicious = !/[ぁ-んァ-ヶ一-龠]/.test(source) || /["「]$|\([^)]*$/.test(source) || source.length > 24;
  return (suspicious && csvLabel ? csvLabel : source || csvLabel || '名称未設定').slice(0, 32);
}

function noteFor(page, ja) {
  const notes = {
    hair:`髪を「${ja}」に。`, outfit:`「${ja}」を着用。`, pose_body:`「${ja}」の姿勢・特徴。`,
    action:`「${ja}」の動作。`, species:`「${ja}」の役割・種族。`, background:`背景に「${ja}」。`,
    expression:`「${ja}」の表情・目。`, camera:`「${ja}」の構図。`,
  };
  return notes[page] || `「${ja}」を指定。`;
}

function stableId(page, label) {
  let hash = 2166136261;
  for (const char of label) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return `${page}_${(hash >>> 0).toString(36)}`;
}

async function fetchDanbooru(names) {
  const counts = new Map();
  for (let index = 0; index < names.length; index += 75) {
    const batch = names.slice(index, index + 75).join(',');
    const response = await fetch(`${API}/tags.json?search%5Bname_comma%5D=${encodeURIComponent(batch)}&limit=100`, { headers:HEADERS });
    if (!response.ok) throw new Error(`${response.status} Danbooru tags API`);
    for (const tag of await response.json()) if (tag.category === 0) counts.set(tag.name, tag.post_count);
  }
  return { counts, translations:new Map() };
}

const japaneseCopy = JSON.parse(await readFile(new URL('./.japanese-copy.tmp.json', import.meta.url), 'utf8'));
const csvReference = await loadCsvReference();
const candidateEntries = Object.entries(japaneseCopy).filter(([name, entry]) => {
  if (!name || structural.test(name) || excluded.test(name) || unsafe.test(name) || unsafeJapanese.test(entry.ja || '')) return false;
  return (entry.placements || []).some(placement => placementScore(placement) > -100);
});
const reference = csvReference || await fetchDanbooru(candidateEntries.map(([name]) => name));

const categoryMap = new Map();
for (const info of Object.values(pageInfo)) categoryMap.set(info.id, { ...info, subcategories:[] });
const groupMaps = new Map([...categoryMap.keys()].map(id => [id, new Map()]));
const seenTags = new Set();

for (const [name, entry] of candidateEntries) {
  const postCount = reference.counts.get(name) || 0;
  if (postCount <= 0 || seenTags.has(name)) continue;
  const placement = [...(entry.placements || [])].sort((a, b) => placementScore(b) - placementScore(a))[0];
  const taxonomy = taxonomyFor(placement);
  if (!taxonomy) continue;
  const { info, subcategory, microcategory } = taxonomy;
  const groups = groupMaps.get(info.id);
  if (!groups.has(subcategory)) {
    const group = { id:stableId(info.id, subcategory), name:subcategory, tags:[], optional:/未分類|反映されにくい/.test(subcategory) };
    groups.set(subcategory, group);
    categoryMap.get(info.id).subcategories.push(group);
  }
  const ja = shortJapanese(entry.ja, reference.translations.get(name));
  groups.get(subcategory).tags.push({ tag:name.replaceAll('_', ' '), ja, note:noteFor(placement.page, ja), postCount, microcategory });
  seenTags.add(name);
}

const categories = [...categoryMap.values()].filter(category => category.subcategories.length);
for (const category of categories) for (const group of category.subcategories) group.tags.sort((a, b) => b.postCount - a.postCount);
const countObject = Object.fromEntries([...seenTags].sort().map(name => [name, reference.counts.get(name)]));
await writeFile(new URL('../app/danbooru-counts.json', import.meta.url), `${JSON.stringify(countObject, null, 2)}\n`);
await writeFile(new URL('../app/danbooru-import.json', import.meta.url), `${JSON.stringify(categories, null, 2)}\n`);
console.log(`SoreNuts taxonomy: ${categories.length} categories, ${categories.reduce((sum, category) => sum + category.subcategories.length, 0)} subcategories, ${seenTags.size} Danbooru tags${csvReference ? ' (CSV reference)' : ''}`);
