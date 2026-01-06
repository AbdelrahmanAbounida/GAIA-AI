import { AuthForm } from "@/components/auth-form";
import { getServerAuth } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import React from "react";

const LoginPage = async () => {
  const { user } = await getServerAuth();

  if (user) {
    return redirect("/chat");
  }
  return (
    <div className="flex h-screen  items-center justify-center bg-gaia-200 dark:bg-gaia-900">
      <AuthForm />
    </div>
  );
};

export default LoginPage;
