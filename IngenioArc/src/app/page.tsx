"use client";
import { Page } from '@/components/PageLayout';
import { AuthButton } from '../components/AuthButton';
import { AuthSession } from '../components/AuthSession';
import { Verify } from '../components/Verify';
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import { BtnVerify } from '../components/BtnVerify';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ChatList from '../components/ChatList';

const verifyPayload: VerifyCommandInput = {
    action: 'user_verification2', // This is your action ID from the Developer Portal
    signal: "01", // Optional additional data
    verification_level: VerificationLevel.Device, // Orb | Device
}

const handleVerify = async (router: ReturnType<typeof useRouter>) => {
    if (!MiniKit.isInstalled()) {
        return
    }
    const {finalPayload} = await MiniKit.commandsAsync.verify(verifyPayload)
    if (finalPayload.status === 'error') {
        return console.log('Error payload', finalPayload)
    }

    const verifyResponse = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            payload: finalPayload as ISuccessResult,
            action: 'user_verification2',
            signal: '01',
        }),
    })

    const verifyResponseJson = await verifyResponse.json()
    if (verifyResponseJson.status === 200) {
        console.log('Verification success!');
        router.push('/select_profile');
    }
}

export default function Home() {
  const router = useRouter();
  return (
    <Page>
      <Page.Main className="flex flex-col items-center justify-center">
        <AuthSession/>
        <div className="mt-4 w-full">
          <BtnVerify handleVerify={() => handleVerify(router)} />
        </div>
        <div className="mt-6">
          <ChatList />
        </div>
      </Page.Main>
    </Page>
  );
}