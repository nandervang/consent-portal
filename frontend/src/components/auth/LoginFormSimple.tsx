import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function LoginFormSimple() {
  const [personalNumber, setPersonalNumber] = useState('');
  const { loginWithBankId, isLoading, error, bankIdStatus } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation for Swedish personal number format
    const personalNumberRegex = /^\d{8}-\d{4}$/;
    if (!personalNumberRegex.test(personalNumber)) {
      return; // Error will be shown by validation
    }

    await loginWithBankId(personalNumber);
  };

  const handlePersonalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9-]/g, ''); // Only allow numbers and dashes
    
    // Auto-format as YYYYMMDD-XXXX
    if (value.length >= 8 && value.indexOf('-') === -1) {
      value = value.slice(0, 8) + '-' + value.slice(8, 12);
    }
    
    setPersonalNumber(value);
  };

  const isValidPersonalNumber = /^\d{8}-\d{4}$/.test(personalNumber);

  const getStatusMessage = () => {
    if (!bankIdStatus) return null;
    
    switch (bankIdStatus.status) {
      case 'pending':
        return 'Please complete the Bank ID authentication in your mobile app';
      case 'complete':
        return 'Authentication successful! Logging you in...';
      case 'failed':
        return `Authentication failed: ${bankIdStatus.hintCode || 'Unknown error'}`;
      default:
        return null;
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2>Login with Bank ID</h2>
        <p className="login-description">
          Please enter your Swedish personal number to authenticate with Bank ID
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="personalNumber">Personal Number</label>
            <input
              id="personalNumber"
              type="text"
              value={personalNumber}
              onChange={handlePersonalNumberChange}
              placeholder="YYYYMMDD-XXXX"
              maxLength={13}
              disabled={isLoading}
              required
            />
            {personalNumber && !isValidPersonalNumber && (
              <div className="validation-error">
                Please enter a valid Swedish personal number (YYYYMMDD-XXXX)
              </div>
            )}
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || !isValidPersonalNumber}
            className="login-button"
          >
            {isLoading ? 'Authenticating...' : 'Login with Bank ID'}
          </button>
        </form>
        
        {isLoading && bankIdStatus && (
          <div className="auth-status">
            <div className="spinner" />
            <p>{getStatusMessage()}</p>
            {bankIdStatus.status === 'pending' && (
              <div className="status-details">
                <p><strong>Status:</strong> {bankIdStatus.status}</p>
                {bankIdStatus.hintCode && (
                  <p><strong>Code:</strong> {bankIdStatus.hintCode}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="test-info">
          <h4>For Testing</h4>
          <p>Use personal number: <code>197810126789</code></p>
          <p>This will simulate a successful Bank ID authentication.</p>
        </div>
      </div>
    </div>
  );
}