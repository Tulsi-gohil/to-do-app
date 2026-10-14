import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import InputField from '../components/InputField.jsx';
import api from '../api/axios.js';
import { validateRegister } from '../utils/validation.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
  });
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
    const nextErrors = validateRegister(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setServerError('');
    try {
      await api.post('/auth/register', form);
      navigate('/verify-otp', {
        state: { email: form.email.trim().toLowerCase(), purpose: 'register' },
      });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Join TaskFlow with a unique username, then verify your email with a one-time code.">
      <h2 className="font-display text-3xl text-foam">Create account</h2>
      <p className="mt-2 text-sm text-mist">
        Already have one?{' '}
        <Link to="/login" className="font-semibold text-mint hover:underline">
          Log in
        </Link>
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-3.5" noValidate>
        <InputField
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={onChange}
          placeholder="Ava Sharma"
          error={errors.fullName}
          autoComplete="name"
        />
        <InputField
          label="Username"
          name="username"
          value={form.username}
          onChange={onChange}
          placeholder="ava_sharma"
          error={errors.username}
          autoComplete="username"
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          placeholder="ava@email.com"
          error={errors.email}
          autoComplete="email"
        />
        <InputField
          label="Phone number"
          name="phone"
          value={form.phone}
          onChange={onChange}
          placeholder="+91 98765 43210"
          error={errors.phone}
          autoComplete="tel"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          placeholder="At least 6 characters"
          error={errors.password}
          autoComplete="new-password"
        />

        {serverError ? (
          <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
            {serverError}
          </p>
        ) : null}

        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? 'Creating…' : 'Continue to email OTP'}
        </button>
      </form>
    </AuthShell>
  );
}
