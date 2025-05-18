'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavbarSpeaker from '../../components/NavbarSepaker';
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput } from '@worldcoin/minikit-js';

interface Plan {
  plan_id: number;
  name_plan: string;
  price_plan: number;
  duration_plan: number; // en segundos
}

export default function ShowPlan() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPlans = async () => {
      const res = await fetch('/api/get-plans');
      const data = await res.json();
      setPlans(data.plans || []);
    };
    fetchPlans();
  }, []);

  // Función para convertir segundos a horas
  const secondsToHours = (seconds: number) => (seconds / 3600);

  // Función de pago adaptada para cada plan
  const sendPayment = async (plan: Plan) => {
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
          token_amount: tokenToDecimals(plan.price_plan, Tokens.WLD).toString(),
        },
        // Puedes agregar más tokens si lo necesitas
      ],
      description: `Pago del plan ${plan.name_plan}`,
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
        // Puedes mostrar un mensaje de éxito o redirigir
        alert('¡Pago realizado con éxito!');
      }
    }
  };

  return (
  <div className="flex flex-col items-center min-h-screen gap-6 pt-8 pb-20">
    <h1 className="text-3xl font-bold mb-4">Planes disponibles</h1>
    <div className="w-full max-w-2xl flex flex-col gap-4">
      {plans.map(plan => (
        <div
          key={plan.plan_id}
          className="border-2 border-gray-200 rounded-xl p-4 flex flex-col gap-2 bg-white shadow"
        >
          <h2 className="text-xl font-semibold">{plan.name_plan}</h2>
          <span className="text-lg font-bold text-blue-600">${plan.price_plan}</span>
          <span className="text-gray-700">
            Duración: {secondsToHours(plan.duration_plan)} horas
          </span>
          <button
            className="flex flex-row items-center justify-center gap-4 rounded-xl w-full max-w-md border-2 border-gray-200 p-4 bg-white hover:bg-gray-100 transition-colors"
            onClick={() => sendPayment(plan)}
          >
            Elegir este plan
          </button>
        </div>
      ))}
    </div>
    <NavbarSpeaker />
    </div>
);
}