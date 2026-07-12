import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Meander } from '../components/Layout';
import type { Routine, WorkoutSession } from '../types';

export default function Dashboard() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [active, setActive] = useState<WorkoutSession | null>(null); // in-progress session
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get<Routine[]>('/routines'),
      api.get<WorkoutSession | null>('/sessions/active'),
      api.get<WorkoutSession[]>('/sessions/history?limit=5'),
    ])
      .then(([r, a, h]) => {
        setRoutines(r);
        setActive(a);
        setHistory(h);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="muted">Consulting the oracle…</p>;

  const routine = routines.find((r) => r.isActive) || routines[0];
  const nextWorkout = routine?.workouts?.[routine.currentWorkoutIndex];
  const progress = routine?.workouts?.length ? routine.currentWorkoutIndex / routine.workouts.length : 0;

  const startNext = async () => {
    if (!routine || !nextWorkout) return;
    const session = await api.post<WorkoutSession>('/sessions/start', {
      routineId: routine.id,
      routineWorkoutId: nextWorkout.id,
      workoutName: nextWorkout.name,
    });
    navigate('/training', { state: { session } });
  };

  return (
    <>
      <p className="eyebrow">The Agora</p>
      <h1 style={{ marginBottom: '1rem' }}>Today's Labor</h1>

      {active && (
        <div className="card gilded">
          <div className="spread">
            <div>
              <p className="eyebrow">In progress</p>
              <h2>{active.workoutName}</h2>
              <p className="muted">{active.sets.length} sets logged so far</p>
            </div>
            <Link className="btn primary" to="/training">
              Resume workout
            </Link>
          </div>
        </div>
      )}

      {!active && routine && nextWorkout && (
        <div className="card gilded">
          <p className="eyebrow">{routine.name}</p>
          <h2 style={{ marginBottom: '.25rem' }}>{nextWorkout.name}</h2>
          <p className="muted" style={{ marginBottom: '.85rem' }}>
            Workout {routine.currentWorkoutIndex + 1} of {routine.workouts.length} ·{' '}
            {nextWorkout.exercises.length} exercises
          </p>
          <Meander progress={progress} />
          <div className="row" style={{ marginTop: '1rem' }}>
            <button className="btn primary" onClick={startNext}>
              Begin workout
            </button>
            <Link className="btn" to="/training">
              View routine
            </Link>
          </div>
        </div>
      )}

      {!active && !routine && (
        <div className="empty">
          <p style={{ marginBottom: '.75rem' }}>No routine yet. Every hero needs a plan.</p>
          <Link className="btn primary" to="/routines/new">
            Create your first routine
          </Link>
        </div>
      )}

      <h2 style={{ margin: '1.5rem 0 .75rem' }}>Recent Conquests</h2>
      {history.length === 0 ? (
        <div className="empty">Completed workouts will appear here.</div>
      ) : (
        <div className="card">
          {history.map((s) => (
            <div key={s.id} className="list-item">
              <div>
                <strong>{s.workoutName}</strong>
                <p className="muted">{new Date(s.completedAt!).toLocaleDateString()}</p>
              </div>
              <span className="pill">{s.sets.length} sets</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
