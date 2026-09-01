'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, Copy, Dice5, Lock, LockOpen, Save, Search, Sparkles, Trash2, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { allTags, categories, type Category, type Subcategory, type Tag } from './tag-data';

type Selection = Record<string, Tag[]>;
type SavedCharacter = { id: string; name: string; tags: Record<string, Tag[]> };
const blankSelection = (): Selection => Object.fromEntries(categories.flatMap(c => c.subcategories.map(s => [s.id, []])));
const pick = (items: Tag[], current: Tag[]) => {
  const pool = items.length > 1 ? items.filter(item => !current.some(x => x.tag === item.tag)) : items;
  return pool[Math.floor(Math.random() * pool.length)] ?? items[0];
};

export default function Home() {
  const [selected, setSelected] = useState<Selection>(blankSelection);
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState('hair');
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictCategory, setDictCategory] = useState('hair');
  const [query, setQuery] = useState('');
  const [characterOpen, setCharacterOpen] = useState(false);
  const [characterName, setCharacterName] = useState('');
  const [characters, setCharacters] = useState<SavedCharacter[]>([]);
  const [quality, setQuality] = useState('');
  const [position, setPosition] = useState<'before'|'after'>('before');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('tag-gacha-settings-v2') || '{}');
      setQuality(settings.quality || ''); setPosition(settings.position || 'before');
      setCharacters(JSON.parse(localStorage.getItem('tag-gacha-characters') || '[]'));
    } catch {}
  }, []);
  useEffect(() => { localStorage.setItem('tag-gacha-settings-v2', JSON.stringify({ quality, position })); }, [quality, position]);
  useEffect(() => { localStorage.setItem('tag-gacha-characters', JSON.stringify(characters)); }, [characters]);

  const active = categories.find(c => c.id === activeId) ?? categories[0];
  const flatSelected = useMemo(() => categories.flatMap(c => c.subcategories.flatMap(s => selected[s.id] || [])), [selected]);
  const tagNames = useMemo(() => [...new Set(flatSelected.map(t => t.tag))], [flatSelected]);
  const prompt = useMemo(() => {
    const main = tagNames.join(', '); const fixed = quality.trim().replace(/^,|,$/g, '').trim();
    return fixed && main ? (position === 'before' ? `${fixed}, ${main}` : `${main}, ${fixed}`) : fixed || main;
  }, [tagNames, quality, position]);
  const shownTags = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allTags.filter(x => x.category.id === dictCategory && (!q || `${x.tag} ${x.ja} ${x.note}`.toLowerCase().includes(q)));
  }, [dictCategory, query]);

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
    const ids = categories.filter(c => c.id === 'hair' || c.id === 'body').flatMap(c => c.subcategories.map(s => s.id));
    const tags = Object.fromEntries(ids.map(id => [id, selected[id] || []]));
    setCharacters(v => [...v, { id: crypto.randomUUID(), name, tags }]); setCharacterName('');
  };
  const applyCharacter = (character: SavedCharacter) => {
    setSelected(v => ({ ...v, ...character.tags }));
    const ids = Object.keys(character.tags); setLocked(v => ({ ...v, ...Object.fromEntries(ids.map(id => [id, true])) }));
    setCharacterOpen(false);
  };

  return <main className="min-h-screen pb-28">
    <header className="topbar"><div className="shell topbar-inner">
      <div className="brand"><span className="logo-mark"><Dice5 /></span><span><small>SDXL DANBOORU</small><strong>タグガチャ</strong></span></div>
      <div className="header-actions">
        <Button variant="outline" className="header-tool" onClick={() => setCharacterOpen(true)}><UserRound /><span>キャラ固定</span>{characters.length > 0 && <b>{characters.length}</b>}</Button>
        <Button variant="outline" className="header-tool" onClick={() => setDictionaryOpen(true)}><BookOpen /><span>辞書から選ぶ</span></Button>
        <Button className="roll-all" onClick={rollAll}><Sparkles /><span className="wide-label">ぜんぶまとめて</span>抽選</Button>
      </div>
    </div></header>

    <div className="shell workspace">
      <section className="prompt-dock">
        <div className="prompt-main"><div className="prompt-meta"><strong>FINAL PROMPT</strong><span>{tagNames.length} tags</span></div><p>{prompt || 'カテゴリを抽選するか、辞書からタグを選んでください。'}</p></div>
        <div className="quality-compact"><label>固定クオリティタグ</label><Input value={quality} onChange={e => setQuality(e.target.value)} placeholder="自分で入力（抽選対象外）"/><div className="segmented"><button className={position === 'before' ? 'active' : ''} onClick={() => setPosition('before')}>先頭</button><button className={position === 'after' ? 'active' : ''} onClick={() => setPosition('after')}>末尾</button></div></div>
        <Button className="copy-main" onClick={copyPrompt} disabled={!prompt}>{copied ? <Check /> : <Copy />}{copied ? 'コピー済み' : 'コピー'}</Button>
      </section>

      <nav className="category-tabs" aria-label="カテゴリ">
        {categories.map(category => <button key={category.id} className={activeId === category.id ? 'active' : ''} style={{ '--cat': category.color } as React.CSSProperties} onClick={() => setActiveId(category.id)}><span>{category.icon}</span>{category.name}<b>{category.subcategories.reduce((n,s) => n + (selected[s.id]?.length || 0), 0)}</b></button>)}
      </nav>

      <section className="category-work" style={{ '--cat': active.color } as React.CSSProperties}>
        <div className="work-heading"><div><p className="section-kicker">CATEGORY BUILDER</p><h1>{active.icon} {active.name}を組み立てる</h1><p>細分類ごとに抽選。選択済みタグは複数残せます。</p></div><div><Button variant="outline" onClick={() => { setDictCategory(active.id); setDictionaryOpen(true); }}><BookOpen />一覧から選ぶ</Button><Button onClick={() => rollCategory(active)}><Dice5 />このカテゴリを一括抽選</Button></div></div>
        <div className="subcategory-grid">{active.subcategories.map(subcategory => <article className="subcategory-row" key={subcategory.id}>
          <div className="sub-name"><strong>{subcategory.name}</strong>{subcategory.optional && <small>任意</small>}</div>
          <div className="sub-values">{(selected[subcategory.id] || []).map(tag => <button key={tag.tag} className="selected-token" onClick={() => toggleTag(subcategory.id, tag)} title={tag.note}><span>{tag.tag}</span><small>{tag.ja}</small><X /></button>)}{!selected[subcategory.id]?.length && <span className="unselected">未選択</span>}</div>
          <div className="sub-actions"><button className={locked[subcategory.id] ? 'locked' : ''} onClick={() => setLocked(v => ({ ...v, [subcategory.id]: !v[subcategory.id] }))} aria-label={`${subcategory.name}の固定`}>{locked[subcategory.id] ? <Lock /> : <LockOpen />}</button><button onClick={() => rollSubcategory(subcategory)} disabled={locked[subcategory.id]} aria-label={`${subcategory.name}を抽選`}><Dice5 /></button></div>
        </article>)}</div>
        <div className="category-bottom"><button onClick={() => setSelected(v => ({ ...v, ...Object.fromEntries(active.subcategories.map(s => [s.id, []])) }))}>このカテゴリを空にする</button><span>タグに触れると短い説明を確認できます</span></div>
      </section>

      <section className="selected-summary"><div className="summary-head"><div><p className="section-kicker">SELECTED TAGS</p><h2>現在の組み合わせ</h2></div><button onClick={clear}>すべて解除</button></div><div className="summary-chips">{categories.map(c => c.subcategories.flatMap(s => (selected[s.id] || []).map(tag => <button key={`${s.id}-${tag.tag}`} style={{ '--cat': c.color } as React.CSSProperties} onClick={() => toggleTag(s.id, tag)}><span>{tag.tag}</span><small>{s.name}</small><X /></button>)))}{!tagNames.length && <p>まだタグがありません。</p>}</div></section>
    </div>

    {dictionaryOpen && <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setDictionaryOpen(false)}><section className="dictionary-dialog" role="dialog" aria-modal="true" aria-labelledby="dictionary-title">
      <header className="dialog-top"><div><h2 id="dictionary-title">辞書から選んで作る</h2><p>タグをタップして複数選択できます。</p></div><button className="dialog-x" onClick={() => setDictionaryOpen(false)}><X /></button></header>
      <div className="dict-search"><Search /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="日本語・英語タグで検索"/></div>
      <div className="dict-layout"><nav className="dict-categories">{categories.map(c => <button key={c.id} className={dictCategory === c.id ? 'active' : ''} style={{ '--cat': c.color } as React.CSSProperties} onClick={() => setDictCategory(c.id)}><span>{c.icon}</span>{c.name}<b>{c.subcategories.reduce((n,s) => n + (selected[s.id]?.length || 0),0)}</b></button>)}</nav>
        <div className="dict-content">{(categories.find(c => c.id === dictCategory)?.subcategories || []).map(sub => { const tags = shownTags.filter(x => x.subcategory.id === sub.id); if (!tags.length) return null; return <section key={sub.id}><h3>{sub.name}<small>複数選択可</small></h3><div className="dict-tags">{tags.map(item => { const on = selected[sub.id]?.some(x => x.tag === item.tag); return <button key={item.tag} className={on ? 'active' : ''} style={{ '--cat': item.category.color } as React.CSSProperties} onClick={() => toggleTag(sub.id,item)}><span>{item.ja}</span><code>{item.tag}</code><small>{item.note}</small>{on && <Check />}</button>})}</div></section>})}{!shownTags.length && <p className="no-result">一致するタグがありません。</p>}</div>
      </div><footer className="dict-footer"><span>{tagNames.length}件 選択中</span><Button onClick={() => setDictionaryOpen(false)}>選択を反映して閉じる</Button></footer>
    </section></div>}

    {characterOpen && <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && setCharacterOpen(false)}><section className="character-dialog" role="dialog" aria-modal="true" aria-labelledby="character-title"><button className="dialog-x character-close" onClick={() => setCharacterOpen(false)}><X /></button>
      <header><h2 id="character-title">キャラ固定</h2><p>髪・瞳・身体・種族の現在値を名前付きで保存し、いつでも固定できます。</p></header>
      <div className="save-character"><Input value={characterName} onChange={e => setCharacterName(e.target.value)} placeholder="例：銀髪の看板娘" onKeyDown={e => e.key === 'Enter' && saveCharacter()}/><Button onClick={saveCharacter} disabled={!characterName.trim()}><Save />現在の外見を保存</Button></div>
      <div className="character-list">{characters.map(character => { const names = Object.values(character.tags).flat().map(t => t.tag); return <article key={character.id}><div><strong>{character.name}</strong><p>{names.length ? names.join(', ') : 'タグなし'}</p></div><Button size="sm" onClick={() => applyCharacter(character)}><Lock />適用して固定</Button><button className="delete-character" aria-label={`${character.name}を削除`} onClick={() => setCharacters(v => v.filter(x => x.id !== character.id))}><Trash2 /></button></article>})}{!characters.length && <div className="empty-characters"><UserRound /><p>まだ保存されたキャラはいません。</p></div>}</div>
    </section></div>}

    <div className="mobile-bar"><span>{tagNames.length} tags</span><Button variant="outline" onClick={() => setDictionaryOpen(true)}><BookOpen />辞書</Button><Button onClick={copyPrompt} disabled={!prompt}>{copied ? <Check /> : <Copy />}{copied ? '済み' : 'コピー'}</Button></div>
  </main>;
}
