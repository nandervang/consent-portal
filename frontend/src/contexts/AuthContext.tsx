import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Database } from '../types/database';
import { BankIdService, BankIdStatusResponse } from '../services/bankid';

type User = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  bankIdStatus: BankIdStatusResponse | null;
  error: string | null;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_BANKID_STATUS'; payload: BankIdStatusResponse | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  bankIdStatus: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: !!action.payload,
        error: null 
      };
    case 'SET_BANKID_STATUS':
      return { ...state, bankIdStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...initialState };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  loginWithBankId: (personalNumber: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on app start
  useEffect(() => {
    const storedUser = localStorage.getItem('consent-portal-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'SET_USER', payload: user });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('consent-portal-user');
      }
    }
  }, []);

  const loginWithBankId = async (personalNumber: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'SET_BANKID_STATUS', payload: null });

      console.log('Starting Bank ID authentication for:', personalNumber);

      // Initiate Bank ID authentication
      const initResponse = await BankIdService.initiate(personalNumber);
      console.log('Bank ID initiated:', initResponse);

      // Poll for status with updates
      const statusResponse = await BankIdService.pollStatus(
        initResponse.orderRef,
        (status) => {
          console.log('Bank ID status update:', status);
          dispatch({ type: 'SET_BANKID_STATUS', payload: status });
        }
      );

      if (statusResponse.status === 'complete' && statusResponse.completionData) {
        console.log('Bank ID authentication completed:', statusResponse.completionData);

        // Extract user information from Bank ID response
        const { user: bankIdUser } = statusResponse.completionData;
        
        // Create user object matching our database schema
        const user: User = {
          id: `user-${Date.now()}`, // This would come from the database in real implementation
          bank_id_number: bankIdUser.personalNumber,
          email: `${bankIdUser.personalNumber}@bankid.test`,
          full_name: bankIdUser.name,
          role: 'participant',
          bank_id_verified: true,
          last_bank_id_auth: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Store user in localStorage for persistence
        localStorage.setItem('consent-portal-user', JSON.stringify(user));
        
        // Update state
        dispatch({ type: 'SET_USER', payload: user });
        dispatch({ type: 'SET_LOADING', payload: false });

        console.log('User successfully authenticated:', user);
      } else {
        throw new Error('Bank ID authentication did not complete successfully');
      }
    } catch (error) {
      console.error('Bank ID authentication error:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Authentication failed' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = () => {
    localStorage.removeItem('consent-portal-user');
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    ...state,
    loginWithBankId,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}