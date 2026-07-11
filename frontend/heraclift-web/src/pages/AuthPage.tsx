import { useState, type ChangeEvent} from 'react';
import { useAuth } from '../AuthContext';
import HeraclesIcon from '../components/HeraclesIcon';
import { LogIn,  UserRoundPlus } from 'lucide-react';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(form.username, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="main" style={{ maxWidth: 420 }}>
      <div className="auth-hero">
        <HeraclesIcon size={128} style={{ color: 'var(--gold)', display: 'block', margin: '0 auto .75rem' }} />
        <h1>
          Hera<span className="accent">clift</span>
        </h1>
        <p className="tagline">Ascend through your labors</p>
      </div>

      <div className="meander" style={{ marginBottom: '1.5rem' }} />

      <div className="card gilded">
        <div className="segmented" style={{ marginBottom: '1rem' }}>
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button">
            Sign in
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')} type="button">
            Create account
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="field">
            <span>Username</span>
            <input value={form.username} onChange={set('username')} autoComplete="username" required />
          </label>

          {mode === 'register' && (
            <label className="field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
            </label>
          )}

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 8 : undefined}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }} disabled={busy}>
            {mode === 'login' ? (<><LogIn size={18}/> Enter the Agora</>) : (<><UserRoundPlus size={18}/> Begin your labors</>)}
          </button>
        </form>
      </div>
    </div>
  );
}
