import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Tags,
  FileBarChart,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  student_staff: 'Student / Staff',
  maintenance_officer: 'Maintenance Officer',
  admin: 'Administrator',
};

const NAV_BY_ROLE = {
  student_staff: [
    { to: '/dashboard', label: 'My Requests', icon: LayoutDashboard },
    { to: '/submit', label: 'Submit Request', icon: PlusCircle },
  ],
  maintenance_officer: [
    { to: '/dashboard', label: 'Assigned to Me', icon: ClipboardList },
  ],
  admin: [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/requests', label: 'All Requests', icon: ClipboardList },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/categories', label: 'Categories', icon: Tags },
    { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  ],
};

function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Layout({ title, eyebrow, children, headerAction }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="mark">
  <img src="/logo-icon.png" alt="MOU" />
</div>
          <div>
            <div className="name">MOU Service Portal</div>
            <div className="sub">Facilities Maintenance</div>
          </div>
        </div>

        <nav className="nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              end
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar">{initials(user?.name)}</div>
            <div>
              <div className="u-name">{user?.name}</div>
              <div className="u-role">{ROLE_LABELS[user?.role]}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h1>{title}</h1>
          </div>
          {headerAction}
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
