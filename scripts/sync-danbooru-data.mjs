import { readFile, writeFile } from 'node:fs/promises';

const API = 'https://danbooru.donmai.us';
const HEADERS = { 'User-Agent': 'SDXLTagGacha/1.0 (SoreNuts taxonomy sync)' };

const excluded = /(?:masterpiece|quality|absurdres|highres|lowres|artist|artstyle|drawn_by|inspired_by|official_art|official_style|traditional_media|watercolor|oil_painting|pixel_art|sketch|lineart|realistic|photorealistic|3d|render|anime_coloring|flat_color|limited_palette|monochrome|greyscale|sepia|oekaki|vector_trace|ai-generated|painterly|fine_art|manga|comic|koma|screentone|hatching|dithering|halftone|film_grain|still_life|surreal|abstract|collage|glitch|artistic_error|bad_anatomy|bad_hands|bad_feet|bad_proportions|censored|uncensored|watermark|web_address|logo|outline|no_humans|outside_border|screenshot|typo|ranguage)/i;
const unsafe = /(?:sex|nude|naked|penis|vagina|anus|pussy|cum|semen|nipple|areola|masturbat|fellatio|paizuri|rape|bondage|guro|corpse|decapitat|vore|urine|feces|ass(?:$|_)|breast|pubic|erection|testicle|clitoris|groin|cervix|uterus|perineum|foreskin|phimosis|mons|cameltoe|bulge|cleavage|underboob|sideboob|no_bra|groping|fondling|molestation|aroused|in_heat|fucked|ahegao|torogao)/i;
const structural = /^(?:tag_group:|list_of_|help:|howto:|topic:|template:)/;
const unsafePlacement = /女性器|男性器|性器|胸揉み|乳合わせ|性的|性交|成人向け/;
const unsafeJapanese = /胸揉み|乳合わせ|裏乳|胸部を揉/;

const groupInfo = {
  hair_color:['hair','hair_color','髪色',false], hair_effect:['hair','hair_extra','色分け・特殊髪',true], hair_length:['hair','hair_length','髪の長さ',false], bangs:['hair','bangs','前髪・額',false], hairstyle:['hair','hairstyle','髪型',false], hair_texture:['hair','hair_texture','髪質・毛先',false],
  eye_color:['body','eye_color','瞳の色',false], pupils:['body','pupils','瞳孔・虹彩',true], eye_shape:['body','eye_shape','目の形',true], eye_state:['body','eye_state','目の状態',true], skin:['body','skin','肌色・材質',false], face_feature:['body','face_feature','顔の特徴',true], markings:['body','markings','身体の特徴',true], body_type:['body','body_type','体型・体格',false], wings:['body','wings','翼',true], species:['body','species','獣耳・亜人・種族',true],
  top:['outfit','top','トップス',false], clothing_detail:['outfit','clothing_detail','袖・襟・着こなし',true], outerwear:['outfit','outerwear','上着・コート',true], bottom:['outfit','bottom','ボトムス',false], dresses:['outfit','dresses','ドレス・ワンピース',false], footwear:['outfit','footwear','履物',false], legwear:['outfit','legwear','靴下・脚衣',true], outfit_theme:['outfit','outfit_theme','制服・衣装',false], swimwear:['outfit','swimwear','水着・ボディスーツ',true], traditional:['outfit','traditional','伝統衣装',true], accessory:['outfit','accessory','服飾小物',true], jewelry:['outfit','jewelry','宝飾・アクセサリー',true], eyewear:['outfit','eyewear','眼鏡・顔装備',true], headwear:['outfit','headwear','帽子・頭装備',true],
  indoor:['background','indoor','屋内・施設',false], urban:['background','urban','街・建物・交通',false], nature:['background','nature','自然・水辺',false], sky:['background','sky','空・天体',true], weather:['background','weather','天候・季節・時間',false], background_detail:['background','background_detail','背景効果・柄',true],
  held_item:['prop','held_item','手持ち品',false], nearby_item:['prop','nearby_item','家具・小物',true], tech_music:['prop','tech_music','機械・音楽',true], food_drink:['prop','food_drink','食べ物・飲み物',true], weapon:['prop','weapon','武器',true], wearable:['prop','wearable','身につける小物',true],
  base_pose:['pose','base_pose','基本姿勢',false], hands:['pose','hands','手・指',false], arms:['pose','arms','腕',false], legs:['pose','legs','脚・座り方',false], gaze:['pose','gaze','視線・向き',false], action:['pose','action','移動・動作',true], interaction:['pose','interaction','接触・交流',true],
  emotion:['expression','emotion','感情・表情',false], mouth:['expression','mouth','口の表情',false], eye_expression:['expression','eye_expression','目の表情',true], face_detail:['expression','face_detail','眉・歯・鼻・化粧',true], emoticon:['expression','emoticon','顔文字表現',true], expression_symbol:['expression','expression_symbol','シンボル・吹き出し',true], emotion_detail:['expression','emotion_detail','感情の補助',true],
  framing:['camera','framing','画角',false], angle:['camera','angle','アングル',false], perspective:['camera','perspective','遠近・視点',true], focus:['camera','focus','フォーカス・動き',true], composition:['camera','composition','配置・レイアウト',true],
  light_source:['lighting','light_source','光源',false], light_direction:['lighting','light_direction','光の向き',false], light_effect:['lighting','light_effect','光・色の演出',true], atmosphere:['lighting','atmosphere','空気・環境演出',true],
};

