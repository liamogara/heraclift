import { useEffect, useState } from 'react';
import { api } from '../api';
import type { WorkoutSession } from '../types';
import RoutinesPage from './RoutinesPage';
import WorkoutPage from './WorkoutPage';
import RunsPage from './RunsPage';

type Section = 'routines' | 'workout' | 'runs';

export default function TrainingPage() {
  const [section, setSection] = useState<Section | null>(null);

  useEffect(() => {
    api
      .get<WorkoutSession | null>('/sessions/active')
      .then((active) => setSection(active ? 'workout' : 'routines'))
      .catch(() => setSection('routines'));
  }, []);

  if (!section) return <p className="muted">Loading…</p>;

  return (
    <>
      <div style={{marginBottom: '1rem' }}>
          <p className="eyebrow">The Labors</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div className="segmented" role="group" aria-label="Training section">
          <button className={section === 'routines' ? 'active' : ''} onClick={() => setSection('routines')}>
            Routines
          </button>
          <button className={section === 'workout' ? 'active' : ''} onClick={() => setSection('workout')}>
            Workout
          </button>
          <button className={section === 'runs' ? 'active' : ''} onClick={() => setSection('runs')}>
            Runs
          </button>
        </div>
      </div>

      {section === 'routines' && <RoutinesPage />}
      {section === 'workout' && <WorkoutPage />}
      {section === 'runs' && <RunsPage />}
    </>
  );
}
