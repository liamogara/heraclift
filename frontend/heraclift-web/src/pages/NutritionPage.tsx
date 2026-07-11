import { useCallback, useEffect, useState, type ChangeEvent} from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

interface NutritionEntry {
  id: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionGoal {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionDay {
  date: string;
  entries: NutritionEntry[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  goal: NutritionGoal | null;
}

const today = () => new Date().toLocaleDateString('en-CA'); // yyyy-MM-dd, local time

function Ring({ value, goal, label, color }: { value: number; goal: number; label: string; color: string }) {
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring-wrap">
      <svg width="88" height="88" viewBox="0 0 88 88" role="img" aria-label={`${label}: ${Math.round(value)} of ${Math.round(goal)}`}>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 44 44)"
          style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
        <text x="44" y="42" textAnchor="middle" fill="var(--marble)" fontSize="14" fontWeight="800">
          {Math.round(value)}
        </text>
        <text x="44" y="57" textAnchor="middle" fill="var(--marble-dim)" fontSize="10">
          / {goal ? Math.round(goal) : '—'}
        </text>
      </svg>
      <span className="label">{label}</span>
    </div>
  );
}

export default function NutritionPage() {
  const [date, setDate] = useState(today());
  const [day, setDay] = useState<NutritionDay | null>(null);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [error, setError] = useState('');

  const load = useCallback(() => api.get<NutritionDay>(`/nutrition/day/${date}`).then(setDay), [date]);
  useEffect(() => {
    load();
  }, [load]);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const add: React.ComponentProps<'form'>['onSubmit'] = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name the food.');
    try {
      await api.post('/nutrition/entries', {
        date,
        name: form.name.trim(),
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
      });
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '' });
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (id: number) => {
    await api.del(`/nutrition/entries/${id}`);
    load();
  };

  if (!day) return <p className="muted">Loading…</p>;

  const g = day.goal;

  return (
    <>
      <div className="spread" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">The Feast</p>
          <h1>Nutrition</h1>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: 'auto' }}
          aria-label="Log date"
        />
      </div>

      <div className="card gilded">
        <div className="rings">
          <Ring value={day.totals.calories} goal={g?.calories ?? 0} label="Calories" color="var(--gold)" />
          <Ring value={day.totals.protein} goal={g?.protein ?? 0} label="Protein (g)" color="var(--aegean)" />
          <Ring value={day.totals.carbs} goal={g?.carbs ?? 0} label="Carbs (g)" color="var(--olive)" />
          <Ring value={day.totals.fat} goal={g?.fat ?? 0} label="Fat (g)" color="var(--gold-bright)" />
        </div>
        {!g && (
          <p className="muted" style={{ marginTop: '.85rem', textAlign: 'center' }}>
            No goal set yet, <Link to="/calculators">use the Oracle's calculations</Link> and save the result as your goal.
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '.75rem' }}>Add Feast</h2>
        <form onSubmit={add}>
          <label className="field">
            <span>Feast Name</span>
            <input value={form.name} onChange={set('name')} placeholder="Greek yogurt, 200g" />
          </label>
          <div className="field-row" style={{ marginBottom: '.85rem' }}>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Cals</span>
              <input type="number" inputMode="decimal" value={form.calories} onChange={set('calories')} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>P (g)</span>
              <input type="number" inputMode="decimal" value={form.protein} onChange={set('protein')} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>C (g)</span>
              <input type="number" inputMode="decimal" value={form.carbs} onChange={set('carbs')} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>F (g)</span>
              <input type="number" inputMode="decimal" value={form.fat} onChange={set('fat')} />
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn primary">Add to log</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '.5rem' }}>Logged today</h2>
        {day.entries.length === 0 ? (
          <p className="muted">Nothing logged today, add your first feast above.</p>
        ) : (
          day.entries.map((e) => (
            <div key={e.id} className="list-item">
              <div>
                <strong>{e.name}</strong>
                <p className="muted">
                  {Math.round(e.calories)} kcal · P {Math.round(e.protein)} · C {Math.round(e.carbs)} · F {Math.round(e.fat)}
                </p>
              </div>
              <button className="btn small danger" onClick={() => remove(e.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
