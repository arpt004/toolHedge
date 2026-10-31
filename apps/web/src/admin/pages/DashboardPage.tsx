import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api';
import { AdminDashboardStats } from '../types';

export function DashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi
      .getDashboardStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => {
        if (active) setError('Could not load dashboard stats.');
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your product catalog.</p>
        </div>
        <div className="admin-quick-actions">
          <Link className="button button-primary" to="/admin/products/new">
            + Add product
          </Link>
          <Link className="button button-secondary" to="/admin/categories">
            Manage categories
          </Link>
          <Link className="button button-secondary" to="/admin/filters">
            Manage filters
          </Link>
          <Link className="button button-secondary" to="/admin/products">
            Configure columns
          </Link>
        </div>
      </div>

      {error && <div className="admin-banner-error">{error}</div>}

      {!stats && !error && <p>Loading…</p>}

      {stats && (
        <>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-label">Total products</div>
              <div className="admin-stat-value">{stats.totalProducts}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Published</div>
              <div className="admin-stat-value">{stats.activeProducts}</div>
              <div className="admin-stat-sub">{stats.inactiveProducts} not published</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Categories</div>
              <div className="admin-stat-value">{stats.totalCategories}</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-label">Filters</div>
              <div className="admin-stat-value">{stats.enabledFilters}</div>
              <div className="admin-stat-sub">{stats.totalFilters} total configured</div>
            </div>
          </div>

          <div className="admin-card">
            <h2>Recently updated products</h2>
            {stats.recentlyUpdated.length === 0 ? (
              <p className="admin-field-hint">No products yet.</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentlyUpdated.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>
                          <span className={`admin-badge admin-badge-${item.contentStatus.toLowerCase()}`}>
                            {item.contentStatus}
                          </span>
                        </td>
                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                        <td>
                          <Link className="button button-secondary" to={`/admin/products/${item.id}/edit`}>
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
