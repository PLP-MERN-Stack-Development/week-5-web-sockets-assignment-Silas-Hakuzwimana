import { useState } from 'react';
import { MessageCircle, User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useNavigate }from 'react-router-dom';

export default function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Account created! You can now log in.');
        setUsername('');
        setEmail('');
        setPassword('');
        onRegister && onRegister(); // optional callback
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create an Account</h1>
            <p className="text-white/70">Join ChatFlow to start chatting</p>
          </div>

          {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 text-sm rounded-xl">{error}</div>}
          {success && <div className="mb-4 p-3 bg-green-500/20 text-green-300 text-sm rounded-xl">{success}</div>}

          <div className="space-y-6">
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-white/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-white/50 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-2xl font-semibold transition transform hover:scale-105"
            >
              {isLoading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </div>
        <div className="text-center mt-8">
          <p className="text-white/40 text-sm">Already have an account? <button
            onClick={() => navigate('/login')}
            className="text-blue-300 hover:text-blue-200 transition-colors"
          >
            Login
            </button></p>
        </div>
      </div>
    </div>
  );
}
