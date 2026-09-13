'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { allTags, type Tag } from './tag-data';

type DictionaryTag = (typeof allTags)[number];
type RelatedData = Record<string, [string, number][]>;
const index = new Map(allTags.map(tag => [tag.tag, tag]));
const formatCount = (n: number) => n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : String(n);

export default function RelatedTagsPanel({ source, selected, onToggle, onBack, conflicts }: {
  source: DictionaryTag;
  selected: string[];
  onToggle: (subcategory: string, tag: Tag) => void;
  onBack: () => void;
  conflicts: (tags: string[]) => string;
}) {
  const [data, setData] = useState<RelatedData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setFailed(false);
    import('./related-tags.json').then(module => { if (active) setData(module.default as unknown as RelatedData); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [attempt]);
  const sourceSelected = selected.includes(source.tag);
  return <section className="related-panel" aria-label={`${source.ja}の関連タグ`}>
    <button className="related-back" onClick={onBack}>← タグ一覧に戻る</button>
    <h3>{source.ja} の関連タグ</h3>
    <p className="related-source"><code>{source.tag}</code><button aria-pressed={sourceSelected} disabled={!sourceSelected && !!conflicts([...selected, source.tag])} onClick={() => onToggle(source.subcategory.id, source)}>{sourceSelected ? '選択済み・解除' : 'このタグを選択'}</button></p>
    <p className="related-note">併用されやすい候補です。すべての矛盾を判定できるわけではありません。</p>
    {!data && !failed && <p role="status">関連タグを読み込み中…</p>}
    {failed && <p role="alert">読み込めませんでした。<button className="related-back" onClick={() => setAttempt(v => v + 1)}>再試行</button></p>}
    {data && !data[source.tag]?.length && <p>このタグの関連データはありません。</p>}
    {data && <div className="dict-tags">{(data[source.tag] || []).map(([name, count]) => {
      const tag = index.get(name);
      if (!tag) return null;
      const on = selected.includes(name);
      const conflict = on ? '' : conflicts([...new Set([...selected, source.tag, name])]);
      return <button key={name} aria-pressed={on} disabled={!!conflict} className={on ? 'active' : ''} style={{ '--cat': tag.category.color } as React.CSSProperties} title={conflict || `併用件数 ${formatCount(count)} · ${tag.category.name} / ${tag.subcategory.name}`} onClick={() => onToggle(tag.subcategory.id, tag)}><span>{tag.ja}</span><code>{name}</code><em>{formatCount(tag.postCount)}</em>{on && <Check />}{conflict && <small className="related-conflict">{conflict}</small>}</button>;
    })}</div>}
    <p className="related-credit"><a href="https://huggingface.co/datasets/newtextdoc1111/danbooru-tag-csv" target="_blank" rel="noreferrer">関連データの出典</a></p>
  </section>;
}
