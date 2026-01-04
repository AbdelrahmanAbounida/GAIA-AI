// import { useState, useMemo, useEffect } from "react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   Check,
//   Download,
//   Loader2,
//   AlertCircle,
//   ExternalLink,
//   X,
//   Trash2,
//   Plus,
//   PlusIcon,
//   RefreshCw,
//   Box,
//   Cpu,
//   CheckCircle2,
//   XCircle,
//   BoxIcon,
//   CheckIcon,
//   Star,
//   EyeOffIcon,
//   EyeIcon,
// } from "lucide-react";
// import { useOllama } from "@/hooks/use-ollama";
// import { useCredentials } from "@/hooks/use-credentials";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { Progress } from "@/components/ui/progress";
// import { cn, validateURL } from "@/lib/utils";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { formatBytes } from "@/lib/format";
// import { ConfirmModal } from "../confirm-modal";
// import { showErrorToast } from "@/components/ui/toast";
// import {
//   ActiveLocalModelsViewTab,
//   useLocalModelStore,
// } from "@/store/use-local-models";

// const RECOMMENDED_MODELS = [
//   {
//     name: "llama3.1:8b",
//     desc: "Llama 3.1 8B - Better reasoning, efficient on mid-range machines",
//     size: "4.7GB",
//     recommended: true,
//   },
//   {
//     name: "qwen2.5:7b",
//     desc: "Qwen 2.5 7B - Strong reasoning and excellent coding",
//     size: "4.7GB",
//     recommended: true,
//   },
//   {
//     name: "phi3:3.8b",
//     desc: "Phi-3 Mini - Extremely efficient and lightweight",
//     size: "2.2GB",
//     recommended: true,
//   },
//   {
//     name: "mistral:7b",
//     desc: "Mistral 7B - Reliable and balanced",
//     size: "4.1GB",
//     recommended: true,
//   },
// ];

// const ADDITIONAL_MODELS = [
//   { name: "llama3.2", desc: "Meta Llama 3.2 - Latest", size: "4.7GB" },
//   { name: "llama3.2:1b", desc: "Llama 3.2 1B - Lightweight", size: "1.3GB" },
//   { name: "codellama", desc: "Code Llama - Code generation", size: "3.8GB" },
//   { name: "gemma2", desc: "Google Gemma 2", size: "5.4GB" },
//   { name: "deepseek-coder-v2", desc: "DeepSeek Coder V2", size: "8.9GB" },
// ];
// const EMBEDDING_MODELS = ["nomic-embed-text", "all-minilm", "bge-small"];

// interface LocalModelsViewProps {
//   view?: "ai_models" | "embeddings";
// }

// export function LocalModelsView({ view = "ai_models" }: LocalModelsViewProps) {
//   // dialog
//   const setConfirmDialog = useLocalModelStore((s) => s.setConfirmDownLoadModel);

//   // tabs
//   const activeTab = useLocalModelStore((s) => s.currentActiveTab);
//   const setActiveTab = useLocalModelStore((s) => s.setCurrentActiveTab);

//   // global search
//   const searchQuery = useLocalModelStore((s) => s.searchQuery);
//   const setSearchQuery = useLocalModelStore((s) => s.setSearchQuery);
//   const searchResults = useLocalModelStore((s) => s.searchResults);
//   const setSearchResults = useLocalModelStore((s) => s.setSearchResults);

//   // ollama
//   const ollamaSearch = useLocalModelStore((s) => s.ollamaSearch);
//   const setOllamaSearch = useLocalModelStore((s) => s.setOllamaSearch);
//   const customOllamaSearch = useLocalModelStore((s) => s.customOllamaSearch);
//   const setCustomOllamaSearch = useLocalModelStore(
//     (s) => s.setCustomOllamaSearch
//   );
//   const showCustomSearch = useLocalModelStore((s) => s.showCustomSearch);
//   const setShowCustomSearch = useLocalModelStore((s) => s.setShowCustomSearch);

