"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
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
import { EyeIcon, EyeOffIcon, Loader, Loader2 } from "lucide-react";

// Login Schema
const loginSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Signup Schema
const signupSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  //   const { error, formItemId } = useFormField();

  const [showPassword, setShowPassword] = useState(false);

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
        // Login flow
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
        // Signup flow
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
      //   toast.error(error?.message || "Something went wrong");
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
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLogin ? "Login" : "Create Account"}</CardTitle>
        <CardDescription>
          {isLogin
            ? "Enter your credentials to access your account"
            : "Fill in the details to create your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-sm">Email</FormLabel>
                  <FormControl>
                    <Input
                      className={cn(fieldState.error && "border-red-800!")}
                      type="email"
                      placeholder="you@example.com"
                      {...field}
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
                  <FormControl className="">
                    <div className="relative">
                      <Input
                        className={cn(fieldState.error && "border-red-800!")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent!"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <EyeIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isLogin && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl className="">
                      <div className="relative">
                        <Input
                          className={cn(
                            fieldState.error && "border-destructive!"
                          )}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••"
                          {...field}
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button
              variant="brand"
              type="submit"
              className="w-full mt-5 hover:bg-brand-800/70! hover:border-brand-700!"
              disabled={isLoading}
              size={"sm"}
            >
              {isLoading && <Loader className=" h-4 w-4 animate-spin" />}

              {isLoading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          className="text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
          variant="ghost"
          onClick={toggleMode}
          disabled={isLoading}
        >
          {isLogin ? (
            <div>
              <span>Don't have an account? </span>
              <span className="font-medium text-white underline hover:opacity-90">
                Sign up
              </span>
            </div>
          ) : (
            <div>
              <span>Already have an account? </span>
              <span className="font-medium text-white underline hover:opacity-90">
                Sign in
              </span>
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
