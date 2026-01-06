import { Loader } from "lucide-react";
import React from "react";

const LoadingPage = () => {
  return (
    <div className="flex items-center justify-center">
      <Loader className="animate-spin size-7 text-brand-700 dark:text-brand-800" />
    </div>
  );
};

export default LoadingPage;
