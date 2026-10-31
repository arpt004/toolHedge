import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AuthContext';
import { ThemeToggle } from '../../components/ThemeToggle/ThemeToggle';
import './AdminLayout.css';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: '◧', end: true },
  { to: '/admin/products', label: 'Products', icon: '▣' },
  { to: '/admin/categories', label: 'Categories', icon: '◇' },
  { to: '/admin/filters', label: 'Filters', icon: '☷' },
];

export function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">t</span>
          <span>Toolhedge Admin</span>
        </div>
        <nav aria-label="Admin navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link${isActive ? ' is-active' : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-link">
            <span aria-hidden="true">↩</span>
            View site
          </a>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div />
          <div className="admin-topbar-user">
            <ThemeToggle />
            <div className="admin-user-chip">
              <span className="admin-user-avatar" aria-hidden="true">
                {admin?.name?.[0]?.toUpperCase() ?? 'A'}
              </span>
              <div>
                <strong>{admin?.name}</strong>
                <small>{admin?.email}</small>
              </div>
            </div>
            <button className="button button-secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
