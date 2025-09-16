// Bank ID authentication service
import { supabase } from './supabase';

export interface BankIdInitiateResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIdStatusResponse {
  status: 'pending' | 'failed' | 'complete';
  hintCode?: string;
  completionData?: {
    user: {
      personalNumber: string;
      name: string;
      givenName: string;
      surname: string;
    };
    device: {
      ipAddress: string;
    };
  };
}

export class BankIdService {
  private static readonly BANKID_AUTH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bankid-auth`;
  private static readonly BANKID_STATUS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bankid-status`;
  private static readonly DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'http://localhost:54321';

  static async initiate(personalNumber: string): Promise<BankIdInitiateResponse> {
    // Demo mode: simulate Bank ID API response without backend
    if (this.DEMO_MODE) {
      console.log('Running in demo mode - simulating Bank ID initiation');
      
      // Simulate a short delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        orderRef: `demo-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        autoStartToken: `demo-auto-${Math.random().toString(36).substr(2, 9)}`,
        qrStartToken: `demo-qr-${Math.random().toString(36).substr(2, 9)}`,
        qrStartSecret: `demo-secret-${Math.random().toString(36).substr(2, 9)}`
      };
    }

    const response = await fetch(this.BANKID_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ personalNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initiate Bank ID authentication');
    }

    return response.json();
  }

  static async checkStatus(orderRef: string): Promise<BankIdStatusResponse> {
    // Demo mode: simulate Bank ID status progression
    if (this.DEMO_MODE) {
      console.log('Running in demo mode - simulating Bank ID status check');
      
      // Simulate a short delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const isDemoOrder = orderRef.startsWith('demo-order-');
      
      if (!isDemoOrder) {
        return {
          status: 'failed',
          hintCode: 'userCancel'
        };
      }

      // Extract timestamp from demo order ref to simulate progression
      const timestamp = orderRef.split('-')[2];
      const orderTime = parseInt(timestamp);
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - orderTime) / 1000;

      if (elapsedSeconds < 3) {
        // Still pending
        return {
          status: 'pending',
          hintCode: 'outstandingTransaction'
        };
      } else {
        // Simulate successful completion
        return {
          status: 'complete',
          completionData: {
            user: {
              personalNumber: '197810126789',
              name: 'Erik Svensson',
              givenName: 'Erik',
              surname: 'Svensson'
            },
            device: {
              ipAddress: '192.168.1.100'
            }
          }
        };
      }
    }

    const response = await fetch(`${this.BANKID_STATUS_URL}/${orderRef}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check Bank ID status');
    }

    return response.json();
  }

  static async pollStatus(
    orderRef: string, 
    onStatusUpdate: (status: BankIdStatusResponse) => void,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<BankIdStatusResponse> {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.checkStatus(orderRef);
          onStatusUpdate(status);

          if (status.status === 'complete') {
            resolve(status);
            return;
          }

          if (status.status === 'failed') {
            reject(new Error(`Bank ID authentication failed: ${status.hintCode || 'Unknown error'}`));
            return;
          }

          attempts++;
          if (attempts >= maxAttempts) {
            reject(new Error('Bank ID authentication timed out'));
            return;
          }

          setTimeout(poll, intervalMs);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  static async authenticateAndSignIn(personalNumber: string): Promise<{ user: any; session: any }> {
    // Step 1: Initiate Bank ID authentication
    const initResponse = await this.initiate(personalNumber);
    
    // Step 2: Poll for completion
    const statusResponse = await this.pollStatus(
      initResponse.orderRef,
      (status) => {
        console.log('Bank ID status update:', status);
      }
    );

    if (statusResponse.status !== 'complete' || !statusResponse.completionData) {
      throw new Error('Bank ID authentication did not complete successfully');
    }

    // Step 3: The status endpoint should have created/updated the user
    // Now we need to sign in with Supabase using the Bank ID number
    const { personalNumber: bankIdNumber } = statusResponse.completionData.user;
    
    // For now, we'll create a simple session by fetching the user
    // In a real implementation, you might use Supabase custom JWT tokens
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('bank_id_number', bankIdNumber)
      .single();

    if (error || !user) {
      throw new Error('Failed to find authenticated user');
    }

    return {
      user,
      session: {
        access_token: 'mock-token', // In production, this would be a real JWT
        user,
      }
    };
  }
}