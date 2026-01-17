// "use client";
// import type React from "react";

// import { useCallback, useState } from "react";
// import {
//   Upload,
//   File,
//   X,
//   FileText,
//   FileSpreadsheet,
//   FileJson,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import { FileParser } from "@/lib/file-parser";
// import { FileType } from "@gaia/db";

// interface FileWithPreview {
//   file: File;
//   type: FileType;
//   preview?: string;
// }

// interface FileUploadZoneProps {
//   onFilesSelected: (files: File[]) => void;
//   disabled?: boolean;
// }

// const acceptedTypes = {
//   "application/pdf": [".pdf"],
//   "text/csv": [".csv"],
//   "application/vnd.ms-excel": [".xls"],
//   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
//     ".xlsx",
//   ],
//   "application/msword": [".doc"],
//   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
//     ".docx",
//   ],
//   "text/plain": [".txt"],
//   "application/json": [".json"],
// };

// const fileTypeIcons: Partial<Record<FileType, React.ReactNode>> = {
//   pdf: <FileText className="h-5 w-5 text-red-500" />,
//   csv: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
//   xls: <FileSpreadsheet className="h-5 w-5 text-green-500" />,
//   docx: <FileText className="h-5 w-5 text-blue-500" />,
//   txt: <File className="h-5 w-5 text-muted-foreground" />,
//   json: <FileJson className="h-5 w-5 text-yellow-500" />,
//   link: <File className="h-5 w-5 text-orange-500" />,
//   other: <File className="h-5 w-5 text-muted-foreground" />,
// };

// export function FileUploadZone({
//   onFilesSelected,
//   disabled,
// }: FileUploadZoneProps) {
//   const [isDragging, setIsDragging] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);

//   const handleDrag = useCallback((e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     if (e.type === "dragenter" || e.type === "dragover") {
//       setIsDragging(true);
//     } else if (e.type === "dragleave") {
//       setIsDragging(false);
//     }
//   }, []);

//   const processFiles = useCallback(async (files: FileList) => {
//     const newFiles: FileWithPreview[] = [];

//     for (const file of Array.from(files)) {
//       const type = FileParser.getFileType(file);
//       let preview: string | undefined;

//       if (type === "txt" || type === "json" || type === "csv") {
//         const text = await file.text();
//         preview = text.slice(0, 500) + (text.length > 500 ? "..." : "");
//       }

//       newFiles.push({ file, type, preview });
//     }

//     setSelectedFiles((prev) => [...prev, ...newFiles]);
//   }, []);

//   const handleDrop = useCallback(
//     (e: React.DragEvent) => {
//       e.preventDefault();
//       e.stopPropagation();
//       setIsDragging(false);

//       if (e.dataTransfer.files?.length) {
//         processFiles(e.dataTransfer.files);
//       }
//     },
//     [processFiles]
//   );

//   const handleFileInput = useCallback(
//     (e: React.ChangeEvent<HTMLInputElement>) => {
//       if (e.target.files?.length) {
//         processFiles(e.target.files);
//       }
//     },
//     [processFiles]
//   );

//   const removeFile = useCallback((index: number) => {
//     setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
//   }, []);

//   const handleUpload = useCallback(() => {
//     onFilesSelected(selectedFiles.map((f) => f.file));
//     setSelectedFiles([]);
//   }, [selectedFiles, onFilesSelected]);

//   const formatFileSize = (bytes: number) => {
//     if (bytes < 1024) return `${bytes} B`;
//     if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
//     return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
//   };

//   return (
//     <div className="space-y-4">
//       <div
//         onDragEnter={handleDrag}
//         onDragOver={handleDrag}
//         onDragLeave={handleDrag}
//         onDrop={handleDrop}
//         className={cn(
//           "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
//           isDragging
//             ? "border-primary bg-primary/5"
//             : "border-muted-foreground/25 hover:border-muted-foreground/50",
//           disabled && "opacity-50 cursor-not-allowed"
//         )}
//       >
//         <Upload className="h-10 w-10 text-muted-foreground mb-4" />
//         <p className="text-sm text-muted-foreground text-center mb-2">
//           Drag and drop files here, or click to browse
//         </p>
//         <p className="text-xs text-muted-foreground/70 text-center">
//           Supports PDF, CSV, Excel, Word, Text, and JSON files
//         </p>
//         <input
//           type="file"
//           multiple
//           accept={Object.entries(acceptedTypes)
//             .flatMap(([mime, exts]) => [mime, ...exts])
//             .join(",")}
//           onChange={handleFileInput}
//           disabled={disabled}
//           className="absolute inset-0 cursor-pointer opacity-0"
//         />
//       </div>

//       {selectedFiles.length > 0 && (
//         <div className="space-y-2">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-medium">
//               {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}{" "}
//               selected
//             </span>
//             <Button onClick={handleUpload} disabled={disabled}>
//               Start Indexing
//             </Button>
//           </div>

//           <div className="space-y-2 max-h-64 overflow-y-auto">
//             {selectedFiles.map((item, index) => (
//               <div
//                 key={index}
//                 className="flex items-start gap-3 p-3 rounded-lg border bg-card"
//               >
//                 <div className="mt-0.5">{fileTypeIcons[item.type]}</div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium truncate">
//                     {item.file.name}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     {item.type.toUpperCase()} • {formatFileSize(item.file.size)}
//                   </p>
//                   {item.preview && (
//                     <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-hidden max-h-20">
//                       {item.preview}
//                     </pre>
//                   )}
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   className="h-6 w-6"
//                   onClick={() => removeFile(index)}
//                 >
//                   <X className="h-4 w-4" />
//                 </Button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