//   // openai compatible
//   const openaiName = useLocalModelStore((s) => s.openaiName);
//   const setOpenaiName = useLocalModelStore((s) => s.setOpenaiName);
//   const openaiUrl = useLocalModelStore((s) => s.openaiUrl);
//   const setOpenaiUrl = useLocalModelStore((s) => s.setOpenaiUrl);
//   const openaiKey = useLocalModelStore((s) => s.openaiKey);
//   const setOpenaiKey = useLocalModelStore((s) => s.setOpenaiKey);
//   const showPassword = useLocalModelStore((s) => s.showPassword);
//   const setShowPassword = useLocalModelStore((s) => s.setShowPassword);
//   const addingOpenAICompatible = useLocalModelStore(
//     (s) => s.addingOpenAICompatible
//   );
//   const setAddingOpenAICompatible = useLocalModelStore(
//     (s) => s.setAddingOpenAICompatible
//   );

//   const {
//     credentials,
//     deleteMutation,
//     createMutation: createCredentialMutation,
//     isPending: credentialsLoading,
//   } = useCredentials();

//   const {
//     installedModels,
//     isOllamaRunning,
//     connectionChecking,
//     checkConnection,
//     pullModel,
//     cancelPull,
//     activePulls,
//     deleteModel,
//     searchModels,
//     isLoading: modelsLoading,
//     refetchModels,
//     getModelDetails,
//   } = useOllama();

//   useEffect(() => {
//     checkConnection();
//   }, [checkConnection]);

//   const filteredInstalledModels = useMemo(() => {
//     if (view === "ai_models") {
//       return installedModels.filter(
//         (model) => !EMBEDDING_MODELS.some((em) => model.name.includes(em))
//       );
//     }
//     return installedModels.filter((model) =>
//       EMBEDDING_MODELS.some((em) => model.name.includes(em))
//     );
//   }, [installedModels, view]);

//   useEffect(() => {
//     const searchOllamaLibrary = async () => {
//       if (ollamaSearch.trim().length < 2) {
//         setSearchResults([]);
//         return;
//       }

//       try {
//         const result = await searchModels.mutateAsync({
//           query: ollamaSearch,
//           order: "popular",
//         });
//         if (result?.success && result.models) {
//           const filtered =
//             view === "ai_models"
//               ? result.models.filter(
//                   (model: any) =>
//                     !EMBEDDING_MODELS.some((em) => model.name.includes(em))
//                 )
//               : result.models.filter((model: any) =>
//                   EMBEDDING_MODELS.some((em) => model.name.includes(em))
//                 );
//           setSearchResults(filtered);
//         }
//       } catch (error) {
//         console.error("Search error:", error);
//       }
//     };
//     const debounce = setTimeout(searchOllamaLibrary, 300);
//     return () => clearTimeout(debounce);
//   }, [ollamaSearch]);

//   const localAICredentials = credentials.filter(
//     (c) =>
//       c.credentialType === "ai_model" &&
//       ["ollama", "openai-compatible"].includes(c.provider)
//   );

//   const filteredCredentials = useMemo(() => {
//     let filtered = localAICredentials;

//     if (activeTab === "ollama") {
//       filtered = filtered.filter((c) => c.provider === "ollama");
//     } else if (activeTab === "openai-compatible") {
//       filtered = filtered.filter((c) => c.provider === "openai-compatible");
//     }

//     if (searchQuery) {
//       filtered = filtered.filter(
//         (c) =>
//           c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           c.provider.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     return filtered;
//   }, [localAICredentials, activeTab, searchQuery]);

//   const organizedModels = useMemo(() => {
//     if (ollamaSearch.trim()) {
//       return {
//         installed: [],
//         recommended: [],
//         additional: searchResults,
//       };
//     }

//     const installedNames = new Set(filteredInstalledModels.map((m) => m.name));

//     const installedRecommended = RECOMMENDED_MODELS.filter((m) =>
//       installedNames.has(m.name)
//     );
//     const notInstalledRecommended = RECOMMENDED_MODELS.filter(
//       (m) => !installedNames.has(m.name)
//     );

//     const otherInstalled = filteredInstalledModels.filter(
//       (m) => !RECOMMENDED_MODELS.some((rm) => rm.name === m.name)
//     );

//     return {
//       installed: [...installedRecommended, ...otherInstalled],
//       recommended: notInstalledRecommended,
//       additional: ADDITIONAL_MODELS.filter((m) => !installedNames.has(m.name)),
//     };
//   }, [ollamaSearch, searchResults, filteredInstalledModels]);

