'use client';
import { Marble, CircularIcon } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckCircleSolid } from 'iconoir-react';
import { useSession } from 'next-auth/react';

/**
 * This component is an example of how to authenticate a user
 * We will use Next Auth for this example, but you can use any auth provider
 * Read More: https://docs.world.org/mini-apps/commands/wallet-auth
 */
export const AuthSession = () => {
  // Fetching the user state client side
  const session = useSession();

  return (
    <div className="flex flex-row items-center justify-center gap-4 rounded-xl w-full border-2 border-gray-200 p-4">
      <Marble src={session?.data?.user?.profilePictureUrl} className="w-14" />
      <div className="flex flex-row items-center justify-center">
        <span className="text-lg font-semibold capitalize">
          {session?.data?.user?.username}
        </span>
        {session?.data?.user?.profilePictureUrl && (
          <CircularIcon size="sm" className="ml-0">
            <CheckCircleSolid className="text-blue-600" />
          </CircularIcon>
        )}
      </div>
    </div>
  );
};
