import { readFile, writeFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);
const API = 'https://danbooru.donmai.us';
const HEADERS = { 'User-Agent': 'SDXLTagGacha/1.0 (tag dictionary sync)' };

const sources = [
  ['tag_group:hair_styles', 'hair'], ['tag_group:hair_color', 'hair'],
  ['tag_group:eyes_tags', 'body'], ['tag_group:skin_color', 'body'], ['tag_group:body_parts', 'body'], ['tag_group:wings', 'body'],
  ['tag_group:attire', 'outfit'], ['tag_group:backgrounds', 'background'], ['tag_group:locations', 'background'],
  ['tag_group:posture', 'pose'], ['tag_group:hands', 'pose'],
  ['tag_group:image_composition', 'camera'], ['tag_group:lighting', 'lighting'],
];

const excluded = /(?:masterpiece|quality|absurdres|highres|lowres|artist|artstyle|drawn_by|inspired_by|official_art|official_style|traditional_media|watercolor|oil_painting|pixel_art|sketch|lineart|realistic|photorealistic|3d|render|anime_coloring|flat_color|limited_palette|monochrome|greyscale|sepia|oekaki|vector_trace|ai-generated|painterly|fine_art|manga|comic|koma|screentone|hatching|dithering|halftone|film_grain|still_life|surreal|abstract|collage|glitch|artistic_error|bad_anatomy|bad_hands|bad_feet|bad_proportions|censored|uncensored|watermark|web_address|logo|cover_page|doujin_cover|album_cover|magazine_cover|fake_cover|calendar_\(medium\)|card_\(medium\)|screenshot|typo|ranguage)/i;
const unsafe = /(?:sex|nude|naked|penis|vagina|anus|pussy|cum|semen|nipple|areola|masturbat|fellatio|paizuri|rape|bondage|guro|corpse|decapitat|vore|urine|feces|ass(?:$|_)|breast|pubic|erection|testicle|clitoris|groin|cervix|uterus|perineum|foreskin|phimosis|mons|cameltoe|bulge|cleavage|underboob|sideboob|no_bra)/i;
const structural = /^(?:tag_group:|list_of_|help:|howto:|topic:|template:)/;

const tokenJa = {
  black:'黒', white:'白', red:'赤', blue:'青', green:'緑', yellow:'黄', pink:'ピンク', purple:'紫', orange:'橙', brown:'茶', grey:'灰', gray:'灰', aqua:'水色', gold:'金', golden:'金色', silver:'銀', dark:'濃い', light:'明るい', multicolored:'多色', two:'二つ', multiple:'複数', single:'一つ', long:'長い', short:'短い', very:'とても', hair:'髪', bangs:'前髪', braid:'三つ編み', braided:'編み込み', bun:'お団子', ponytail:'ポニーテール', twintails:'ツインテール', sidelocks:'横髪', forehead:'額', eyes:'瞳', eye:'目', pupils:'瞳孔', pupil:'瞳孔', sclera:'白目', skin:'肌', face:'顔', facial:'顔', ears:'耳', tail:'尻尾', wings:'翼', horns:'角', shirt:'シャツ', blouse:'ブラウス', sweater:'セーター', jacket:'ジャケット', coat:'コート', skirt:'スカート', pants:'パンツ', shorts:'短パン', dress:'ドレス', uniform:'制服', sleeves:'袖', sleeve:'袖', socks:'靴下', stockings:'ストッキング', boots:'ブーツ', shoes:'靴', gloves:'手袋', hat:'帽子', cap:'帽子', hood:'フード', collar:'襟', bow:'リボン', ribbon:'リボン', belt:'ベルト', indoors:'屋内', outdoors:'屋外', room:'部屋', street:'通り', city:'街', forest:'森', mountain:'山', beach:'海辺', sky:'空', cloud:'雲', clouds:'雲', background:'背景', standing:'立ち', sitting:'座り', lying:'寝姿勢', kneeling:'膝立ち', arms:'腕', arm:'腕', hands:'手', hand:'手', legs:'脚', leg:'脚', looking:'見る', viewer:'こちら', head:'頭', body:'身体', holding:'持つ', light:'光', lighting:'照明', shadow:'影', shadows:'影', sunlight:'日差し', moonlight:'月明かり', backlighting:'逆光', close:'近い', view:'視点', from:'から', above:'上', below:'下', behind:'後ろ', side:'横', full:'全体', upper:'上半分', focus:'焦点', perspective:'遠近', motion:'動き', blur:'ぼけ', depth:'奥行き', open:'開く', closed:'閉じる', crossed:'交差', raised:'上げる', tilted:'傾ける', on:'上', off:'外す', around:'周り', under:'下', over:'上', own:'自分の', other:'他人の', animal:'動物', demon:'悪魔', angel:'天使', bird:'鳥', insect:'虫', mechanical:'機械', transparent:'透明', glowing:'発光', simple:'単純', gradient:'グラデーション', pattern:'模様', striped:'縞', plaid:'チェック', high:'高い', low:'低い', front:'前', back:'後ろ', left:'左', right:'右', one:'片方', both:'両方', with:'付き', without:'なし'
};