//   const handleSelectOllama = (modelName: string) => {
//     const isInstalled = filteredInstalledModels.some(
//       (m) => m.name === modelName
//     );
//     setConfirmDialog({ open: true, modelName, isInstalled });
//   };

//   const handleAddcustomOllamaSearch = async () => {
//     if (customOllamaSearch.trim()) {
//       // validate the model exist first
//       const isModelExist = await getModelDetails.mutateAsync({
//         name: customOllamaSearch.trim(),
//         verbose: false,
//       });

//       if (!isModelExist?.model) {
//         showErrorToast({
//           title: "Model not found",
//           description: "The model you entered does not exist.",
//           position: "bottom-left",
//           duration: 4000,
//         });
//         return;
//       }

//       handleSelectOllama(customOllamaSearch.trim());
//       setCustomOllamaSearch("");
//       setShowCustomSearch(false);
//     }
//   };

//   const handleDeleteCredential = async (credentialId: string) => {
//     if (confirm("Are you sure you want to remove this model?")) {
//       await deleteMutation.mutateAsync({ id: credentialId });
//     }
//   };

//   const validateOpenAICompatible = async (
//     openaiUrl: string,
//     openaiKey: string
//   ) => {
//     try {
//       if (!validateURL(openaiUrl.trim())) {
//         showErrorToast({
//           title: "Invalid URL",
//           description: "Please enter a valid URL.",
//           position: "bottom-right",
//           duration: 4000,
//         });
//         return;
//       }
//       const res = await fetch("/api/validate-openai-compatible", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: openaiName,
//           url: openaiUrl,
//           apiKey: openaiKey,
//         }),
//       });

//       if (!res.ok) {
//         throw new Error(`Server error: ${res.status}`);
//       }

//       const data = await res.json();
//       if (!data.success) {
//         let errorTitle = "Validation Failed";
//         let errorMessage = data.message;

//         if (data.statusCode === 401) {
//           errorTitle = "Invalid API Key";
//           errorMessage = "The API key provided is invalid or expired";
//         } else if (data.statusCode === 403) {
//           errorTitle = "Access Forbidden";
//           errorMessage = "You don't have permission to access this API";
//         } else if (data.statusCode === 404) {
//           errorTitle = "Invalid URL";
//           errorMessage = "The API endpoint was not found. Please check the URL";
//         }

//         showErrorToast({
//           title: errorTitle,
//           description: errorMessage,
//           duration: 6000,
//           position: "bottom-right",
//         });
//         return false;
//       }
//       return true;
//     } catch (error) {
//       showErrorToast({
//         title: "Connection Error",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Failed to validate OpenAI compatible model",
//         duration: 6000,
//         position: "bottom-right",
//       });
//       return false;
//     }
//   };

//   const handleAddOpenAI = async () => {
//     setAddingOpenAICompatible(true);

//     if (!openaiName.trim() || !openaiUrl.trim()) {
//       showErrorToast({
//         title: "Missing Fields",
//         description: "Name and URL are required.",
//         position: "bottom-right",
//         duration: 4000,
//       });
//       setAddingOpenAICompatible(false);
//       return;
//     }

//     try {
//       const isValid = await validateOpenAICompatible(openaiUrl, openaiKey);
//       if (!isValid) {
//         setAddingOpenAICompatible(false);
//         return;
//       }
//       await createCredentialMutation.mutateAsync({
//         provider: "openai-compatible",
//         credentialType: "ai_model",
//         name: openaiName.trim(),
//         baseUrl: openaiUrl.trim(),
//         apiKey: openaiKey.trim() || "",
//       });

//       setOpenaiName("");
//       setOpenaiUrl("");
//       setOpenaiKey("");
//       setActiveTab("all");
//     } catch (error) {
//       console.error("Error adding OpenAI compatible model:", error);
//       showErrorToast({
//         title: "Error",
//         description:
//           error instanceof Error
//             ? error.message
//             : "Failed to add OpenAI compatible model",
//         duration: 4000,
//         position: "bottom-right",
//       });
//     } finally {
//       setAddingOpenAICompatible(false);
//     }
//   };

