import { useState, useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";

export function useRagDocuments(projectId: string, pageSize = 10) {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery(
    orpcQueryClient.authed.rag.getRagDocuments.queryOptions({
      input: {
        projectId,
        limit: pageSize,
        offset: page * pageSize,
      },
      placeholderData: keepPreviousData,
    })
  );

  // Prefetch next page for instant navigation
  useEffect(() => {
    if (
      !isPlaceholderData &&
      data?.documents &&
      data.documents.length === pageSize
    ) {
      queryClient.prefetchQuery(
        orpcQueryClient.authed.rag.getRagDocuments.queryOptions({
          input: {
            projectId,
            limit: pageSize,
            offset: (page + 1) * pageSize,
          },
        })
      );
    }
  }, [data, isPlaceholderData, page, pageSize, queryClient, projectId]);

  const documents = data?.documents ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return {
    documents,
    total,
    page,
    pageCount,
    setPage,
    isLoading,
    isError,
    error,
    isPlaceholderData,
  };
}
