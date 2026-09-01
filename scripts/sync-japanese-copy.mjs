import { writeFile } from 'node:fs/promises';

const pages = [
  ['https://sorenuts.jp/6667/', '髪や髪型として描く。'],
  ['https://sorenuts.jp/4580/', '服装や装飾として描く。'],
  ['https://sorenuts.jp/4566/', '身体の形や姿勢へ反映。'],
  ['https://sorenuts.jp/4507/', '人物の動作として描く。'],
  ['https://sorenuts.jp/2187/', '人物の種族や特徴へ反映。'],
  ['https://sorenuts.jp/2420/', '背景や環境として描く。'],
  ['https://sorenuts.jp/1954/', '顔や表情へ反映。'],
  ['https://sorenuts.jp/2908/', '構図やカメラ表現へ反映。'],
  ['https://sorenuts.jp/22349/', '背景や小物として描く。'],
  ['https://sorenuts.jp/22344/', '顔や表情へ反映。'],
  ['https://sorenuts.jp/22334/', '服装や装飾として描く。'],
];

const headers = { 'User-Agent': 'SDXLTagGacha/1.0 (Japanese copy sync)' };
const tagPattern = /^[a-z0-9][a-z0-9_()' -]*(?:\(cosplay\))?$/i;
const junkTag = /^(?:danbooru|novel ai|stable diffusion|midjourney|english|prompt|none|tags?)$/i;
const labelFixes = {
  alternate_hairstyle:'別の髪型', 'top-down_bottom-up':'うつ伏せで腰を上げる', wrist_scrunchie:'手首のシュシュ', footwear_ribbon:'靴のリボン',
  hair_intakes:'ヘアインテーク', shiny_skin:'つやのある肌', 'symbol-shaped_pupils':'模様入りの瞳孔', solid_circle_pupils:'丸い瞳孔',
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

const copy = {};
for (const [url, fallback] of pages) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const html = await response.text();
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(match => textFromCell(match[1]));
    for (let index = 1; index < cells.length; index++) {
      const rawTag = cells[index].join(' ').trim();
      if (!tagPattern.test(rawTag) || junkTag.test(rawTag) || /[ぁ-んァ-ヶ一-龠]/.test(rawTag)) continue;
      const description = cells[index - 1];
      if (!description.length || !/[ぁ-んァ-ヶ一-龠]/.test(description.join(''))) continue;
      const tag = normalizeTag(rawTag);
      const ja = labelFixes[tag] || naturalLabel(description);
      if (!ja || !/[ぁ-んァ-ヶ一-龠]/.test(ja)) continue;
      const score = (value) => (value.length <= 20 ? 3 : 0) - (/(?:とは|が|を|に|の|または|など)$/.test(value) ? 5 : 0) - ((value.match(/[A-Za-z]/g) || []).length > 5 ? 2 : 0);
      if (!copy[tag] || score(ja) > score(copy[tag].ja)) copy[tag] = { ja, source: url };
    }
  }
}

await writeFile(new URL('./.japanese-copy.tmp.json', import.meta.url), `${JSON.stringify(copy, null, 2)}\n`);
console.log(`Natural Japanese records: ${Object.keys(copy).length}`);