//   const handleRefresh = () => {
//     checkConnection();
//     refetchModels();
//   };

//   const isLoading = credentialsLoading || modelsLoading;

//   return (
//     <div className="h-full bg-background w-full">
//       <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 h-full">
//         <Tabs
//           value={activeTab}
//           onValueChange={(e) => setActiveTab(e as ActiveLocalModelsViewTab)}
//           className="w-full h-full"
//         >
//           {/* TABS  */}
//           <div className="w-full flex items-center justify-between mb-6">
//             <TabsList>
//               <TabsTrigger value="all">
//                 <BoxIcon className="h-4 w-4 mr-2" />
//                 All Models
//               </TabsTrigger>
//               <TabsTrigger value="ollama">
//                 <img
//                   src="/icons/ollama.png"
//                   className="size-4 mr-2"
//                   alt="ollama"
//                   width={16}
//                   height={16}
//                 />
//                 Ollama
//               </TabsTrigger>
//               <TabsTrigger value="openai-compatible">
//                 <img
//                   src="/icons/openai.png"
//                   alt="openai"
//                   className="size-3.5 mr-2"
//                   width={14}
//                   height={14}
//                 />
//                 OpenAI Compatible
//               </TabsTrigger>
//             </TabsList>

//             <Button
//               variant="outline"
//               size="sm"
//               onClick={handleRefresh}
//               disabled={isLoading || connectionChecking}
//             >
//               <RefreshCw
//                 className={cn(
//                   "w-4 h-4 ",
//                   (isLoading || connectionChecking) && "animate-spin"
//                 )}
//               />
//               Refresh
//             </Button>
//           </div>

//           {/* ALERTS */}
//           {!connectionChecking && !isOllamaRunning && (
//             <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
//               <AlertCircle className="h-4 w-4 text-blue-500" />
//               <AlertDescription className="text-sm flex items-center justify-between">
//                 <span>
//                   Ollama is not running. Please start Ollama to download models.
//                 </span>
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   asChild
//                   className="ml-4 shrink-0"
//                 >
//                   <a
//                     href="https://ollama.com/download"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                   >
//                     Download Ollama
//                     <ExternalLink className="w-3 h-3 ml-2" />
//                   </a>
//                 </Button>
//               </AlertDescription>
//             </Alert>
//           )}
//           {connectionChecking && (
//             <Alert className="mb-6">
//               <Loader2 className="h-4 w-4 animate-spin" />
//               <AlertDescription className="text-sm">
//                 Checking Ollama connection...
//               </AlertDescription>
//             </Alert>
//           )}

//           <TabsContent value="all" className="focus-visible:outline-none">
//             {isLoading && (
//               <div className="flex items-center justify-center py-12">
//                 <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
//               </div>
//             )}

//             {!isLoading && filteredCredentials.length === 0 && (
//               <Card className="border-dashed">
//                 <CardContent className="flex flex-col items-center justify-center py-12 w-full">
//                   <Box className="w-12 h-12 text-muted-foreground mb-4" />
//                   <h3 className="text-lg font-medium mb-2">
//                     No local models connected yet
//                   </h3>
//                   <p className="text-sm text-muted-foreground mb-6 text-center max-w-lg">
//                     Get started by installing your first Ollama local model or
//                     connect to an OpenAI compatible model
//                   </p>
//                   <div className="flex gap-3">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={handleRefresh}
//                       disabled={isLoading || connectionChecking}
//                     >
//                       <RefreshCw
//                         className={cn(
//                           "w-4 h-4",
//                           (isLoading || connectionChecking) && "animate-spin"
//                         )}
//                       />
//                       Refresh
//                     </Button>
//                     <Button
//                       variant="brand"
//                       size="sm"
//                       onClick={() => setActiveTab("ollama")}
//                     >
//                       <Plus className="w-4 h-4 mr-2" />
//                       Add Model
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             )}

//             {!isLoading && filteredCredentials.length > 0 && (
//               <div className="space-y-4">
//                 <div className="flex gap-3">
//                   <Input
//                     placeholder="Search models..."
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                     className="max-w-sm"
//                   />
//                 </div>

