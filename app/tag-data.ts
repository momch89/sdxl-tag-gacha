import countData from './danbooru-counts.json';
import importedGroups from './danbooru-import.json';

export type Tag = { tag: string; ja: string; note: string; postCount: number; microcategory?: string };
export type Subcategory = { id: string; name: string; tags: Tag[]; optional?: boolean };
export type Category = { id: string; name: string; icon: string; color: string; subcategories: Subcategory[] };

const counts = countData as Record<string, number>;
const t = (tag: string, ja: string, note: string): Tag => ({ tag, ja, note, postCount: counts[tag.replaceAll(' ', '_')] || 0 });
const s = (id: string, name: string, tags: Tag[], optional = false): Subcategory => ({ id, name, tags, optional });

const categoryData: Category[] = [
  { id:'hair', name:'髪', icon:'✂', color:'#ee765b', subcategories:[
    s('hair_color','髪色',[t('black hair','黒髪','黒色の髪。'),t('blonde hair','金髪','明るい金色の髪。'),t('brown hair','茶髪','茶色の髪。'),t('white hair','白髪','白く明るい髪。'),t('silver hair','銀髪','銀灰色に光る髪。'),t('red hair','赤髪','赤色の髪。'),t('blue hair','青髪','青色の髪。'),t('pink hair','ピンク髪','桃色の髪。'),t('purple hair','紫髪','紫色の髪。'),t('green hair','緑髪','緑色の髪。')]),
    s('hair_length','髪の長さ',[t('very short hair','ベリーショート','耳や顎より短い髪。'),t('short hair','ショート','首元までの短い髪。'),t('medium hair','ミディアム','肩ほどの長さの髪。'),t('long hair','ロング','肩より下まで伸びた髪。'),t('very long hair','超ロング','腰より長く伸びた髪。')]),
    s('hair_texture','髪質',[t('straight hair','ストレート','まっすぐ滑らかな髪。'),t('wavy hair','ウェーブ','波打つようにうねった髪。'),t('curly hair','巻き髪','全体に強くカールした髪。'),t('fluffy hair','ふわふわ髪','柔らかく空気を含んだ髪。'),t('messy hair','乱れ髪','無造作に乱れた髪。'),t('spiked hair','逆立った髪','毛先が鋭く立った髪。')]),
    s('bangs','前髪・額',[t('bangs','前髪','額に前髪がかかる。'),t('blunt bangs','ぱっつん','一直線に切り揃えた前髪。'),t('asymmetrical bangs','非対称前髪','左右で長さが違う前髪。'),t('swept bangs','流し前髪','前髪を片側へ流す。'),t('parted bangs','分け前髪','中央付近で前髪を分ける。'),t('hair between eyes','目の間の髪','髪束が両目の間へ垂れる。'),t('hair over one eye','片目隠れ','髪が片目を覆う。'),t('forehead','額出し','前髪を避けて額を見せる。')]),
    s('hairstyle','髪型',[t('bob cut','ボブ','顎まわりで丸く揃えた髪。'),t('ponytail','ポニーテール','後ろで一本に束ねた髪。'),t('high ponytail','ハイポニー','高い位置で束ねた髪。'),t('twintails','ツインテール','髪全体を左右二つに結ぶ。'),t('two side up','ツーサイドアップ','一部だけ左右で結ぶ。'),t('single braid','一本三つ編み','一本にまとめた編み髪。'),t('twin braids','おさげ','左右に垂らした二本の編み髪。'),t('hair bun','お団子','髪を丸くまとめる。'),t('double bun','二つお団子','左右に二つのお団子を作る。'),t('hime cut','姫カット','直線的な前髪と横髪。')]),
    s('hair_extra','特殊カラー',[t('gradient hair','グラデ髪','毛先へ向かって色が変わる。'),t('two-tone hair','二色髪','髪全体を二色で分ける。'),t('multicolored hair','多色髪','三色以上が混ざった髪。'),t('colored inner hair','インナーカラー','内側だけ異なる髪色。'),t('streaked hair','メッシュ','筋状に異なる色が入る。'),t('colored tips','毛先カラー','毛先だけ異なる色。')],true),
  ]},
  { id:'body', name:'瞳・身体・種族', icon:'◉', color:'#8468c9', subcategories:[
    s('person','人物',[t('1girl','女の子一人','女性キャラクターが一人。'),t('1boy','男の子一人','男性キャラクターが一人。'),t('androgynous','中性的','性別を限定しにくい外見。')]),
    s('eye_color','瞳の色',[t('blue eyes','青い瞳','青色の瞳。'),t('red eyes','赤い瞳','赤色の瞳。'),t('green eyes','緑の瞳','緑色の瞳。'),t('brown eyes','茶色い瞳','茶色の瞳。'),t('purple eyes','紫の瞳','紫色の瞳。'),t('golden eyes','金色の瞳','金色に輝く瞳。'),t('pink eyes','ピンクの瞳','桃色の瞳。'),t('grey eyes','灰色の瞳','灰色の瞳。')]),
    s('eye_shape','目の形',[t('tareme','たれ目','目尻が下がった柔らかな目。'),t('tsurime','つり目','目尻が上がった鋭い目。'),t('sanpaku','三白眼','黒目の三方に白目が見える。')]),
    s('pupils','瞳孔・虹彩',[t('heterochromia','オッドアイ','左右で瞳の色が異なる。'),t('slit pupils','縦長瞳孔','縦に細い獣のような瞳孔。'),t('heart-shaped pupils','ハート瞳孔','瞳孔がハート形。'),t('star-shaped pupils','星形瞳孔','瞳孔が星形。')],true),
    s('eye_state','目の状態',[t('empty eyes','光のない目','ハイライトのない暗い目。')],true),
    s('body_type','体型',[t('slender','細身','ほっそりした体型。'),t('petite','小柄','小さく華奢な体格。'),t('tall female','長身女性','背が高い女性体型。'),t('curvy','曲線的','腰や胸の曲線が目立つ体型。'),t('plump','ぽっちゃり','丸みのある柔らかな体型。'),t('muscular female','筋肉質','筋肉の輪郭が目立つ体型。')]),
    s('skin','肌色',[t('pale skin','色白','明るく白い肌。'),t('fair skin','明るい肌','自然で明るい肌色。'),t('tan','日焼け肌','日焼けした褐色の肌。'),t('dark skin','濃い肌','濃い褐色の肌。'),t('blue skin','青い肌','人外的な青色の肌。'),t('green skin','緑の肌','人外的な緑色の肌。')]),
    s('face_feature','顔の特徴',[t('freckles','そばかす','頬や鼻に小さな斑点。'),t('mole under eye','泣きぼくろ','目の下に小さなほくろ。'),t('fang','八重歯','口元から一本の牙が見える。'),t('sharp teeth','鋭い歯','ギザギザした歯が並ぶ。'),t('bags under eyes','目の下の隈','目の下に疲れた影がある。'),t('pointy ears','尖った耳','耳先が長く尖っている。')],true),
    s('species','獣耳・亜人',[t('animal ears','獣耳','頭に動物の耳が生える。'),t('cat ears','猫耳','頭に猫の耳が生える。'),t('fox ears','狐耳','頭に狐の耳が生える。'),t('wolf ears','狼耳','頭に狼の耳が生える。'),t('rabbit ears','うさ耳','頭に長いうさぎ耳が生える。'),t('horns','角','頭部に角が生える。'),t('demon horns','悪魔の角','悪魔らしい湾曲した角。'),t('tail','尻尾','腰から尻尾が伸びる。'),t('wings','翼','背中に翼が生える。'),t('elf','エルフ','尖った耳を持つ亜人種。'),t('demon girl','悪魔娘','角や翼を持つ女性悪魔。'),t('dragon girl','ドラゴン娘','角や鱗を持つ竜の亜人。')],true),
  ]},
  { id:'outfit', name:'服装', icon:'◇', color:'#5d78d6', subcategories:[
    s('outfit_theme','服装テーマ',[t('school uniform','学生服','学校指定風の制服。'),t('maid','メイド服','エプロン付きの給仕服。'),t('business suit','スーツ','ジャケット中心の仕事着。'),t('kimono','着物','帯を締めた和装。'),t('sportswear','スポーツウェア','運動向けの軽快な服。'),t('casual','カジュアル','日常的で気軽な服装。'),t('gothic lolita','ゴシックロリータ','黒を基調にした華美な装い。'),t('armor','鎧','金属製の防具を着ける。')]),
    s('top','トップス',[t('shirt','シャツ','襟やボタンのある上着。'),t('t-shirt','Tシャツ','半袖中心の薄手シャツ。'),t('hoodie','パーカー','フード付きの上着。'),t('sweater','セーター','編み物の暖かい上着。'),t('blouse','ブラウス','柔らかく装飾的なシャツ。'),t('crop top','クロップトップ','腹部が見える短丈トップス。')]),
    s('bottom','ボトムス',[t('pleated skirt','プリーツスカート','細かなひだのあるスカート。'),t('long skirt','ロングスカート','足元近くまであるスカート。'),t('shorts','ショートパンツ','脚が大きく見える短いパンツ。'),t('denim shorts','デニムショーツ','ジーンズ素材の短いパンツ。'),t('jeans','ジーンズ','デニム素材の長ズボン。'),t('wide pants','ワイドパンツ','裾幅の広いパンツ。')]),
    s('outerwear','上着',[t('jacket','ジャケット','腰丈ほどの軽い上着。'),t('coat','コート','丈の長い防寒用の上着。'),t('trench coat','トレンチコート','ベルト付きの長いコート。'),t('cardigan','カーディガン','前開きの編み上着。'),t('open jacket','前開きジャケット','前を閉じずに羽織る。')],true),
    s('footwear','靴',[t('sneakers','スニーカー','紐付きの運動靴。'),t('loafers','ローファー','紐のない革靴。'),t('boots','ブーツ','足首より上まで覆う靴。'),t('high heels','ハイヒール','かかとの高い靴。'),t('sandals','サンダル','足を露出する軽い履物。')]),
  ]},
  { id:'background', name:'背景', icon:'▧', color:'#3e9d74', subcategories:[
    s('location','場所',[t('classroom','教室','机と黒板のある教室。'),t('bedroom','寝室','ベッドのある室内。'),t('cafe','カフェ','飲食用テーブルのある店。'),t('convenience store','コンビニ','商品棚が並ぶ明るい店内。'),t('city street','街路','建物に囲まれた街中の道。'),t('train station','駅','ホームや改札のある駅。'),t('rooftop','屋上','空が広く見える屋上。'),t('forest','森林','木々に囲まれた自然。'),t('beach','海辺','砂浜と海が広がる場所。'),t('Japanese garden','日本庭園','池や石のある和風庭園。')]),
    s('time','時間帯',[t('morning','朝','朝らしい明るい空気。'),t('day','昼','日中の明るい景色。'),t('sunset','夕暮れ','空が赤く染まる時間。'),t('night','夜','暗い夜の景色。'),t('midnight','深夜','静かで暗い真夜中。')]),
    s('weather','天候',[t('clear sky','快晴','雲が少ない澄んだ空。'),t('cloudy sky','曇り空','雲に覆われた空。'),t('rain','雨','雨粒と濡れた景色。'),t('snowing','雪','雪が舞い落ちる景色。'),t('fog','霧','白い霞で遠景がぼやける。')]),
    s('background_detail','背景効果',[t('bokeh','玉ぼけ','背景光が丸くぼける。'),t('petals','花びら','周囲に花びらが舞う。'),t('falling leaves','落ち葉','葉が空中を舞う。'),t('city lights','街明かり','遠くに多数の人工光。'),t('simple background','単純背景','情報量を抑えた背景。')],true),
  ]},
  { id:'prop', name:'小物', icon:'♢', color:'#d2942f', subcategories:[
    s('held_item','手持ち',[t('smartphone','スマホ','手に携帯端末を持つ。'),t('book','本','本を手に持つ。'),t('umbrella','傘','開いた傘を持つ。'),t('camera','カメラ','撮影用カメラを持つ。'),t('shopping bag','買い物袋','手提げ袋を持つ。'),t('bouquet','花束','束ねた花を持つ。'),t('paper fan','扇子','折りたたみ扇を持つ。')]),
    s('wearable','身につける小物',[t('glasses','眼鏡','眼鏡をかける。'),t('sunglasses','サングラス','色付き眼鏡をかける。'),t('headphones','ヘッドホン','大型イヤホンを着ける。'),t('choker','チョーカー','首に細い飾りを巻く。'),t('necklace','ネックレス','首から装飾品を下げる。'),t('hair ribbon','髪リボン','髪にリボンを飾る。')],true),
    s('nearby_item','周囲の小物',[t('stuffed toy','ぬいぐるみ','そばに柔らかな人形。'),t('flower pot','植木鉢','植物の入った鉢。'),t('laptop','ノートPC','開いた小型パソコン。'),t('gift box','ギフト箱','リボン付きの贈り物。'),t('lantern','ランタン','小型の灯りが置かれる。')],true),
  ]},
  { id:'pose', name:'ポーズ・動作', icon:'⌁', color:'#b260af', subcategories:[
    s('base_pose','基本姿勢',[t('standing','立つ','直立した基本姿勢。'),t('sitting','座る','椅子や床に腰を下ろす。'),t('kneeling','ひざまずく','膝を床につける。'),t('lying','横になる','体を寝かせる。'),t('squatting','しゃがむ','腰を落としてしゃがむ。'),t('walking','歩く','一歩踏み出して歩く。')]),
    s('hands','手・腕',[t('hands on hips','腰に手','手を腰に当てる。'),t('arms behind back','後ろ手','両腕を背中側へ回す。'),t('crossed arms','腕組み','胸の前で腕を交差する。'),t('hand in pocket','ポケットに手','片手をポケットに入れる。'),t('peace sign','ピース','二本指をV字に立てる。'),t('waving','手を振る','片手を上げて振る。')]),
    s('gaze','視線・向き',[t('looking at viewer','こちらを見る','視線をカメラへ向ける。'),t('looking away','目をそらす','視線をカメラから外す。'),t('looking back','振り返る','体と逆方向へ顔を向ける。'),t('looking up','見上げる','視線を上へ向ける。'),t('looking down','見下ろす','視線を下へ向ける。')]),
    s('action','動作',[t('stretching','伸び','腕や体を大きく伸ばす。'),t('running','走る','勢いよく走っている。'),t('jumping','跳ぶ','地面から跳び上がる。'),t('reading','読む','本や紙面を読んでいる。'),t('drinking','飲む','飲み物を口へ運ぶ。'),t('taking picture','撮影','カメラで写真を撮る。')],true),
  ]},
  { id:'expression', name:'表情', icon:'☺', color:'#dc5d87', subcategories:[
    s('mouth','表情',[t('smile','微笑み','口元を軽く上げる。'),t('grin','にっこり','歯が見えるほど笑う。'),t('serious','真剣','引き締まった表情。'),t('surprised','驚き','目と口を大きく開く。'),t('pout','ふくれっ面','不満げに唇を尖らせる。'),t('smirk','得意げ','片側の口角を上げる。')]),
    s('emotion_detail','感情の補助',[t('blush','赤面','頬が赤く染まる。'),t('tears','涙','目から涙が流れる。'),t('sweatdrop','汗マーク','困惑を示す大粒の汗。'),t('sleepy','眠そう','まぶたが重く力が抜ける。'),t('embarrassed','照れ','恥ずかしそうに戸惑う。')],true),
  ]},
  { id:'camera', name:'構図・カメラ', icon:'⌾', color:'#3189b6', subcategories:[
    s('framing','画角',[t('full body','全身','頭から足先まで写す。'),t('cowboy shot','膝上','頭から膝上まで写す。'),t('upper body','上半身','腰より上を中心に写す。'),t('portrait','肖像','顔や胸元を主役にする。'),t('close-up','接写','被写体へ大きく寄る。')]),
    s('angle','アングル',[t('eye level','目線の高さ','被写体と同じ高さから見る。'),t('from above','俯瞰','上から見下ろす。'),t('from below','あおり','下から見上げる。'),t('dutch angle','斜め構図','カメラを傾ける。'),t('side view','横向き','被写体を横から写す。'),t('from behind','背面','被写体を後ろから写す。')]),
    s('focus','フォーカス',[t('depth of field','被写界深度','前後をぼかして主役を強調。'),t('foreground blur','前ぼけ','手前をぼかして奥を見せる。'),t('motion blur','動体ぶれ','動きの方向へ像が流れる。'),t('fisheye','魚眼','周辺が湾曲する広角表現。')],true),
  ]},
  { id:'lighting', name:'照明・演出', icon:'☼', color:'#799846', subcategories:[
    s('light_source','光',[t('sunlight','日差し','太陽からの自然光。'),t('golden hour','金色の夕光','夕方の柔らかな金色光。'),t('neon lights','ネオン','鮮やかな色の人工光。'),t('candlelight','ろうそく光','暖かな小さい炎の光。'),t('moonlight','月明かり','青白く静かな夜の光。')]),
    s('light_direction','光の向き',[t('backlighting','逆光','背後から光が差す。'),t('rim lighting','リムライト','輪郭の縁だけが光る。'),t('side lighting','横からの光','片側から光を当てる。'),t('light rays','光芒','筋状の光が差し込む。'),t('dappled sunlight','木漏れ日','斑点状の日差しが当たる。')]),
  ]},
];

type ImportedGroup = { categoryId: string; subcategoryId: string; subcategoryName: string; optional: boolean; tags: Tag[] };
const knownTags = new Set(categoryData.flatMap(category => category.subcategories.flatMap(subcategory => subcategory.tags.map(item => item.tag))));
for (const group of importedGroups as ImportedGroup[]) {
  const category = categoryData.find(item => item.id === group.categoryId);
  if (!category) continue;
  let subcategory = category.subcategories.find(item => item.id === group.subcategoryId);
  if (!subcategory) {
    subcategory = s(group.subcategoryId, group.subcategoryName, [], group.optional);
    category.subcategories.push(subcategory);
  }
  const additions = group.tags.filter(item => !knownTags.has(item.tag));
  additions.forEach(item => knownTags.add(item.tag));
  subcategory.tags.push(...additions);
}

export const categories: Category[] = [
  categoryData.find(category => category.id === 'body')!,
  categoryData.find(category => category.id === 'hair')!,
  ...categoryData.filter(category => category.id !== 'body' && category.id !== 'hair'),
];

export const allTags = categories.flatMap(category => category.subcategories.flatMap(subcategory => subcategory.tags.map(tag => ({ ...tag, category, subcategory }))));
