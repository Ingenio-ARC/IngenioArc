'use client';
import React from 'react';
import { AuthSession } from '../../components/AuthSession';

export default function MainListener() {
  return (
    <div className="flex flex-col items-center min-h-screen gap-6 pt-8">
      <AuthSession />
      <h1 className="text-4xl font-bold mb-4">¡Bienvenido Listener!</h1>
      <p className="text-lg">Esperando conversaciones...</p>
    </div>
  );
}