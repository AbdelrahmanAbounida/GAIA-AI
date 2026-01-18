import { Button } from "@/components/ui/button";
import Image from "next/image";
import GithubLogo from "@/public/github.svg";
import { authClient } from "@/lib/auth/auth-client";
import { showErrorToast } from "@/components/ui/toast";
import { useAuthModal } from "@/store/use-auth-modal";
import GoogleImage from "@/public/google.png";
import { GithubIcon } from "lucide-react";

export const SocialAuthForm = () => {
  const storedCallbackUrl = useAuthModal((state) => state.callbackUrl);

  const handleSocialAuth = async (provider: "google" | "github") => {
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: storedCallbackUrl,
      newUserCallbackURL: storedCallbackUrl,
    });

    if (error) {
      showErrorToast({
        title: "Failed to login",
        description: error?.message || "Something went wrong",
        position: "top-center",
      });
      return;
    }
  };

  return (
    <div className="space-y-3 max-w-[320px] flex flex-col mx-auto">
      <Button
        variant="outline"
        className="w-full justify-start gap-4 rounded-3xl h-12 "
        onClick={() => handleSocialAuth("google")}
      >
        <Image src={GoogleImage.src} width={18} height={18} alt="Google" />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start gap-4 rounded-3xl h-12"
        onClick={() => handleSocialAuth("github")}
      >
        <Image
          src={GithubLogo.src}
          width={18}
          height={18}
          alt="GitHub"
          className="dark:hidden"
        />
        <GithubIcon className="dark:block hidden" />
        Continue with GitHub
      </Button>
    </div>
  );
};
