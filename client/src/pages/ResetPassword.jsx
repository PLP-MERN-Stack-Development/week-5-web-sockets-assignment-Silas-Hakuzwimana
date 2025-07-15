import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in both fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        <h2 className="text-white text-2xl mb-6 text-center font-bold">Reset Password</h2>

        {message && <p className="mb-4 text-green-400">{message}</p>}
        {error && <p className="mb-4 text-red-400">{error}</p>}

        {/* Password */}
        <div className="relative mb-6">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3.5 text-white/50 hover:text-white/70"
            disabled={loading}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative mb-6">
          <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-3.5 text-white/50 hover:text-white/70"
            disabled={loading}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-2xl font-semibold transition transform hover:scale-105"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </div>
    </div>
  );
}
