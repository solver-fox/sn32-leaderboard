import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function AuthCallbackPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const loadUser = useAuthStore((s) => s.loadUser);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      setAuth({ token, user: { id: '', email: '', name: null } });
      loadUser().then(() => navigate('/'));
    } else {
      navigate('/login');
    }
  }, [setAuth, loadUser, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-slate-400">Signing in...</div>
  );
}
