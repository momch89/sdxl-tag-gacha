'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, Copy, Dice5, Lock, LockOpen, Search, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Tag = { tag: string; ja: string; note: string };
type Category = { id: string; name: string; icon: string; color: string; tags: Tag[] };
const t = (tag: string, ja: string, note: string): Tag => ({ tag, ja, note });

const categories: Category[] = [
  { id: 'hair', name: '髪型', icon: '✂', color: '#ee7d63', tags: [
    t('long hair','ロングヘア','肩より下まで伸びた長い髪。'), t('short hair','ショートヘア','首元までの短い髪。'),
    t('bob cut','ボブカット','顎まわりで揃えた丸い短髪。'), t('ponytail','ポニーテール','後ろで一本に束ねた髪。'),
    t('high ponytail','ハイポニー','頭の高い位置で束ねた髪。'), t('twintails','ツインテール','髪全体を左右二つに結ぶ。'),
    t('two side up','ツーサイドアップ','一部だけ左右で結び、残りは下ろす。'), t('single braid','一本三つ編み','一本にまとめた編み髪。'),
    t('hair bun','お団子ヘア','髪を丸くまとめた髪型。'), t('messy hair','無造作ヘア','寝癖のように乱れた髪。'),
    t('hime cut','姫カット','ぱっつん前髪と直線的な横髪。'), t('hair over one eye','片目隠れ','前髪が片方の目を覆う。'),
  ]},
  { id: 'outfit', name: '服装', icon: '◇', color: '#6f79d8', tags: [
    t('school uniform','学生服','学校の制服らしい装い。'), t('sailor collar','セーラー襟','背面が四角い水兵風の襟。'),
    t('hoodie','パーカー','フード付きのカジュアルな上着。'), t('oversized shirt','オーバーサイズシャツ','体より大きくゆったりしたシャツ。'),
    t('summer dress','サマードレス','薄手で涼しげなワンピース。'), t('business suit','ビジネススーツ','ジャケット中心の仕事着。'),
    t('maid','メイド服','エプロンを合わせた給仕服。'), t('kimono','着物','帯を締めた和装。'),
    t('track suit','ジャージ','運動用の上下セット。'), t('denim shorts','デニムショートパンツ','短丈のジーンズ素材パンツ。'),
    t('pleated skirt','プリーツスカート','細かなひだのあるスカート。'), t('trench coat','トレンチコート','ベルト付きの長いコート。'),
  ]},
  { id: 'background', name: '背景', icon: '▧', color: '#45a77f', tags: [
    t('classroom','教室','机と黒板のある学校の教室。'), t('bedroom','寝室','ベッドのある個人的な室内。'),
    t('convenience store','コンビニ','商品棚と明るい店内照明。'), t('city street','街路','建物に囲まれた街中の道。'),
    t('train station','駅','ホームや改札のある鉄道駅。'), t('rooftop','屋上','空が広く見える建物の屋上。'),
    t('cafe','カフェ','テーブルと飲み物のある喫茶空間。'), t('forest','森林','木々に囲まれた自然の中。'),
    t('beach','海辺','砂浜と海が広がる場所。'), t('Japanese garden','日本庭園','池や石、植木のある和風庭園。'),
    t('night sky','夜空','暗い空に星や月が見える。'), t('simple background','シンプル背景','情報量を抑えた単色寄りの背景。'),
  ]},
  { id: 'prop', name: '小物', icon: '♢', color: '#d99b32', tags: [
    t('smartphone','スマートフォン','手に収まる現代的な携帯端末。'), t('umbrella','傘','雨や日差しを避ける開いた傘。'),
    t('book','本','手持ちや机上に置かれた本。'), t('headphones','ヘッドホン','頭や首に掛ける大型イヤホン。'),
    t('shopping bag','買い物袋','買った品物を入れた手提げ袋。'), t('coffee cup','コーヒーカップ','温かい飲み物の入ったカップ。'),
    t('camera','カメラ','写真撮影用のカメラ。'), t('stuffed toy','ぬいぐるみ','柔らかな動物や人物の人形。'),
    t('handbag','ハンドバッグ','手に持つ小型の鞄。'), t('bouquet','花束','複数の花を束ねたもの。'),
    t('lollipop','棒付きキャンディ','棒の付いた丸い飴。'), t('paper fan','扇子','折りたためる和風の扇。'),
  ]},
  { id: 'pose', name: 'ポーズ', icon: '⌁', color: '#b46bb9', tags: [
    t('standing','立つ','直立した基本姿勢。'), t('sitting','座る','椅子や床に腰を下ろす。'),
    t('kneeling','ひざまずく','膝を床につけた姿勢。'), t('lying','横になる','体を寝かせた姿勢。'),
    t('looking back','振り返る','体と逆方向へ顔を向ける。'), t('hands on hips','腰に手','両手または片手を腰に当てる。'),
    t('arms behind back','後ろ手','両腕を背中側へ回す。'), t('crossed arms','腕組み','胸の前で両腕を交差する。'),
    t('peace sign','ピースサイン','二本指をV字に立てる。'), t('hand in pocket','ポケットに手','片手を服のポケットに入れる。'),
    t('walking','歩く','一歩踏み出した動きのある姿勢。'), t('stretching','伸びをする','腕や体を大きく伸ばす。'),
  ]},
  { id: 'expression', name: '表情', icon: '☺', color: '#e0628b', tags: [
    t('smile','微笑み','口元を軽く上げた表情。'), t('grin','にっこり笑う','歯が見えるほど大きく笑う。'),
    t('serious','真剣','笑わず引き締まった表情。'), t('surprised','驚き','目と口を大きく開いた表情。'),
    t('blush','赤面','頬が赤く染まった状態。'), t('sleepy','眠そう','まぶたが重く力の抜けた表情。'),
    t('pout','ふくれっ面','不満げに唇を尖らせる。'), t('smirk','得意げな笑み','片側の口角を上げた笑み。'),
  ]},
  { id: 'camera', name: '構図・カメラ', icon: '⌾', color: '#3e90be', tags: [
    t('full body','全身','頭から足先まで画面に入れる。'), t('upper body','上半身','腰より上を中心に写す。'),
    t('portrait','ポートレート','顔や上半身を主役にする。'), t('close-up','接写','被写体へ大きく寄った構図。'),
    t('from above','俯瞰','被写体を上から見下ろす。'), t('from below','あおり','被写体を下から見上げる。'),
    t('dutch angle','斜め構図','カメラを傾けた不安定な構図。'), t('depth of field','被写界深度','前後をぼかして主役を際立たせる。'),
  ]},
  { id: 'atmosphere', name: '照明・天候', icon: '☼', color: '#7b9c48', tags: [
    t('sunlight','日差し','太陽からの明るい自然光。'), t('golden hour','ゴールデンアワー','夕方の柔らかな金色の光。'),
    t('neon lights','ネオン照明','鮮やかな色の人工光。'), t('backlighting','逆光','被写体の背後から光が差す。'),
    t('rain','雨','雨粒や濡れた景色が見える。'), t('snowing','降雪','雪が空から舞い落ちる。'),
    t('fog','霧','白い霞で遠景がぼやける。'), t('wind','風','髪や服が風になびく。'),
  ]},
];

