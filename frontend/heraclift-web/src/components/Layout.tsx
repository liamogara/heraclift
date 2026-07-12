import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import HeraclesIcon from './HeraclesIcon';
import { Landmark, Dumbbell, UtensilsCrossed, Calculator, LogOut } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Agora', end: true, icon: Landmark },
  { to: '/training', label: 'Labors', icon: Dumbbell },
  { to: '/nutrition', label: 'Feast', icon: UtensilsCrossed },
  { to: '/calculators', label: 'Oracle', icon: Calculator },
];

export function Meander({ progress }: { progress?: number }) {
  // progress: 0..1 — filled Greek-key strip. Without progress it's a static divider.
  if (progress === undefined) return <div className="meander" role="presentation" />;
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className="meander-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className="meander meander-bg" />
      <div className="meander-fill" style={{ width: `${pct}%` }}>
        <div className="meander" />
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <HeraclesIcon size={32} style={{ color: 'var(--gold)', verticalAlign: '-8px', marginRight: '.5rem' }} />
          Herac<span className="accent">lift</span>
        </div>
        <nav className="topnav" aria-label="Primary">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <t.icon size={18} />
                {t.label}
              </span>
            </NavLink>
          ))}
          <button className="btn small" onClick={logout}>
            <LogOut size={18}/>
            Sign out{user ? ` (${user.username})` : ''}
          </button>
        </nav>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <nav className="tabbar" aria-label="Primary">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <t.icon size={24} />
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
