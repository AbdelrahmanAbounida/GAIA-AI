import { useAuthModal } from "@/store/use-auth-modal";
import { Button } from "../ui/button";

export const ToggleAuthMode = () => {
  const isLogin = useAuthModal((state) => state.isLogin);
  const toggleAuthMode = useAuthModal((state) => state.toggleAuthMode);

  return (
    <div className="text-center">
      <span className="text-gray-600 dark:text-gaia-300 text-sm">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
      </span>
      <Button
        variant="link"
        className="p-0 ml-1 h-auto text-main text-xs underline hover:text-main-300 dark:text-gaia-200"
        onClick={toggleAuthMode}
      >
        {isLogin ? "Create account" : "Sign in"}
      </Button>
    </div>
  );
};

export const Divider = () => {
  return (
    <div className="flex items-center w-full">
      <div className="grow h-px bg-gray-200" />
      <span className="mx-3 text-xs uppercase text-gray-500 dark:text-gray-300">
        Or continue with email
      </span>
      <div className="grow h-px bg-gray-200" />
    </div>
  );
};
