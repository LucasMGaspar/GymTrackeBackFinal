/**
 * Mercado Pago Integration Client
 * Handles all interactions with Mercado Pago API
 */

import { MercadoPagoConfig, PreApproval, Customer } from 'mercadopago';

// Initialize Mercado Pago client
const getMercadoPagoClient = () => {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  
  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN environment variable is not set');
  }

  const client = new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 5000,
      idempotencyKey: undefined, // Will be set per request
    },
  });

  return {
    preapproval: new PreApproval(client),
    customer: new Customer(client),
  };
};

export interface CreatePreApprovalParams {
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: 'months' | 'days';
    transaction_amount: number;
    currency_id: 'BRL' | 'USD' | 'EUR';
    start_date?: string; // ISO 8601
    end_date?: string; // ISO 8601
  };
  back_url?: string;
  status?: 'pending' | 'authorized';
  external_reference?: string;
  payer_email?: string;
}

export interface CreateCustomerParams {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: {
    area_code?: string;
    number?: string;
  };
  identification?: {
    type?: string;
    number?: string;
  };
}

/**
 * Create a recurring subscription (preapproval) in Mercado Pago
 */
export async function createPreApproval(params: CreatePreApprovalParams) {
  try {
    const { preapproval } = getMercadoPagoClient();
    
    const requestBody = {
      reason: params.reason,
      auto_recurring: params.auto_recurring,
      back_url: params.back_url,
      status: params.status || 'pending',
      external_reference: params.external_reference,
      payer_email: params.payer_email,
    };

    console.log('[MercadoPago] Creating preapproval with body:', JSON.stringify(requestBody, null, 2));
    
    const response = await preapproval.create({
      body: requestBody,
    });

    console.log('[MercadoPago] Preapproval response:', {
      id: response.id,
      status: response.status,
      has_init_point: !!response.init_point,
      has_sandbox_init_point: !!(response as any).sandbox_init_point,
    });

    return {
      success: true,
      data: {
        id: response.id,
        init_point: response.init_point || '',
        sandbox_init_point: (response as any).sandbox_init_point || response.init_point || '',
        status: response.status,
        external_reference: response.external_reference || '',
      },
    };
  } catch (error: any) {
    console.error('[MercadoPago] Error creating preapproval:', {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      cause: error.cause,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message || 'Failed to create preapproval',
      details: error.cause || error,
      statusCode: error.status || error.statusCode,
    };
  }
}

/**
 * Get preapproval details by ID
 */
export async function getPreApproval(preapprovalId: string) {
  try {
    const { preapproval } = getMercadoPagoClient();
    
    const response = await preapproval.get({ id: preapprovalId });
    
    return {
      success: true,
      data: {
        id: response.id,
        status: response.status,
        reason: response.reason,
        auto_recurring: response.auto_recurring,
        payer_id: response.payer_id,
        payer_email: response.payer_email,
        init_point: response.init_point || '',
        sandbox_init_point: (response as any).sandbox_init_point || response.init_point || '',
        external_reference: response.external_reference || '',
        created: response.date_created,
        updated: response.last_modified,
      },
    };
  } catch (error: any) {
    console.error('[MercadoPago] Error getting preapproval:', error);
    return {
      success: false,
      error: error.message || 'Failed to get preapproval',
      details: error.cause || error,
    };
  }
}

/**
 * Cancel a preapproval
 */
export async function cancelPreApproval(preapprovalId: string) {
  try {
    const { preapproval } = getMercadoPagoClient();
    
    const response = await preapproval.update({
      id: preapprovalId,
      body: {
        status: 'cancelled',
      },
    });
    
    return {
      success: true,
      data: {
        id: response.id,
        status: response.status,
      },
    };
  } catch (error: any) {
    console.error('[MercadoPago] Error canceling preapproval:', error);
    return {
      success: false,
      error: error.message || 'Failed to cancel preapproval',
      details: error.cause || error,
    };
  }
}

/**
 * Create or get customer in Mercado Pago
 */
export async function createOrGetCustomer(params: CreateCustomerParams) {
  try {
    const { customer } = getMercadoPagoClient();
    
    // Try to find existing customer by email
    // Note: MP API doesn't have a direct search by email, so we'll create if not exists
    const response = await customer.create({
      body: {
        email: params.email,
        first_name: params.first_name,
        last_name: params.last_name,
        phone: params.phone,
        identification: params.identification,
      },
    });
    
    return {
      success: true,
      data: {
        id: response.id,
        email: response.email,
      },
    };
  } catch (error: any) {
    console.error('[MercadoPago] Error creating customer:', error);
    return {
      success: false,
      error: error.message || 'Failed to create customer',
      details: error.cause || error,
    };
  }
}

/**
 * Map Mercado Pago status to internal subscription status
 */
export function mapMPStatusToInternal(mpStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'authorized': 'active',
    'paused': 'paused',
    'cancelled': 'canceled',
  };

  return statusMap[mpStatus] || 'incomplete';
}

/**
 * Map internal subscription status to Mercado Pago status
 */
export function mapInternalStatusToMP(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'active': 'authorized',
    'trialing': 'authorized',
    'paused': 'paused',
    'canceled': 'cancelled',
    'past_due': 'pending',
    'unpaid': 'pending',
    'incomplete': 'pending',
  };

  return statusMap[internalStatus] || 'pending';
}

