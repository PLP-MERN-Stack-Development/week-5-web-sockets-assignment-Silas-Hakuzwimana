import { useState } from 'react';
import { MessageCircle, User, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                setError('');
                localStorage.setItem('username', data.username); // Store username
                localStorage.setItem('token', data.token);       // Store token
                onLogin && onLogin(data.username);
                navigate('/chat'); // Redirect after successful login
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('Error connecting to server');
            } finally {
                setIsLoading(false);
            }
        };
    
        const handleKeyPress = (e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        };
    
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full">
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                            <p className="text-white/70">Sign in to continue to ChatFlow</p>
                        </div>
    
                        {/* Error message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl">
                                <p className="text-red-300 text-sm text-center">{error}</p>
                            </div>
                        )}
    
                        {/* Login Form */}
                        <div className="space-y-6">
                            {/* Username Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-white/50" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                    disabled={isLoading}
                                />
                            </div>
    
                            {/* Password Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-white/50" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl pl-12 pr-12 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/50 hover:text-white/70 transition-colors"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
    
                            {/* Login Button */}
                            <button
                                onClick={handleLogin}
                                disabled={!username.trim() || !password.trim() || isLoading}
                                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center justify-center space-x-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <span>Sign In</span>
                                )}
                            </button>
                        </div>
    
                        {/* Additional Links */}
                        <div className="mt-8 text-center space-y-4">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="h-px bg-white/20 flex-1"></div>
                                <span className="text-white/50 text-sm">or</span>
                                <div className="h-px bg-white/20 flex-1"></div>
                            </div>
    
                            <div className="space-y-2">
                                <button
                                    onClick={() => navigate('/forgot-password')}
                                    className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                                    Forgot your password?
                                </button>
                                <div className="text-white/60 text-sm">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={() => navigate('/register')}
                                        className="text-blue-300 hover:text-blue-200 transition-colors">
                                        Sign up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
    
                    {/* Footer */}
                    <div className="text-center mt-8">
                        <p className="text-white/40 text-sm">
                            Secure login powered by ChatFlow
                        </p>
                    </div>
                </div>
            </div>
        );
    }