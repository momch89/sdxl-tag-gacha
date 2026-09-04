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

const garmentNouns = [
  ['one-piece_swimsuit','ワンピース水着',/ワンピース水着/], ['slingshot_swimsuit','スリングショット水着',/スリングショット水着/],
  ['sweater_vest','セーターベスト',/セーターベスト|ニットベスト/], ['sailor_collar','セーラー襟',/セーラー襟/],
  ['dress_shirt','ドレスシャツ',/ドレスシャツ/], ['t_shirt','Tシャツ',/Tシャツ/], ['miniskirt','ミニスカート',/ミニスカート/],
  ['thighhighs','サイハイソックス',/サイハイ|ニーハイ/], ['kneehighs','ハイソックス',/ハイソックス/],
  ['pantyhose','タイツ',/タイツ|パンスト/], ['stockings','ストッキング',/ストッキング/],
  ['cardigan','カーディガン',/カーディガン/], ['capelet','ケープレット',/ケープレット/], ['bodysuit','ボディスーツ',/ボディスーツ/],
  ['sweater','セーター',/セーター|ニット/], ['hoodie','パーカー',/パーカー|フーディ/], ['swimsuit','水着',/水着/],
  ['leotard','レオタード',/レオタード/], ['jacket','ジャケット',/ジャケット/], ['sleeves','袖',/袖/],
  ['blouse','ブラウス',/ブラウス/], ['camisole','キャミソール',/キャミソール/], ['tank_top','タンクトップ',/タンクトップ/],
  ['shirt','シャツ',/シャツ/], ['skirt','スカート',/スカート/], ['shorts','ショートパンツ',/ショートパンツ/],
  ['pants','パンツ',/パンツ|ズボン/], ['panties','ショーツ',/ショーツ|パンティ/], ['dress','ドレス',/ドレス|ワンピース/],
  ['cloak','マント',/マント|クローク/], ['cape','ケープ',/ケープ/], ['coat','コート',/コート/], ['vest','ベスト',/ベスト/],
  ['robe','ローブ',/ローブ/], ['hood','フード',/フード/], ['bikini','ビキニ',/ビキニ/], ['boots','ブーツ',/ブーツ/],
  ['shoes','靴',/靴|シューズ/], ['socks','ソックス',/ソックス|靴下/], ['gloves','手袋',/手袋|グローブ/],
  ['bra','ブラ',/ブラ/], ['kimono','着物',/着物|和服/],
];

const colorDescriptors = new Map([
  ['white','白い'], ['black','黒い'], ['blue','青い'], ['brown','茶色の'], ['red','赤い'], ['grey','グレーの'],
  ['green','緑の'], ['pink','ピンクの'], ['purple','紫の'], ['yellow','黄色い'], ['orange','オレンジ色の'],
  ['light_brown','薄茶色の'], ['light_blue','水色の'], ['light_purple','薄紫の'], ['dark_blue','濃い青の'],
  ['aqua','水色の'], ['gold','金色の'], ['silver','銀色の'], ['two-tone','ツートンカラーの'],
  ['multicolored','カラフルな'], ['gradient','グラデーションの'], ['rainbow','虹色の'], ['split-color','2色に分かれた'],
  ['colored_inner','インナーカラーの'], ['colored','色付きの'],
  ['striped','ストライプ柄の'], ['vertical-striped','縦縞の'], ['diagonal-striped','斜め縞の'], ['pinstripe','細い縦縞の'],
  ['plaid','チェック柄の'], ['checkered','市松模様の'], ['polka_dot','水玉模様の'], ['print','柄入りの'],
  ['camouflage','迷彩柄の'], ['gingham','ギンガムチェック柄の'], ['argyle','アーガイル柄の'], ['american_flag','星条旗柄の'],
  ['strawberry','イチゴ柄の'], ['bear','クマ柄の'], ['cow_print','牛柄の'], ['german_flag','ドイツ国旗柄の'],
  ['floral','花柄の'], ['heart','ハート柄の'], ['grid','格子柄の'], ['paw_print','肉球柄の'], ['snowflake','雪の結晶柄の'],
  ['honeycomb','ハニカム柄の'], ['flag','旗柄の'], ['lace','レース柄の'], ['food-themed','食べ物柄の'],
]);

const patternDescriptors = new Set([
  'striped', 'vertical-striped', 'horizontal-striped', 'diagonal-striped', 'pinstripe', 'plaid', 'checkered',
  'polka_dot', 'print', 'camouflage', 'gingham', 'argyle', 'american_flag',
  'strawberry', 'bear', 'cow_print', 'german_flag', 'floral', 'heart', 'grid', 'paw_print', 'snowflake',
  'honeycomb', 'flag', 'lace', 'food-themed',
]);

const coloredObjects = [
  ...garmentNouns,
  ['fundoshi','ふんどし',/ふんどし/], ['loincloth','腰布',/腰布/], ['legwear','レッグウェア',/レッグウェア/],
  ['hairband','ヘアバンド',/ヘアバンド/], ['neckerchief','ネッカチーフ',/ネッカチーフ/], ['necktie','ネクタイ',/ネクタイ/],
  ['eyeliner','アイライナー',/アイライナー/], ['background','背景',/背景/], ['earrings','イヤリング',/イヤリング|ピアス/],
  ['pupils','瞳孔',/瞳孔/], ['sclera','強膜',/強膜/], ['ribbon','リボン',/リボン/], ['gloves','手袋',/手袋|グローブ/],
  ['hair','髪',/髪/], ['clothes','服',/服|衣装/], ['halo','天使の輪',/天使の輪|光輪/], ['hat','帽子',/帽子/],
  ['scarf','スカーフ',/スカーフ/], ['ascot','アスコットタイ',/アスコット/], ['bow','リボン',/リボン|蝶ネクタイ/],
  ['belt','ベルト',/ベルト/], ['wings','翼',/翼/], ['horns','角',/角/], ['skin','肌',/肌/], ['sky','空',/空/],
  ['moon','月',/月/], ['eyes','瞳',/目|瞳/], ['lips','唇',/唇/], ['trim','縁取り',/縁取り|縁飾り/], ['pattern','模様',/模様/],
];

