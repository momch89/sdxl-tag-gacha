'use client';

import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, BookOpen, Check, ChevronDown, Copy, Dice5, Lock, LockOpen, Menu, Save, Search, Sparkles, Trash2, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { allTags, categories, type Category, type Subcategory, type Tag } from './tag-data';

type Selection = Record<string, Tag[]>;
type SavedCharacter = { id: string; name: string; tags: Record<string, Tag[]>; freePrompt?: string; locks?: Record<string, boolean> };
type QualityPreset = { id: string; name: string; prompt: string; position: 'before'|'after' };
const blankSelection = (): Selection => Object.fromEntries(categories.flatMap(c => c.subcategories.map(s => [s.id, []])));
const pick = (items: Tag[], current: Tag[]) => {
  const pool = items.length > 1 ? items.filter(item => !current.some(x => x.tag === item.tag)) : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? items[0];
};
const formatCount = (count = 0) => count >= 1_000_000 ? `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1).replace('.0','')}M` : count >= 1_000 ? `${(count / 1_000).toFixed(count >= 100_000 ? 0 : 1).replace('.0','')}k` : `${count}`;
type DictionaryTag = (typeof allTags)[number];
const groupByMicrocategory = (tags: DictionaryTag[], fallback: string) => {
  const groups = new Map<string, DictionaryTag[]>();
  for (const item of tags) {
    const name = item.microcategory || fallback;
    groups.set(name, [...(groups.get(name) || []), item]);
  }
  return [...groups.entries()];
};
const microcategoriesFor = (subcategory: Subcategory) => [...new Set(subcategory.tags.map(tag => tag.microcategory || subcategory.name))];
const microAnchorId = (categoryId: string, subcategoryId: string, microcategory: string) => `dict-${categoryId}-${subcategoryId}-${encodeURIComponent(microcategory)}`;

