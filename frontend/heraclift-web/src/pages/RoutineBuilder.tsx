import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import type { Routine } from '../types';

interface DraftExercise {
  name: string;
  targetSets: number | string;
  targetReps: number | string;
  notes: string;
}

interface DraftWorkout {
  name: string;
  exercises: DraftExercise[];
}

const blankExercise = (): DraftExercise => ({ name: '', targetSets: 2, targetReps: 8, notes: '' });
const blankWorkout = (): DraftWorkout => ({ name: '', exercises: [blankExercise()] });

export default function RoutineBuilder() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workouts, setWorkouts] = useState<DraftWorkout[]>([blankWorkout()]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Routine>(`/routines/${id}`).then((r) => {
      setName(r.name);
      setDescription(r.description);
      setWorkouts(
        r.workouts.map((w) => ({
          name: w.name,
          exercises: w.exercises.map((e) => ({
            name: e.name,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            notes: e.notes,
          })),
        }))
      );
    });
  }, [id]);

  const updateWorkout = (wi: number, patch: Partial<DraftWorkout>) =>
    setWorkouts(workouts.map((w, i) => (i === wi ? { ...w, ...patch } : w)));

  const updateExercise = (wi: number, ei: number, patch: Partial<DraftExercise>) =>
    setWorkouts(
      workouts.map((w, i) =>
        i === wi
          ? { ...w, exercises: w.exercises.map((e, j) => (j === ei ? { ...e, ...patch } : e)) }
          : w
      )
    );

  const save = async () => {
    setError('');
    const cleaned = {
      name: name.trim(),
      description: description.trim(),
      workouts: workouts
        .filter((w) => w.name.trim())
        .map((w) => ({
          name: w.name.trim(),
          exercises: w.exercises
            .filter((e) => e.name.trim())
            .map((e) => ({
              name: e.name.trim(),
              targetSets: Number(e.targetSets) || 2,
              targetReps: Number(e.targetReps) || 8,
              notes: e.notes,
            })),
        })),
    };
    if (!cleaned.name) return setError('Give the routine a name.');
    if (cleaned.workouts.length === 0) return setError('Add at least one workout with a name.');

    setBusy(true);
    try {
      if (id) await api.put(`/routines/${id}`, cleaned);
      else await api.post('/routines', cleaned);
      navigate('/training');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="eyebrow">{id ? 'Edit' : 'New'} routine</p>
      <h1 style={{ marginBottom: '1rem' }}>{id ? 'Revise the Plan' : 'Forge a Routine'}</h1>

      <div className="card">
        <label className="field">
          <span>Routine name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Push / Pull / Legs" />
        </label>
        <label className="field">
          <span>Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="6-day hypertrophy split"
          />
        </label>
      </div>

      {workouts.map((w, wi) => (
        <div className="card" key={wi}>
          <div className="spread" style={{ marginBottom: '.75rem' }}>
            <h3>Workout {wi + 1}</h3>
            {workouts.length > 1 && (
              <button
                className="btn small danger"
                onClick={() => setWorkouts(workouts.filter((_, i) => i !== wi))}
              >
                Remove workout
              </button>
            )}
          </div>

          <label className="field">
            <span>Workout name</span>
            <input
              value={w.name}
              onChange={(e) => updateWorkout(wi, { name: e.target.value })}
              placeholder="Day 1 — Push"
            />
          </label>

          {w.exercises.map((ex, ei) => (
            <div key={ei} className="card" style={{ background: 'var(--night)', marginBottom: '.6rem' }}>
              <div className="field-row" style={{ marginBottom: '.6rem' }}>
                <label className="field" style={{ flex: 2, marginBottom: 0 }}>
                  <span>Exercise</span>
                  <input
                    value={ex.name}
                    onChange={(e) => updateExercise(wi, ei, { name: e.target.value })}
                    placeholder="Bench press"
                  />
                </label>
                <label className="field" style={{ marginBottom: 0 }}>
                  <span>Sets</span>
                  <input
                    type="number"
                    min="1"
                    value={ex.targetSets}
                    onChange={(e) => updateExercise(wi, ei, { targetSets: e.target.value })}
                  />
                </label>
                <label className="field" style={{ marginBottom: 0 }}>
                  <span>Reps</span>
                  <input
                    type="number"
                    min="1"
                    value={ex.targetReps}
                    onChange={(e) => updateExercise(wi, ei, { targetReps: e.target.value })}
                  />
                </label>
              </div>
              <div className="spread">
                <input
                  value={ex.notes}
                  onChange={(e) => updateExercise(wi, ei, { notes: e.target.value })}
                  placeholder="Notes (tempo, cues…)"
                  style={{ flex: 1 }}
                />
                {w.exercises.length > 1 && (
                  <button
                    className="btn small danger"
                    onClick={() =>
                      updateWorkout(wi, { exercises: w.exercises.filter((_, j) => j !== ei) })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            className="btn small"
            onClick={() => updateWorkout(wi, { exercises: [...w.exercises, blankExercise()] })}
          >
            + Add exercise
          </button>
        </div>
      ))}

      <div className="row" style={{ marginBottom: '1rem' }}>
        <button className="btn" onClick={() => setWorkouts([...workouts, blankWorkout()])}>
          + Add workout day
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="row">
        <button className="btn primary" onClick={save} disabled={busy}>
          Save routine
        </button>
        <button className="btn" onClick={() => navigate('/training')}>
          Cancel
        </button>
      </div>
    </>
  );
}