const garmentLabelOverrides = new Map([
  ['sleeveless_shirt','袖無しシャツ'], ['sleeveless_sweater','袖無しセーター'], ['sleeveless_dress','袖無しドレス'],
  ['ribbed_sweater','リブ編みセーター'], ['off-shoulder_sweater','肩出しセーター'], ['cropped_sweater','丈が短いセーター'],
  ['sweater_lift','セーターをたくし上げる'], ['sweater_pull','セーターの襟を引っ張る'], ['sweater_tug','セーターの裾を引っ張る'],
  ['sweater_around_waist','腰に巻いたセーター'], ['sweater_around_neck','首に巻いたセーター'], ['sweater_tucked_in','ボトムスに入れたセーター'],
  ['sideless_dress','脇が開いたドレス'], ['shirt_tucked_in','シャツをボトムスの中に入れる'], ['unbuttoned_shirt','ボタンを留めていないシャツ'],
  ['skirt_cutout','裾付近が切り抜かれたスカート'], ['crotch_seam','股部分に縫い目のあるショーツ'],
  ['wet_panties','濡れたショーツ'], ['crotchless_panties','股部分が開いたショーツ'], ['stained_panties','染みの付いたショーツ'],
]);

function garmentFor(name) {
  return garmentNouns.find(([key]) => new RegExp(`(?:^|_)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_|$)`).test(name));
}

function coloredObjectFor(name) {
  return coloredObjects.find(([key]) => new RegExp(`(?:^|_)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_|$)`).test(name));
}

function descriptorFor(name, object) {
  const [key] = object;
  return name.replace(new RegExp(`(?:^|_)${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:_|$)`), '_').replace(/^_+|_+$/g, '');
}

function coloredObjectLabel(name, object) {
  const [, noun] = object;
  const descriptor = descriptorFor(name, object);
  return colorDescriptors.has(descriptor) ? `${colorDescriptors.get(descriptor)}${noun}` : '';
}

function organizeColorMicrocategory(page, subcategory, microcategory, name) {
  const object = coloredObjectFor(name);
  if (!object || !colorDescriptors.has(descriptorFor(name, object))) return microcategory;
  if (page === 'hair' && subcategory === '髪色') return microcategory;
  if (page === 'pose_body' && /肌の色|肌色/.test(microcategory)) return microcategory;
  const kind = patternDescriptors.has(descriptorFor(name, object)) ? '柄タグ' : '色タグ';
  if (kind === '柄タグ' && /色タグ/.test(microcategory)) return microcategory.replace('色タグ', '柄タグ');
  if (kind === '柄タグ' && /柄|パターン/.test(microcategory) && !/効果・色・柄背景/.test(microcategory)) return microcategory;
  if (kind === '色タグ' && /色タグ/.test(microcategory)) return microcategory;
  return `${kind}（${subcategory}）`;
}

function shortJapanese(name, sorenuts, csv, microcategory) {
  const source = (sorenuts || '').trim();
  const csvLabel = (csv || '').trim();
  const suspicious = !/[ぁ-んァ-ヶ一-龠]/.test(source) || /["「]$|\([^)]*$/.test(source) || source.length > 24;
  let label = suspicious && csvLabel ? csvLabel : source || csvLabel || '名称未設定';
  const garment = garmentFor(name);
  const coloredObject = coloredObjectFor(name);
  if (garmentLabelOverrides.has(name)) label = garmentLabelOverrides.get(name);
  else if (coloredObject) label = coloredObjectLabel(name, coloredObject) || label;
  else if (garment && /構造的特徴|セーター/.test(microcategory) && !garment[2].test(label)) {
    label = `${label.endsWith('露出') ? `${label}した` : label}${garment[1]}`;
  }
  return label.slice(0, 32);
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
  const { info, subcategory } = taxonomy;
  const microcategory = organizeColorMicrocategory(info.id, subcategory, taxonomy.microcategory, name);
  const groups = groupMaps.get(info.id);
  if (!groups.has(subcategory)) {
    const group = { id:stableId(info.id, subcategory), name:subcategory, tags:[], optional:/未分類|反映されにくい/.test(subcategory) };
    groups.set(subcategory, group);
    categoryMap.get(info.id).subcategories.push(group);
  }
  const ja = shortJapanese(name, entry.ja, reference.translations.get(name), microcategory);
  groups.get(subcategory).tags.push({ tag:name.replaceAll('_', ' '), ja, postCount, microcategory });
  seenTags.add(name);
}

const categories = [...categoryMap.values()].filter(category => category.subcategories.length);
const countObject = Object.fromEntries([...seenTags].sort().map(name => [name, reference.counts.get(name)]));
await writeFile(new URL('../app/danbooru-counts.json', import.meta.url), `${JSON.stringify(countObject, null, 2)}\n`);
await writeFile(new URL('../app/danbooru-import.json', import.meta.url), `${JSON.stringify(categories, null, 2)}\n`);
console.log(`SoreNuts taxonomy: ${categories.length} categories, ${categories.reduce((sum, category) => sum + category.subcategories.length, 0)} subcategories, ${seenTags.size} Danbooru tags${csvReference ? ' (CSV reference)' : ''}`);
