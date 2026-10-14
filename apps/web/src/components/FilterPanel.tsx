import { useMemo, useState } from 'react';
import { Category, PricingType, SoftwareList } from '../types/software';

type Facets = SoftwareList['facets'];
const PRICING: Array<{ value: PricingType; label: string }> = [
  { value: 'FREE', label: 'Free' },
  { value: 'FREEMIUM', label: 'Freemium' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OPEN_SOURCE', label: 'Open source' },
];
const PLATFORMS = ['Web', 'Windows', 'Mac', 'Linux', 'iOS', 'Android'];

interface FilterPanelProps {
  facets: Facets;
  categories: Category[];
  pricing: string[];
  platforms: string[];
  tags: string[];
  onPricingChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  onTagChange: (value: string) => void;
  mobile?: boolean;
  onClose?: () => void;
}

export function FilterPanel({ facets, categories, pricing, platforms, tags, onPricingChange, onPlatformChange, onTagChange, mobile = false, onClose }: FilterPanelProps) {
  const [tagSearch, setTagSearch] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const matchingTags = useMemo(() => facets.tags.filter(tag => tag.name.toLowerCase().includes(tagSearch.toLowerCase())), [facets.tags, tagSearch]);
  const visibleTags = showAllTags || tagSearch ? matchingTags : matchingTags.slice(0, 10);
  const categoryCounts = new Map(facets.categories.map(item => [item.slug, item.count]));
  const platformCounts = new Map(facets.platforms.map(item => [item.value, item.count]));
  const pricingCounts = new Map(facets.pricing.map(item => [item.value, item.count]));
  const tagCounts = new Map(facets.tags.map(item => [item.slug, item.count]));
  const selectedTags = tags.filter(slug => !facets.tags.some(tag => tag.slug === slug)).map(slug => ({ slug, name: slug.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join(' '), count: 0 }));
  const displayedTags = [...visibleTags, ...selectedTags.filter(tag => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))];

  return <aside className={`${mobile ? 'filter-drawer' : 'filter-sidebar'}${mobile ? ' is-open' : ''}`} aria-label="Software filters">
    {mobile && <div className="drawer-heading"><h2>Filters</h2><button className="drawer-close" aria-label="Close filters" onClick={onClose}>×</button></div>}
    <section className="filter-section"><h3>Pricing</h3>{PRICING.map(option => <label className={`filter-option${(pricingCounts.get(option.value) ?? 0) === 0 ? ' is-dimmed' : ''}`} key={option.value}><input type="checkbox" checked={pricing.includes(option.value)} onChange={() => onPricingChange(option.value)} /><span>{option.label}</span><small>{pricingCounts.get(option.value) ?? 0}</small></label>)}</section>
    <section className="filter-section"><h3>Platform</h3>{PLATFORMS.map(platform => <label className={`filter-option${(platformCounts.get(platform) ?? 0) === 0 ? ' is-dimmed' : ''}`} key={platform}><input type="checkbox" checked={platforms.includes(platform)} onChange={() => onPlatformChange(platform)} /><span>{platform}</span><small>{platformCounts.get(platform) ?? 0}</small></label>)}</section>
    <section className="filter-section filter-tags"><h3>Tags</h3><input className="tag-search" placeholder="Find a tag..." aria-label="Search tags" value={tagSearch} onChange={event => setTagSearch(event.target.value)} />
      {displayedTags.map(tag => <label className={`filter-option${(tagCounts.get(tag.slug) ?? 0) === 0 ? ' is-dimmed' : ''}`} key={tag.slug}><input type="checkbox" checked={tags.includes(tag.slug)} onChange={() => onTagChange(tag.slug)} /><span>{tag.name}</span><small>{tagCounts.get(tag.slug) ?? 0}</small></label>)}
      {!tagSearch && matchingTags.length > 10 && <button className="show-tags" onClick={() => setShowAllTags(value => !value)}>{showAllTags ? 'Show fewer' : 'Show more tags'}</button>}
      {!matchingTags.length && <p className="no-tags">No matching tags</p>}
    </section>
    <span className="sr-only">{categories.length} categories available</span>
  </aside>;
}
