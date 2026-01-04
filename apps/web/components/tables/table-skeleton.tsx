import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function TableSkeleton({
  rows = 5,
  cells = 4,
  cellClassName,
  className,
  showHeader = false,
}: {
  rows?: number;
  cells?: number;
  cellClassName?: string;
  className?: string;
  showHeader?: boolean;
}) {
  return (
    <Table className={cn("", className)}>
      {/* Header */}
      {showHeader && (
        <TableHeader className="border-none!">
          <TableRow className="border-none!">
            <TableHead colSpan={4}>
              <Skeleton className="h-9 w-full " />
            </TableHead>
          </TableRow>
        </TableHeader>
      )}

      {/* Body */}
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index} className="border-none">
            {Array.from({ length: cells }).map((_, index) => (
              <TableCell key={index} className="border-none">
                <Skeleton className={cn("h-9 w-full ", cellClassName)} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
