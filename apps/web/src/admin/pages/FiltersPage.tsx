import { FormEvent, useEffect, useState } from 'react';
import { adminApi, AdminApiError } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AdminCategory, AdminFeatureOption, AdminFilterDefinition, FilterSourceType, FilterType } from '../types';

const FILTER_TYPES: FilterType[] = ['CHECKBOX', 'SINGLE_SELECT', 'BOOLEAN', 'RANGE'];
const SOURCE_TYPES: FilterSourceType[] = ['FEATURE', 'PRICING_TYPE', 'PLATFORM', 'TAG'];

interface FilterFormState {
  key: string;
  label: string;
  type: FilterType;
  sourceType: FilterSourceType;
  featureId: number | null;
  categorySlugs: string[];
}
const EMPTY: FilterFormState = { key: '', label: '', type: 'BOOLEAN', sourceType: 'FEATURE', featureId: null, categorySlugs: [] };

export function FiltersPage() {
  const [filters, setFilters] = useState<AdminFilterDefinition[]>([]);
  const [features, setFeatures] = useState<AdminFeatureOption[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FilterFormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminFilterDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.listFilters(), adminApi.listFeatureOptions(), adminApi.listCategories()])
      .then(([filterList, featureList, categoryResult]) => {
        setFilters(filterList);
        setFeatures(featureList);
        setCategories(categoryResult.items);
      })
      .catch(() => setError('Could not load filters.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setForm(EMPTY);
    setFormError('');
    setShowForm(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.key.trim() || !form.label.trim()) {
      setFormError('Key and label are required.');
      return;
    }
    if (form.sourceType === 'FEATURE' && !form.featureId) {
      setFormError('Choose which product attribute this filter reads from.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await adminApi.createFilter({
        key: form.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
        label: form.label.trim(),
        type: form.type,
        sourceType: form.sourceType,
        featureId: form.sourceType === 'FEATURE' ? form.featureId : undefined,
        isEnabled: true,
        displayOrder: filters.length,
        categorySlugs: form.categorySlugs,
      });
      setShowForm(false);
      load();
    } catch (reason) {
      setFormError(reason instanceof AdminApiError ? reason.message : 'Could not create this filter.');
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (filter: AdminFilterDefinition) => {
    try {
      await adminApi.setFilterEnabled(filter.id, !filter.isEnabled);
      load();
    } catch {
      setError('Could not update that filter.');
    }
  };

  const move = async (filter: AdminFilterDefinition, direction: -1 | 1) => {
    const sorted = [...filters].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = sorted.findIndex((f) => f.id === filter.id);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    [sorted[index], sorted[target]] = [sorted[target], sorted[index]];
    try {
      await adminApi.reorderFilters(sorted.map((f) => f.id));
      load();
    } catch {
      setError('Could not reorder filters.');
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteFilter(pendingDelete.id);
      setPendingDelete(null);
      load();
    } catch {
      setError('Could not delete this filter.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Filters</h1>
          <p>Control which attribute filters show on the public listing page.</p>
        </div>
        <button className="button button-primary" onClick={openCreate}>
          + Add filter
        </button>
      </div>

      {error && <div className="admin-banner-error">{error}</div>}

      <div className="admin-card">
        {loading && <p>Loading…</p>}
        {!loading && filters.length === 0 && (
          <div className="admin-empty-state">
            <h3>No filters configured</h3>
            <p>Add a filter to surface a product attribute (like "Open source" or "API available") on the browse page.</p>
          </div>
        )}
        {!loading &&
          [...filters]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((filter, index) => (
              <div className="admin-filter-row" key={filter.id}>
                <span className="admin-drag-handle" aria-hidden="true">
                  ⠿
                </span>
                <div style={{ flex: 1 }}>
                  <strong>{filter.label}</strong>
                  <div className="admin-field-hint">
                    key: {filter.key} · {filter.type} · source: {filter.sourceType}
                    {filter.feature ? ` (${filter.feature.name})` : ''}
                    {filter.categories.length > 0 ? ` · scoped to ${filter.categories.map((c) => c.name).join(', ')}` : ' · all categories'}
                  </div>
                </div>
                <div className="admin-row-actions">
                  <button className="admin-icon-button" disabled={index === 0} onClick={() => move(filter, -1)} title="Move up">
                    ↑
                  </button>
                  <button
                    className="admin-icon-button"
                    disabled={index === filters.length - 1}
                    onClick={() => move(filter, 1)}
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
                <label className="admin-switch" title={filter.isEnabled ? 'Enabled' : 'Disabled'}>
                  <input type="checkbox" checked={filter.isEnabled} onChange={() => toggleEnabled(filter)} />
                  <span className="admin-switch-track" />
                </label>
                <button className="admin-icon-button is-danger" title="Delete" onClick={() => setPendingDelete(filter)}>
                  🗑
                </button>
              </div>
            ))}
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <h3>Add filter</h3>
            <form onSubmit={onSubmit}>
              {formError && <div className="admin-banner-error">{formError}</div>}
              <div className="admin-form-grid full">
                <div className="admin-field">
                  <label>Label *</label>
                  <input className="admin-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label>Key (query param, unique) *</label>
                  <input className="admin-input" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
                  <span className="admin-field-hint">Lowercase letters/numbers/underscores. e.g. "api_access"</span>
                </div>
                <div className="admin-field">
                  <label>Filter type</label>
                  <select className="admin-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FilterType })}>
                    {FILTER_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>Source</label>
                  <select
                    className="admin-select"
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value as FilterSourceType, featureId: null })}
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                {form.sourceType === 'FEATURE' && (
                  <div className="admin-field">
                    <label>Product attribute *</label>
                    <select
                      className="admin-select"
                      value={form.featureId ?? ''}
                      onChange={(e) => setForm({ ...form, featureId: e.target.value ? Number(e.target.value) : null })}
                    >
                      <option value="">Choose…</option>
                      {features.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.group.name} — {f.name} ({f.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="admin-field">
                  <label>Limit to categories (optional)</label>
                  <div className="admin-checkbox-grid">
                    {categories.map((cat) => (
                      <span
                        key={cat.slug}
                        className={`admin-chip-toggle${form.categorySlugs.includes(cat.slug) ? ' is-selected' : ''}`}
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            categorySlugs: current.categorySlugs.includes(cat.slug)
                              ? current.categorySlugs.filter((s) => s !== cat.slug)
                              : [...current.categorySlugs, cat.slug],
                          }))
                        }
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <span className="admin-field-hint">Leave empty to show this filter across all categories.</span>
                </div>
              </div>
              <div className="admin-modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="button button-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Create filter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete filter?"
          message={`"${pendingDelete.label}" will stop appearing on the public listing. The underlying product attribute data is not affected.`}
          confirmLabel="Delete filter"
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
