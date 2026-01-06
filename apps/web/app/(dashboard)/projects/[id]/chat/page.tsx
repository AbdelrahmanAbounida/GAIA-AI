"use client";
import { cn, generateUUID } from "@/lib/utils";
import { useState } from "react";
import { ChatPageView } from "@/components/chat/chat-page";
import { useParams } from "next/navigation";

const HomeChatPage = () => {
  const [id] = useState(() => generateUUID());

  return (
    <div className={cn(" h-full  rounded-2xl flex flex-col ")}>
      <ChatPageView isHome={true} id={id} autoResume={true} />
    </div>
  );
};

export default HomeChatPage;
