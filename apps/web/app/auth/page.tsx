import { AuthForm } from "@/components/auth/auth-form";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getServerAuth } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

const LoginPage = async () => {
  const { user } = await getServerAuth();

  if (user) {
    return redirect("/");
  }
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gaia-200 dark:bg-gaia-900">
      <div className="w-full pr-4 pt-4 flex items-center justify-end">
        <ThemeSwitcher withIcon={false} />
      </div>
      <AuthForm />
    </div>
  );
};

export default LoginPage;