const exactJa = {
  ahoge:'アホ毛', drill_hair:'縦ロール', hime_cut:'姫カット', bob_cut:'ボブ', pixie_cut:'ピクシーカット', blunt_bangs:'ぱっつん前髪', asymmetrical_bangs:'非対称前髪', hair_over_one_eye:'片目隠れ', hair_between_eyes:'目の間の髪', animal_ears:'獣耳', pointy_ears:'尖り耳', heterochromia:'オッドアイ', tareme:'たれ目', tsurime:'つり目', sanpaku:'三白眼', serafuku:'セーラー服', kimono:'着物', yukata:'浴衣', hakama:'袴', maid:'メイド服', barefoot:'裸足', thighhighs:'ニーハイ', pantyhose:'パンスト', kneehighs:'膝下ソックス', from_above:'俯瞰', from_below:'あおり', cowboy_shot:'膝上構図', 'close-up':'接写', full_body:'全身', upper_body:'上半身', looking_at_viewer:'こちらを見る', depth_of_field:'被写界深度', rim_lighting:'リムライト', dappled_sunlight:'木漏れ日', lens_flare:'レンズフレア'
};

const groupInfo = {
  hair_color:['hair','hair_color','髪色',false,'髪色として反映。'], hair_effect:['hair','hair_extra','色分け・特殊髪',true,'髪の色分けや特殊効果。'], hair_length:['hair','hair_length','長さ・量',false,'髪の長さや量を指定。'], bangs:['hair','bangs','前髪・額',false,'前髪や額まわりの形。'], tied_hair:['hair','tied_hair','結び髪',false,'髪を結んだ形。'], braids_buns:['hair','braids_buns','三つ編み・お団子',false,'編み髪やまとめ髪。'], hair_texture:['hair','hair_texture','髪質・毛先',false,'髪の質感や毛先の形。'], hairstyle:['hair','hairstyle','髪型',false,'髪型全体の形。'],
  eye_color:['body','eye_color','瞳の色',false,'虹彩の色を指定。'], pupils:['body','pupils','瞳孔・虹彩',true,'瞳孔や虹彩の形。'], eye_shape:['body','eye_shape','目の形・状態',true,'目の形や開き方。'], skin:['body','skin','肌色・材質',false,'肌の色や材質を指定。'], face_feature:['body','face_feature','顔の特徴',true,'顔まわりの特徴。'], markings:['body','markings','身体の特徴',true,'身体の見える特徴。'], body_type:['body','body_type','体格',false,'体格や輪郭を指定。'], wings:['body','wings','翼',true,'翼の形や位置を指定。'],
  headwear:['outfit','headwear','帽子・頭装備',true,'頭に着ける衣類。'], top:['outfit','top','トップス',false,'上半身の服。'], outerwear:['outfit','outerwear','上着・コート',true,'上から羽織る服。'], bottom:['outfit','bottom','ボトムス',false,'腰から下の服。'], legwear:['outfit','legwear','靴下・脚衣',true,'脚を覆う衣類。'], footwear:['outfit','footwear','履物',false,'靴や履物。'], outfit_theme:['outfit','outfit_theme','制服・衣装',false,'衣装全体のテーマ。'], traditional:['outfit','traditional','伝統衣装',true,'地域性のある伝統服。'], accessory:['outfit','accessory','服飾小物',true,'服に合わせる装身具。'], clothing_detail:['outfit','clothing_detail','着こなし',true,'袖や襟、着崩し方。'],
  dresses:['outfit','dresses','ドレス・ワンピース',false,'一枚ものの衣服。'], swimwear:['outfit','swimwear','水着・ボディスーツ',true,'水着や身体に沿う衣装。'], eyewear:['outfit','eyewear','眼鏡・顔装備',true,'目や顔に着ける装備。'], jewelry:['outfit','jewelry','宝飾・アクセサリー',true,'身体に着ける装飾品。'],
  indoor:['background','indoor','屋内',false,'屋内の場所を背景にする。'], urban:['background','urban','街・建物',false,'街や建物を背景にする。'], nature:['background','nature','自然',false,'自然の場所を背景にする。'], sky:['background','sky','空・天体',true,'空や天体を背景にする。'], weather:['background','weather','天候・季節',false,'天候や季節感を加える。'], background_detail:['background','background_detail','背景効果',true,'背景の見え方を指定。'],
  base_pose:['pose','base_pose','基本姿勢',false,'身体の基本姿勢。'], arms:['pose','arms','腕',false,'腕の位置を指定。'], hands:['pose','hands','手・指',false,'手や指の形を指定。'], legs:['pose','legs','脚',false,'脚の位置を指定。'], gaze:['pose','gaze','視線・向き',false,'顔や視線の向き。'], action:['pose','action','移動・動作',true,'身体の動きを指定。'], interaction:['pose','interaction','交流',true,'他の人物との動作。'],
  framing:['camera','framing','画角',false,'画面に入る範囲。'], angle:['camera','angle','アングル',false,'カメラの高さや向き。'], perspective:['camera','perspective','遠近・視点',true,'遠近感や主観視点。'], focus:['camera','focus','フォーカス・動き',true,'ぼけや動きの見え方。'], composition:['camera','composition','配置・レイアウト',true,'画面内の配置を指定。'],
  light_source:['lighting','light_source','光源',false,'光源の種類を指定。'], light_direction:['lighting','light_direction','光の向き',false,'光が差す方向。'], light_effect:['lighting','light_effect','光・色の演出',true,'光学的な演出を加える。'], atmosphere:['lighting','atmosphere','空気・環境演出',true,'空気中の粒子や霞。']
};