const empty: Record<string, Tag | null> = Object.fromEntries(categories.map(c => [c.id, null]));
const random = (tags: Tag[], old?: Tag | null) => {
  const pool = tags.length > 1 ? tags.filter(x => x.tag !== old?.tag) : tags;
  return pool[Math.floor(Math.random() * pool.length)];
};

export default function Home() {
  const [selected, setSelected] = useState<Record<string, Tag | null>>(empty);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [quality, setQuality] = useState('');
  const [position, setPosition] = useState<'before' | 'after'>('before');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try { const s = JSON.parse(localStorage.getItem('tag-gacha-settings') || '{}'); setQuality(s.quality || ''); setPosition(s.position || 'before'); } catch {}
  }, []);
  useEffect(() => { localStorage.setItem('tag-gacha-settings', JSON.stringify({ quality, position })); }, [quality, position]);

  const picked = useMemo(() => categories.map(c => selected[c.id]?.tag).filter(Boolean) as string[], [selected]);
  const prompt = useMemo(() => {
    const main = picked.join(', '), fixed = quality.trim().replace(/^,|,$/g, '').trim();
    return fixed && main ? (position === 'before' ? `${fixed}, ${main}` : `${main}, ${fixed}`) : fixed || main;
  }, [picked, quality, position]);
  const shown = useMemo(() => {
    const q = query.toLowerCase().trim();
    return categories.flatMap(category => category.tags.map(tag => ({ ...tag, category }))).filter(x =>
      (filter === 'all' || x.category.id === filter) && (!q || `${x.tag} ${x.ja} ${x.note}`.toLowerCase().includes(q))
    );
  }, [filter, query]);

  const roll = (category: Category) => !locked[category.id] && setSelected(v => ({ ...v, [category.id]: random(category.tags, v[category.id]) }));
  const rollAll = () => setSelected(v => Object.fromEntries(categories.map(c => [c.id, locked[c.id] ? v[c.id] : random(c.tags, v[c.id])])));
  const choose = (category: Category, tag: Tag) => setSelected(v => ({ ...v, [category.id]: v[category.id]?.tag === tag.tag ? null : tag }));
  const copy = async () => { if (!prompt) return; await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1600); };

  return <main className="min-h-screen pb-28">
    <header className="topbar"><div className="shell flex h-full items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3"><div className="logo-mark"><Dice5 /></div><div className="min-w-0"><p className="truncate text-[10px] font-bold tracking-[.14em] text-[var(--ink-soft)]">SDXL DANBOORU PROMPT TOOL</p><h1 className="truncate text-lg font-black sm:text-xl">タグガチャ</h1></div></div>
      <Button onClick={rollAll} className="roll-all h-11 rounded-full px-4 sm:px-6"><Sparkles /><span className="hidden sm:inline">ぜんぶまとめて</span>抽選</Button>
    </div></header>

    <div className="shell pt-6 sm:pt-9">
      <section><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="section-kicker">01 / RANDOMIZE</p><h2 className="section-title">カテゴリ別に引く</h2></div><p className="text-xs text-[var(--ink-soft)]">固定したカードは一括抽選でも変わりません</p></div>
        <div className="category-grid">{categories.map(category => { const item = selected[category.id]; return <article key={category.id} className="category-card" style={{ '--cat': category.color } as React.CSSProperties}>
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2.5"><span className="category-icon">{category.icon}</span><h3 className="font-extrabold">{category.name}</h3></div><button className="lock-button" aria-label={`${category.name}を固定`} onClick={() => setLocked(v => ({ ...v, [category.id]: !v[category.id] }))}>{locked[category.id] ? <Lock /> : <LockOpen />}</button></div>
          <div className="result-box">{item ? <><button aria-label="選択解除" className="remove-result" onClick={() => setSelected(v => ({ ...v, [category.id]: null }))}><X /></button><strong>{item.tag}</strong><span>{item.ja}</span><p>{item.note}</p></> : <p className="empty-result">まだ選ばれていません</p>}</div>
          <Button variant="outline" className="h-10 w-full rounded-xl bg-white" onClick={() => roll(category)} disabled={locked[category.id]}><Dice5 />{locked[category.id] ? '固定中' : 'このカテゴリを抽選'}</Button>
        </article>})}</div>
      </section>

      <section className="builder-section"><div><p className="section-kicker">02 / BUILD & COPY</p><h2 className="section-title">プロンプトを仕上げる</h2></div>
        <div className="builder-grid"><div className="selected-panel"><div className="mb-3 flex items-center justify-between"><h3 className="font-extrabold">選択中のタグ</h3><button className="text-button" onClick={() => setSelected(empty)}>すべて外す</button></div><div className="chip-area">{categories.map(c => selected[c.id] && <button key={c.id} className="tag-chip" style={{ '--cat': c.color } as React.CSSProperties} onClick={() => setSelected(v => ({ ...v, [c.id]: null }))}><span>{selected[c.id]!.tag}</span><X /></button>)}{!picked.length && <span className="text-sm text-[var(--ink-soft)]">抽選するか、下の一覧から選んでください。</span>}</div></div>
          <div className="quality-panel"><div className="mb-2 flex items-center justify-between gap-3"><div><h3 className="font-extrabold">固定クオリティタグ</h3><p className="mt-0.5 text-xs text-[var(--ink-soft)]">抽選対象には含まれません</p></div><div className="position-switch"><button className={position === 'before' ? 'active' : ''} onClick={() => setPosition('before')}>先頭</button><button className={position === 'after' ? 'active' : ''} onClick={() => setPosition('after')}>末尾</button></div></div><Input value={quality} onChange={e => setQuality(e.target.value)} className="h-11 rounded-xl bg-white" placeholder="自分の固定タグをカンマ区切りで入力" /></div>
          <div className="output-panel"><div className="min-w-0 flex-1"><p className="mb-1 text-xs font-bold text-[var(--ink-soft)]">FINAL PROMPT</p><p className={`prompt-text ${prompt ? '' : 'text-[var(--ink-soft)]'}`}>{prompt || 'タグを選ぶとここに表示されます'}</p></div><Button onClick={copy} disabled={!prompt} className="copy-button h-12 rounded-xl px-5">{copied ? <Check /> : <Copy />}{copied ? 'コピー済み' : 'まとめてコピー'}</Button></div>
        </div>
      </section>

      <section className="tag-library"><div className="mb-4 flex flex-wrap items-end justify-between gap-4"><div><p className="section-kicker">03 / TAG LIBRARY</p><h2 className="section-title">タグ一覧から選ぶ</h2></div><div className="search-box"><Search /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="英語・日本語で検索" /></div></div>
        <div className="filter-row"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>すべて</button>{categories.map(c => <button key={c.id} className={filter === c.id ? 'active' : ''} onClick={() => setFilter(c.id)}>{c.name}</button>)}</div>
        <div className="tag-list">{shown.map(x => { const on = selected[x.category.id]?.tag === x.tag; return <button key={`${x.category.id}-${x.tag}`} className={`library-tag ${on ? 'selected' : ''}`} style={{ '--cat': x.category.color } as React.CSSProperties} onClick={() => choose(x.category, x)}><span className="tag-dot"/><span className="min-w-0 flex-1 text-left"><strong>{x.tag}</strong><small>{x.ja} — {x.note}</small></span>{on ? <Check /> : <span className="plus">＋</span>}</button>})}</div>
        {!shown.length && <div className="empty-search">該当するタグがありません。</div>}
      </section>
    </div>
    <div className="mobile-copybar"><span><Clipboard /> {picked.length} tags</span><Button onClick={copy} disabled={!prompt}>{copied ? <Check /> : <Copy />}{copied ? 'コピー済み' : 'まとめてコピー'}</Button></div>
  </main>;
}
