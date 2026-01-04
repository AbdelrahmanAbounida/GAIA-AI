import { AuthUser } from "@/lib/auth/auth";
import { authClient } from "@/lib/auth/auth-client";

export const useCurrentUser = () => {
  const { data: session, isPending } = authClient.useSession();
  return {
    session,
    user: session?.user as AuthUser,
    isPending,
  };
};
