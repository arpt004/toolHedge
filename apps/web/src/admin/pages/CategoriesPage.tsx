import { FormEvent, useEffect, useState } from 'react';
import { adminApi, AdminApiError } from '../api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AdminCategory } from '../types';

interface CategoryFormState {
  slug: string;
  name: string;
  description: string;
  icon: string;
}
const EMPTY: CategoryFormState = { slug: '', name: '', description: '', icon: '' };
const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(null);
  const [dependentWarning, setDependentWarning] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi
      .listCategories()
      .then((result) => setCategories(result.items))
      .catch(() => setError('Could not load categories.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setShowForm(true);
  };
  const openEdit = (category: AdminCategory) => {
    setEditing(category);
    setForm({ slug: category.slug, name: category.name, description: category.description, icon: category.icon });
    setFormError('');
    setShowForm(true);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.description.trim() || !form.icon.trim()) {
      setFormError('Name, description, and icon are all required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = { slug: slugify(form.slug || form.name), name: form.name.trim(), description: form.description.trim(), icon: form.icon.trim() };
      if (editing) await adminApi.updateCategory(editing.id, payload);
      else await adminApi.createCategory(payload);
      setShowForm(false);
      load();
    } catch (reason) {
      setFormError(reason instanceof AdminApiError ? reason.message : 'Could not save this category.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (force: boolean) => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteCategory(pendingDelete.id, force);
      setPendingDelete(null);
      setDependentWarning('');
      load();
    } catch (reason) {
      if (reason instanceof AdminApiError && reason.code === 'CATEGORY_HAS_DEPENDENTS') {
        setDependentWarning(reason.message);
      } else {
        setError('Could not delete this category.');
        setPendingDelete(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Categories</h1>
          <p>{categories.length} categories</p>
        </div>
        <button className="button button-primary" onClick={openCreate}>
          + Add category
        </button>
      </div>

      {error && <div className="admin-banner-error">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Name</th>
              <th>Slug</th>
              <th className="admin-cell-wrap">Description</th>
              <th>Products</th>
              <th>Filters</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            )}
            {!loading && categories.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="admin-empty-state">
                    <h3>No categories yet</h3>
                    <p>Add your first category to start organizing products.</p>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.icon}</td>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td className="admin-cell-wrap">{category.description}</td>
                  <td>{category.softwareCount}</td>
                  <td>{category.filterCount}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-icon-button" title="Edit" onClick={() => openEdit(category)}>
                        ✎
                      </button>
                      <button
                        className="admin-icon-button is-danger"
                        title="Delete"
                        onClick={() => {
                          setPendingDelete(category);
                          setDependentWarning('');
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="admin-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="admin-modal" style={{ maxWidth: 480 }}>
            <h3>{editing ? 'Edit category' : 'Add category'}</h3>
            <form onSubmit={onSubmit}>
              {formError && <div className="admin-banner-error">{formError}</div>}
              <div className="admin-form-grid full">
                <div className="admin-field">
                  <label>Name *</label>
                  <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label>Slug</label>
                  <input
                    className="admin-input"
                    placeholder={slugify(form.name)}
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div className="admin-field">
                  <label>Icon (emoji) *</label>
                  <input className="admin-input" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
                </div>
                <div className="admin-field">
                  <label>Description *</label>
                  <textarea className="admin-textarea" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="admin-modal-actions" style={{ marginTop: 18 }}>
                <button type="button" className="button button-secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && !dependentWarning && (
        <ConfirmDialog
          title="Delete category?"
          message={`"${pendingDelete.name}" will be removed. Products and filters that reference it will be checked first.`}
          confirmLabel="Delete category"
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => confirmDelete(false)}
        />
      )}
      {pendingDelete && dependentWarning && (
        <ConfirmDialog
          title="This category is in use"
          message={dependentWarning}
          confirmLabel="Remove anyway"
          danger
          busy={deleting}
          onCancel={() => {
            setPendingDelete(null);
            setDependentWarning('');
          }}
          onConfirm={() => confirmDelete(true)}
        />
      )}
    </div>
  );
}
