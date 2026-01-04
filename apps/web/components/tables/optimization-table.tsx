// TODO:: remove
// // Columns
// import { ColumnDef } from "@tanstack/react-table";
// import { Badge } from "@/components/ui/badge";
// import { Progress } from "@/components/ui/progress";
// import {
//   CheckCircle2,
//   XCircle,
//   Clock,
//   Loader2,
//   MoreHorizontal,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// // Define the shape of our data
// export type OptimizationRun = {
//   id: string;
//   name?: string;
//   status: "pending" | "running" | "completed" | "failed";
//   progress: number; // 0-100
//   trials: number;
//   bestScore: number | null;
//   startedAt: string;
// };

// export const columns: ColumnDef<OptimizationRun>[] = [
//   {
//     accessorKey: "name",
//     header: "Run Name",
//     cell: ({ row }) => {
//       return (
//         <div className="flex flex-col">
//           <span className="font-medium text-sm">{row.getValue("name")}</span>
//           <span className="text-xs text-muted-foreground font-mono">
//             {row.original.id}
//           </span>
//         </div>
//       );
//     },
//   },
//   {
//     accessorKey: "status",
//     header: "Status / Progress",
//     cell: ({ row }) => {
//       const status = row.getValue("status") as string;
//       const progress = row.original.progress;

//       if (status === "running") {
//         return (
//           <div className="w-[140px] space-y-1">
//             <div className="flex items-center justify-between text-xs text-muted-foreground">
//               <span className="flex items-center gap-1 text-blue-500">
//                 <Loader2 className="h-3 w-3 animate-spin" /> Running
//               </span>
//               <span>{Math.round(progress)}%</span>
//             </div>
//             <Progress value={progress} className="h-1.5" />
//           </div>
//         );
//       }

//       const variants: Record<string, any> = {
//         completed: {
//           label: "Completed",
//           icon: CheckCircle2,
//           class:
//             "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100/80",
//         },
//         failed: {
//           label: "Failed",
//           icon: XCircle,
//           class:
//             "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/80",
//         },
//         pending: {
//           label: "Pending",
//           icon: Clock,
//           class:
//             "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100/80",
//         },
//       };

//       const curr = variants[status] || variants.pending;
//       const Icon = curr.icon;

//       return (
//         <Badge
//           variant="outline"
//           className={`${curr.class} border-transparent px-2 py-0.5`}
//         >
//           <Icon className="mr-1.5 h-3.5 w-3.5" />
//           {curr.label}
//         </Badge>
//       );
//     },
//   },
//   {
//     accessorKey: "trials",
//     header: "Trials",
//     cell: ({ row }) => (
//       <div className="text-muted-foreground text-sm">
//         {row.getValue("trials")}
//       </div>
//     ),
//   },
//   {
//     accessorKey: "bestScore",
//     header: "Best Score",
//     cell: ({ row }) => {
//       const score = row.getValue("bestScore") as number | null;
//       if (score === null)
//         return <span className="text-muted-foreground">-</span>;

//       // Highlight high scores
//       const isHigh = score > 0.85;
//       return (
//         <span
//           className={`font-mono font-medium ${isHigh ? "text-green-600 dark:text-green-400" : ""}`}
//         >
//           {score.toFixed(3)}
//         </span>
//       );
//     },
//   },
//   {
//     accessorKey: "startedAt",
//     header: "Date",
//     cell: ({ row }) => {
//       return (
//         <span className="text-muted-foreground text-xs whitespace-nowrap">
//           {new Date(row.getValue("startedAt")).toLocaleString()}
//         </span>
//       );
//     },
//   },
//   {
//     id: "actions",
//     cell: ({ row }) => {
//       const run = row.original;

//       return (
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button variant="ghost" className="h-8 w-8 p-0">
//               <span className="sr-only">Open menu</span>
//               <MoreHorizontal className="h-4 w-4" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent align="end">
//             <DropdownMenuLabel>Actions</DropdownMenuLabel>
//             <DropdownMenuItem
//               onClick={() => navigator.clipboard.writeText(run.id)}
//             >
//               Copy Run ID
//             </DropdownMenuItem>
//             <DropdownMenuSeparator />
//             <DropdownMenuItem>View Logs</DropdownMenuItem>
//             <DropdownMenuItem className="text-red-600">
//               Delete Run
//             </DropdownMenuItem>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       );
//     },
//   },
// ];

// // Table

// import React from "react";
// import {
//   flexRender,
//   getCoreRowModel,
//   useReactTable,
//   getPaginationRowModel,
//   getSortedRowModel,
//   SortingState,
// } from "@tanstack/react-table";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// interface OptimizationTableProps {
//   data: OptimizationRun[];
//   onRowClick?: (run: OptimizationRun) => void;
// }

// export function OptimizationTable({
//   data,
//   onRowClick,
// }: OptimizationTableProps) {
//   const [sorting, setSorting] = React.useState<SortingState>([]);

//   const table = useReactTable({
//     data,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     onSortingChange: setSorting,
//     getSortedRowModel: getSortedRowModel(),
//     state: {
//       sorting,
//     },
//   });

//   return (
//     <div className="space-y-4">
//       <div className="rounded-md border bg-card">
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id}>
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead key={header.id}>
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                           )}
//                     </TableHead>
//                   );
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow
//                   key={row.id}
//                   data-state={row.getIsSelected() && "selected"}
//                   className="cursor-pointer hover:bg-muted/50 transition-colors"
//                   // Prevent click when clicking dropdown actions
//                   onClick={(e) => {
//                     const target = e.target as HTMLElement;
//                     if (!target.closest("[data-radix-collection-item]")) {
//                       onRowClick?.(row.original);
//                     }
//                   }}
//                 >
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id}>
//                       {flexRender(
//                         cell.column.columnDef.cell,
//                         cell.getContext()
//                       )}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell
//                   colSpan={columns.length}
//                   className="h-24 text-center text-muted-foreground"
//                 >
//                   No optimization runs found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>

//       {/* Simple Pagination Controls */}
//       <div className="flex items-center justify-end space-x-2 py-2 px-2">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => table.previousPage()}
//           disabled={!table.getCanPreviousPage()}
//         >
//           Previous
//         </Button>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => table.nextPage()}
//           disabled={!table.getCanNextPage()}
//         >
//           Next
//         </Button>
//       </div>
//     </div>
//   );
// }
