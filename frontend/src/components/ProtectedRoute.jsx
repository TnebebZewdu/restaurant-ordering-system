import React, { useState } from 'react';

const ProtectedRoute = ({ children, role, title }) => {
  const storageKey = `${role}_authenticated`;
  const tokenKey = `${role}_token`;

  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem(storageKey) === 'true' &&
      Boolean(localStorage.getItem(tokenKey))
  );

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        'http://localhost:5000/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pin,
            role
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success && data.token) {
        localStorage.setItem(tokenKey, data.token);
        localStorage.setItem(storageKey, 'true');

        setIsAuthenticated(true);
        setPin('');
        setError('');
      } else {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(tokenKey);

        setIsAuthenticated(false);
        setError(data.error || 'Invalid PIN.');
      }
    } catch (err) {
      console.error('Login Fetch Error:', err);
      setError(
        'ከሰርቨሩ ጋር መገናኘት አልተቻለም'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(tokenKey);

    setIsAuthenticated(false);
    setPin('');
    setError('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 w-full max-w-md text-center">

          <div className="text-4xl mb-3">
            🔒
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {title} Access
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            ለመግባት እባክዎን PIN ቁጥርዎን ያስገቡ
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 font-medium border border-red-100">
              {error}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const value =
                  e.target.value.replace(/\D/g, '');

                setPin(value);
                setError('');
              }}
              placeholder="••••"
              className="w-full text-center text-3xl tracking-[1em] py-3 px-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />

            <button
              type="submit"
              disabled={
                loading ||
                pin.length !== 4
              }
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-md transition-all"
            >
              {loading
                ? 'በማረጋገጥ ላይ...'
                : 'ይግቡ (Login)'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center bg-white px-6 py-3 rounded-xl shadow-sm mb-6">

        <span className="text-sm font-semibold text-gray-600">
          🔑 የተፈቀደለት መለያ:{' '}

          <strong className="text-indigo-600 uppercase">
            {role}
          </strong>
        </span>

        <button
          onClick={handleLogout}
          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-lg transition-all"
        >
          ውጣ (Logout)
        </button>

      </div>

      {children}
    </div>
  );
};

export default ProtectedRoute;