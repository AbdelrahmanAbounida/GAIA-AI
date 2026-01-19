"use client";

import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcQueryClient } from "@/lib/orpc/client";
import {
  SheetIcon,
  FileTypeIcon,
  Link2Icon,
  FileIcon,
  FileSpreadsheet,
  FileBracesIcon,
  FileChartColumn,
  FileTextIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  DatabaseIcon,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Trash2, MoreHorizontal } from "lucide-react";
import { showSuccessToast, showErrorToast } from "@/components/ui/toast";
import { RagDocument } from "@gaia/db";
import { useParams } from "next/navigation";
import { ConfirmModal } from "../modals/confirm-modal";
import { useRagDocuments } from "@/hooks/use-rag-docs";
import { RAGModal } from "../modals/rag-modal/rag-modal";

export function RAGTable() {
  const queryClient = useQueryClient();

  const {
    documents,
    total,
    page,
    pageCount,
    setPage,
    isLoading,
    isPlaceholderData,
  } = useRagDocuments(10);

  // Delete Mutation
  const deleteMutation = useMutation({
    ...orpcQueryClient.authed.rag.deleteRagDocument.mutationOptions({}),
    // onMutate: async ({ id }) => {
    //   // Cancel outgoing refetches
    //   const key = orpcQueryClient.authed.rag.getRagDocuments.queryKey({
    //     input: { projectId, limit: 20, offset: page * 20 },
    //   });
    //   await queryClient.cancelQueries({ queryKey: key });

    //   // Snapshot previous value
    //   const previous = queryClient.getQueryData(key);

    //   // Optimistically update
    //   queryClient.setQueryData(key, (old: any) =>
    //     old
    //       ? {
    //           ...old,
    //           documents: old.documents.filter((d: RagDocument) => d.id !== id),
    //           total: Math.max(0, (old.total ?? 0) - 1),
    //         }
    //       : old
    //   );

    //   return { previous };
    // },
    onSuccess: (data) => {
      if (data?.success) {
        showSuccessToast({
          title: "Deleted",
          description: "Document removed successfully.",
        });
      } else {
        showErrorToast({
          title: "Failed",
          description: data.message || "Something went wrong",
        });
      }
    },
    onError: (error, _, ctx) => {
      // Rollback on error
      showErrorToast({
        title: "Failed",
        description: error.message,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      // queryClient.invalidateQueries({
      //   queryKey: orpcQueryClient.authed.rag.getRagDocuments.queryKey({
      //     input: { projectId, limit: 20, offset: page * 20 },
      //   }),
      // });
      queryClient.invalidateQueries({
        queryKey: orpcQueryClient.authed.rag.getRagDocuments.key({}),
      });
    },
  });

  const handleDelete = (doc: RagDocument) => {
    if (doc.id) {
      deleteMutation.mutate({ id: doc.id });
    }
  };

  if (isLoading) {
    return (
      <div className="py-6 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg ">
        <Table>
          <TableHeader className="bg-gaia-200  h-11 dark:bg-gaia-800 rounded-md!">
            <TableRow className=" border-none rounded-xl!">
              <TableHead>Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Indexed</TableHead>
              <TableHead className="w-15" />
            </TableRow>
          </TableHeader>

          <TableBody className="w-full">
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="inline-flex items-center justify-center size-11 bg-white dark:bg-gaia-800 border border-gaia-400 dark:border-gaia-700 rounded-xl mb-3">
                      <FileIcon className="size-6 text-[#3BA34A] dark:text-brand-800" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      No Indexed Documents
                    </h3>
                    <p className="text-gray-500/80 dark:text-zinc-400 text-sm mb-6">
                      Upload a document, PDF, or CSV, or raw text to get started
                    </p>

                    <RAGModal>
                      <Button variant="brand" size="sm">
                        <DatabaseIcon className="size-3!" />
                        Add Data
                      </Button>
                    </RAGModal>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow
                  key={doc.id}
                  className={isPlaceholderData ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div className="font-medium">{doc.fileName}</div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={"brand"}
                      className="px-2 flex items-center gap-2 capitalize"
                    >
                      {{
                        txt: <FileTextIcon className="h-4 w-4" />,
                        pdf: <FileChartColumn className="h-4 w-4" />,
                        csv: <FileSpreadsheet className="h-4 w-4" />,
                        xls: <SheetIcon className="h-4 w-4" />,
                        json: <FileBracesIcon className="h-4 w-4" />,
                        docx: <FileTypeIcon className="h-4 w-4" />,
                        link: <Link2Icon className="h-4 w-4" />,
                        other: <FileIcon className="h-4 w-4" />,
                      }[doc.fileType] || <FileIcon className="h-4 w-4" />}
                      {doc.fileType === "txt" ? "Text" : doc.fileType}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-muted-foreground">
                    {format(new Date(doc.createdAt!), "MMM d, yyyy HH:mm")}
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <ConfirmModal
                          onDelete={() => handleDelete(doc)}
                          isPending={deleteMutation.isPending}
                          description="Deleting this document will remove it completely from the knowledge base and vector store"
                        >
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => e.preventDefault()}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </ConfirmModal>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {page * 20 + 1} to {Math.min((page + 1) * 20, total)} of{" "}
            {total} documents
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || isPlaceholderData}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {pageCount}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pageCount - 1 || isPlaceholderData}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
