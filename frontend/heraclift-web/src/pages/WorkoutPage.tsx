import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Meander } from '../components/Layout';
import type { ExerciseWeight, RoutineWorkout, SetLog, WorkoutSession } from '../types';

// Client-side Epley estimate, shown inline while logging.
const epley = (w: number, r: number) => (r <= 1 ? w : w * (1 + r / 30));

// lb <-> kg, so a remembered weight prefills correctly even if the unit toggle differs.
const convertWeight = (weight: number, fromUnit: string, toUnit: string) => {
  if (fromUnit === toUnit) return weight;
  const kg = fromUnit === 'kg' ? weight : weight / 2.20462;
  return Math.round((toUnit === 'kg' ? kg : kg * 2.20462) * 10) / 10;
};

interface PlanExercise {
  name: string;
  targetSets: number;
  targetReps: number;
  notes?: string;
}

function ExerciseCard({
  exercise,
  session,
  onLogged,
  unit,
  lastWeight,
}: {
  exercise: PlanExercise;
  session: WorkoutSession;
  onLogged: (set: SetLog | null, removedId?: number) => void;
  unit: string;
  lastWeight?: ExerciseWeight;
}) {
  const [weight, setWeight] = useState(
    lastWeight ? String(convertWeight(lastWeight.weight, lastWeight.unit, unit)) : ''
  );
  const [reps, setReps] = useState<number | string>(exercise?.targetReps ?? 8);
  const sets = session.sets.filter((s) => s.exerciseName === exercise.name);
  const done = sets.length >= exercise.targetSets;

  const log = async () => {
    if (!weight || !reps) return;
    const set = await api.post<SetLog>(`/sessions/${session.id}/sets`, {
      exerciseName: exercise.name,
      setNumber: sets.length + 1,
      weight: Number(weight),
      unit,
      reps: Number(reps),
    });
    onLogged(set);
  };

  const removeSet = async (setId: number) => {
    await api.del(`/sessions/${session.id}/sets/${setId}`);
    onLogged(null, setId);
  };

  const best = sets.reduce((m, s) => Math.max(m, epley(s.weight, s.reps)), 0);

  return (
    <div className={`card ${done ? 'gilded' : ''}`}>
      <div className="spread">
        <div>
          <h3>{exercise.name}</h3>
          <p className="muted">
            Target {exercise.targetSets} × {exercise.targetReps}
            {exercise.notes ? ` · ${exercise.notes}` : ''}
          </p>
        </div>
        {best > 0 && (
          <span className="pill" title="Estimated one-rep max (Epley)">
            e1RM {Math.round(best)} {unit}
          </span>
        )}
      </div>

      <div className="row" style={{ margin: '.6rem 0' }}>
        {sets.map((s) => (
          <button
            key={s.id}
            className="set-chip done"
            onClick={() => removeSet(s.id)}
            title="Tap to remove this set"
          >
            {s.weight}
            {s.unit} × {s.reps}
          </button>
        ))}
        {sets.length === 0 && <span className="muted">No sets logged yet</span>}
      </div>

      <div className="field-row">
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Weight ({unit})</span>
          <input type="number" inputMode="decimal" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Reps</span>
          <input type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn primary" onClick={log} disabled={!weight || !reps}>
            Log set
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WorkoutPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [plan, setPlan] = useState<RoutineWorkout | null>(null);
  const [weights, setWeights] = useState<Record<string, ExerciseWeight>>({});
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState('lb');

  useEffect(() => {
    (async () => {
      const [active, lastWeights] = await Promise.all([
        api.get<WorkoutSession | null>('/sessions/active'),
        api.get<ExerciseWeight[]>('/exercises/weights'),
      ]);
      setSession(active);
      setWeights(Object.fromEntries(lastWeights.map((w) => [w.exerciseName, w])));
      if (active?.routineId) {
        const routine = await api.get<{ workouts: RoutineWorkout[] }>(`/routines/${active.routineId}`);
        setPlan(routine.workouts.find((w) => w.id === active.routineWorkoutId) ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const exercises: PlanExercise[] = useMemo(() => {
    if (plan) return plan.exercises;
    if (!session) return [];
    const names = [...new Set(session.sets.map((s) => s.exerciseName))];
    return names.map((n) => ({ name: n, targetSets: 3, targetReps: 8, notes: '' }));
  }, [plan, session]);

  const totalTargetSets = exercises.reduce((a, e) => a + e.targetSets, 0);
  const progress = totalTargetSets ? Math.min(1, (session?.sets.length ?? 0) / totalTargetSets) : 0;

  const onLogged = (set: SetLog | null, removedId?: number) => {
    setSession((s) => (s ? {
      ...s,
      sets: removedId ? s.sets.filter((x) => x.id !== removedId) : [...s.sets, set as SetLog],
    } : s));
  };

  const complete = async () => {
    if (!session) return;
    await api.post(`/sessions/${session.id}/complete`);
    navigate('/');
  };

  const abandon = async () => {
    if (!session) return;
    if (!confirm('Abandon this workout? Logged sets will be discarded.')) return;
    await api.del(`/sessions/${session.id}`);
    navigate('/');
  };

  if (loading) return <p className="muted">Loading…</p>;

  if (!session)
    return (
      <div className="empty">
        <p style={{ marginBottom: '.75rem' }}>No workout in progress.</p>
        <button className="btn primary" onClick={() => navigate('/')}>
          Start today's workout from the Agora
        </button>
      </div>
    );

  return (
    <>
      <div className="spread" style={{ marginBottom: '.5rem' }}>
        <div>
          <p className="eyebrow">Training</p>
          <h1>{session.workoutName}</h1>
        </div>
        <div className="segmented" role="group" aria-label="Weight unit">
          <button className={unit === 'lb' ? 'active' : ''} onClick={() => setUnit('lb')}>
            lb
          </button>
          <button className={unit === 'kg' ? 'active' : ''} onClick={() => setUnit('kg')}>
            kg
          </button>
        </div>
      </div>

      <div style={{ margin: '0 0 1.25rem' }}>
        <Meander progress={progress} />
        <p className="muted" style={{ marginTop: '.35rem' }}>
          {session.sets.length} of {totalTargetSets || '—'} sets complete
        </p>
      </div>

      {exercises.map((ex) => (
        <ExerciseCard
          key={ex.name}
          exercise={ex}
          session={session}
          onLogged={onLogged}
          unit={unit}
          lastWeight={weights[ex.name]}
        />
      ))}

      <div className="row" style={{ marginTop: '1.25rem' }}>
        <button className="btn primary" onClick={complete}>
          Complete workout
        </button>
        <button className="btn danger" onClick={abandon}>
          Abandon
        </button>
      </div>
    </>
  );
}
