"use client";
import { cn, generateUUID } from "@/lib/utils";
import { useState } from "react";
import { ChatPageView } from "@/components/chat/chat-page";
import { useSearchParams } from "next/navigation";

function NewChat() {
  const [id] = useState(() => generateUUID());

  return (
    <div className={cn(" h-full  rounded-2xl flex flex-col ")}>
      <ChatPageView isHome={true} id={id} autoResume={true} />
    </div>
  );
}

const HomeChatPage = () => {
  const searchParams = useSearchParams();
  const newKey = searchParams.get("new") ?? "default";

  return <NewChat key={newKey} />;
};

export default HomeChatPage;
