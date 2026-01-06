"use client";

import * as z from "zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";
import { showErrorToast, showSuccessToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader, AlertTriangle, X, XCircle } from "lucide-react";
import { ALERT_STORAGE_KEY } from "@/const/storage";

// Login Schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Signup Schema
const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

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
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-amber-100/50 to-transparent dark:from-amber-900/20 dark:to-transparent" />

        <div className="relative px-4 py-3.5 flex gap-3">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="shrink-0 mt-0.5"
          >
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          </motion.div>

          {/* Content */}
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

              {/* Dismiss button */}
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
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const isDismissed = localStorage.getItem(ALERT_STORAGE_KEY);
    setShowAlert(!isDismissed);
  }, []);

  const handleDismissAlert = () => {
    setShowAlert(false);
    localStorage.setItem(ALERT_STORAGE_KEY, "true");
  };

  const form = useForm<LoginValues | SignupValues>({
    resolver: zodResolver(isLogin ? loginSchema : signupSchema),
    defaultValues: isLogin
      ? { email: "", password: "" }
      : { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: LoginValues | SignupValues) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await authClient.signIn.email({
          email: values.email,
          password: values.password,
          callbackURL: "/",
        });

        if (error) {
          showErrorToast({
            title: "Failed to sign in",
            position: "bottom-right",
            description: error.message || "Something went wrong",
          });
          return;
        }

        showSuccessToast({
          title: "Login successful",
          position: "bottom-right",
          description: "Login successful",
        });
        router.push("/");
      } else {
        const signupValues = values as SignupValues;
        const { data, error } = await authClient.signUp.email({
          email: signupValues.email,
          password: signupValues.password,
          name: "",
        });

        if (error) {
          showErrorToast({
            title: "Failed to create account",
            position: "bottom-right",
            description: error.message || "Failed to create account",
          });
          return;
        }
        showSuccessToast({
          title: "Success",
          position: "bottom-right",
          description: "Account created successfully",
        });
        router.push("/");
      }
    } catch (error: any) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    form.reset(
      !isLogin
        ? { email: "", password: "" }
        : { email: "", password: "", confirmPassword: "" }
    );
  };

  return (
    <div className="flex flex-col h-full items-center w-full justify-center px-4 py-8">
      {/* Animated Alert */}
      <AnimatePresence>
        {showAlert && (
          <AnimatedAlert
            className="absolute top-3"
            title="Development Environment"
            description="These credentials are for local use only. They are not real and have no effect outside this environment."
            onDismiss={handleDismissAlert}
          />
        )}
      </AnimatePresence>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-none dark:shadow-xl ">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Enter your credentials to access your account"
                : "Fill in the details to create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Email</FormLabel>
                      <FormControl>
                        <Input
                          className={cn(
                            "transition-colors bg-white  text-black",
                            fieldState.error &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            className={cn(
                              "transition-colors pr-10 bg-white",
                              fieldState.error &&
                                "border-red-500 focus-visible:ring-red-500"
                            )}
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            {...field}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <AnimatePresence mode="wait">
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field, fieldState }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  className={cn(
                                    "transition-colors pr-10 bg-white",
                                    fieldState.error &&
                                      "border-red-500 focus-visible:ring-red-500"
                                  )}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="••••••"
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      form.handleSubmit(onSubmit)();
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="brand"
                  type="button"
                  className="w-full mt-6 h-11"
                  disabled={isLoading}
                  size="sm"
                  onClick={form.handleSubmit(onSubmit)}
                >
                  {isLoading && (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
                </Button>
              </div>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button
              className="text-muted-foreground hover:bg-transparent"
              variant="ghost"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isLogin ? (
                <div className="text-sm">
                  <span>Don't have an account? </span>
                  <span className="font-medium text-foreground underline underline-offset-4">
                    Sign up
                  </span>
                </div>
              ) : (
                <div className="text-sm">
                  <span>Already have an account? </span>
                  <span className="font-medium text-foreground underline underline-offset-4">
                    Sign in
                  </span>
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
