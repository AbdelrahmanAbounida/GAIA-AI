"use server";

import { headers } from "next/headers";
import { Session, type User } from "better-auth";
import { auth } from "./server";

export const getServerAuth = async (): Promise<{
  session?: Session;
  user?: User;
}> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.session) {
    return {};
  }
  return { session: session.session, user: session.user };
};

export const getServerUser = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user;
};

export const getServerSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
};
