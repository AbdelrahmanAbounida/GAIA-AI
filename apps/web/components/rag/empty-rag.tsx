import { KeyRound, LoaderIcon } from "lucide-react";
import LogoImage from "@/public/logos/logo.png";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Image from "next/image";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { orpc, orpcQueryClient } from "@/lib/orpc/client";
import { CredentialModal } from "@/components/modals/credential-modal/credential-modal";
import { RAGModal } from "@/components/modals/rag-modal/rag-modal";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Search, Plus, FileText, Sparkles } from "lucide-react";

interface EmptyRAGProps {
  projectId: string;
}

export function EmptyRAG({ projectId }: EmptyRAGProps) {
  const { data: credentialsData, isPending: isLoadingCredentials } = useQuery(
    orpcQueryClient.authed.credentials.list.queryOptions({
      input: {
        offset: 0,
        limit: 20,
      },
    })
  );

  // Fetch indexed documents
  const { data: indexData, isPending: isLoadingDocuments } = useQuery(
    orpcQueryClient.authed.rag.getRagDocuments.queryOptions({
      input: {
        projectId,
      },
    })
  );

  useEffect(() => {
    // Show error toasts
    if (!isLoadingCredentials && !credentialsData?.success) {
      showErrorToast({
        title: "Failed to load credentials",
        position: "bottom-right",
        description: credentialsData?.message || "Something went wrong",
      });
    }

    if (!isLoadingDocuments && !indexData?.success) {
      showErrorToast({
        title: "Failed to load documents",
        position: "bottom-right",
        description: indexData?.message || "Something went wrong",
      });
    }
  }, [isLoadingCredentials, isLoadingDocuments, credentialsData, indexData]);

  // Loading state
  if (isLoadingCredentials || isLoadingDocuments) {
    return (
      <Empty className="h-full w-full">
        <EmptyHeader className="max-w-[500px]">
          <EmptyMedia variant="icon">
            <LoaderIcon className="size-12 animate-spin" />
          </EmptyMedia>
          <EmptyTitle className="text-[17px]">Loading...</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  // Check valid credentials for both AI models and vector stores
  const validCredentials =
    credentialsData?.credentials?.filter((cred) => cred.isValid) || [];
  const hasValidCredentials = validCredentials.length > 0;

  // Check indexed documents
  const indexedDocuments = indexData?.documents || [];
  const hasIndexedDocuments = indexedDocuments.length > 0;

  const demoSearch = async () => {
    try {
      const data = await orpc.authed.rag.searchDocuments({
        projectId,
        query: "mango",
        topK: 2,
      });
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };

  // Both ready - show welcome message
  if (hasValidCredentials && hasIndexedDocuments) {
    return (
      <Empty className="h-full w-full">
        <EmptyHeader className="max-w-[500px]">
          <EmptyMedia
            variant="icon"
            className="bg-background! hover:bg-background!"
          >
            <div className="flex items-center ">
              <Image src={LogoImage} alt="gaia" width={100} height={100} />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-[20px]">Welcome to GAIA</EmptyTitle>
          <EmptyDescription className="w-full text-[16px]">
            Ready to help you create your perfect agent
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {/* <Button variant={"outline"} onClick={demoSearch}>
            Demo Search
          </Button> */}
        </EmptyContent>
      </Empty>
    );
  }

  if (!hasValidCredentials) {
    return (
      <Empty className="h-full w-full">
        <EmptyHeader className="max-w-[500px]">
          <EmptyMedia variant="icon">
            <div className="flex items-center bg-transparent!">
              <Image
                src={LogoImage}
                alt="gaia"
                width={100}
                height={100}
                className="bg-gaia-100 dark:bg-gaia-900 "
              />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-[17px]">Setup Required</EmptyTitle>
          <EmptyDescription className="w-full text-[14px]">
            Complete the following steps to get started:
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="space-y-3 w-full max-w-[500px]">
            <CredentialModal
              activeTab="providers"
              trigger={
                <Button variant={"outline"} size={"tiny"}>
                  <KeyRound className="size-3!" />
                  Setup Credentials
                </Button>
              }
            />
          </div>
        </EmptyContent>
      </Empty>
    );
  }
  return (
    <Empty className="w-full h-full">
      <EmptyHeader className="max-w-[500px]">
        <EmptyMedia variant="icon">
          {/* <FolderCodeIcon /> */}
          <div className="bg-gaia-100 dark:bg-gaia-900! flex items-center">
            <Image src={LogoImage} alt="gaia" width={100} height={100} />
          </div>
        </EmptyMedia>
        <EmptyTitle className="text-[17px]">No Knowledge Base Found</EmptyTitle>
        <EmptyDescription className="w-full text-[14px] flex flex-col items-center justify-center gap-1">
          <span className="flex items-center "></span>
          <span className="flex items-center gap-2">
            Start by uploading PDFs, CSVs, or text files to build your knowledge
            base.
          </span>
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          {/* <RAGSettingsModal className="text-[12px]!" /> */}
          <RAGModal />
          {/* <DemoFullTextDialog projectId={projectId} /> */}
        </div>
      </EmptyContent>
    </Empty>
  );
}

// const DemoFullTextDialog = ({ projectId }: { projectId: string }) => {
//   const [open, setOpen] = useState(false);
//   const [activeTab, setActiveTab] = useState("search");

//   // Search state
//   const [query, setQuery] = useState("");
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
//   const [isSearching, setIsSearching] = useState(false);

//   // Add documents state
//   const [newDoc, setNewDoc] = useState("");
//   const [isAdding, setIsAdding] = useState(false);

//   // Demo documents
//   const [demoDocuments] = useState([
//     {
//       content: "I love eating apples and bananas. They are my favorite fruits.",
//       metadata: { category: "preferences", type: "food" },
//     },
//     {
//       content:
//         "Machine learning is a subset of artificial intelligence focused on data.",
//       metadata: { category: "technology", type: "definition" },
//     },
//     {
//       content:
//         "The weather today is sunny with a chance of rain in the evening.",
//       metadata: { category: "weather", type: "forecast" },
//     },
//     {
//       content:
//         "Python is a popular programming language for data science and web development.",
//       metadata: { category: "technology", type: "programming" },
//     },
//     {
//       content: "Oranges and grapefruits are citrus fruits rich in vitamin C.",
//       metadata: { category: "health", type: "nutrition" },
//     },
//   ]);

//   const handleSearch = async () => {
//     if (!query.trim()) return;

//     setIsSearching(true);
//     try {
//       const res = await orpc.authed.demo.demoFulltextSearch({
//         projectId,
//         query: query.trim(),
//         topK: 10,
//         minScore: 0.1,
//       });

//       if (res?.success && res.results) {
//         setSearchResults(res.results);
//         showSuccessToast({
//           title: "Search Complete",
//           description: `Found ${res.count} results`,
//         });
//       } else {
//         showErrorToast({
//           title: "Search Failed",
//           description: res?.message || "No results found",
//         });
//         setSearchResults([]);
//       }
//     } catch (e) {
//       console.error(e);
//       showErrorToast({
//         title: "Error",
//         description: "Failed to perform search",
//       });
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleAddDocument = async (doc: string) => {
//     if (!doc.trim()) return;

//     setIsAdding(true);
//     try {
//       const res = await orpc.authed.demo.demoFulltextAdd({
//         projectId,
//         documents: [
//           {
//             content: doc.trim(),
//             metadata: {
//               addedAt: new Date().toISOString(),
//               type: "custom",
//             },
//           },
//         ],
//       });

//       if (res?.success) {
//         showSuccessToast({
//           title: "Success",
//           description: "Document added successfully",
//         });
//         setNewDoc("");
//       } else {
//         showErrorToast({
//           title: "Error",
//           description: res?.message || "Failed to add document",
//         });
//       }
//     } catch (e) {
//       console.error(e);
//       showErrorToast({
//         title: "Error",
//         description: "Failed to add document",
//       });
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   const handleAddDemoDocuments = async () => {
//     setIsAdding(true);
//     try {
//       const res = await orpc.authed.demo.demoFulltextAdd({
//         projectId,
//         documents: demoDocuments,
//       });

//       if (res?.success) {
//         showSuccessToast({
//           title: "Success",
//           description: `Added ${demoDocuments.length} demo documents`,
//         });
//         setActiveTab("search");
//       } else {
//         showErrorToast({
//           title: "Error",
//           description: res?.message || "Failed to add demo documents",
//         });
//       }
//     } catch (e) {
//       console.error(e);
//       showErrorToast({
//         title: "Error",
//         description: "Failed to add demo documents",
//       });
//     } finally {
//       setIsAdding(false);
//     }
//   };

//   const highlightText = (text: string, query: string) => {
//     if (!query.trim()) return text;

//     const terms = query.toLowerCase().split(/\s+/);
//     const regex = new RegExp(`(${terms.join("|")})`, "gi");

//     return text.split(regex).map((part, i) =>
//       terms.some((term) => part.toLowerCase().includes(term)) ? (
//         <mark
//           key={i}
//           className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded"
//         >
//           {part}
//         </mark>
//       ) : (
//         part
//       )
//     );
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         <Button variant="outline" className="gap-2">
//           <Sparkles className="h-4 w-4" />
//           Demo Full Text Search
//         </Button>
//       </DialogTrigger>
//       <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
//         <DialogHeader>
//           <DialogTitle>Full Text Search Demo</DialogTitle>
//           <DialogDescription>
//             Test full text search by adding documents and searching through
//             them.
//           </DialogDescription>
//         </DialogHeader>

//         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//           <TabsList className="grid w-full grid-cols-2">
//             <TabsTrigger value="search" className="gap-2">
//               <Search className="h-4 w-4" />
//               Search
//             </TabsTrigger>
//             <TabsTrigger value="add" className="gap-2">
//               <Plus className="h-4 w-4" />
//               Add Documents
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="search" className="space-y-4 mt-4">
//             <div className="grid gap-2">
//               <Label htmlFor="query">Search Query</Label>
//               <div className="flex gap-2">
//                 <Input
//                   id="query"
//                   placeholder="e.g., fruit preferences, machine learning, weather"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" && !isSearching) {
//                       handleSearch();
//                     }
//                   }}
//                 />
//                 <Button
//                   onClick={handleSearch}
//                   disabled={!query.trim() || isSearching}
//                   className="gap-2"
//                 >
//                   {isSearching ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Search className="h-4 w-4" />
//                   )}
//                   Search
//                 </Button>
//               </div>
//             </div>

//             <Separator />

//             <div className="space-y-2">
//               <div className="flex items-center justify-between">
//                 <Label>Results ({searchResults.length})</Label>
//                 {searchResults.length > 0 && (
//                   <Badge variant="secondary">
//                     Top {searchResults.length} matches
//                   </Badge>
//                 )}
//               </div>

//               <ScrollArea className="h-[300px] w-full rounded-md border p-4">
//                 {searchResults.length === 0 ? (
//                   <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//                     <FileText className="h-12 w-12 mb-2 opacity-50" />
//                     <p className="text-sm">
//                       No results yet. Try searching for something!
//                     </p>
//                     <p className="text-xs mt-1">
//                       Example: "fruit", "programming", "weather"
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3">
//                     {searchResults.map((result, idx) => (
//                       <Card
//                         key={result.id}
//                         className="border-l-4 border-l-primary/50"
//                       >
//                         <CardHeader className="pb-3">
//                           <div className="flex items-center justify-between">
//                             <CardTitle className="text-sm font-medium">
//                               Result #{idx + 1}
//                             </CardTitle>
//                             <Badge variant="outline" className="text-xs">
//                               Score: {(result.score * 100).toFixed(1)}%
//                             </Badge>
//                           </div>
//                         </CardHeader>
//                         <CardContent className="space-y-2">
//                           <p className="text-sm leading-relaxed">
//                             {highlightText(result.content, query)}
//                           </p>
//                           {Object.keys(result.metadata).length > 0 && (
//                             <div className="flex gap-1 flex-wrap">
//                               {Object.entries(result.metadata).map(
//                                 ([key, value]) => (
//                                   <Badge
//                                     key={key}
//                                     variant="secondary"
//                                     className="text-xs"
//                                   >
//                                     {key}: {String(value)}
//                                   </Badge>
//                                 )
//                               )}
//                             </div>
//                           )}
//                         </CardContent>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </ScrollArea>
//             </div>
//           </TabsContent>

//           <TabsContent value="add" className="space-y-4 mt-4">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="text-base">
//                   Quick Start: Demo Documents
//                 </CardTitle>
//                 <CardDescription>
//                   Add {demoDocuments.length} sample documents to test the search
//                   functionality
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <ScrollArea className="h-[150px] w-full rounded-md border p-3 mb-3">
//                   <div className="space-y-2 text-sm">
//                     {demoDocuments.map((doc, idx) => (
//                       <div key={idx} className="flex gap-2">
//                         <Badge variant="outline" className="shrink-0">
//                           {idx + 1}
//                         </Badge>
//                         <p className="text-muted-foreground">{doc.content}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </ScrollArea>
//                 <Button
//                   onClick={handleAddDemoDocuments}
//                   disabled={isAdding}
//                   className="w-full gap-2"
//                 >
//                   {isAdding ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <Plus className="h-4 w-4" />
//                   )}
//                   Add All Demo Documents
//                 </Button>
//               </CardContent>
//             </Card>

//             <Separator className="my-4" />

//             <div className="space-y-2">
//               <Label htmlFor="newDoc">Add Custom Document</Label>
//               <Textarea
//                 id="newDoc"
//                 placeholder="Enter your custom document text here..."
//                 value={newDoc}
//                 onChange={(e) => setNewDoc(e.target.value)}
//                 rows={4}
//                 className="resize-none"
//               />
//               <Button
//                 onClick={() => handleAddDocument(newDoc)}
//                 disabled={!newDoc.trim() || isAdding}
//                 className="w-full gap-2"
//               >
//                 {isAdding ? (
//                   <Loader2 className="h-4 w-4 animate-spin" />
//                 ) : (
//                   <Plus className="h-4 w-4" />
//                 )}
//                 Add Custom Document
//               </Button>
//             </div>
//           </TabsContent>
//         </Tabs>

//         <DialogFooter>
//           <Button
//             type="button"
//             variant="outline"
//             onClick={() => setOpen(false)}
//           >
//             Close
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };
// interface SearchResult {
//   id: string;
//   content: string;
//   metadata: Record<string, any>;
//   score: number;
// }
