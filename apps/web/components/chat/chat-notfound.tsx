"use client";
import { useParams, useRouter } from "next/navigation";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { showErrorToast } from "../ui/toast";
import { XCircleIcon } from "lucide-react";

export const ChatNotfound = ({ errorMessage }: { errorMessage?: string }) => {
  const { id: projectId } = useParams<{ id: string }>();
  const [routeLoading, setrouteLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (errorMessage) {
      showErrorToast({
        title: "Error",
        description: errorMessage || "Something went wrong",
        position: "top-right",
      });
    }
  }, [errorMessage]);
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Empty className="h-full w-full">
        <EmptyHeader className="max-w-125">
          <EmptyMedia
            variant="icon"
            className="bg-background! hover:bg-background!"
          >
            <div className="flex items-center ">
              {/* <Image src={LogoImage} alt="gaia" width={100} height={100} /> */}
              <XCircleIcon className="text-destructive" />
            </div>
          </EmptyMedia>
          <EmptyTitle className="text-[20px]">
            {"Can’t open this chat"}
          </EmptyTitle>
          <EmptyDescription className="w-full text-[16px]">
            It may have been deleted or Chat might not exist
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            disabled={routeLoading}
            onClick={() => {
              setrouteLoading(true);
              router.push(`/projects/${projectId}/chat`);
            }}
            size={"sm"}
            variant={"brand"}
          >
            Start a new chat
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
};
