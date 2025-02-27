import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

function AuthContainer() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {mode === 'login' ? (
        <Login onToggleMode={toggleMode} />
      ) : (
        <Register onToggleMode={toggleMode} />
      )}
    </div>
  );
}

export default AuthContainer;