//                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                   {filteredCredentials.map((credential) => {
//                     const isOllama = credential.provider === "ollama";
//                     const installedModel = filteredInstalledModels.find(
//                       (m) => m.name === credential.name
//                     );

//                     return (
//                       <Card key={credential.id} className="relative group">
//                         <CardHeader className="pb-3">
//                           <div className="flex items-start justify-between gap-2">
//                             <div className="flex items-center gap-3 min-w-0 flex-1">
//                               {isOllama ? (
//                                 <Box className="w-5 h-5 text-muted-foreground shrink-0" />
//                               ) : (
//                                 <Cpu className="w-5 h-5 text-muted-foreground shrink-0" />
//                               )}
//                               <div className="min-w-0 flex-1">
//                                 <CardTitle className="text-base truncate mb-1">
//                                   {credential.name || credential.provider}
//                                 </CardTitle>
//                                 <CardDescription className="text-xs">
//                                   {isOllama ? "Ollama" : "OpenAI Compatible"}
//                                 </CardDescription>
//                               </div>
//                             </div>
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
//                               onClick={() =>
//                                 handleDeleteCredential(credential.id)
//                               }
//                             >
//                               <Trash2 className="w-4 h-4 text-destructive" />
//                             </Button>
//                           </div>
//                         </CardHeader>

//                         <CardContent className="space-y-3">
//                           <div className="flex items-center gap-2 text-xs">
//                             {credential.isValid ? (
//                               <>
//                                 <div className="w-2 h-2 rounded-full bg-green-500" />
//                                 <span className="text-muted-foreground">
//                                   Connected
//                                 </span>
//                               </>
//                             ) : (
//                               <>
//                                 <div className="w-2 h-2 rounded-full bg-destructive" />
//                                 <span className="text-muted-foreground">
//                                   Disconnected
//                                 </span>
//                               </>
//                             )}
//                           </div>

//                           {isOllama && installedModel && (
//                             <div className="space-y-2 pt-2 border-t text-xs">
//                               <div className="flex justify-between">
//                                 <span className="text-muted-foreground">
//                                   Size
//                                 </span>
//                                 <span className="font-mono">
//                                   {formatBytes(installedModel.size)}
//                                 </span>
//                               </div>
//                               <div className="flex justify-between">
//                                 <span className="text-muted-foreground">
//                                   Modified
//                                 </span>
//                                 <span className="font-mono">
//                                   {new Date(
//                                     installedModel.modified_at
//                                   ).toLocaleDateString()}
//                                 </span>
//                               </div>
//                             </div>
//                           )}

//                           {!isOllama && credential.baseUrl && (
//                             <div className="pt-2 border-t">
//                               <div className="text-xs text-muted-foreground mb-1">
//                                 Base URL
//                               </div>
//                               <div className="text-xs font-mono truncate">
//                                 {credential.baseUrl}
//                               </div>
//                             </div>
//                           )}

//                           {credential.maskedApiKey && (
//                             <div className="pt-2 border-t text-xs text-muted-foreground">
//                               API Key configured
//                             </div>
//                           )}
//                         </CardContent>
//                       </Card>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//           </TabsContent>

//           {/* OPRNAI Compatible */}
//           <TabsContent
//             value="openai-compatible"
//             className="focus-visible:outline-none"
//           >
//             <div className="glass-panel rounded-lg p-6 space-y-5">
//               <div className="space-y-2">
//                 <Label htmlFor="openai-name" className="text-sm">
//                   Display name
//                 </Label>
//                 <Input
//                   id="openai-name"
//                   placeholder="e.g., GPT-4 Turbo"
//                   value={openaiName}
//                   onChange={(e) => setOpenaiName(e.target.value)}
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="openai-url" className="text-sm">
//                   Base URL
//                 </Label>
//                 <Input
//                   id="openai-url"
//                   placeholder="https://api.openai.com/v1"
//                   value={openaiUrl}
//                   onChange={(e) => setOpenaiUrl(e.target.value)}
//                   className="font-mono text-sm"
//                 />
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="openai-key" className="text-sm">
//                   API Key{" "}
//                   <span className="text-muted-foreground">(optional)</span>
//                 </Label>
//                 <div className="relative w-full">
//                   <Input
//                     id="openai-key"
//                     type={showPassword ? "text" : "password"}
//                     placeholder="sk-..."
//                     value={openaiKey}
//                     onChange={(e) => setOpenaiKey(e.target.value)}
//                     className="font-mono text-sm pr-10"
//                   />
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
//                     onClick={() => setShowPassword(!showPassword)}
//                   >
//                     {showPassword ? (
//                       <EyeOffIcon className="h-4 w-4" />
//                     ) : (
//                       <EyeIcon className="h-4 w-4" />
//                     )}
//                   </Button>
//                 </div>
//               </div>

