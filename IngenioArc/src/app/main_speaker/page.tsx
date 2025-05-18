'use client';
import React from 'react';
import { AuthSession } from '../../components/AuthSession';
import NavbarSpeaker from '../../components/NavbarSpeaker';
import ChatList from '../../components/ChatList';

export default function MainSpeaker() {
  return (
    <>
      <div className="flex flex-col items-center min-h-screen gap-6 pt-8">
        <AuthSession />
        <h1 className="text-4xl font-bold mb-4">¡Bienvenido Anónimo!</h1>
        <p className="text-lg ml-4">A continuacion vas a encontrar personas dispuestas a ayudarte.</p>
        <ChatList />
      </div>
      <div>
        <NavbarSpeaker />
      </div>
    </>
  );
}