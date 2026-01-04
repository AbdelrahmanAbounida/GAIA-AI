"use client";
import { createQueryClient } from "@/lib/query-client";
import {
  DehydratedState,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import React, { PropsWithChildren, useState } from "react";

export function HydrateClient(props: {
  children: React.ReactNode;
  state: DehydratedState;
}) {
  return (
    <HydrationBoundary state={props.state}>{props.children}</HydrationBoundary>
  );
}

export function QueryProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
