import { LoginFormSimple } from './components/auth/LoginFormSimple';
import { HeaderSimple } from './components/common/HeaderSimple';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

function AppContent() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="app">
      <HeaderSimple />
      <main className="main-content">
        {isAuthenticated && user ? (
          <div className="dashboard">
            <div className="welcome-section">
              <h2>Welcome, {user.full_name}!</h2>
              <p>Personal Number: {user.bank_id_number}</p>
              <p>Email: {user.email}</p>
              <p>Role: {user.role}</p>
              <p>Bank ID Verified: {user.bank_id_verified ? 'Yes' : 'No'}</p>
              {user.last_bank_id_auth && (
                <p>Last Authentication: {new Date(user.last_bank_id_auth).toLocaleString()}</p>
              )}
            </div>
            
            <div className="actions-section">
              <h3>Available Actions</h3>
              <p>Studies and consent functionality will be available here.</p>
            </div>
          </div>
        ) : (
          <LoginFormSimple />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;