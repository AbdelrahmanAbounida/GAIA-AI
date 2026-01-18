"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const OneTapAuth = () => {
  const router = useRouter();
  const { user, isPending } = useCurrentUser();

  const oneTapCall = async () => {
    try {
      await authClient.oneTap({
        callbackURL: "/",
        cancelOnTapOutside: true,
        context: "signin",
        autoSelect: false,
        fetchOptions: {
          headers: {
            "Referrer-Policy": "no-referrer-when-downgrade",
          },
          onSuccess: () => {
            router.push("/");
          },
          onError: (err) => {
            console.log({ err });
          },
        },
      });
    } catch (error) {
      console.log("One Tap error:", error);
    }
  };

  useEffect(() => {
    if (!isPending && !user) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        oneTapCall().catch((error) => {
          console.log("One Tap initialization failed:", error);
          if (error?.message && !error.message.includes("cancel")) {
            toast.error("Authentication failed");
          }
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, isPending]);

  return null;
};
