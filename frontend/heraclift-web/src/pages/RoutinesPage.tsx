import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { Routine } from '../types';

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[] | null>(null);

  const load = () => api.get<Routine[]>('/routines').then(setRoutines);
  useEffect(() => {
    load();
  }, []);

  const activate = async (id: number) => {
    await api.post(`/routines/${id}/activate`);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this routine? Its workout history is kept.')) return;
    await api.del(`/routines/${id}`);
    load();
  };

  if (!routines) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="spread" style={{ marginBottom: '1rem' }}>
        <div>
          <p className="eyebrow">The Labors</p>
          <h1>Routines</h1>
        </div>
        <Link className="btn primary" to="/routines/new">
          New routine
        </Link>
      </div>

      {routines.length === 0 && (
        <div className="empty">
          <p style={{ marginBottom: '.75rem' }}>No routines yet. Build one to begin your labors.</p>
          <Link className="btn primary" to="/routines/new">
            Create routine
          </Link>
        </div>
      )}

      {routines.map((r) => (
        <div key={r.id} className={`card ${r.isActive ? 'gilded' : ''}`}>
          <div className="spread">
            <div>
              <h2>
                {r.name} {r.isActive && <span className="pill">Active</span>}
              </h2>
              {r.description && <p className="muted">{r.description}</p>}
              <p className="muted">
                {r.workouts.length} workouts · next up:{' '}
                <strong style={{ color: 'var(--marble)' }}>
                  {r.workouts[r.currentWorkoutIndex]?.name ?? '—'}
                </strong>
              </p>
            </div>
            <div className="row">
              {!r.isActive && (
                <button className="btn small" onClick={() => activate(r.id)}>
                  Make active
                </button>
              )}
              <Link className="btn small" to={`/routines/${r.id}/edit`}>
                Edit
              </Link>
              <button className="btn small danger" onClick={() => remove(r.id)}>
                Delete
              </button>
            </div>
          </div>

          <div style={{ marginTop: '.75rem' }}>
            {r.workouts.map((w, i) => (
              <div key={w.id} className="list-item">
                <div>
                  <strong style={{ color: i === r.currentWorkoutIndex ? 'var(--gold-bright)' : undefined }}>
                    {i + 1}. {w.name}
                  </strong>
                  <p className="muted">{w.exercises.map((e) => e.name).join(' · ') || 'No exercises'}</p>
                </div>
                {i === r.currentWorkoutIndex && <span className="pill">Up next</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