const text = (placement) => `${placement.section || ''} ${placement.microcategory || ''} ${placement.column || ''}`;
const micro = (placement, fallback) => (placement.microcategory || placement.section || fallback)
  .replace(/\s*[（(][A-Za-z &/\-]+[）)]/g, '')
  .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
  .replace(/\s*・\s*/g, '・')
  .trim();

function classifyPlacement(placement, name) {
  const where = text(placement);
  const detail = `${placement.microcategory || ''} ${placement.column || ''}`;

  // 見出しよりタグ自体の意味を優先する横断ルール。
  if (/^(?:looking_|staring$|glance|averting_eyes|rolling_eyes|upturned_eyes)/.test(name)) return { key:'gaze', micro:'視線', score:30 };
  if (/^(?:blinking|eyelid_pull|akanbe)$/.test(name)) return { key:'action', micro:'顔・目の動作', score:29 };
  if (/^(?:eyepatch|blindfold)$/.test(name)) return { key:'eyewear', micro:'目元の装備', score:28 };
  if (/(?:^|_)(?:pupils?|iris)(?:$|_)/.test(name) || name === 'heterochromia') return { key:'pupils', micro:'瞳孔・虹彩', score:31 };
  if (/(?:^|_)(?:cat|dog|fox|wolf|rabbit|bunny|bear|mouse|cow|sheep|goat|horse|deer|kemonomimi)_ears$/.test(name)) return { key:'species', micro:'獣耳', score:30 };

  if (placement.page === 'hair') {
    if (/髪色/.test(where)) return { key:/複合|ツートン|グラデ|メッシュ/.test(where) ? 'hair_effect' : 'hair_color', micro:micro(placement,'髪色'), score:9 };
    if (/髪の動作|動作・状態/.test(where)) return { key:'action', micro:micro(placement,'髪の動作'), score:8 };
    if (/アクセサリー/.test(where)) return { key:'accessory', micro:micro(placement,'髪飾り'), score:7 };
    if (/ヒゲ/.test(where)) return { key:'face_feature', micro:micro(placement,'ひげ'), score:7 };
    if (/前髪/.test(where)) return { key:'bangs', micro:micro(placement,'前髪'), score:9 };
    if (/長さ/.test(where)) return { key:'hair_length', micro:micro(placement,'長さ'), score:9 };
    if (/テクスチャ|巻き|質感|細部/.test(where)) return { key:'hair_texture', micro:micro(placement,'髪質'), score:9 };
    return { key:'hairstyle', micro:micro(placement,'髪型'), score:7 };
  }

  if (placement.page === 'expression') {
    if (/顔文字/.test(detail)) return { key:'emoticon', micro:micro(placement,'顔文字'), score:24 };
    if (/シンボル|吹き出し/.test(detail)) return { key:'expression_symbol', micro:micro(placement,'シンボル・吹き出し'), score:23 };
    if (/目の形|瞳孔/.test(where)) {
      if (/pupil|iris|heterochromia/.test(name)) return { key:'pupils', micro:micro(placement,'瞳孔'), score:22 };
      return { key:'eye_shape', micro:micro(placement,'目の形'), score:20 };
    }
    if (/身体の震え|震える|痙攣|揺れる/.test(where)) return { key:'action', micro:micro(placement,'身体の動き'), score:18 };
    if (/目の表情|虚ろな目/.test(where)) return { key:'eye_expression', micro:micro(placement,'目の表情'), score:17 };
    if (/口の表現/.test(where)) return { key:'mouth', micro:micro(placement,'口の表情'), score:17 };
    if (/歯|鼻|眉|顔の特徴|化粧/.test(where)) return { key:'face_detail', micro:micro(placement,'顔の細部'), score:17 };
    if (/汗|赤面|涙/.test(where)) return { key:'emotion_detail', micro:micro(placement,'感情の補助'), score:15 };
    return { key:'emotion', micro:micro(placement,'感情・表情'), score:14 };
  }

  if (placement.page === 'outfit') {
    if (/トップス|シャツ|セーター/.test(where)) return { key:'top', micro:micro(placement,'トップス'), score:12 };
    if (/袖|襟|露出度|未分類/.test(where)) return { key:'clothing_detail', micro:micro(placement,'着こなし'), score:11 };
    if (/アウター/.test(where)) return { key:'outerwear', micro:micro(placement,'アウター'), score:12 };
    if (/ボトムス/.test(where)) return { key:'bottom', micro:micro(placement,'ボトムス'), score:12 };
    if (/ワンピース|ドレス/.test(where)) return { key:'dresses', micro:micro(placement,'ドレス'), score:12 };
    if (/靴・レッグウェア|ソックス|ストッキング|タイツ|レギンス/.test(where)) return { key:/靴|ブーツ|履物/.test(placement.microcategory || '') ? 'footwear' : 'legwear', micro:micro(placement,'靴・レッグウェア'), score:12 };
    if (/制服|コスチューム|擬人化/.test(where)) return { key:'outfit_theme', micro:micro(placement,'制服・衣装'), score:12 };
    if (/水着|ボディスーツ/.test(where)) return { key:'swimwear', micro:micro(placement,'水着'), score:12 };
    if (/伝統|和服|宗教/.test(where)) return { key:'traditional', micro:micro(placement,'伝統衣装'), score:12 };
    if (/眼鏡|アイウェア|顔装備/.test(where)) return { key:'eyewear', micro:micro(placement,'眼鏡・顔装備'), score:12 };
    if (/帽子|頭装備/.test(where)) return { key:'headwear', micro:micro(placement,'帽子・頭装備'), score:12 };
    if (/宝飾|ジュエリー|アクセサリー/.test(where)) return { key:/耳|首|腕|指輪|宝飾|ジュエリー/.test(where) ? 'jewelry' : 'accessory', micro:micro(placement,'アクセサリー'), score:12 };
    return { key:'clothing_detail', micro:micro(placement,'服装の細部'), score:6 };
  }

  if (placement.page === 'pose_body') {
    if (/手持ち/.test(where)) return { key:'held_item', micro:micro(placement,'手持ち品'), score:15 };
    if (/武器/.test(where)) return { key:'weapon', micro:micro(placement,'武器'), score:15 };
    if (/身体特徴|肌の色/.test(where)) {
      if (/肌の色|特殊な肌質/.test(detail) || /(?:^|_)(?:skin|tan|dark-skinned|pale)(?:$|_)/.test(name)) return { key:'skin', micro:micro(placement,'肌'), score:16 };
      if (/頭部|顔部|頸部/.test(detail)) return { key:'face_feature', micro:micro(placement,'顔・頭部'), score:15 };
      if (/体格|体型|年齢/.test(detail)) return { key:'body_type', micro:micro(placement,'体型・体格'), score:15 };
      return { key:'markings', micro:micro(placement,'身体の特徴'), score:14 };
    }
    if (/座り方|足の姿勢|脚|膝|つま先|立位/.test(where)) return { key:'legs', micro:micro(placement,'脚・座り方'), score:15 };
    if (/接触|他者|人との/.test(where)) return { key:'interaction', micro:micro(placement,'接触動作'), score:14 };
    if (/手|指差し|ハンドジェスチャー/.test(where)) return { key:'hands', micro:micro(placement,'手・指'), score:14 };
    if (/腕/.test(where)) return { key:'arms', micro:micro(placement,'腕'), score:14 };
    if (/動作|行動|アクシデント/.test(where)) return { key:'action', micro:micro(placement,'動作'), score:13 };
    return { key:'base_pose', micro:micro(placement,'基本姿勢'), score:8 };
  }

  if (placement.page === 'action') {
    if (/感情/.test(where)) return { key:'emotion', micro:micro(placement,'感情'), score:11 };
    if (/社会|関係|交流/.test(where)) return { key:'interaction', micro:micro(placement,'交流'), score:11 };
    return { key:'action', micro:micro(placement,'動作・行動'), score:10 };
  }

  if (placement.page === 'species') {
    if (/種族|民族|文化|起源|背景/.test(placement.column || '')) return { key:'species', micro:micro({...placement, microcategory:placement.section},'種族'), score:13 };
    return null;
  }

  if (placement.page === 'background') {
    if (/水関連活動/.test(where)) return { key:'action', micro:micro(placement,'水中の動作'), score:12 };
    if (/小物|家具|備品|椅子|机/.test(where)) return { key:'nearby_item', micro:micro(placement,'家具・小物'), score:14 };
    if (/電子機器/.test(where)) return { key:'tech_music', micro:micro(placement,'電子機器'), score:14 };
    if (/天候|空の状態|四季|時間帯/.test(where)) return { key:'weather', micro:micro(placement,'天候・季節・時間'), score:14 };
    if (/天体|宇宙/.test(where)) return { key:'sky', micro:micro(placement,'空・天体'), score:14 };
    if (/効果・色・柄背景/.test(where)) return { key:'background_detail', micro:micro(placement,'背景効果'), score:14 };
    if (/部屋|学校|店舗|施設/.test(where)) return { key:'indoor', micro:micro(placement,'屋内・施設'), score:13 };
    if (/交通|道路|構造物/.test(where)) return { key:'urban', micro:micro(placement,'街・交通'), score:13 };
    return { key:'nature', micro:micro(placement,'自然・水辺'), score:9 };
  }

  if (placement.page === 'camera') {
    if (/lens_flare|chromatic_aberration|bokeh|bloom|glow|light/.test(name)) return { key:'light_effect', micro:micro(placement,'光学効果'), score:13 };
    if (/from_|angle|view$|profile|top-down|side_view|behind/.test(name)) return { key:'angle', micro:micro(placement,'アングル'), score:12 };
    if (/perspective|foreshorten|pov|lens|reflection|over-the-shoulder/.test(name)) return { key:'perspective', micro:micro(placement,'遠近・視点'), score:12 };
    if (/blur|focus|depth|speed_lines|motion|zoom/.test(name)) return { key:'focus', micro:micro(placement,'フォーカス・動き'), score:12 };
    if (/body|shot|portrait|close-up|frame|waist/.test(name)) return { key:'framing', micro:micro(placement,'画角'), score:12 };
    return { key:'composition', micro:micro(placement,'構図'), score:8 };
  }

  return null;
}

