import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import type { RunLog } from '../types';

const MI_PER_KM = 1 / 1.60934;

const RACE_TYPES: { value: string; label: string }[] = [
  { value: '5K', label: '5K' },
  { value: '10K', label: '10K' },
  { value: 'HalfMarathon', label: 'Half Marathon' },
  { value: 'Marathon', label: 'Marathon' },
  { value: 'Custom', label: 'Custom' },
];

const raceLabel = (raceType: string) => RACE_TYPES.find((r) => r.value === raceType)?.label ?? raceType;

const today = () => new Date().toLocaleDateString('en-CA'); // yyyy-MM-dd, local time

// Parses a yyyy-MM-dd string as a local date, avoiding the UTC-midnight shift `new Date(str)` causes.
const formatDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString();
};

const formatDistance = (km: number, unit: string) =>
  `${(unit === 'mi' ? km * MI_PER_KM : km).toFixed(2)} ${unit}`;

const formatDuration = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

const formatPace = (km: number, totalSeconds: number, unit: string) => {
  const distance = unit === 'mi' ? km * MI_PER_KM : km;
  if (distance <= 0) return '—';
  const paceSeconds = totalSeconds / distance;
  const m = Math.floor(paceSeconds / 60);
  const s = Math.round(paceSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')} /${unit}`;
};

export default function RunsPage() {
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('mi');
  const [error, setError] = useState('');

  const [raceType, setRaceType] = useState('5K');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  const [date, setDate] = useState(today());

  const load = useCallback(() => api.get<RunLog[]>('/runs?limit=50').then(setRuns), []);
  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const durationSeconds = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
    if (durationSeconds <= 0) return setError('Enter a duration.');

    let distanceKm: number | undefined;
    if (raceType === 'Custom') {
      const d = Number(distance);
      if (!d || d <= 0) return setError('Enter a distance.');
      distanceKm = unit === 'mi' ? d / MI_PER_KM : d;
    }

    try {
      await api.post('/runs', { raceType, distanceKm, durationSeconds, date });
      setDistance('');
      setHours('');
      setMinutes('');
      setSeconds('');
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const remove = async (id: number) => {
    await api.del(`/runs/${id}`);
    load();
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="spread" style={{ marginBottom: '1rem' }}>
        <div>
          <h1>Runs</h1>
        </div>
        <div className="segmented" role="group" aria-label="Distance unit">
          <button className={unit === 'mi' ? 'active' : ''} onClick={() => setUnit('mi')}>
            mi
          </button>
          <button className={unit === 'km' ? 'active' : ''} onClick={() => setUnit('km')}>
            km
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '.75rem' }}>Log a run</h2>
        <form onSubmit={submit}>
          <label className="field">
            <span>Race type</span>
            <select value={raceType} onChange={(e) => setRaceType(e.target.value)}>
              {RACE_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          {raceType === 'Custom' && (
            <label className="field">
              <span>Distance ({unit})</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </label>
          )}

          <div className="field-row" style={{ marginBottom: '.85rem' }}>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Hours</span>
              <input type="number" inputMode="numeric" min="0" value={hours} onChange={(e) => setHours(e.target.value)} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Minutes</span>
              <input type="number" inputMode="numeric" min="0" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Seconds</span>
              <input type="number" inputMode="numeric" min="0" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 'auto' }} />
          </label>

          {error && <p className="error-text">{error}</p>}
          <button className="btn primary">Log run</button>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '.5rem' }}>Past runs</h2>
        {runs.length === 0 ? (
          <p className="muted">No runs logged yet, log your first one above.</p>
        ) : (
          runs.map((r) => (
            <div key={r.id} className="list-item">
              <div>
                <strong>{raceLabel(r.raceType)}</strong>
                <p className="muted">
                  {formatDistance(r.distanceKm, unit)} · {formatDuration(r.durationSeconds)} ·{' '}
                  {formatPace(r.distanceKm, r.durationSeconds, unit)} · {formatDate(r.date)}
                </p>
              </div>
              <button className="btn small danger" onClick={() => remove(r.id)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