function classify(source, name) {
  if (source.includes('hair_color')) return /two-tone|multicolored|gradient|colored|streak|split-color|rainbow|tips|inner|ombre|glowing|transparent/.test(name) ? 'hair_effect' : 'hair_color';
  if (source.includes('hair_styles')) {
    if (/bang|forehead|hair_between|hair_over|sidelock|fringe/.test(name)) return 'bangs';
    if (/braid|bun|cornrow|dreadlock/.test(name)) return 'braids_buns';
    if (/ponytail|twintail|two_side_up|tied_hair|half_updo|topknot|hair_up/.test(name)) return 'tied_hair';
    if (/long_hair|short_hair|medium_hair|bald|big_hair|hair_length/.test(name)) return 'hair_length';
    if (/wavy|curly|straight|messy|spiked|fluffy|drill|ringlet|hair_flaps|widow/.test(name)) return 'hair_texture';
    return 'hairstyle';
  }
  if (source.includes('eyes_tags')) {
    if (/^looking_|gaze|glance|averting|staring/.test(name)) return 'gaze';
    if (/pupil|iris|heterochromia|ringed_eyes|multicolored_eyes/.test(name)) return 'pupils';
    if (/^(?:black|blue|brown|green|grey|gray|orange|pink|purple|red|white|yellow|aqua|golden)_eyes$/.test(name)) return 'eye_color';
    return 'eye_shape';
  }
  if (source.includes('skin_color')) return 'skin';
  if (source.includes('wings')) return 'wings';
  if (source.includes('body_parts')) {
    if (/face|cheek|mouth|teeth|fang|ear|nose|eyebrow|freckle|mole/.test(name)) return 'face_feature';
    if (/scar|tattoo|marking|sweat|navel|body_hair/.test(name)) return 'markings';
    if (/abs$|pectorals|wide_hips|narrow_waist|thick_thighs|long_legs|biceps|obliques|slim_legs|thick_arms|collarbone/.test(name)) return 'body_type';
    return null;
  }
  if (source.includes('attire')) {
    if (/glasses|eyewear|eyepatch|blindfold|mask$/.test(name)) return 'eyewear';
    if (/earring|bracelet|ring$|brooch|piercing|anklet|armlet|circlet|necklace|choker|jewelry/.test(name)) return 'jewelry';
    if (/hat|cap|helmet|headwear|hood|crown|beret|bonnet|tiara/.test(name)) return 'headwear';
    if (/coat|jacket|cardigan|cloak|cape|poncho|parka/.test(name)) return 'outerwear';
    if (/shirt|blouse|sweater|top$|vest|camisole|hoodie|turtleneck/.test(name)) return 'top';
    if (/skirt|pants|shorts|trousers|jeans/.test(name)) return 'bottom';
    if (/sock|stocking|pantyhose|leggings|legwear|leg_warmers/.test(name)) return 'legwear';
    if (/shoe|boot|sandal|heel|loafer|slipper|footwear|barefoot/.test(name)) return 'footwear';
    if (/bikini|swimsuit|school_swimsuit|wetsuit|bodysuit|leotard|one-piece_swimsuit|rash_guard/.test(name)) return 'swimwear';
    if (/dress$|gown|robe$|sundress|cocktail_dress|evening_dress/.test(name)) return 'dresses';
    if (/kimono|yukata|hakama|hanfu|qipao|china_dress|sari|traditional/.test(name)) return 'traditional';
    if (/uniform|costume|maid|nurse|armor|suit$|witch|miko|sportswear|track_suit/.test(name)) return 'outfit_theme';
    if (/glove|scarf|necktie|bowtie|belt|suspender|apron|hair_ornament|hair_ribbon|hair_bow|hairband|hairclip|headband|veil|neckerchief/.test(name)) return 'accessory';
    return 'clothing_detail';
  }
  if (source.includes('locations')) {
    if (/room|indoors|interior|classroom|bedroom|kitchen|bath|library|cafe|restaurant|office|hospital|shop|store/.test(name)) return 'indoor';
    if (/city|street|alley|station|rooftop|balcony|bridge|castle|church|building|urban|road/.test(name)) return 'urban';
    return 'nature';
  }
  if (source.includes('backgrounds')) {
    if (/sky|moon|sun|star|cloud|rainbow|aurora/.test(name)) return 'sky';
    if (/rain|snow|fog|wind|storm|weather|spring|summer|autumn|winter/.test(name)) return 'weather';
    return 'background_detail';
  }
  if (source.includes('hands')) return /arm/.test(name) ? 'arms' : 'hands';
  if (source.includes('posture')) {
    if (/look|facing|head|gaze/.test(name)) return 'gaze';
    if (/hand|finger|thumb|palm|fist/.test(name)) return 'hands';
    if (/arm|shoulder/.test(name)) return 'arms';
    if (/leg|knee|feet|foot|tiptoe|seiza|wariza/.test(name)) return 'legs';
    if (/walking|running|jump|dance|falling|flying|reading|writing|drinking|eating|sleeping/.test(name)) return 'action';
    if (/hug|holding_hands|handshake|headpat|carry|piggyback|around_another/.test(name)) return 'interaction';
    return 'base_pose';
  }
  if (source.includes('image_composition')) {
    if (/from_|angle|view$|profile|top-down|side_view|behind/.test(name)) return 'angle';
    if (/perspective|foreshorten|pov|lens|reflection|over-the-shoulder/.test(name)) return 'perspective';
    if (/blur|focus|depth|speed_lines|motion|zoom/.test(name)) return 'focus';
    if (/body|shot|portrait|close-up|frame|waist/.test(name)) return 'framing';
    return 'composition';
  }
  if (source.includes('lighting')) {
    if (/backlight|rim_light|side_light|top_light|underlight|light_rays|dappled|crepuscular/.test(name)) return 'light_direction';
    if (/sunlight|moonlight|candle|firelight|spotlight|neon|window_light|screen_light|light_source/.test(name)) return 'light_source';
    if (/mist|smoke|dust|ember|snowflake|raindrop|underwater|haze/.test(name)) return 'atmosphere';
    return 'light_effect';
  }
  return null;
}

