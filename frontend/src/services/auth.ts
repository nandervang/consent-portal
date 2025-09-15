import { supabase } from './supabase';
import type { 
  BankIdInitiateRequest, 
  BankIdInitiateResponse, 
  BankIdStatusResponse, 
  User 
} from '../types';
import { BankIdError } from '../types';

  // const BANKID_API_URL = import.meta.env.VITE_BANKID_API_URL;
  const IS_TEST_MODE = import.meta.env.VITE_BANKID_TEST_MODE === 'true';

export class AuthService {
  private static instance: AuthService;
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initiate Bank ID authentication
   */
  async initiateBankId(personalNumber: string): Promise<BankIdInitiateResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('bankid-auth', {
        body: { personalNumber } as BankIdInitiateRequest,
      });

      if (error) {
        throw new BankIdError(`Authentication initiation failed: ${error.message}`);
      }

      return data as BankIdInitiateResponse;
    } catch (error) {
      console.error('Bank ID initiation error:', error);
      
      // In test mode, return mock response
      if (IS_TEST_MODE) {
        return this.getMockBankIdResponse(personalNumber);
      }
      
      throw error instanceof BankIdError 
        ? error 
        : new BankIdError('Failed to initiate Bank ID authentication');
    }
  }

  /**
   * Check Bank ID authentication status
   */
  async checkBankIdStatus(orderRef: string): Promise<BankIdStatusResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('bankid-status', {
        body: { orderRef },
      });

      if (error) {
        throw new BankIdError(`Status check failed: ${error.message}`);
      }

      return data as BankIdStatusResponse;
    } catch (error) {
      console.error('Bank ID status check error:', error);
      
      // In test mode, return mock completion
      if (IS_TEST_MODE) {
        return this.getMockStatusResponse(orderRef);
      }
      
      throw error instanceof BankIdError 
        ? error 
        : new BankIdError('Failed to check Bank ID status');
    }
  }

  /**
   * Complete authentication after Bank ID verification
   */
  async completeAuthentication(completionData: any): Promise<User> {
    try {
      const { personalNumber, name } = completionData.user;
      
      // Check if user exists
      let { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('bank_id_number', personalNumber)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Database error: ${fetchError.message}`);
      }

      let user: User;

      if (existingUser) {
        // Update existing user - using any type for now
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            full_name: name,
            bank_id_verified: true,
            last_bank_id_auth: new Date().toISOString(),
          } as any)
          .eq('id', (existingUser as any).id)
          .select()
          .single();

        if (updateError) {
          throw new Error(`User update failed: ${updateError.message}`);
        }

        user = updatedUser as User;
      } else {
        // Create new user
        const email = `${personalNumber}@bankid.temp`; // Temporary email, should be updated by user
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            bank_id_number: personalNumber,
            email,
            full_name: name,
            role: 'participant' as const,
            bank_id_verified: true,
            last_bank_id_auth: new Date().toISOString(),
          } as any)
          .select()
          .single();

        if (createError) {
          throw new Error(`User creation failed: ${createError.message}`);
        }

        user = newUser as User;
      }

      // Sign in with Supabase Auth using custom JWT
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: personalNumber, // In a real implementation, this would be handled differently
      });

      if (signInError) {
        console.warn('Supabase auth sign-in failed:', signInError.message);
        // Continue anyway as we have the user data
      }

      return user;
    } catch (error) {
      console.error('Authentication completion error:', error);
      throw new BankIdError('Failed to complete authentication');
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user) {
        return null;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.session.user.id)
        .single();

      if (error) {
        console.error('Failed to fetch user data:', error);
        return null;
      }

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  /**
   * Mock Bank ID response for testing
   */
  private getMockBankIdResponse(_personalNumber: string): BankIdInitiateResponse {
    return {
      orderRef: `test-order-${Date.now()}`,
      autoStartToken: 'test-auto-start-token',
      qrStartToken: 'test-qr-start-token',
      qrStartSecret: 'test-qr-start-secret',
    };
  }

  /**
   * Mock status response for testing
   */
  private getMockStatusResponse(_orderRef: string): BankIdStatusResponse {
    // Simulate successful completion after a short delay
    return {
      status: 'complete',
      completionData: {
        user: {
          personalNumber: '197810126789',
          name: 'Test Testsson',
          givenName: 'Test',
          surname: 'Testsson',
        },
        device: {
          ipAddress: '127.0.0.1',
        },
      },
    };
  }
}