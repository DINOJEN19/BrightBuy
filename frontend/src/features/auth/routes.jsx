import { Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import RequireAuth from '../../components/RequireAuth';

export const authRoutes = [
  <Route key="auth-login" path="/login" element={<LoginPage />} />,
  <Route key="auth-register" path="/register" element={<RegisterPage />} />,
  <Route
    key="auth-profile"
    path="/profile"
    element={
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    }
  />,
];

export default authRoutes;
