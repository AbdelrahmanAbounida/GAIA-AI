import { redirect } from "next/navigation";

export default function HomePage() {
  console.log("HomePage rendering - about to redirect");
  return redirect("/projects");
}
