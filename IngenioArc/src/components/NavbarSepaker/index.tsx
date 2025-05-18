'use client';
import { useRouter } from 'next/navigation';

export default function NavbarSpeaker() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
      {/* Inicio */}
      <button
        className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-600"
        onClick={() => router.push('/main_speaker')}
      >
        {/* Icono de casita */}
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M4 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3" />
        </svg>
        <span className="text-xs font-semibold">Inicio</span>
      </button>

      {/* Planes */}
      <button
        className="flex flex-col items-center justify-center text-gray-700 hover:text-blue-600"
        onClick={() => router.push('/show_plan')}
      >
        {/* Icono de billetes */}
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="2" y="7" width="20" height="10" rx="2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span className="text-xs font-semibold">Planes</span>
      </button>
    </nav>
  );
}