export default function Home() {
  const [selected, setSelected] = useState<Selection>(blankSelection);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState(categories[0]?.id || 'hair');
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictCategory, setDictCategory] = useState(categories[0]?.id || 'hair');
  const [dictionaryMenuOpen, setDictionaryMenuOpen] = useState(false);
  const [expandedJumpCategory, setExpandedJumpCategory] = useState<string | null>(categories[0]?.id || null);
  const [expandedJumpSubcategory, setExpandedJumpSubcategory] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'default'|'count'>('default');
  const [query, setQuery] = useState('');
  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characterFree, setCharacterFree] = useState('');
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [qualityName, setQualityName] = useState('');
  const [qualityPresets, setQualityPresets] = useState<QualityPreset[]>([]);
  const [quality, setQuality] = useState('');
  const [position, setPosition] = useState<'before'|'after'>('before');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('tag-gacha-settings-v2') || '{}');
      setQuality(settings.quality || ''); setPosition(settings.position || 'before');
      setCharacterFree(settings.characterFree || '');
      setCharacters(JSON.parse(localStorage.getItem('tag-gacha-characters') || '[]'));
      setQualityPresets(JSON.parse(localStorage.getItem('tag-gacha-quality-presets') || '[]'));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem('tag-gacha-settings-v2', JSON.stringify({ quality, position, characterFree })); }, [quality, position, characterFree]);
  useEffect(() => { localStorage.setItem('tag-gacha-characters', JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem('tag-gacha-quality-presets', JSON.stringify(qualityPresets)); }, [qualityPresets]);

  const active = categories.find(c => c.id === activeId) ?? categories[0];
  const flatSelected = useMemo(() => categories.flatMap(c => c.subcategories.flatMap(s => selected[s.id] || [])), [selected]);
  const tagNames = useMemo(() => [...new Set(flatSelected.map(t => t.tag))], [flatSelected]);
  const prompt = useMemo(() => {
    const main = [characterFree.trim().replace(/^,|,$/g, '').trim(), ...tagNames].filter(Boolean).join(', '); const fixed = quality.trim().replace(/^,|,$/g, '').trim();
    return fixed && main ? (position === 'before' ? `${fixed}, ${main}` : `${main}, ${fixed}`) : fixed || main;
  }, [tagNames, characterFree, quality, position]);
  const shownTags = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = allTags.filter(x => x.category.id === dictCategory && (!q || `${x.tag} ${x.ja} ${x.note}`.toLowerCase().includes(q)));
    return sortMode === 'count' ? [...filtered].sort((a, b) => b.postCount - a.postCount) : filtered;
  }, [dictCategory, query, sortMode]);

  const toggleTag = (subcategoryId: string, tag: Tag) => setSelected(v => {
    const current = v[subcategoryId] || []; const exists = current.some(x => x.tag === tag.tag);
    return { ...v, [subcategoryId]: exists ? current.filter(x => x.tag !== tag.tag) : [...current, tag] };
  });
  const rollSubcategory = (subcategory: Subcategory) => {
    if (locked[subcategory.id]) return;
    setSelected(v => ({ ...v, [subcategory.id]: [pick(subcategory.tags, v[subcategory.id] || [])] }));
  };
  const rollCategory = (category: Category) => setSelected(v => ({ ...v, ...Object.fromEntries(category.subcategories.map(s => [s.id, locked[s.id] ? v[s.id] : [pick(s.tags, v[s.id] || [])]])) }));
  const rollAll = () => setSelected(v => ({ ...v, ...Object.fromEntries(categories.flatMap(c => c.subcategories.map(s => [s.id, locked[s.id] ? v[s.id] : [pick(s.tags, v[s.id] || [])]]))) }));
  const clear = () => setSelected(blankSelection());
  const copyPrompt = async () => { if (!prompt) return; await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  const saveCharacter = () => {
    const name = characterName.trim(); if (!name) return;
    const ids = categories.filter(c => ['hair','pose_body','species','expression'].includes(c.id)).flatMap(c => c.subcategories.map(s => s.id));
    const tags = Object.fromEntries(ids.map(id => [id, selected[id] || []]));
    const locks = Object.fromEntries(ids.map(id => [id, !!locked[id]]));
    setCharacters(v => [...v, { id: crypto.randomUUID(), name, tags, freePrompt: characterFree.trim(), locks }]); setCharacterName('');
  };
  const applyCharacter = (character: SavedCharacter) => {
    setSelected(v => ({ ...v, ...character.tags }));
    setCharacterFree(character.freePrompt || '');
    const ids = Object.keys(character.tags); setLocked(v => ({ ...v, ...Object.fromEntries(ids.map(id => [id, character.locks?.[id] ?? true])) }));
    setCharacterOpen(false);
  };
  const saveQuality = () => {
    const name = qualityName.trim(); if (!name || !quality.trim()) return;
    setQualityPresets(v => [...v, { id: crypto.randomUUID(), name, prompt: quality.trim(), position }]); setQualityName('');
  };
  const chooseDictionaryCategory = (categoryId: string) => {
    if (expandedJumpCategory === categoryId) { setExpandedJumpCategory(null); setExpandedJumpSubcategory(null); return; }
    setExpandedJumpCategory(categoryId); setExpandedJumpSubcategory(null);
    setDictCategory(categoryId); setQuery('');
    requestAnimationFrame(() => document.querySelector('.dict-content')?.scrollTo({ top:0, behavior:'smooth' }));
  };
  const toggleJumpSubcategory = (categoryId: string, subcategoryId: string) => {
    const key = `${categoryId}:${subcategoryId}`;
    if (expandedJumpSubcategory === key) { setExpandedJumpSubcategory(null); return; }
    setExpandedJumpSubcategory(key); setDictCategory(categoryId); setQuery('');
    setTimeout(() => document.getElementById(`dict-${categoryId}-${subcategoryId}`)?.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
  };
  const jumpToMicrocategory = (categoryId: string, subcategoryId: string, microcategory: string) => {
    setDictCategory(categoryId); setQuery(''); setDictionaryMenuOpen(false);
    setTimeout(() => document.getElementById(microAnchorId(categoryId, subcategoryId, microcategory))?.scrollIntoView({ behavior:'smooth', block:'start' }), 0);
  };

  return <main className="min-h-screen pb-28">
    <header className="topbar"><div className="shell topbar-inner">
      <div className="brand"><span className="logo-mark"><Dice5 /></span><span><small>SDXL DANBOORU</small><strong>タグガチャ</strong></span></div>
      <div className="header-actions">
        <Button variant="outline" className="header-tool" onClick={() => setCharacterOpen(true)}><UserRound /><span>キャラ固定</span>{characters.length > 0 && <b>{characters.length}</b>}</Button>
        <Button variant="outline" className="header-tool" onClick={() => setQualityOpen(true)}><BadgeCheck /><span>クオリティタグ</span>{qualityPresets.length > 0 && <b>{qualityPresets.length}</b>}</Button>
        <Button variant="outline" className="header-tool" onClick={() => setDictionaryOpen(true)}><BookOpen /><span>タグ一覧から選ぶ</span></Button>
        <Button className="roll-all" onClick={rollAll}><Sparkles /><span className="wide-label">ぜんぶまとめて</span>抽選</Button>
      </div>
    </div></header>

    <div className="shell workspace">
      <section className="prompt-dock">
        <div className="prompt-main"><div className="prompt-meta"><strong>FINAL PROMPT</strong><span>{tagNames.length + (characterFree.trim() ? 1 : 0)} tags</span>{quality.trim() && <span className="quality-active">品質固定あり</span>}</div><p>{prompt || 'カテゴリを抽選するか、タグ一覧から選んでください。'}</p></div>
        <Button className="copy-main" onClick={copyPrompt} disabled={!prompt}>{copied ? <Check /> : <Copy />}{copied ? 'コピー済み' : 'コピー'}</Button>
      </section>

      <nav className="category-tabs" aria-label="カテゴリ">
        {categories.map(category => <button key={category.id} className={activeId === category.id ? 'active' : ''} style={{ '--cat': category.color } as React.CSSProperties} onClick={() => setActiveId(category.id)}><span>{category.icon}</span>{category.name}<b>{category.subcategories.reduce((n,s) => n + (selected[s.id]?.length || 0), 0)}</b></button>)}
      </nav>

      <section className="category-work" style={{ '--cat': active.color } as React.CSSProperties}>
        <div className="work-heading"><div><p className="section-kicker">CATEGORY</p><h1>{active.icon} {active.name}</h1><p>細分類ごとに抽選。選択済みタグは複数残せます。</p></div><div><Button variant="outline" onClick={() => { setDictCategory(active.id); setDictionaryOpen(true); }}><BookOpen />タグ一覧から選ぶ</Button><Button onClick={() => rollCategory(active)}><Dice5 />このカテゴリを一括抽選</Button></div></div>
        <div className="subcategory-grid">{active.subcategories.map(subcategory => <article className="subcategory-row" key={subcategory.id}>
          <div className="sub-name"><strong>{subcategory.name}</strong>{subcategory.optional && <small>任意</small>}</div>
          <div className="sub-values">{(selected[subcategory.id] || []).map(tag => <button key={tag.tag} className="selected-token" onClick={() => toggleTag(subcategory.id, tag)} title={tag.note}><span>{tag.tag}</span><small>{tag.ja}</small><X /></button>)}{!selected[subcategory.id]?.length && <span className="unselected">未選択</span>}</div>
          <div className="sub-actions"><button className={locked[subcategory.id] ? 'locked' : ''} onClick={() => setLocked(v => ({ ...v, [subcategory.id]: !v[subcategory.id] }))} aria-label={`${subcategory.name}の固定`}>{locked[subcategory.id] ? <Lock /> : <LockOpen />}</button><button onClick={() => rollSubcategory(subcategory)} disabled={locked[subcategory.id]} aria-label={`${subcategory.name}を抽選`}><Dice5 /></button></div>
        </article>)}</div>
        <div className="category-bottom"><button onClick={() => setSelected(v => ({ ...v, ...Object.fromEntries(active.subcategories.map(s => [s.id, []])) }))}>このカテゴリを空にする</button><span>タグに触れると短い説明を確認できます</span></div>
      </section>

      <section className="selected-summary"><div className="summary-head"><div><p className="section-kicker">SELECTED TAGS</p><h2>現在の組み合わせ</h2></div><button onClick={clear}>すべて解除</button></div><div className="summary-chips">{categories.map(c => c.subcategories.flatMap(s => (selected[s.id] || []).map(tag => <button key={`${s.id}-${tag.tag}`} style={{ '--cat': c.color } as React.CSSProperties} onClick={() => toggleTag(s.id, tag)}><span>{tag.tag}</span><small>{s.name}</small><X /></button>)))}{!tagNames.length && <p>まだタグがありません。</p>}</div></section>
    </div>

    {dictionaryOpen && <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) { setDictionaryOpen(false); setDictionaryMenuOpen(false); } }}><section className="dictionary-dialog" role="dialog" aria-modal="true" aria-labelledby="dictionary-title">
      <header className="dialog-top"><div><h2 id="dictionary-title">タグ一覧から選ぶ</h2><p>SoreNuts分類の一般Danbooruタグ {allTags.length.toLocaleString()}件。投稿件数つき・複数選択できます。</p></div><div className="dialog-actions"><button className="dict-menu-trigger" aria-expanded={dictionaryMenuOpen} aria-controls="dictionary-jump-menu" onClick={() => { setDictionaryMenuOpen(v => !v); setExpandedJumpCategory(current => current || dictCategory); }}><Menu /><span>分類</span></button><button className="dialog-x" onClick={() => { setDictionaryOpen(false); setDictionaryMenuOpen(false); }}><X /></button></div></header>
      {dictionaryMenuOpen && <><button className="dict-menu-scrim" aria-label="分類メニューを閉じる" onClick={() => setDictionaryMenuOpen(false)}/><aside className="dict-jump-menu" id="dictionary-jump-menu"><header><strong>分類から移動</strong><button aria-label="分類メニューを閉じる" onClick={() => setDictionaryMenuOpen(false)}><X /></button></header><nav>{categories.map(category => <div key={category.id}><button className={`jump-category ${dictCategory === category.id ? 'active' : ''}`} aria-expanded={expandedJumpCategory === category.id} style={{ '--cat':category.color } as React.CSSProperties} onClick={() => chooseDictionaryCategory(category.id)}><span>{category.icon}</span><strong>{category.name}</strong><small>{category.subcategories.length}</small><ChevronDown /></button>{expandedJumpCategory === category.id && <div className="jump-subcategories">{category.subcategories.map(subcategory => { const subKey = `${category.id}:${subcategory.id}`; const expanded = expandedJumpSubcategory === subKey; return <div className="jump-subcategory" key={subcategory.id}><button aria-expanded={expanded} onClick={() => toggleJumpSubcategory(category.id, subcategory.id)}><span>{subcategory.name}</span><small>{subcategory.tags.length}</small><ChevronDown /></button>{expanded && <div className="jump-microcategories">{microcategoriesFor(subcategory).map(microcategory => <button key={microcategory} onClick={() => jumpToMicrocategory(category.id, subcategory.id, microcategory)}><span>{microcategory}</span></button>)}</div>}</div>})}</div>}</div>)}</nav></aside></>}
      <div className="dict-search"><div className="dict-search-field"><Search /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="日本語・英語タグで検索"/></div><div className="dict-sort" aria-label="タグの表示順"><span>表示順</span><button className={sortMode === 'default' ? 'active' : ''} onClick={() => setSortMode('default')}>デフォルト</button><button className={sortMode === 'count' ? 'active' : ''} onClick={() => setSortMode('count')}>Danbooru件数</button></div></div>
      <div className="dict-layout"><nav className="dict-categories">{categories.map(c => <button key={c.id} className={dictCategory === c.id ? 'active' : ''} style={{ '--cat': c.color } as React.CSSProperties} onClick={() => setDictCategory(c.id)}><span>{c.icon}</span>{c.name}<b>{c.subcategories.reduce((n,s) => n + (selected[s.id]?.length || 0),0)}</b></button>)}</nav>
        <div className="dict-content">{(categories.find(c => c.id === dictCategory)?.subcategories || []).map(sub => {
          const tags = shownTags.filter(x => x.subcategory.id === sub.id);
          if (!tags.length) return null;
          return <section key={sub.id} id={`dict-${dictCategory}-${sub.id}`}><h3>{sub.name}<small>{tags.length}件・複数選択可</small></h3>
            {groupByMicrocategory(tags, sub.name).map(([microName, microTags]) => <div className="dict-micro" id={microAnchorId(dictCategory, sub.id, microName)} key={microName}>
              <h4>{microName}<small>{microTags.length}件</small></h4>
              <div className="dict-tags">{microTags.map(item => { const on = selected[sub.id]?.some(x => x.tag === item.tag); return <button key={item.tag} className={on ? 'active' : ''} style={{ '--cat': item.category.color } as React.CSSProperties} onClick={() => toggleTag(sub.id,item)}><span>{item.ja}</span><code>{item.tag}</code><small>{item.note}</small><em>{formatCount(item.postCount)}</em>{on && <Check />}</button>})}</div>
            </div>)}
          </section>;
        })}{!shownTags.length && <p className="no-result">一致するタグがありません。</p>}</div>
      </div><footer className="dict-footer"><span>{tagNames.length}件 選択中</span><Button onClick={() => setDictionaryOpen(false)}>選択を反映して閉じる</Button></footer>
    </section></div>}

    {characterOpen && <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setCharacterOpen(false)}><section className="character-dialog" role="dialog" aria-modal="true" aria-labelledby="character-title"><button className="dialog-x character-close" onClick={() => setCharacterOpen(false)}><X /></button>
      <header><h2 id="character-title">キャラ固定</h2><p>自由入力・髪・瞳・身体・種族と、各項目の固定状態をまとめて保存します。</p></header>
      <div className="character-free-field"><label>キャラの自由入力タグ</label><Input value={characterFree} onChange={e => setCharacterFree(e.target.value)} placeholder="例：original character, sharp face, blue ribbon"/><small>ここに入力した内容も最終プロンプトとキャラ固定に含まれます。</small></div>
      <div className="save-character"><Input value={characterName} onChange={e => setCharacterName(e.target.value)} placeholder="保存名：例 銀髪の看板娘" onKeyDown={e => e.key === 'Enter' && saveCharacter()}/><Button onClick={saveCharacter} disabled={!characterName.trim()}><Save />現在の設定を保存</Button></div>
      <div className="character-list">{characters.map(character => { const names = Object.values(character.tags).flat().map(t => t.tag); return <article key={character.id}><div><strong>{character.name}</strong><p>{names.length ? names.join(', ') : 'タグなし'}</p></div><Button size="sm" onClick={() => applyCharacter(character)}><Lock />適用して固定</Button><button className="delete-character" aria-label={`${character.name}を削除`} onClick={() => setCharacters(v => v.filter(x => x.id !== character.id))}><Trash2 /></button></article>})}{!characters.length && <div className="empty-characters"><UserRound /><p>まだ保存されたキャラはいません。</p></div>}</div>
    </section></div>}

    {qualityOpen && <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setQualityOpen(false)}><section className="quality-dialog" role="dialog" aria-modal="true" aria-labelledby="quality-title"><button className="dialog-x quality-close" onClick={() => setQualityOpen(false)}><X /></button>
      <header><h2 id="quality-title">クオリティタグ</h2><p>抽選とは分けて入力し、名前付きプリセットとして保存できます。</p></header>
      <div className="quality-editor"><label>固定クオリティタグ</label><Input value={quality} onChange={e => setQuality(e.target.value)} placeholder="例：masterpiece, best quality"/><div className="quality-position"><span>配置</span><div className="segmented"><button className={position === 'before' ? 'active' : ''} onClick={() => setPosition('before')}>先頭</button><button className={position === 'after' ? 'active' : ''} onClick={() => setPosition('after')}>末尾</button></div></div></div>
      <div className="save-quality"><Input value={qualityName} onChange={e => setQualityName(e.target.value)} placeholder="プリセット名：例 SDXL基本" onKeyDown={e => e.key === 'Enter' && saveQuality()}/><Button onClick={saveQuality} disabled={!qualityName.trim() || !quality.trim()}><Save />保存</Button></div>
      <div className="quality-list">{qualityPresets.map(preset => <article key={preset.id}><div><strong>{preset.name}</strong><p>{preset.prompt}</p><small>{preset.position === 'before' ? '先頭に配置' : '末尾に配置'}</small></div><Button size="sm" onClick={() => { setQuality(preset.prompt); setPosition(preset.position); }}><Check />適用</Button><button className="delete-character" aria-label={`${preset.name}を削除`} onClick={() => setQualityPresets(v => v.filter(x => x.id !== preset.id))}><Trash2 /></button></article>)}{!qualityPresets.length && <div className="empty-characters"><BadgeCheck /><p>まだ保存されたプリセットはありません。</p></div>}</div>
    </section></div>}

    <div className="mobile-bar"><span>{tagNames.length} tags</span><Button variant="outline" onClick={() => setDictionaryOpen(true)}><BookOpen />タグ一覧</Button><Button onClick={copyPrompt} disabled={!prompt}>{copied ? <Check /> : <Copy />}{copied ? '済み' : 'コピー'}</Button></div>
  </main>;
}
