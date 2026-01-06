import { convertToUIMessages } from "@/lib/utils";
import { cookies } from "next/headers";
import { getServerAuth } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { orpc } from "@/lib/orpc/client";
import { ChatPageView } from "@/components/chat/chat-page";
import { ChatNotfound } from "@/components/chat/chat-notfound";

const ChatPage = async (props: {
  params: Promise<{ id: string; chatId: string }>;
}) => {
  const params = await props.params;
  const chatId = params.chatId;

  console.log({ id: params.id, chatId });

  // 0- TODO:: handle the auth operation
  const user = await getServerAuth();
  if (!user) {
    return redirect("/auth");
  }

  // - Load all requried states from cookies
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  // 1- Load old Messages
  const res = await orpc.authed.chat.listMessages({
    chatId,
  });

  if (!res?.success) {
    return <ChatNotfound errorMessage={res?.message} />;
  }
  const uiMessages = convertToUIMessages(res?.messages);
  console.log({ uiMessages });

  return (
    <ChatPageView
      id={chatId}
      initialMessages={uiMessages}
      initialChatModel={chatModelFromCookie?.value!}
      autoResume={true}
    />
  );
};

export default ChatPage;
