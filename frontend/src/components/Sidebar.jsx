import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, Wrench, UserCheck, FileText, Camera, Computer } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/products', icon: Package, label: 'المنتجات' },
  { to: '/customers', icon: Users, label: 'العملاء' },
  { to: '/maintenance', icon: Wrench, label: 'الصيانة' },
  { to: '/employees', icon: UserCheck, label: 'الموظفين' },
  { to: '/invoices', icon: FileText, label: 'الفواتير' },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: '', gap: 10 }}>
          <Computer size={25} color="var(--accent2)" />
          <div>
            <h1>شركة قمة الابتكار  </h1>
            <p>للأنظمة الامان والشبكات والحواسيب</p>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        <div className="nav-section-label">القائمة الرئيسية</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            end={to === '/'}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: 11, color: 'var(--text3)' }}>Nader-Dev v1.0.0</p>
      </div>
    </aside>
  );
}
