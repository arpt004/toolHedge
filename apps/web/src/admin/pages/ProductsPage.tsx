import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { ColumnManager, ColumnDef } from '../components/ColumnManager';
import { useColumnPreferences } from '../components/useColumnPreferences';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AdminProductListItem } from '../types';

const PAGE_SIZE = 20;
const ALL_COLUMNS: ColumnDef[] = [
  { key: 'slug', label: 'Slug' },
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'status', label: 'Status' },
  { key: 'popularity', label: 'Popularity' },
  { key: 'created', label: 'Created date' },
  { key: 'updated', label: 'Last updated' },
  { key: 'actions', label: 'Actions', required: true },
];
const DEFAULT_COLUMNS = ['name', 'slug', 'category', 'pricing', 'status', 'updated', 'actions'];

export function ProductsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AdminProductListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('updated_desc');
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<AdminProductListItem | null>(null);
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState('');

  const { visible, toggleColumn, resetColumns, syncError } = useColumnPreferences(
    'products',
    ALL_COLUMNS.map((c) => c.key),
    DEFAULT_COLUMNS,
  );

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    adminApi
      .listProducts({ q, status, sort, page, limit: PAGE_SIZE })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
        setStatusCounts(result.statusCounts as Record<string, number>);
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [q, status, sort, page]);

  useEffect(() => {
    load();
  }, [load]);

  const column = (key: string) => visible.includes(key);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (deleteMode === 'hard') {
        await adminApi.deleteProductPermanently(pendingDelete.id);
        setNotice(`"${pendingDelete.name}" was permanently deleted.`);
      } else {
        await adminApi.archiveProduct(pendingDelete.id);
        setNotice(`"${pendingDelete.name}" was archived and removed from the public site.`);
      }
      setPendingDelete(null);
      load();
    } catch {
      setError('Could not complete that action. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Products</h1>
          <p>{total} total · {statusCounts.PUBLISHED ?? 0} published</p>
        </div>
        <button className="button button-primary" onClick={() => navigate('/admin/products/new')}>
          + Add product
        </button>
      </div>

      {notice && <div className="admin-banner-success">{notice}</div>}
      {error && <div className="admin-banner-error">{error}</div>}

      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            className="admin-input admin-search-input"
            placeholder="Search by name or slug…"
            value={q}
            onChange={(event) => {
              setPage(1);
              setQ(event.target.value);
            }}
          />
          <select
            className="admin-select"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="NEEDS_REVIEW">Needs review</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            className="admin-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
          >
            <option value="updated_desc">Recently updated</option>
            <option value="newest">Newest</option>
            <option value="name_asc">Name A–Z</option>
            <option value="name_desc">Name Z–A</option>
            <option value="popular">Most popular</option>
          </select>
        </div>
        <div className="admin-toolbar-right">
          <ColumnManager columns={ALL_COLUMNS} visible={visible} onToggle={toggleColumn} onReset={resetColumns} syncError={syncError} />
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {column('name') && <th>Name</th>}
              {column('slug') && <th>Slug</th>}
              {column('category') && <th>Category</th>}
              {column('pricing') && <th>Pricing</th>}
              {column('status') && <th>Status</th>}
              {column('popularity') && <th>Popularity</th>}
              {column('created') && <th>Created</th>}
              {column('updated') && <th>Updated</th>}
              {column('actions') && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 6 }, (_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan={visible.length}>&nbsp;</td>
                </tr>
              ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={visible.length}>
                  <div className="admin-empty-state">
                    <h3>No products found</h3>
                    <p>Try a different search, or add your first product.</p>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              items.map((item) => (
                <tr key={item.id}>
                  {column('name') && (
                    <td>
                      <Link to={`/admin/products/${item.id}/edit`}>{item.name}</Link>
                    </td>
                  )}
                  {column('slug') && <td>{item.slug}</td>}
                  {column('category') && <td>{item.categories.map((c) => c.name).join(', ') || '—'}</td>}
                  {column('pricing') && <td>{item.pricingType}</td>}
                  {column('status') && (
                    <td>
                      <span className={`admin-badge admin-badge-${item.contentStatus.toLowerCase()}`}>
                        {item.contentStatus}
                      </span>
                    </td>
                  )}
                  {column('popularity') && <td>{item.popularity}</td>}
                  {column('created') && <td>{new Date(item.createdAt).toLocaleDateString()}</td>}
                  {column('updated') && <td>{new Date(item.updatedAt).toLocaleDateString()}</td>}
                  {column('actions') && (
                    <td>
                      <div className="admin-row-actions">
                        <a
                          className="admin-icon-button"
                          href={`/software/${item.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          title="View on site"
                        >
                          ↗
                        </a>
                        <button
                          className="admin-icon-button"
                          title="Edit"
                          onClick={() => navigate(`/admin/products/${item.id}/edit`)}
                        >
                          ✎
                        </button>
                        <button
                          className="admin-icon-button is-danger"
                          title="Delete"
                          onClick={() => {
                            setDeleteMode('soft');
                            setPendingDelete(item);
                          }}
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="admin-pagination">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="admin-pagination-controls">
          <button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button
            className="button button-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title={deleteMode === 'hard' ? 'Permanently delete product?' : 'Archive this product?'}
          message={
            deleteMode === 'hard'
              ? `"${pendingDelete.name}" and all of its reviews, pricing plans, and media will be permanently deleted. This cannot be undone.`
              : `"${pendingDelete.name}" will be archived and hidden from the public site. You can restore it later by editing it. ${
                  pendingDelete.reviewCount > 0 ? `It has ${pendingDelete.reviewCount} review(s), which will be kept.` : ''
                }`
          }
          confirmLabel={deleteMode === 'hard' ? 'Permanently delete' : 'Archive product'}
          danger
          busy={deleting}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        >
          {deleteMode === 'soft' ? (
            <button
              type="button"
              className="admin-column-popover-actions"
              style={{ background: 'none', border: 'none', color: '#b23b3b', fontSize: 12.5, padding: 0, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setDeleteMode('hard')}
            >
              Permanently delete instead (cannot be undone)
            </button>
          ) : (
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: '#4f7f68', fontSize: 12.5, padding: 0, marginBottom: 12, cursor: 'pointer' }}
              onClick={() => setDeleteMode('soft')}
            >
              ← Archive instead (safer, reversible)
            </button>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
