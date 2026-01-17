import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const LoadingProjects = () => {
  return (
    <div className="h-full flex items-center mt-6">
      <div className="flex flex-wrap max-w-5xl mx-auto gap-9 items-start justify-center">
        <Skeleton className="h-42 w-100! animate-pulse" />
        <Skeleton className="h-42 w-100! animate-pulse" />
        <Skeleton className="h-42 w-100! animate-pulse" />
        <Skeleton className="h-42 w-100! animate-pulse" />
      </div>
    </div>
  );
};

export default LoadingProjects;
