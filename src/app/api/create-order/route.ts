import { NextResponse } from 'next/server';
// @ts-expect-error - paytmchecksum is not typed
import PaytmChecksum from 'paytmchecksum';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, registrationId } = body;

        const paytmParams: Record<string, string | Record<string, string | Record<string, string>>> = {};

        const orderId = `OID_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const customerId = `CUST_${registrationId || Date.now()}`;

        paytmParams.body = {
            "requestType": "Payment",
            "mid": process.env.PAYTM_MID!,
            "websiteName": process.env.PAYTM_WEBSITE!,
            "orderId": orderId,
            "callbackUrl": `${req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/verify-payment`,
            "txnAmount": {
                "value": String(amount),
                "currency": "INR",
            },
            "userInfo": {
                "custId": customerId,
            },
        };

        const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY!);
        
        paytmParams.head = {
            "signature": checksum
        };

        const environment = process.env.PAYTM_ENVIRONMENT === 'PRODUCTION' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in';
        const post_data = JSON.stringify(paytmParams);

        const response = await fetch(`https://${environment}/theia/api/v1/initiateTransaction?mid=${process.env.PAYTM_MID}&orderId=${orderId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(post_data.length)
            },
            body: post_data
        });

        const data = await response.json();

        if (data.body && data.body.txnToken) {
            return NextResponse.json({
                success: true,
                orderId: orderId,
                amount: amount,
                txnToken: data.body.txnToken,
                mid: process.env.PAYTM_MID,
                environment: environment
            }, { status: 200 });
        } else {
            console.error("Paytm Initiate Transaction Error:", data);
            return NextResponse.json({ success: false, message: "Failed to initiate Paytm transaction", details: data }, { status: 400 });
        }

    } catch (error) {
        console.error("Create Order Error:", error);
        return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
    }
}
