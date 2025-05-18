'use client';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

export default function PaymentSpeaker() {
  const sendPayment = async () => {
    const res = await fetch('/api/initiate-payment', {
      method: 'POST',
    });
    const { id } = await res.json();

    const payload: PayCommandInput = {
      reference: id,
      to: '0x77d7331dbe86fa0f73bb1edab47d6ad25ac44b37', // Test address
      tokens: [
        {
          symbol: Tokens.WLD,
          token_amount: tokenToDecimals(1, Tokens.WLD).toString(),
        },
        {
          symbol: Tokens.USDCE,
          token_amount: tokenToDecimals(3, Tokens.USDCE).toString(),
        },
      ],
      description: 'Test example payment for minikit',
    };

    if (!MiniKit.isInstalled()) {
      return;
    }

    const { finalPayload } = await MiniKit.commandsAsync.pay(payload);

    if (finalPayload.status == 'success') {
      const res = await fetch(`/api/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });
      const payment = await res.json();
      if (payment.success) {
        // Congrats your payment was successful!
      }
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen gap-6 pt-8">
      <h1 className="text-3xl font-bold mb-2">Payment</h1>
      <button
        className="flex flex-row items-center justify-center gap-4 rounded-xl w-full max-w-md border-2 border-gray-200 p-4 bg-white hover:bg-gray-100 transition-colors"
        onClick={sendPayment}
      >
        <span className="text-lg font-semibold capitalize">Pay</span>
      </button>
    </div>
  );
}