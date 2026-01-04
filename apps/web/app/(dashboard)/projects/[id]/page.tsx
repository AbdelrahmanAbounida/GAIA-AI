import { orpc } from "@/lib/orpc/client";
import { redirect } from "next/navigation";

const ProjectPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const projectExist = await orpc.authed.project.get({
    projectId: id,
  });
  if (!projectExist) {
    return redirect("/projects?error=project-not-found");
  }
  return redirect(`/projects/${id}/chat`);
};

export default ProjectPage;
