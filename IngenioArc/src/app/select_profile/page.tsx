'use client';
import React from 'react';
import { AuthSession } from '../../components/AuthSession';

export default function SelectProfile() {
  return (
    <div className="flex flex-col items-center min-h-screen gap-6 pt-8">
      <AuthSession />
  
      <h1 className="text-3xl font-bold mb-2">Selecciona un perfil</h1>

      {/* Icono de perfil */}
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
        <svg
          className="w-12 h-12 text-gray-500 dark:text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 8-4 8-4s8 0 8 4" />
        </svg>
      </div>

      {/* Botón Listener */}
      <button
        className="flex flex-row items-center justify-center gap-4 rounded-xl w-full max-w-md border-2 border-gray-200 p-4 bg-white hover:bg-gray-100 transition-colors"
      >
        <span className="text-lg font-semibold capitalize">Listener</span>
      </button>

      {/* Botón Speaker */}
      <button
        className="flex flex-row items-center justify-center gap-4 rounded-xl w-full max-w-md border-2 border-gray-200 p-4 bg-white hover:bg-gray-100 transition-colors"
      >
        <span className="text-lg font-semibold capitalize">Speaker</span>
      </button>
    </div>
  );
}