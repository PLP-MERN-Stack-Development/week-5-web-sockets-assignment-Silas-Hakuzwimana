import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
        setError(data.error || 'Something went wrong');
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
        <h2 className="text-white text-2xl mb-6 text-center font-bold">Forgot Password</h2>
        {message && <p className="mb-4 text-green-400">{message}</p>}
        {error && <p className="mb-4 text-red-400">{error}</p>}

        <input
          type="email"
          placeholder="Your email"
          className="w-full p-3 rounded-xl bg-white/20 placeholder-white/50 text-white mb-6"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-3 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </div>
    </div>
  );
}
