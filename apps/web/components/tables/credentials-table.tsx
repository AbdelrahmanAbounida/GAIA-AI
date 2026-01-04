"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Credential } from "@gaia/db";
import { ConfirmModal } from "../modals/confirm-modal";
import { useCredentials } from "@/hooks/use-credentials";

// interface Provider {
//   value: string;
//   label?: string;
// }
// type Provider = Array<string>

type CredentialWithMaskedApiKey = Credential & { maskedApiKey: string };

interface CredentialsTableProps {
  credentials: CredentialWithMaskedApiKey[];
  providers: string[];
}

export function CredentialsTable({
  credentials,
  providers,
}: CredentialsTableProps) {
  const { deleteMutation } = useCredentials(20);

  const handleDelete = (credential: Credential) => {
    if (!credential.id) return;
    deleteMutation.mutate({ id: credential.id });
  };

  const getProviderLabel = (value: string) => {
    return providers.find((p) => p === value) || value;
  };

  return (
    <div className="rounded-md border ">
      <Table className="">
        <TableHeader className="bg-gaia-200 dark:bg-gaia-800">
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {credentials.map((credential) => (
            <TableRow key={credential.id}>
              <TableCell className="font-medium">
                {getProviderLabel(credential.provider)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {credential.maskedApiKey}
                  </code>
                  {/* {credential.apiKey && (
                    <CopyButton
                      iconClassName="text-gray-300!"
                    />
                  )} */}
                </div>
              </TableCell>
              <TableCell>
                {credential.isValid ? (
                  <Badge
                    variant="outline"
                    className="text-green-700 bg-gaia-200 border-gaia-400  dark:text-green-500 dark:border-green-900/50 rounded-md dark:bg-green-950 "
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Valid
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-400 bg-red-950 rounded-md border-red-900/80"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Invalid
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(credential.createdAt), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="focus:outline-none! ring-0!"
                    asChild
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4 text-gray-500 hover:text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="hover:bg-gaia-200 dark:hover:bg-gaia-800!"
                  >
                    <ConfirmModal
                      isPending={deleteMutation.isPending}
                      onDelete={() => handleDelete(credential)}
                      description="Deleting this credential will permanently remove it from your account."
                    >
                      <DropdownMenuItem
                        onClick={(e) => e.preventDefault()}
                        className=""
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="mr-2 h-4 w-4 text-red-500 hover:bg-gaia-200! dark:hover:bg-gaia-800!" />
                        Delete
                      </DropdownMenuItem>
                    </ConfirmModal>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
