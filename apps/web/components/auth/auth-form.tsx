"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { AlertTriangle, XCircle } from "lucide-react";
import { ALERT_STORAGE_KEY } from "@/const/storage";
import { Logo } from "../logo";
import { EmailVerificationForm } from "./forms/emai-verification-form";
import {
  ForgotPasswordForm,
  ResetPasswordForm,
} from "./forms/password-reset-form";
import { SocialAuthForm } from "./forms/social-auth-form";
import { EmailPasswordForm } from "./forms/email-password-form";
import { Divider, ToggleAuthMode } from "./toggle-auth";
import { useAuthModal } from "@/store/use-auth-modal";
import { OneTapAuth } from "./one-top-auth";

// Animated Alert Component
function AnimatedAlert({
  title,
  description,
  onDismiss,
  className,
}: {
  title: string;
  description: string;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("w-full max-w-md mx-auto mb-6", className)}
    >
      <div className="relative overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-linear-to-br from-amber-100/50 to-transparent dark:from-amber-900/20 dark:to-transparent" />

        <div className="relative px-4 py-3.5 flex gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="shrink-0 mt-0.5"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </motion.div>

          <div className="flex-1 min-w-0">
            <div className="w-full flex items-center justify-between">
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-semibold text-amber-900 dark:text-amber-400 mb-1"
              >
                {title}
              </motion.h3>

              {onDismiss && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onDismiss}
                  className="shrink-0 cursor-pointer text-amber-600 dark:text-amber-500 hover:text-amber-800 dark:hover:text-amber-300 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <XCircle className="h-4 w-4" />
                </motion.button>
              )}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-amber-800 dark:text-amber-300/90 leading-relaxed"
            >
              {description}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AuthForm() {
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get state from Zustand store
  const view = useAuthModal((state) => state.view);
  const isLogin = useAuthModal((state) => state.isLogin);
  const setView = useAuthModal((state) => state.setView);
  const setIsLogin = useAuthModal((state) => state.setIsLogin);

  const isVercel = !!(process.env.VERCEL === "1" || process.env.VERCEL_ENV);

  useEffect(() => {
    const isDismissed = localStorage.getItem(ALERT_STORAGE_KEY);
    setShowAlert(!isDismissed);
  }, []);

  useEffect(() => {
    const openLogin = searchParams.get("login");
    if (openLogin === "true") {
      setView("auth");
      setIsLogin(true);
    }
  }, [searchParams, setView, setIsLogin]);

  const handleDismissAlert = () => {
    setShowAlert(false);
    localStorage.setItem(ALERT_STORAGE_KEY, "true");
  };

  const getTitle = () => {
    if (view === "otp") return "Verify your email";
    if (view === "forgot-password") return "Reset your password";
    if (view === "reset-password") return "Reset your password";
    return isLogin ? "Welcome back" : "Welcome to GAIA AI";
  };

  const getDescription = () => {
    if (view === "otp") return "Enter the verification code sent to your email";
    if (view === "forgot-password")
      return "Enter your email to receive a reset link";
    if (view === "reset-password") return "Enter your new password";
    return isLogin
      ? "Sign in to access your account"
      : "Create your account to get started";
  };

  return (
    <div className="flex flex-col h-full items-center w-full justify-center px-4 py-8 ">
      {/* Development Alert */}
      <AnimatePresence>
        {!isVercel && showAlert && view === "auth" && (
          <AnimatedAlert
            className="absolute top-3"
            title="Development Environment"
            description="These credentials are for local use only. They are not real and have no effect outside this environment."
            onDismiss={handleDismissAlert}
          />
        )}
      </AnimatePresence>

      <OneTapAuth />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-none dark:shadow-xl">
          <CardHeader className="text-center space-y-2">
            <Logo
              className={cn(
                "mx-auto w-fit",
                view === "otp" && "size-12 text-3xl items-center justify-center"
              )}
              isIcon
            />
            <CardTitle
              className={cn(
                "text-2xl",
                view === "otp" && "text-2xl font-medium"
              )}
            >
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-sm">
              {getDescription()}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {view === "auth" ? (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Only show social auth in Vercel */}
                  {isVercel && (
                    <>
                      <SocialAuthForm />
                      <Divider />
                    </>
                  )}

                  {/* Pass isVercel to EmailPasswordForm to handle confirm password */}
                  <EmailPasswordForm isVercel={isVercel} />
                  <ToggleAuthMode />
                </motion.div>
              ) : view === "otp" ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <EmailVerificationForm />
                </motion.div>
              ) : view === "forgot-password" ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ForgotPasswordForm />
                </motion.div>
              ) : (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResetPasswordForm />
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