function classify(entry, name) {
  const options = (entry.placements || []).map(placement => {
    const result = classifyPlacement(placement, name);
    return result ? { ...result, placement } : null;
  }).filter(Boolean);
  options.sort((a, b) => b.score - a.score);
  return options[0] || null;
}

function noteFor(categoryId, subcategoryId, ja, name) {
  if (name === 'transparent_background') return '背景を透明にする。';
  if (name === 'from_above') return '上から見下ろす構図。';
  if (name === 'from_below') return '下から見上げる構図。';
  if (name === 'from_behind') return '人物を後ろから写す。';
  if (subcategoryId === 'hair_color') return `髪色を「${ja}」にする。`;
  if (categoryId === 'hair') return `「${ja}」の髪型になる。`;
  if (subcategoryId === 'eye_color') return `「${ja}」になる。`;
  if (['pupils','eye_shape','eye_state'].includes(subcategoryId)) return `目元を「${ja}」にする。`;
  if (subcategoryId === 'skin') return `肌を「${ja}」にする。`;
  if (subcategoryId === 'wings') return `「${ja}」を生やす。`;
  if (subcategoryId === 'body_type') return `「${ja}」の体格になる。`;
  if (categoryId === 'body') return `「${ja}」の特徴が加わる。`;
  if (categoryId === 'outfit') return `「${ja}」を身につける。`;
  if (categoryId === 'background') return `背景に「${ja}」を描く。`;
  if (categoryId === 'prop') return `「${ja}」を画面に加える。`;
  if (categoryId === 'pose') return `「${ja}」の姿勢・動作になる。`;
  if (categoryId === 'expression') return `「${ja}」の表情になる。`;
  if (categoryId === 'camera') return `「${ja}」の構図になる。`;
  if (categoryId === 'lighting') return `「${ja}」の光・空気感になる。`;
  return `${ja}を描く。`;
}

