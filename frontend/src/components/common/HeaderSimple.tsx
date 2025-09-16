import { useAuth } from '../../contexts/AuthContext';

export function HeaderSimple() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1>Academic Consent Portal</h1>
        </div>
        <div className="header-right">
          {isAuthenticated && user ? (
            <div className="user-info">
              <span className="user-name">{user.full_name}</span>
              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </div>
          ) : (
            <span className="login-prompt">Please log in with Bank ID</span>
          )}
        </div>
      </div>
    </header>
  );
}