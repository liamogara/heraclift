import { useState, type ChangeEvent } from 'react';
import { api } from '../api';

const LB_PER_KG = 2.20462;
const IN_PER_CM = 0.393701;

interface OneRepMaxResult {
  average: number;
  epley: number;
  brzycki: number;
  lombardi: number;
  percentageTable: Record<string, number>;
}

interface TdeeResult {
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  bmr: number;
  tdee: number;
}

interface BmiResult {
  bmi: number;
  category: string;
}

function OneRepMax() {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [unit, setUnit] = useState('lb');
  const [result, setResult] = useState<OneRepMaxResult | null>(null);
  const [error, setError] = useState('');

  const calc = async () => {
    setError('');
    try {
      setResult(await api.post<OneRepMaxResult>('/calculators/one-rep-max', { weight: Number(weight), reps: Number(reps) }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="card gilded">
      <p className="eyebrow">Strength</p>
      <h2 style={{ marginBottom: '.75rem' }}>One-Rep Max</h2>
      <div className="field-row" style={{ marginBottom: '.75rem' }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Weight lifted ({unit})</span>
          <input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Reps performed</span>
          <input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
        </label>
      </div>
      <div className="row">
        <button className="btn primary" onClick={calc}>Estimate 1RM</button>
        <div className="segmented" role="group" aria-label="Unit">
          <button className={unit === 'lb' ? 'active' : ''} onClick={() => setUnit('lb')}>lb</button>
          <button className={unit === 'kg' ? 'active' : ''} onClick={() => setUnit('kg')}>kg</button>
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}

      {result && (
        <>
          <div className="stat-grid" style={{ margin: '1rem 0' }}>
            <div className="stat"><div className="value">{result.average}</div><div className="label">Average</div></div>
            <div className="stat"><div className="value">{result.epley}</div><div className="label">Epley</div></div>
            <div className="stat"><div className="value">{result.brzycki}</div><div className="label">Brzycki</div></div>
            <div className="stat"><div className="value">{result.lombardi}</div><div className="label">Lombardi</div></div>
          </div>
          <table className="plain">
            <thead><tr><th>% of 1RM</th><th>Weight ({unit})</th></tr></thead>
            <tbody>
              {Object.entries(result.percentageTable)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([pct, w]) => (
                  <tr key={pct}><td>{pct}%</td><td>{w}</td></tr>
                ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function MacroCalculator({ onSaved }: { onSaved?: () => void }) {
  const [useImperial, setUseImperial] = useState(true);
  const [form, setForm] = useState({ sex: 'male', weight: '', heightFt: '', heightIn: '', heightCm: '', age: '', activityLevel: 'moderate', goal: 'maintain' });
  const [result, setResult] = useState<TdeeResult | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const calc = async () => {
    setError('');
    setSaved(false);
    const weightKg = useImperial ? Number(form.weight) / LB_PER_KG : Number(form.weight);
    const heightCm = useImperial
      ? (Number(form.heightFt) * 12 + Number(form.heightIn || 0)) / IN_PER_CM
      : Number(form.heightCm);
    try {
      setResult(
        await api.post<TdeeResult>('/calculators/tdee', {
          sex: form.sex,
          weightKg,
          heightCm,
          age: Number(form.age),
          activityLevel: form.activityLevel,
          goal: form.goal,
        })
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveAsGoal = async () => {
    if (!result) return;
    await api.put('/nutrition/goal', {
      calories: result.targetCalories,
      protein: result.protein,
      carbs: result.carbs,
      fat: result.fat,
    });
    setSaved(true);
    onSaved?.();
  };

  return (
    <div className="card gilded">
      <p className="eyebrow">Nutrition · Mifflin-St Jeor</p>
      <h2 style={{ marginBottom: '.75rem' }}>Calories & Macros</h2>

      <div className="row" style={{ marginBottom: '.85rem' }}>
        <div className="segmented" role="group" aria-label="Units">
          <button className={useImperial ? 'active' : ''} onClick={() => setUseImperial(true)}>lb / ft</button>
          <button className={!useImperial ? 'active' : ''} onClick={() => setUseImperial(false)}>kg / cm</button>
        </div>
      </div>

      <div className="field-row" style={{ marginBottom: '.6rem' }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Sex</span>
          <select value={form.sex} onChange={set('sex')}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Age</span>
          <input type="number" value={form.age} onChange={set('age')} />
        </label>
      </div>

      <div className="field-row" style={{ marginBottom: '.6rem' }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Weight ({useImperial ? 'lb' : 'kg'})</span>
          <input type="number" value={form.weight} onChange={set('weight')} />
        </label>
        {useImperial ? (
          <>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Height (ft)</span>
              <input type="number" value={form.heightFt} onChange={set('heightFt')} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>(in)</span>
              <input type="number" value={form.heightIn} onChange={set('heightIn')} />
            </label>
          </>
        ) : (
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Height (cm)</span>
            <input type="number" value={form.heightCm} onChange={set('heightCm')} />
          </label>
        )}
      </div>

      <div className="field-row" style={{ marginBottom: '.85rem' }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Activity level</span>
          <select value={form.activityLevel} onChange={set('activityLevel')}>
            <option value="sedentary">Sedentary (little exercise)</option>
            <option value="light">Light (1–3 days/week)</option>
            <option value="moderate">Moderate (3–5 days/week)</option>
            <option value="active">Active (6–7 days/week)</option>
            <option value="very_active">Very active (physical job)</option>
          </select>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Goal</span>
          <select value={form.goal} onChange={set('goal')}>
            <option value="cut">Lose fat</option>
            <option value="maintain">Maintain</option>
            <option value="bulk">Build muscle</option>
          </select>
        </label>
      </div>

      <button className="btn primary" onClick={calc}>Calculate</button>
      {error && <p className="error-text">{error}</p>}

      {result && (
        <>
          <div className="stat-grid" style={{ margin: '1rem 0' }}>
            <div className="stat"><div className="value">{result.targetCalories}</div><div className="label">kcal / day</div></div>
            <div className="stat"><div className="value">{result.protein}g</div><div className="label">Protein</div></div>
            <div className="stat"><div className="value">{result.carbs}g</div><div className="label">Carbs</div></div>
            <div className="stat"><div className="value">{result.fat}g</div><div className="label">Fat</div></div>
          </div>
          <p className="muted" style={{ marginBottom: '.75rem' }}>
            BMR {result.bmr} kcal · maintenance {result.tdee} kcal
          </p>
          <button className="btn" onClick={saveAsGoal}>
            {saved ? 'Saved as daily goal ✓' : 'Set as my daily goal'}
          </button>
        </>
      )}
    </div>
  );
}

function Bmi() {
  const [useImperial, setUseImperial] = useState(true);
  const [form, setForm] = useState({ weight: '', heightFt: '', heightIn: '', heightCm: '' });
  const [result, setResult] = useState<BmiResult | null>(null);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const calc = async () => {
    setError('');
    const weightKg = useImperial ? Number(form.weight) / LB_PER_KG : Number(form.weight);
    const heightCm = useImperial
      ? (Number(form.heightFt) * 12 + Number(form.heightIn || 0)) / IN_PER_CM
      : Number(form.heightCm);
    try {
      setResult(await api.post<BmiResult>('/calculators/bmi', { weightKg, heightCm }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="card gilded">
      <p className="eyebrow">Body</p>
      <h2 style={{ marginBottom: '.75rem' }}>BMI</h2>

      <div className="row" style={{ marginBottom: '.85rem' }}>
        <div className="segmented" role="group" aria-label="Units">
          <button className={useImperial ? 'active' : ''} onClick={() => setUseImperial(true)}>lb / ft</button>
          <button className={!useImperial ? 'active' : ''} onClick={() => setUseImperial(false)}>kg / cm</button>
        </div>
      </div>

      <div className="field-row" style={{ marginBottom: '.85rem' }}>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Weight ({useImperial ? 'lb' : 'kg'})</span>
          <input type="number" value={form.weight} onChange={set('weight')} />
        </label>
        {useImperial ? (
          <>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Height (ft)</span>
              <input type="number" value={form.heightFt} onChange={set('heightFt')} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>(in)</span>
              <input type="number" value={form.heightIn} onChange={set('heightIn')} />
            </label>
          </>
        ) : (
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Height (cm)</span>
            <input type="number" value={form.heightCm} onChange={set('heightCm')} />
          </label>
        )}
      </div>

      <button className="btn primary" onClick={calc}>Calculate BMI</button>
      {error && <p className="error-text">{error}</p>}

      {result && (
        <div className="stat-grid" style={{ marginTop: '1rem' }}>
          <div className="stat"><div className="value">{result.bmi}</div><div className="label">BMI</div></div>
          <div className="stat"><div className="value" style={{ fontSize: '1.2rem' }}>{result.category}</div><div className="label">Category</div></div>
        </div>
      )}
    </div>
  );
}

export default function CalculatorsPage() {
  return (
    <>
      <p className="eyebrow">The Oracle</p>
      <h1 style={{ marginBottom: '1rem' }}>Calculators</h1>
      <OneRepMax />
      <MacroCalculator />
      <Bmi />
    </>
  );
}
