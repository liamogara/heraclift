import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import RoutineBuilder from './pages/RoutineBuilder';
import TrainingPage from './pages/TrainingPage';
import NutritionPage from './pages/NutritionPage';
import CalculatorsPage from './pages/CalculatorsPage';

function Gate() {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="training" element={<TrainingPage />} />
        <Route path="routines/new" element={<RoutineBuilder />} />
        <Route path="routines/:id/edit" element={<RoutineBuilder />} />
        <Route path="nutrition" element={<NutritionPage />} />
        <Route path="calculators" element={<CalculatorsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Gate />
      </BrowserRouter>
    </AuthProvider>
  );
}