//               <div className="flex justify-end gap-3 pt-4">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setActiveTab("all")}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   variant="brand"
//                   size="sm"
//                   onClick={handleAddOpenAI}
//                   disabled={
//                     !openaiName.trim() ||
//                     !openaiUrl.trim() ||
//                     createCredentialMutation.isPending ||
//                     addingOpenAICompatible
//                   }
//                 >
//                   {createCredentialMutation.isPending ||
//                   addingOpenAICompatible ? (
//                     <Loader2 className="w-4 h-4 animate-spin mr-2" />
//                   ) : (
//                     <PlusIcon className="w-4 h-4 mr-2" />
//                   )}
//                   Add Model
//                 </Button>
//               </div>
//             </div>
//           </TabsContent>

//           {/* OLLAMA View  */}
//           <TabsContent
//             value="ollama"
//             className="focus-visible:outline-none h-full flex flex-col"
//           >
//             {/* Pulling State */}
//             <div className="flex flex-col h-full space-y-4">
//               {activePulls.length > 0 && (
//                 <div className="glass-panel rounded-lg p-4 space-y-3 shrink-0">
//                   <Label className="text-sm font-medium">
//                     Downloading Models
//                   </Label>
//                   {activePulls.map((pull) => (
//                     <div key={pull.modelName} className="space-y-2">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="font-mono">{pull.modelName}</span>
//                         <div className="flex items-center gap-2">
//                           <span className="text-muted-foreground font-mono">
//                             {pull.progress.toFixed(0)}%
//                           </span>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             className="h-6 w-6 p-0"
//                             onClick={() => cancelPull(pull.modelName)}
//                           >
//                             <X className="w-3 h-3" />
//                           </Button>
//                         </div>
//                       </div>
//                       <Progress value={pull.progress} />
//                       <p className="text-xs text-muted-foreground">
//                         {pull.status}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               )}

//               <div className="flex-1 glass-panel rounded-lg overflow-hidden min-h-0 max-h-[64%]">
//                 <Command className="bg-transparent h-full flex flex-col">
//                   <div className="border-border shrink-0">
//                     <CommandInput
//                       placeholder="Search Ollama library..."
//                       value={ollamaSearch}
//                       onValueChange={setOllamaSearch}
//                     />
//                   </div>
//                   <CommandList className="mt-2 border rounded-xl overflow-y-auto flex-1 h-full">
//                     {searchModels.isPending && (
//                       <div className="py-8 text-center">
//                         <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
//                       </div>
//                     )}
//                     {!searchModels.isPending &&
//                       !ollamaSearch.trim() &&
//                       organizedModels.installed.length === 0 &&
//                       organizedModels.recommended.length === 0 &&
//                       organizedModels.additional.length === 0 && (
//                         <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
//                           No models found. Try a different search or use a
//                           custom model name.
//                         </CommandEmpty>
//                       )}
//                     {!searchModels.isPending && (
//                       <>
//                         {organizedModels.installed.length > 0 && (
//                           <CommandGroup heading="Installed Models">
//                             {organizedModels.installed.map((model) =>
//                               renderModelItem({
//                                 model,
//                                 isInstalled: true,
//                                 isSearch: false,
//                                 isRecommended: RECOMMENDED_MODELS.some(
//                                   (rm) => rm.name === model.name
//                                 ),
//                                 onSelect: () => handleSelectOllama(model.name),
//                               })
//                             )}
//                           </CommandGroup>
//                         )}
//                         {organizedModels.recommended.length > 0 && (
//                           <CommandGroup heading="Recommended Models">
//                             {organizedModels.recommended.map((model) =>
//                               renderModelItem({
//                                 model,
//                                 isInstalled: false,
//                                 isSearch: false,
//                                 isRecommended: true,
//                                 onSelect: () => handleSelectOllama(model.name),
//                               })
//                             )}
//                           </CommandGroup>
//                         )}
//                         {ollamaSearch.trim() &&
//                           organizedModels.additional.length > 0 && (
//                             <CommandGroup heading="Search Results">
//                               {organizedModels.additional.map((model) =>
//                                 renderModelItem({
//                                   model,
//                                   isSearch: true,
//                                   isInstalled: false,
//                                   isRecommended: RECOMMENDED_MODELS.some(
//                                     (m) => m.name === model.name
//                                   ),
//                                   onSelect: () =>
//                                     handleSelectOllama(model.name),
//                                 })
//                               )}
//                             </CommandGroup>
//                           )}
//                         {!ollamaSearch.trim() &&
//                           organizedModels.additional.length > 0 && (
//                             <CommandGroup heading="Additional Models">
//                               {organizedModels.additional.map((model) =>
//                                 renderModelItem({
//                                   model,
//                                   onSelect: () =>
//                                     handleSelectOllama(model.name),
//                                 })
//                               )}
//                             </CommandGroup>
//                           )}
//                       </>
//                     )}
//                   </CommandList>
//                 </Command>
//               </div>

