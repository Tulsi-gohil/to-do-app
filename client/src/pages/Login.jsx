import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import InputField from '../components/InputField.jsx';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin } from '../utils/validation.js';

export default function Login() {
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setServerError('');
    try {
      const { data } = await api.post('/auth/login', form);
      loginSuccess(data.token, data.user);
      navigate('/todos', { replace: true });
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.needsVerification) {
        navigate('/verify-otp', {
          state: { email: payload.email, purpose: 'register' },
        });
        return;
      }
      setServerError(payload?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Sign in with your email or username. Forgot your password? Reset it with an OTP.">
      <h2 className="font-display text-3xl text-foam">Welcome back</h2>
      <p className="mt-2 text-sm text-mist">
        New here?{' '}
        <Link to="/register" className="font-semibold text-mint hover:underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3.5" noValidate>
        <InputField
          label="Email or username"
          name="identifier"
          value={form.identifier}
          onChange={onChange}
          placeholder="ava@email.com or ava_sharma"
          error={errors.identifier}
          autoComplete="username"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="Your password"
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-mint hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {serverError ? (
          <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Signing in…' : 'Log in'}
        </button>
      </form>
    </AuthShell>
  );
}
