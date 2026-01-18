import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useAuthModal } from "@/store/use-auth-modal";
import { orpc } from "@/lib/orpc/client";
import { useState } from "react";
import z from "zod";

const EmailSchema = z.string().email();

// Step 1: Email Input Form
export const ForgotPasswordForm = () => {
  const email = useAuthModal((state) => state.email);
  const setEmail = useAuthModal((state) => state.setEmail);
  const loading = useAuthModal((state) => state.loading);
  const setLoading = useAuthModal((state) => state.setLoading);
  const setView = useAuthModal((state) => state.setView);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // checking email is valid
      const result = EmailSchema.safeParse(email);
      if (!result.success) {
        showErrorToast({
          title: "Invalid email",
          position: "top-center",
          description: "Please enter a valid email",
        });
        return;
      }

      const emailExist = await orpc.public.auth.checkEmailExist({
        email,
      });
      if (!emailExist?.success) {
        showErrorToast({
          title: "Email does not exist",
          position: "top-center",
          description: "it seems like you don't have an account",
        });
        return;
      }

      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "forget-password",
      });

      if (error) {
        showErrorToast({
          title: "Failed to send reset code",
          position: "top-center",
          description: error?.message || "Something went wrong",
        });
        return;
      }
      showSuccessToast({
        title: "Reset code sent to your email!",
        position: "top-center",
        description: "Please check your email for the reset code",
      });
      setView("reset-password");
    } catch (error: any) {
      showErrorToast({
        title: "Failed to send reset code",
        position: "top-center",
        description: error?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4 max-w-[320px] mx-auto">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl"
        />
      </div>

      <Button
        variant={"brand"}
        type="submit"
        className="w-full rounded-xl h-11 text-white"
        disabled={loading || !email}
        onClick={handleSendOTP}
      >
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Sending...
          </div>
        ) : (
          "Send Reset Code"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-xl "
        onClick={() => setView("auth")}
      >
        Back to sign in
      </Button>
    </form>
  );
};

// Step 2: Combined OTP Verification and Password Reset Form
export const ResetPasswordForm = () => {
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loading = useAuthModal((state) => state.loading);
  const setLoading = useAuthModal((state) => state.setLoading);
  const setView = useAuthModal((state) => state.setView);
  const email = useAuthModal((state) => state.email);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      showErrorToast({
        title: "Passwords don't match",
        position: "top-center",
        description: "Please make sure both passwords are the same",
      });
      return;
    }

    if (password.length < 8) {
      showErrorToast({
        title: "Password too short",
        position: "top-center",
        description: "Password must be at least 8 characters long",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.emailOtp.resetPassword({
        email,
        otp,
        password,
      });

      if (error) {
        showErrorToast({
          title: "Failed to reset password",
          position: "top-center",
          description: error?.message || "Something went wrong",
        });
        return;
      }

      showSuccessToast({
        title: "Password reset successfully!",
        position: "top-center",
        description: "You can now login with your new password",
      });
      setView("auth");
    } catch (error: any) {
      showErrorToast({
        title: "Failed to reset password",
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
        type: "forget-password",
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
        title: "Verification code resent!",
        position: "top-center",
        description: "Please check your email for the new code",
      });
    } catch (error: any) {
      showErrorToast({
        title: "Failed to resend code",
        position: "top-center",
        description: error?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleResetPassword} className="space-y-4  mx-auto ">
      <div className="space-y-2 w-full ">
        <Label htmlFor="otp">Verification Code</Label>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          className="w-full border "
        >
          <InputOTPGroup className="rounded-3xl! w-full ">
            <InputOTPSlot index={0} className=" first:rounded-l-xl " />
            <InputOTPSlot index={1} className=" " />
            <InputOTPSlot index={2} className=" " />
            <InputOTPSlot index={3} className=" " />
            <InputOTPSlot index={4} className=" " />
            <InputOTPSlot index={5} className=" last:rounded-r-xl " />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className=" rounded-xl pr-10 "
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

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className=" rounded-xl pr-10 "
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

      <Button
        variant={"brand"}
        type="submit"
        className="w-full rounded-xl h-11 dark:h-9 mt-3"
        disabled={
          loading ||
          otp.length !== 6 ||
          password !== confirmPassword ||
          !password ||
          !confirmPassword
        }
      >
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Resetting...
          </div>
        ) : (
          "Reset Password"
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gaia-300">
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
        className="w-full rounded-xl"
        onClick={() => setView("forgot-password")}
      >
        Back
      </Button>
    </form>
  );
};
