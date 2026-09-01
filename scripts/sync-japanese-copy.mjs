import { writeFile } from 'node:fs/promises';

const pages = [
  { url:'https://sorenuts.jp/6667/', page:'hair' },
  { url:'https://sorenuts.jp/4580/', page:'outfit' },
  { url:'https://sorenuts.jp/4566/', page:'pose_body' },
  { url:'https://sorenuts.jp/4507/', page:'action' },
  { url:'https://sorenuts.jp/2187/', page:'species' },
  { url:'https://sorenuts.jp/2420/', page:'background' },
  { url:'https://sorenuts.jp/1954/', page:'expression' },
  { url:'https://sorenuts.jp/2908/', page:'camera' },
];

const headers = { 'User-Agent': 'SDXLTagGacha/1.0 (Japanese copy sync)' };
// 顔文字タグ（^_^、:d、@_@ など）も許可する。カンマはAPIの区切り文字なので除外。
const tagPattern = /^[a-z0-9<>=@+.:;!?^|()' _\/-]+$/i;
const junkTag = /^(?:danbooru|novel ai|stable diffusion|midjourney|english|prompt|none|tags?)$/i;
const labelFixes = {
  alternate_hairstyle:'別の髪型', 'top-down_bottom-up':'うつ伏せで腰を上げる', wrist_scrunchie:'手首のシュシュ', footwear_ribbon:'靴のリボン',
  hair_intakes:'インテーク', shiny_skin:'つやのある肌', 'symbol-shaped_pupils':'模様入りの瞳孔', solid_circle_pupils:'丸い瞳孔',
  heterochromia:'オッドアイ', bright_pupils:'光る瞳孔', white_pupils:'白い瞳孔', 'heart-shaped_pupils':'ハート形の瞳孔',
  slit_pupils:'縦長の瞳孔', 'star-shaped_pupils':'星形の瞳孔', constricted_pupils:'収縮した瞳孔',
  'cross-shaped_pupils':'十字形の瞳孔', 'diamond-shaped_pupils':'ひし形の瞳孔', mismatched_pupils:'左右で形の違う瞳孔',
  'flower-shaped_pupils':'花形の瞳孔', 'x-shaped_pupils':'X形の瞳孔', horizontal_pupils:'横長の瞳孔',
  heads_together:'頭を寄せ合う', melting:'溶ける', pinching:'つまむ',
  merfolk:'人魚族', centaur:'ケンタウロス', native_american:'アメリカ先住民',
  cropped_jacket:'丈の短いジャケット', solo_focus:'単独フォーカス', head_wings:'頭に生えた翼',
  "hand_on_another's_face":'相手の顔に片手', "hands_on_another's_face":'相手の顔に両手',
  "hand_on_another's_waist":'相手の腰に片手', "hands_on_another's_waist":'相手の腰に両手', "hands_on_another's_hips":'相手の腰骨に両手'
};

function decode(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function textFromCell(html) {
  return decode(html
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
  ).split('\n').map(line => line.replace(/[\t\r ]+/g, ' ').trim()).filter(Boolean);
}

function normalizeTag(value) {
  return value.toLowerCase().trim().replaceAll(' ', '_');
}

function naturalLabel(lines) {
  let label = lines[0] || '';
  if (/とは$/.test(label)) {
    const detail = lines.slice(1).find(line => /[ぁ-んァ-ヶ一-龠]/.test(line));
    if (detail) label = detail.replace(/^[-–—・\s]+/, '');
  }
  label = label.replace(/^[-–—・| ]+/, '').replace(/[。.:：]+$/, '').trim();
  label = label.replace(/^(?:\([^)]*\)|（[^）]*）)\s*/, '').trim();
  const aliases = label.split(/[、／/]/).map(item => item.trim()).filter(Boolean);
  label = aliases[0] || label;
  label = label.replace(/\s*,\s*/g, '・').replace(/\s+/g, ' ');
  if (label.length > 28) label = label.replace(/[（(].*$/, '').trim();
  return label.slice(0, 32);
}

function cleanHeading(value) {
  return value
    .replace(/・?\s*(?:Danbooru|e621)語.*$/i, '')
    .replace(/Pony系モデル.*$/i, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\s・]+$/g, '')
    .replace(/^[\s・]+/g, '')
    .trim();
}

const copy = {};
for (const { url, page } of pages) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const html = await response.text();
  let section = '';
  let subsection = '';
  let microcategory = '';
  let e621 = false;
  let columnHeaders = [];
  for (const event of html.matchAll(/<(h[2-6]|tr)[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const kind = event[1].toLowerCase();
    if (kind !== 'tr') {
      const rawHeading = textFromCell(event[2]).join(' ');
      const heading = cleanHeading(rawHeading);
      const level = Number(kind.slice(1));
      if (level <= 3) e621 = /e621/i.test(rawHeading) ? true : false;
      if (!heading || heading.length > 80) continue;
      if (level === 2) { section = heading; subsection = ''; microcategory = ''; columnHeaders = []; }
      if (level === 3) { subsection = heading; microcategory = ''; columnHeaders = []; }
      if (level >= 4) microcategory = heading;
      continue;
    }
    const rawHeadingCells = [...event[2].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(match => textFromCell(match[1]).join(' ')).filter(Boolean);
    if (rawHeadingCells.length) {
      const rawHeading = rawHeadingCells.join('・');
      const heading = cleanHeading(rawHeading);
      if (/e621/i.test(rawHeading)) e621 = true;
      columnHeaders = rawHeadingCells.map(cleanHeading);
      if (!/^(?:日本語訳|英語)(?:・(?:日本語訳|英語))*$/.test(heading)) microcategory = heading;
      continue;
    }
    if (e621 || /e621/i.test(microcategory)) continue;
    const cells = [...event[2].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(match => textFromCell(match[1]));
    for (let index = 1; index < cells.length; index++) {
      const rawTag = cells[index].join(' ').trim();
      if (!tagPattern.test(rawTag) || junkTag.test(rawTag) || /[ぁ-んァ-ヶ一-龠]/.test(rawTag)) continue;
      const description = cells[index - 1];
      if (!description.length || !/[ぁ-んァ-ヶ一-龠]/.test(description.join(''))) continue;
      const tag = normalizeTag(rawTag);
      const ja = labelFixes[tag] || naturalLabel(description);
      if (!ja || !/[ぁ-んァ-ヶ一-龠]/.test(ja)) continue;
      const score = (value) => (value.length <= 20 ? 3 : 0) - (/(?:とは|が|を|に|の|または|など)$/.test(value) ? 5 : 0) - ((value.match(/[A-Za-z]/g) || []).length > 5 ? 2 : 0);
      const placement = { source:url, page, section:cleanHeading(subsection || section), microcategory:cleanHeading(microcategory || subsection || section), column:cleanHeading(columnHeaders[index] || '') };
      if (!copy[tag]) copy[tag] = { ja, placements:[] };
      if (score(ja) > score(copy[tag].ja)) copy[tag].ja = ja;
      const placementKey = `${page}|${placement.section}|${placement.microcategory}|${placement.column}`;
      if (!copy[tag].placements.some(item => `${item.page}|${item.section}|${item.microcategory}|${item.column}` === placementKey)) copy[tag].placements.push(placement);
    }
  }
}

await writeFile(new URL('./.japanese-copy.tmp.json', import.meta.url), `${JSON.stringify(copy, null, 2)}\n`);
console.log(`Natural Japanese records: ${Object.keys(copy).length}`);
