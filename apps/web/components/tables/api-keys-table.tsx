"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  KeyRoundIcon,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiKey } from "@gaia/db";
import { cn } from "@/lib/utils";

interface ApiKeyTableProps {
  keys: ApiKey[];
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

const ITEMS_PER_PAGE = 10;

function maskApiKey(key: string): string {
  if (key.length <= 12) return key;
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}${"•".repeat(20)}${suffix}`;
}

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(dateObj);
}

export function ApiKeyTable({ keys, onDelete, onCreateNew }: ApiKeyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalPages = Math.ceil(keys.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedKeys = keys.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
      // Reset to last page if current page becomes empty
      const newTotal = Math.ceil((keys.length - 1) / ITEMS_PER_PAGE);
      if (currentPage > newTotal && newTotal > 0) {
        setCurrentPage(newTotal);
      }
    }
  };

  const keyToDelete = keys.find((k) => k.id === deleteId);

  return (
    <>
      <div className="">
        <Table className="">
          <TableHeader className="bg-gaia-200  h-11 dark:bg-gaia-800 rounded-md!">
            <TableRow className=" border-none rounded-xl!">
              <TableHead className="rounded-l-xl">Name</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead className="w-17.5 rounded-r-xl">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="inline-flex items-center justify-center w-13.75 h-13.75 bg-white dark:bg-gaia-800 border border-gaia-400 dark:border-gaia-700 rounded-xl mb-3">
                      <KeyRoundIcon className="w-8 h-8 text-[#3BA34A] dark:text-brand-800" />
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      No API keys yet
                    </h3>
                    <p className="text-gray-500/80 dark:text-zinc-400 text-sm mb-6">
                      Create an API key to start using the platform
                      programmatically. Keys allow you to authenticate API
                      requests.
                    </p>

                    <Button variant="brand" size="sm" onClick={onCreateNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create API Key
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(key.createdAt)}
                  </TableCell>
                  <TableCell>
                    <code className=" bg-gaia-200 dark:bg-gaia-800  p-1 rounded-md px-2 py-1 font-mono text-sm">
                      {maskApiKey(key.value)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => setDeleteId(key.id)}
                          className="text-destructive hover:bg-transparent focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-
            {Math.min(startIndex + ITEMS_PER_PAGE, keys.length)} of{" "}
            {keys.length} keys
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1 text-sm">
              <span className="font-medium">{currentPage}</span>
              <span className="text-muted-foreground">of {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the API key{" "}
              <span className="font-semibold">{keyToDelete?.name}</span>? This
              action cannot be undone and any applications using this key will
              stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(
                buttonVariants({ variant: "destructive", size: "sm" }),
              )}
            >
              <div>Delete Key</div>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
