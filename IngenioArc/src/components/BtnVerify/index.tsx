'use client';
import { useTheme } from 'next-themes';

export const BtnVerify = ({ handleVerify }: { handleVerify: () => void }) => {
  const { resolvedTheme } = useTheme();

  return (
    <button
      className={`
        w-full rounded-xl border-2 p-4 text-lg font-semibold capitalize transition-colors
        ${resolvedTheme === 'dark'
          ? 'bg-white text-black border-gray-700 hover:bg-gray-200'
          : 'bg-black text-white border-gray-200 hover:bg-gray-800'}
      `}
      onClick={handleVerify}
    >
      Verificar usuario
    </button>
  );
};