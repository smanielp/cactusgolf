import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import AuthContainer from './AuthContainer';

// Create context
const AuthContext = createContext();

// Context hook
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe; // Cleanup subscription
  }, []);

  // Context value
  const value = {
    currentUser,
    isAdmin: currentUser?.email === 'dan.pedrero@gmail.com' // Simple admin check based on email
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-green-800">Loading...</div>
      </div>
    );
  }

  // If no user is authenticated, show auth screens
  if (!currentUser) {
    return <AuthContainer />;
  }

  // Otherwise, render children (the app)
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;