function label(name) {
  if (exactJa[name]) return exactJa[name];
  return name.split('_').map(word => tokenJa[word] || word).join('・');
}

async function json(url) {
  const response = await fetch(url, { headers: HEADERS });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

const currentSource = await readFile(new URL('../app/tag-data.ts', import.meta.url), 'utf8');
const currentTags = [...currentSource.matchAll(/\bt\('([^']+)'/g)].map(match => match[1].replaceAll(' ', '_'));
const candidates = new Map();
for (const [title, category] of sources) {
  const pages = await json(`${API}/wiki_pages.json?search%5Btitle%5D=${encodeURIComponent(title)}&limit=1`);
  if (!pages[0]) continue;
  for (const match of pages[0].body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const name = match[1].trim().toLowerCase().replaceAll(' ', '_');
    if (!name || !/^[a-z0-9_()'-]+$/.test(name) || structural.test(name) || excluded.test(name) || unsafe.test(name)) continue;
    const key = classify(title, name);
    if (key && groupInfo[key]) candidates.set(name, key);
  }
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
for (const [name, key] of candidates) {
  if (!general.has(name)) continue;
  const [categoryId, subcategoryId, subcategoryName, optional, note] = groupInfo[key];
  const groupKey = `${categoryId}:${subcategoryId}`;
  if (!groups.has(groupKey)) groups.set(groupKey, { categoryId, subcategoryId, subcategoryName, optional, tags: [] });
  groups.get(groupKey).tags.push({ tag: name.replaceAll('_', ' '), ja: label(name), note, postCount: counts[name] });
}
for (const group of groups.values()) group.tags.sort((a, b) => b.postCount - a.postCount);

await writeFile(new URL('../app/danbooru-counts.json', import.meta.url), `${JSON.stringify(counts, null, 2)}\n`);
await writeFile(new URL('../app/danbooru-import.json', import.meta.url), `${JSON.stringify([...groups.values()], null, 2)}\n`);
console.log(`Wiki groups: ${sources.length}, imported general tags: ${[...groups.values()].reduce((sum, group) => sum + group.tags.length, 0)}, count records: ${Object.keys(counts).length}`);
