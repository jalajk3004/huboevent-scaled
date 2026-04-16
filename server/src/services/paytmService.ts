import PaytmChecksum from 'paytmchecksum';
import config from '../config/env';

const { mid, merchantKey, host, website } = config.paytm;

export interface InitiateTransactionParams {
  orderId: string;
  amount: number;
  callbackUrl: string;
  userInfo: { custId: string; mobile: string; email: string };
}

export interface TransactionResult {
  txnToken: string;
  mid: string;
  host: string;
}

export interface OrderStatusResult {
  isSuccess: boolean;
  txnId: string;
  txnAmount: string;
  resultMsg: string;
}

/**
 * Generates a Paytm txn token to initiate payment flow.
 */
export async function initiateTransaction(
  params: InitiateTransactionParams
): Promise<TransactionResult> {
  const { orderId, amount, callbackUrl, userInfo } = params;

  const paytmParams: Record<string, any> = {
    body: {
      requestType: 'Payment',
      mid,
      websiteName: website,
      orderId,
      callbackUrl,
      txnAmount: { value: amount.toString(), currency: 'INR' },
      userInfo,
    },
  };

  const checksum = await PaytmChecksum.generateSignature(
    JSON.stringify(paytmParams.body),
    merchantKey
  );
  paytmParams.head = { signature: checksum };

  const url = `${host}/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paytmParams),
  });

  const result = await response.json() as any;

  if (result.body?.resultInfo?.resultStatus !== 'S') {
    const msg: string = result.body?.resultInfo?.resultMsg ?? 'Payment initiation failed';
    throw new Error(msg);
  }

  return { txnToken: result.body.txnToken as string, mid, host };
}

/**
 * Verifies order status with Paytm v3 API.
 */
export async function verifyOrderStatus(orderId: string): Promise<OrderStatusResult> {
  const paytmParams: Record<string, any> = { body: { mid, orderId } };

  const signature = await PaytmChecksum.generateSignature(
    JSON.stringify(paytmParams.body),
    merchantKey
  );
  paytmParams.head = { signature };

  const response = await fetch(`${host}/v3/order/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paytmParams),
  });

  const statusData = await response.json() as any;
  const isSuccess: boolean = statusData?.body?.resultInfo?.resultStatus === 'TXN_SUCCESS';

  return {
    isSuccess,
    txnId: (statusData?.body?.txnId as string) ?? 'N/A',
    txnAmount: (statusData?.body?.txnAmount as string) ?? '0',
    resultMsg: (statusData?.body?.resultInfo?.resultMsg as string) ?? 'Payment Failed',
  };
}
