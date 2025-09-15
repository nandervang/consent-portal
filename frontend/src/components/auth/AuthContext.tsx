import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthService } from '../services/auth';
import type { 
  AuthContextType, 
  User, 
  BankIdStatusResponse 
} from '../types';
import { BankIdError } from '../types';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  authOrderRef: string | null;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'SET_ORDER_REF'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  authOrderRef: null,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        authOrderRef: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        authOrderRef: null,
      };
    case 'AUTH_LOGOUT':
      return initialState;
    case 'SET_ORDER_REF':
      return {
        ...state,
        authOrderRef: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const authService = AuthService.getInstance();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      dispatch({ type: 'AUTH_START' });
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user });
        } else {
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (personalNumber: string): Promise<void> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.initiateBankId(personalNumber);
      dispatch({ type: 'SET_ORDER_REF', payload: response.orderRef });
      
      // Start polling for status
      pollAuthStatus(response.orderRef);
    } catch (error) {
      const message = error instanceof BankIdError 
        ? (error as BankIdError).message 
        : 'Authentication initiation failed';
      dispatch({ type: 'AUTH_ERROR', payload: message });
      throw error;
    }
  };

  // Poll authentication status
  const pollAuthStatus = async (orderRef: string) => {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        const statusResponse = await authService.checkBankIdStatus(orderRef);

        switch (statusResponse.status) {
          case 'complete':
            if (statusResponse.completionData) {
              const user = await authService.completeAuthentication(statusResponse.completionData);
              dispatch({ type: 'AUTH_SUCCESS', payload: user });
            } else {
              dispatch({ type: 'AUTH_ERROR', payload: 'Authentication completed but no user data received' });
            }
            break;

          case 'failed':
            dispatch({ type: 'AUTH_ERROR', payload: `Authentication failed: ${statusResponse.hintCode}` });
            break;

          case 'pending':
            if (attempts < maxAttempts) {
              setTimeout(poll, 5000); // Poll every 5 seconds
            } else {
              dispatch({ type: 'AUTH_ERROR', payload: 'Authentication timeout' });
            }
            break;
        }
      } catch (error) {
        const message = error instanceof BankIdError 
          ? (error as BankIdError).message 
          : 'Status check failed';
        dispatch({ type: 'AUTH_ERROR', payload: message });
      }
    };

    poll();
  };

  // Check auth status manually (for status displays)
  const checkAuthStatus = async (orderRef: string): Promise<BankIdStatusResponse> => {
    return authService.checkBankIdStatus(orderRef);
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Context value
  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Error notification could be added here */}
      {state.error && (
        <div className="auth-error-notification">
          <p>{state.error}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}