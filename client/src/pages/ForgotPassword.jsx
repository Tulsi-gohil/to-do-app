import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import InputField from '../components/InputField.jsx';
import api from '../api/axios.js';
import { emailRegex } from '../utils/validation.js';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!/^\d{6}$/.test(otp.trim())) {
      setError('OTP must be exactly 6 digits.');
      return;
    }
    if (password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        password,
      });
      setInfo(data.message);
      setTimeout(() => navigate('/login'), 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell subtitle="Reset securely with an email OTP — no guessing, no weak links.">
      <h2 className="font-display text-3xl text-foam">
        {step === 1 ? 'Forgot password' : 'Enter OTP & new password'}
      </h2>
      <p className="mt-2 text-sm text-mist">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-mint hover:underline">
          Back to login
        </Link>
      </p>

      {step === 1 ? (
        <form onSubmit={sendOtp} className="mt-6 space-y-3.5" noValidate>
          <InputField
            label="Registered email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
          />
          {error ? (
            <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="mt-6 space-y-3.5" noValidate>
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <InputField
            label="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="••••••"
            inputMode="numeric"
          />
          <InputField
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
          <InputField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
          />

          {error ? (
            <p className="rounded-xl border border-ember/30 bg-ember/10 px-3 py-2 text-sm text-ember">
              {error}
            </p>
          ) : null}
          {info ? (
            <p className="rounded-xl border border-mint/30 bg-mint/10 px-3 py-2 text-sm text-mint">
              {info}
            </p>
          ) : null}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Updating…' : 'Reset password'}
          </button>
          <button type="button" className="btn-ghost w-full" onClick={() => setStep(1)}>
            Resend to a different email
          </button>
        </form>
      )}
    </AuthShell>
  );
}
