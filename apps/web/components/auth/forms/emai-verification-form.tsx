import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useAuthModal } from "@/store/use-auth-modal";
import { useRouter } from "next/navigation";

export const EmailVerificationForm = () => {
  const otp = useAuthModal((state) => state.otp);
  const setOtp = useAuthModal((state) => state.setOtp);
  const loading = useAuthModal((state) => state.loading);
  const setLoading = useAuthModal((state) => state.setLoading);
  const setView = useAuthModal((state) => state.setView);
  const email = useAuthModal((state) => state.email);
  const setIsOpen = useAuthModal((state) => state.setIsOpen);
  const storedCallbackUrl = useAuthModal((state) => state.callbackUrl);
  const password = useAuthModal((state) => state.password);

  const router = useRouter();

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error, data } = await authClient.emailOtp.verifyEmail({
        email,
        otp,
      });

      if (error) {
        showErrorToast({
          title: "Failed to verify email",
          position: "top-center",
          description: error?.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Email verified successfully!",
        position: "top-center",
        description: "You can now access your account",
      });

      // Trying to auto-login
      try {
        const signInResult = await authClient.signIn.email({
          email,
          callbackURL: storedCallbackUrl || "/",
          password,
        });

        if (signInResult.error) {
          setView("auth");
          return;
        }

        setIsOpen(false);
        window.history.replaceState({}, "", "/");
        router.push(storedCallbackUrl || "/");
      } catch (err) {
        setView("auth"); // redirect user to login
      }
    } catch (error: any) {
      showErrorToast({
        title: "Failed to verify email",
        position: "top-center",
        description: error?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        showErrorToast({
          title: "Failed to resend code",
          position: "top-center",
          description: error?.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Verification code sent!",
        position: "top-center",
        description: "Please check your email for the OTP code",
      });
    } catch (error: any) {
      showErrorToast({
        title: "Failed to send OTP code",
        position: "top-center",
        description: error?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleVerifyOtp}
      className="space-y-1 max-w-[320px] mx-auto text-center"
    >
      <p className="text-sm text-gray-600">
        We sent a verification code to <strong>{email}</strong>
      </p>
      <p className="text-gray-600 text-sm mx-auto text-center">
        {"If you didn't receive the code, check your spam or junk folder."}
      </p>
      <div className="space-y-2 mt-5">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          className="w-full mx-auto"
        >
          <InputOTPGroup className="mx-auto w-full">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button
        variant={"brand"}
        type="submit"
        className={cn(
          "w-full rounded-xl h-11 dark:h-7 mt-5",
          loading && "opacity-90"
        )}
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <div className="flex items-center">
            <Loader2 className="mr-2 animate-spin" />
            Verifying...
          </div>
        ) : (
          "Verify Email"
        )}
      </Button>
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
          {"Didn't receive the code?"}
        </p>
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto text-main text-sm underline hover:text-main-300"
          onClick={handleResendOtp}
          disabled={loading}
        >
          Resend code
        </Button>
      </div>
      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-xl h-10"
        onClick={() => setView("auth")}
      >
        Back to sign up
      </Button>
    </form>
  );
};
