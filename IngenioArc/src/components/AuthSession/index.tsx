'use client';
import { walletAuth } from '@/auth/wallet';
import { Button, TextArea, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Label } from 'iconoir-react';

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthSession = () => {
  const [isPending, setIsPending] = useState(false);
  const { isInstalled } = useMiniKit();
  const { data: session } = useSession();

  const onClick = useCallback(async () => {
    if (!isInstalled || isPending) {
      return;
    }
    setIsPending(true);
    try {
      await walletAuth();
    } catch (error) {
      console.error('Wallet authentication button error', error);
      setIsPending(false);
      return;
    }

    setIsPending(false);
  }, [isInstalled, isPending]);
  console.log('session', session?.user.username);
  useEffect(() => {
    const authenticate = async () => {
      if (isInstalled && !isPending && !session?.user) {
        setIsPending(true);
        try {
          await walletAuth();
        } catch (error) {
          console.error('Auto wallet authentication error', error);
        } finally {
          setIsPending(false);
        }
      }
    };

    authenticate();
  }, [isInstalled, isPending]);

  return (
    <TextArea
    id="username"
    disabled={true}
    value={session?.user.username}
    ></TextArea>
  );
};
