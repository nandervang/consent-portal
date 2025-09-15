import { useState } from 'react';

export function LoginFormSimple() {
  const [personalNumber, setPersonalNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation for Swedish personal number format
    const personalNumberRegex = /^\d{8}-\d{4}$/;
    if (!personalNumberRegex.test(personalNumber)) {
      setError('Please enter a valid Swedish personal number (YYYYMMDD-XXXX)');
      setIsLoading(false);
      return;
    }

    try {
      // Simulate authentication process
      setTimeout(() => {
        setIsLoading(false);
        // Redirect to dashboard (this would be handled by routing in a real app)
        alert('Login successful! (This is a demo)');
      }, 2000);
    } catch (err) {
      setError('Failed to initiate Bank ID authentication');
      setIsLoading(false);
      console.error('Login error:', err);
    }
  };

  const handlePersonalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9-]/g, ''); // Only allow numbers and dashes
    
    // Auto-format as YYYYMMDD-XXXX
    if (value.length >= 8 && value.indexOf('-') === -1) {
      value = value.slice(0, 8) + '-' + value.slice(8, 12);
    }
    
    setPersonalNumber(value);
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
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading || personalNumber.length < 13}
            className="login-button"
          >
            {isLoading ? 'Authenticating...' : 'Login with Bank ID'}
          </button>
        </form>
        
        {isLoading && (
          <div className="auth-status">
            <div className="spinner" />
            <p>Please complete the Bank ID authentication in your mobile app</p>
          </div>
        )}
        
        <div className="test-info">
          <h4>For Testing</h4>
          <p>Use personal number: <code>197810126789</code></p>
        </div>
      </div>
    </div>
  );
}