import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell.jsx';
import InputField from '../components/InputField.jsx';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { emailRegex } from '../utils/validation.js';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuccess } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!location.state?.email) {
      setInfo('Enter the email you registered with to verify.');
    }
  }, [location.state]);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      loginSuccess(data.token, data.user);
      navigate('/todos', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setInfo('');
    if (!emailRegex.test(email.trim())) {
      setError('Enter a valid email first.');
      return;
    }
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
      });
      setInfo(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell subtitle="We sent a 6-digit code to your inbox. Enter it below to unlock TaskFlow.">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15 text-mint animate-pulse-ring">
        <Mail className="h-5 w-5" />
      </div>
      <h2 className="font-display text-3xl text-foam">Verify email</h2>
      <p className="mt-2 text-sm text-mist">
        Code expires in 10 minutes.{' '}
        <Link to="/register" className="font-semibold text-mint hover:underline">
          Back to register
        </Link>
      </p>

      <form onSubmit={verify} className="mt-6 space-y-3.5" noValidate>
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
        />
        <InputField
          label="6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          inputMode="numeric"
          autoComplete="one-time-code"
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
          {loading ? 'Verifying…' : 'Verify & continue'}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="btn-ghost w-full"
        >
          {resending ? 'Sending…' : 'Resend OTP'}
        </button>
      </form>
    </AuthShell>
  );
}
