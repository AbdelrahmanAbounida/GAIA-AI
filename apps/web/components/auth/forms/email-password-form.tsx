import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth/auth-client";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/store/use-auth-modal";
import { useState } from "react";

interface EmailPasswordFormProps {
  isVercel?: boolean;
}

export const EmailPasswordForm = ({
  isVercel = false,
}: EmailPasswordFormProps) => {
  const email = useAuthModal((state) => state.email);
  const setEmail = useAuthModal((state) => state.setEmail);
  const password = useAuthModal((state) => state.password);
  const setPassword = useAuthModal((state) => state.setPassword);
  const showPassword = useAuthModal((state) => state.showPassword);
  const setShowPassword = useAuthModal((state) => state.setShowPassword);
  const isLogin = useAuthModal((state) => state.isLogin);
  const loading = useAuthModal((state) => state.loading);
  const setLoading = useAuthModal((state) => state.setLoading);
  const setView = useAuthModal((state) => state.setView);
  const setIsOpen = useAuthModal((state) => state.setIsOpen);

  // Local state for confirm password (only used in non-Vercel signup)
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password match for non-Vercel signup
    if (!isVercel && !isLogin && password !== confirmPassword) {
      showErrorToast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
        position: "top-center",
      });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        // Login flow
        const { error } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (error) {
          showErrorToast({
            title: "Failed to login",
            description: error?.message || "Something went wrong",
            position: "top-center",
          });
          return;
        }
        showSuccessToast({
          title: "Login successful",
          description: "You have successfully logged in",
          position: "top-center",
        });
        setIsOpen(false);
        router.push("/");
      } else {
        // Signup
        const { data, error } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0],
        });
        if (error) {
          showErrorToast({
            title: "Failed to signup",
            description: error?.message || "Something went wrong",
            position: "top-center",
          });
          return;
        }

        if (isVercel) {
          // For Vercel: send verification OTP via email
          const otpResult = await authClient.emailOtp.sendVerificationOtp({
            email,
            type: "email-verification",
          });
          if (otpResult.error) {
            showErrorToast({
              title: "Failed to send verification code",
              description: otpResult.error?.message || "Something went wrong",
              position: "top-center",
            });
            return;
          }
          showSuccessToast({
            title: "Verification code sent!",
            position: "top-center",
            description: "Please check your email for the OTP code",
          });
          setView("otp");
        } else {
          // For local: auto-verify and sign in directly
          showSuccessToast({
            title: "Account created successfully!",
            description: "You can start Testing the platform 😃",
            position: "top-center",
          });
          setIsOpen(false);
          router.push("/");
        }
      }
    } catch (error: any) {
      showErrorToast({
        title: "Failed to login",
        description: error?.message || "Something went wrong",
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailAuth} className="space-y-4 w-full mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-gaia-400 dark:border-gaia-800 rounded-xl "
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gaia-400 dark:border-gaia-800 rounded-xl pr-10 "
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOffIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Confirm Password Field - Only for non-Vercel signup */}
      {!isVercel && !isLogin && (
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="border-gaia-400 dark:border-gaia-800 rounded-xl pr-10 "
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOffIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <EyeIcon className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>
      )}

      {isVercel && isLogin && (
        <div className="text-right h-7">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-main hover:text-main-300 underline text-xs"
            onClick={() => setView("forgot-password")}
          >
            Forgot password?
          </Button>
        </div>
      )}
      <Button
        variant={"brand"}
        type="submit"
        className="w-full rounded-xl h-11 dark:h-9 mt-3 "
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2  border-t-transparent rounded-full animate-spin mr-2" />
            {isLogin ? "Signing in..." : "Creating account..."}
          </div>
        ) : isLogin ? (
          "Sign in"
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
};
