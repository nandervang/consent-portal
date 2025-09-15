import React from 'react';
import { useAuth } from '../components/auth/AuthContext';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Academic Consent Portal</h1>
        </div>
        <div className="header-right">
          {isAuthenticated && user && (
            <>
              <span className="user-info">
                Welcome, {user.full_name}
                {user.bank_id_verified && (
                  <span className="verified-badge">✓ Verified</span>
                )}
              </span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}