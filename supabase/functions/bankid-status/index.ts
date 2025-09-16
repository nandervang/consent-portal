import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "supabase";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Bank ID Status function started");

interface BankIdStatusResponse {
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'GET') {
      throw new Error('Method not allowed');
    }

    // Get orderRef from URL path
    const url = new URL(req.url);
    const orderRef = url.pathname.split('/').pop();

    if (!orderRef) {
      throw new Error('Order reference is required');
    }

    const isTestMode = Deno.env.get('VITE_BANKID_TEST_MODE') === 'true';
    
    console.log(`Checking Bank ID status for order: ${orderRef} (test mode: ${isTestMode})`);

    if (isTestMode) {
      // Simulate Bank ID status progression
      // For demo purposes, we'll simulate a successful completion after a short time
      
      const isTestOrder = orderRef.startsWith('test-order-');
      
      if (!isTestOrder) {
        return new Response(
          JSON.stringify({ 
            status: 'failed',
            hintCode: 'userCancel'
          } as BankIdStatusResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Extract timestamp from test order ref to simulate progression
      const timestamp = orderRef.split('-')[2];
      const orderTime = parseInt(timestamp);
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - orderTime) / 1000;

      if (elapsedSeconds < 3) {
        // Still pending
        return new Response(
          JSON.stringify({ 
            status: 'pending',
            hintCode: 'outstandingTransaction'
          } as BankIdStatusResponse),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Simulate successful completion with test data
        const mockCompletionData: BankIdStatusResponse = {
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

        // Create or update user in database
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { personalNumber, name } = mockCompletionData.completionData!.user;
        
        // Upsert user record
        const { data: user, error: userError } = await supabase
          .from('users')
          .upsert({
            bank_id_number: personalNumber,
            email: `${personalNumber}@bankid.test`,
            full_name: name,
            role: 'participant',
            bank_id_verified: true,
            last_bank_id_auth: new Date().toISOString()
          }, {
            onConflict: 'bank_id_number'
          })
          .select()
          .single();

        if (userError) {
          console.error('Error upserting user:', userError);
          throw new Error('Failed to create/update user');
        }

        console.log('User authenticated successfully:', user);

        return new Response(
          JSON.stringify(mockCompletionData),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // In production, this would make actual Bank ID API call
    throw new Error('Production Bank ID API integration not yet implemented');

  } catch (error) {
    console.error('Bank ID status error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to check Bank ID status',
        code: 'BANKID_STATUS_ERROR'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});