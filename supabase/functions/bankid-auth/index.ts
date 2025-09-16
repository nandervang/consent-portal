import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Bank ID Auth function started");

interface BankIdInitiateRequest {
  personalNumber: string;
}

interface BankIdInitiateResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const { personalNumber }: BankIdInitiateRequest = await req.json();

    // Validate personal number format (Swedish: YYYYMMDD-XXXX)
    const personalNumberRegex = /^\d{8}-\d{4}$/;
    if (!personalNumberRegex.test(personalNumber)) {
      throw new Error('Invalid personal number format');
    }

    // Get Bank ID API configuration
    const bankIdApiUrl = Deno.env.get('VITE_BANKID_API_URL') || 'https://appapi2.test.bankid.com/rp/v6.0';
    const isTestMode = Deno.env.get('VITE_BANKID_TEST_MODE') === 'true';
    
    console.log(`Initiating Bank ID auth for ${personalNumber} (test mode: ${isTestMode})`);

    // For demo/test purposes, simulate Bank ID API response
    if (isTestMode) {
      // Simulate successful Bank ID initiation
      const mockResponse: BankIdInitiateResponse = {
        orderRef: `test-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        autoStartToken: `test-auto-${Math.random().toString(36).substr(2, 9)}`,
        qrStartToken: `test-qr-${Math.random().toString(36).substr(2, 9)}`,
        qrStartSecret: `test-secret-${Math.random().toString(36).substr(2, 9)}`
      };

      console.log('Mock Bank ID response:', mockResponse);

      return new Response(
        JSON.stringify(mockResponse),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // In production, this would make actual Bank ID API call
    // For now, we'll implement the test flow
    throw new Error('Production Bank ID API integration not yet implemented');

  } catch (error) {
    console.error('Bank ID auth error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to initiate Bank ID authentication',
        code: 'BANKID_INITIATE_ERROR'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});