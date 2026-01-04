import { orpcQueryClient } from "@/lib/orpc/client";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { useParams } from "next/navigation";

export const useCurrentProjectId = () => {
  const params = useParams<{ id: string }>();
  const activeProjectId = useAppStore((state) => state.activeProjectId);
  return {
    projectId: activeProjectId || params.id,
  };
};

// incase of pagination
export function useProjects(pageSize = 20) {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, isPlaceholderData } = useQuery(
    orpcQueryClient.authed.project.list.queryOptions({
      input: {
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
      data?.projects &&
      data.projects.length === pageSize
    ) {
      queryClient.prefetchQuery(
        orpcQueryClient.authed.project.list.queryOptions({
          input: {
            limit: pageSize,
            offset: (page + 1) * pageSize,
          },
        })
      );
    }
  }, [data, isPlaceholderData, page, pageSize, queryClient]);

  const projects = data?.projects ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.ceil(total / pageSize);

  return {
    projects,
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

export const useCurrentProject = () => {
  const { projectId } = useCurrentProjectId();

  if (!projectId) {
    return {
      project: null,
      isLoading: false,
      isError: false,
      error: null,
    };
  }

  const { data, isLoading, isError, error } = useQuery(
    orpcQueryClient.authed.project.get.queryOptions({
      input: {
        projectId,
      },
    })
  );

  return {
    project: data?.project,
    isLoading,
    isError,
    error,
  };
};

// in case of infinite scroll
export function useProjectsInfiniteScroll(limit = 20) {
  const searchParams = useSearchParams();
  const searchWord = searchParams.get("q") || "";

  // Debounced search term
  const [debouncedSearch, setDebouncedSearch] = useState(searchWord);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchWord);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchWord]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    isFetching,
  } = useInfiniteQuery(
    orpcQueryClient.authed.project.list.infiniteOptions({
      input: (pageParam: number | undefined) => ({
        limit,
        offset: pageParam ?? 0,
        searchWord: debouncedSearch,
      }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextOffset,
      queryKey: ["projects", debouncedSearch],
    })
  );

  const projects = data?.pages.flatMap((page) => page.projects) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return {
    data: projects,
    total,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    isPlaceholderData,
    searchWord: debouncedSearch,
  };
}

export function usecreate() {
  const queryClient = useQueryClient();

  return useMutation(
    orpcQueryClient.authed.project.create.mutationOptions({
      onSuccess: ({ project }) => {
        toast.success(`Project "${project?.name}" created successfully!`);

        // Invalidate all project queries to refetch
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });
      },
      onError: (error) => {
        toast.error("Failed to create project. Please try again.");
        console.error(error);
      },
    })
  );
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation(
    orpcQueryClient.authed.project.delete.mutationOptions({
      onMutate: async (deletedId) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });

        // Snapshot previous value
        const previousProjects = queryClient.getQueryData(
          orpcQueryClient.authed.project.list.key()
        );

        // Optimistically update
        queryClient.setQueriesData(
          { queryKey: orpcQueryClient.authed.project.list.key() },
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                projects: page.projects.filter((p: any) => p.id !== deletedId),
              })),
            };
          }
        );

        return { previousProjects };
      },
      onError: (err, deletedId, context) => {
        // Rollback on error
        if (context?.previousProjects) {
          queryClient.setQueryData(
            orpcQueryClient.authed.project.list.key(),
            context.previousProjects
          );
        }
        toast.error("Failed to delete project.");
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: orpcQueryClient.authed.project.list.key(),
        });
      },
    })
  );
}
