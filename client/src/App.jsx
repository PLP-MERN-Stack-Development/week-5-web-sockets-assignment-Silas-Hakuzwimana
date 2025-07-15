import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';

import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <Routes>
        {/* Redirect root to chat if logged in, else to login */}
        <Route
          path="/"
          element={loggedIn ? <Navigate to="/chat" /> : <Navigate to="/login" />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login onLogin={() => setLoggedIn(true)} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected route */}
        <Route
          path="/chat"
          element={loggedIn ? <Chat /> : <Navigate to="/login" />}
        />
        
        {/* Catch all unmatched routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
