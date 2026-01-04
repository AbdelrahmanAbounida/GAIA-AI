import { useState, useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useParams } from "next/navigation";

interface UseToolsOptions {
  onSuccess?: () => void;
  showToasts?: boolean;
  pageSize?: number;
}

export const useTools = ({
  onSuccess,
  showToasts = true,
  pageSize = 10,
}: UseToolsOptions = {}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);

  const params = useParams<{ id: string }>();
  const projectId = params.id!;

  const {
    data,
    isPending: isLoadingTools,
    isError,
    error,
    isPlaceholderData,
  } = useQuery(
    orpcQueryClient.authed.tools.listTools.queryOptions({
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
      data?.success &&
      data.tools &&
      data.tools.length === pageSize
    ) {
      queryClient.prefetchQuery(
        orpcQueryClient.authed.tools.listTools.queryOptions({
          input: {
            projectId,
            limit: pageSize,
            offset: (page + 1) * pageSize,
          },
        })
      );
    }
  }, [data, isPlaceholderData, page, pageSize, queryClient, projectId]);

  // Show error toast for list query
  useEffect(() => {
    if (showToasts && data && !data.success) {
      showErrorToast({
        title: "Failed to get tools",
        position: "bottom-right",
        description: data.message || "Something went wrong",
      });
    }
  }, [data, showToasts]);

  const invalidateTools = () => {
    queryClient.invalidateQueries({
      queryKey: orpcQueryClient.authed.tools.listTools.key(),
    });
  };

  const createTool = useMutation(
    orpcQueryClient.authed.tools.createTool.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "Tool created",
            position: "bottom-right",
            description: data.message,
          });
        }
        onSuccess?.();
      },
      onError: (error, variables) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to create tool",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateTools();
      },
    })
  );

  const updateTool = useMutation(
    orpcQueryClient.authed.tools.updateTool.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "Tool updated",
            position: "bottom-right",
            description: data.message,
          });
        }
        onSuccess?.();
      },
      onError: (error, variables) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to update tool",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateTools();
      },
    })
  );

  const triggerToolActivation = useMutation(
    orpcQueryClient.authed.tools.triggerToolActivation.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "Tool status updated",
            position: "bottom-right",
            description: data.message,
          });
        }
        onSuccess?.();
      },
      onError: (error, variables) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to update tool status",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateTools();
      },
    })
  );

  const deleteTool = useMutation(
    orpcQueryClient.authed.tools.deleteTool.mutationOptions({
      onSuccess: (data) => {
        if (showToasts && data.success) {
          showSuccessToast({
            title: "Tool deleted",
            position: "bottom-right",
            description: data.message,
          });
        }
        onSuccess?.();
      },
      onError: (error, variables) => {
        if (showToasts) {
          showErrorToast({
            title: "Failed to delete tool",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
        }
      },
      onSettled: () => {
        invalidateTools();
      },
    })
  );

  const tools = data?.success ? data.tools || [] : [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return {
    tools,
    total,
    page,
    pageCount,
    setPage,
    isLoadingTools,
    isError,
    error,
    isPlaceholderData,

    triggerToolActivation: {
      mutate: triggerToolActivation.mutate,
      mutateAsync: triggerToolActivation.mutateAsync,
      isPending: triggerToolActivation.isPending,
      isError: triggerToolActivation.isError,
      error: triggerToolActivation.error,
    },
    updateTool: {
      mutate: updateTool.mutate,
      mutateAsync: updateTool.mutateAsync,
      isPending: updateTool.isPending,
      isError: updateTool.isError,
      error: updateTool.error,
    },
    deleteTool: {
      mutate: deleteTool.mutate,
      mutateAsync: deleteTool.mutateAsync,
      isPending: deleteTool.isPending,
      isError: deleteTool.isError,
      error: deleteTool.error,
    },
    createTool: {
      mutate: createTool.mutate,
      mutateAsync: createTool.mutateAsync,
      isPending: createTool.isPending,
      isError: createTool.isError,
      error: createTool.error,
    },
    projectId,
    invalidateTools,
  };
};