async function json(url) {
  const response = await fetch(url, { headers:HEADERS });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const currentSource = await readFile(new URL('../app/tag-data.ts', import.meta.url), 'utf8');
const japaneseCopy = JSON.parse(await readFile(new URL('./.japanese-copy.tmp.json', import.meta.url), 'utf8'));
const currentTags = [...currentSource.matchAll(/\bt\('([^']+)'/g)].map(match => match[1].replaceAll(' ', '_'));
const candidates = new Map();

for (const [name, entry] of Object.entries(japaneseCopy)) {
  if (!name || structural.test(name) || excluded.test(name) || unsafe.test(name) || unsafeJapanese.test(entry.ja || '') || /(?:^|_)cover(?:$|_)/.test(name)) continue;
  if ((entry.placements || []).some(placement => unsafePlacement.test(text(placement)))) continue;
  const result = classify(entry, name);
  if (result && groupInfo[result.key]) candidates.set(name, { ...result, ja:entry.ja });
}

const lookupNames = [...new Set([...currentTags, ...candidates.keys()])];
const counts = {};
const general = new Set();
for (let index = 0; index < lookupNames.length; index += 75) {
  const names = lookupNames.slice(index, index + 75).join(',');
  const tags = await json(`${API}/tags.json?search%5Bname_comma%5D=${encodeURIComponent(names)}&limit=100`);
  for (const tag of tags) {
    counts[tag.name] = tag.post_count;
    if (tag.category === 0 && tag.post_count >= 1000) general.add(tag.name);
  }
}

const groups = new Map();
for (const [name, candidate] of candidates) {
  if (!general.has(name)) continue;
  const [categoryId, subcategoryId, subcategoryName, optional] = groupInfo[candidate.key];
  const groupKey = `${categoryId}:${subcategoryId}`;
  if (!groups.has(groupKey)) groups.set(groupKey, { categoryId, subcategoryId, subcategoryName, optional, tags:[] });
  groups.get(groupKey).tags.push({
    tag:name.replaceAll('_',' '),
    ja:candidate.ja,
    note:noteFor(categoryId, subcategoryId, candidate.ja, name),
    postCount:counts[name],
    microcategory:candidate.micro || subcategoryName,
  });
}

for (const group of groups.values()) group.tags.sort((a, b) => b.postCount - a.postCount);
await writeFile(new URL('../app/danbooru-counts.json', import.meta.url), `${JSON.stringify(counts, null, 2)}\n`);
await writeFile(new URL('../app/danbooru-import.json', import.meta.url), `${JSON.stringify([...groups.values()], null, 2)}\n`);
console.log(`SoreNuts candidates: ${candidates.size}, Danbooru general tags: ${[...groups.values()].reduce((sum, group) => sum + group.tags.length, 0)}, count records: ${Object.keys(counts).length}`);