//               <div className="shrink-0">
//                 {!showCustomSearch ? (
//                   <Button
//                     variant="outline"
//                     className="w-full"
//                     onClick={() => setShowCustomSearch(true)}
//                     disabled={!isOllamaRunning}
//                   >
//                     <Plus className="w-4 h-4 mr-2" />
//                     Add Custom Model
//                   </Button>
//                 ) : (
//                   <div className="glass-panel rounded-lg p-3 space-y-2">
//                     <Label className="text-xs text-muted-foreground">
//                       Enter custom model name
//                     </Label>
//                     <div className="flex gap-2">
//                       <Input
//                         placeholder="e.g., llama3.2:70b"
//                         value={customOllamaSearch}
//                         onChange={(e) => setCustomOllamaSearch(e.target.value)}
//                         className="font-mono text-sm flex-1 h-7 dark:placeholder:text-gaia-600"
//                         onKeyDown={(e) =>
//                           e.key === "Enter" && handleAddcustomOllamaSearch()
//                         }
//                       />
//                       <Button
//                         onClick={handleAddcustomOllamaSearch}
//                         disabled={
//                           !customOllamaSearch.trim() ||
//                           getModelDetails.isPending
//                         }
//                         variant="brand"
//                         size="sm"
//                         className="px-3 h-[27px]"
//                       >
//                         <Download className="size-3.5! mr-1" />
//                         Pull
//                       </Button>
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => {
//                           setShowCustomSearch(false);
//                           setCustomOllamaSearch("");
//                         }}
//                       >
//                         Cancel
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </TabsContent>
//         </Tabs>

//         {/* CONFIRM DOWNLOAD MOLDEL */}
//         <ConfirmDownloadModal />
//       </div>
//     </div>
//   );
// }

// const renderModelItem = ({
//   model,
//   onSelect,
//   isInstalled = false,
//   isRecommended = false,
//   isSearch = false,
// }: {
//   model: any;
//   onSelect: () => void;
//   isInstalled?: boolean;
//   isRecommended?: boolean;
//   isSearch?: boolean;
// }) => {
//   const { activePulls, deleteModel } = useOllama();

//   const getModelProgress = (modelName: string) => {
//     return activePulls.find((p) => p.modelName === modelName);
//   };
//   const handleDeleteModel = async (modelName: string) => {
//     deleteModel.mutate({ modelName });
//   };
//   const progress = getModelProgress(model.name);
//   const isPulling = !!progress;

//   return (
//     <CommandItem
//       key={model.name}
//       value={model.name}
//       onSelect={() => !isPulling && onSelect()}
//       disabled={isPulling}
//       className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors"
//     >
//       <div className="flex flex-col flex-1 min-w-0 gap-1">
//         <div className="flex items-center gap-2">
//           <span className="font-medium text-sm">{model.name}</span>
//           {isRecommended && !isInstalled && (
//             <Star className="size-3 fill-yellow-500 text-yellow-500" />
//           )}
//         </div>

//         {isSearch && (
//           <div className="flex items-center gap-3 text-xs text-muted-foreground">
//             {model.pulls && (
//               <span className="flex items-center gap-1">
//                 <Download className="w-3 h-3" />
//                 {model.pulls} pulls
//               </span>
//             )}
//             {model.updated && <span>Updated {model.updated}</span>}
//             {model.tags && (
//               <span>
//                 {model.tags} {model.tags === "1" ? "tag" : "tags"}
//               </span>
//             )}
//           </div>
//         )}
//       </div>

//       <div className="flex items-center gap-3 shrink-0 ml-4">
//         {model.size && (
//           <span className="text-xs text-muted-foreground font-mono min-w-[60px] text-right">
//             {formatBytes(model.size)}
//           </span>
//         )}
//         {isPulling ? (
//           <Loader2 className="w-4 h-4 animate-spin text-primary" />
//         ) : isInstalled ? (
//           <div
//             className="flex items-center gap-2"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <ConfirmModal
//               onDelete={() => handleDeleteModel(model.name)}
//               description={`Are you sure you want to delete ${model.name}?`}
//               isPending={deleteModel.isPending}
//             >
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
//               >
//                 <Trash2 className="w-3.5 h-3.5 dark:text-red-800" />
//               </Button>
//             </ConfirmModal>
//             <CheckCircle2 className="w-4 h-4" color="green" />
//           </div>
//         ) : (
//           <Download className="w-4 h-4 text-muted-foreground" />
//         )}
//       </div>
//     </CommandItem>
//   );
// };

// const ConfirmDownloadModal = () => {
//   const confirmDialog = useLocalModelStore(
//     (state) => state.confirmDownloadDialog
//   );
//   const setConfirmDialog = useLocalModelStore(
//     (state) => state.setConfirmDownLoadModel
//   );
//   const { pullModel } = useOllama();
//   const { createMutation: createCredentialMutation } = useCredentials();

//   const handleConfirmAdd = async () => {
//     const { modelName, isInstalled } = confirmDialog;
//     setConfirmDialog({ open: false, modelName: "", isInstalled: false });

//     if (isInstalled) {
//       await createCredentialMutation.mutateAsync({
//         provider: "ollama",
//         credentialType: "ai_model",
//         name: modelName,
//         apiKey: "",
//       });
//     } else {
//       await pullModel(modelName);
//       await createCredentialMutation.mutateAsync({
//         provider: "ollama",
//         credentialType: "ai_model",
//         name: modelName,
//         apiKey: "",
//       });
//     }
//   };

//   return (
//     <Dialog
//       open={confirmDialog.open}
//       onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
//     >
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>
//             {confirmDialog.isInstalled ? "Add Model" : "Download & Add Model"}
//           </DialogTitle>
//           <DialogDescription>
//             {confirmDialog.isInstalled ? (
//               <>
//                 The model{" "}
//                 <span className="font-mono font-semibold">
//                   {confirmDialog.modelName}
//                 </span>{" "}
//                 is already installed. Would you like to add it to your available
//                 models?
//               </>
//             ) : (
//               <>
//                 This will download{" "}
//                 <span className="font-mono font-semibold dark:text-green-600/90">
//                   {confirmDialog.modelName}
//                 </span>{" "}
//                 from Ollama and add it to your available models. The download
//                 will continue in the background.
//               </>
//             )}
//           </DialogDescription>
//         </DialogHeader>
//         <DialogFooter>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() =>
//               setConfirmDialog({
//                 open: false,
//                 modelName: "",
//                 isInstalled: false,
//               })
//             }
//           >
//             Cancel
//           </Button>
//           <Button variant="brand" size="sm" onClick={handleConfirmAdd}>
//             {confirmDialog.isInstalled ? (
//               <>
//                 <Check className="w-4 h-4 mr-2" />
//                 Add Model
//               </>
//             ) : (
//               <>
//                 <Download className="w-4 h-4 mr-2" />
//                 Download & Add
//               </>
//             )}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// };
