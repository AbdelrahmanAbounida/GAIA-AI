import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { FlagIcon, Loader } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { SidebarMenuButton, useSidebar } from "../ui/sidebar";
import { showErrorToast, showSuccessToast } from "../ui/toast";
import { orpc } from "@/lib/orpc/client";

function FeedbackModal({ children }: { children?: React.ReactNode }) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>("");
  const [feedbackError, setfeedbackError] = useState(false);
  const [submitLoading, setsubmitLoading] = useState(false);

  const [openDialog, setopenDialog] = useState(false);

  const handleSubmit = async () => {
    if (feedback?.length! < 3) {
      showErrorToast({
        title: "Failed to submit feedback",
        position: "bottom-right",
        description: "Feedback cannot be less than 3 characters",
      });
      setfeedbackError(true);
      return;
    } else {
      setfeedbackError(false);
    }

    if (!rating) {
      showErrorToast({
        title: "Failed to submit feedback",
        position: "bottom-right",
        description: "Please select a rating",
      });

      return;
    }
    try {
      setsubmitLoading(true);
      const res = await orpc.authed.feedback.createFeedback({
        content: feedback!,
        stars: rating!,
      });

      if (!res?.success) {
        showErrorToast({
          title: "Failed to submit feedback",
          position: "bottom-right",
          description: res?.message || "Something went wrong",
        });
        return;
      }

      if (res?.success) {
        showSuccessToast({
          title: "Feedback submitted successfully",
          position: "bottom-right",
          description: "Thank you for your feedback 😃",
        });
        setopenDialog(false);
      }
    } catch (e: any) {
      console.log(e);
      showErrorToast({
        title: "Failed to submit feedback",
        position: "top-right",
        description: e?.message || "Something went wrong",
      });
    } finally {
      setsubmitLoading(false);
    }
  };

  useEffect(() => {
    if (!openDialog) {
      setRating(null);
      setFeedback(null);
      setfeedbackError(false);
    }
  }, [openDialog]);

  useCallback(() => {}, [openDialog]);

  useMemo(() => {}, [openDialog]);

  const { state } = useSidebar();

  return (
    <Dialog open={openDialog} onOpenChange={setopenDialog}>
      <Tooltip>
        {children ? (
          <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <SidebarMenuButton
              tooltip={"Feedback"}
              asChild
              className="cursor-pointer ml-2"
            >
              <FlagIcon className="mr-1 ml-0 w-4.5! h-4.5!" />
            </SidebarMenuButton>
          </DialogTrigger>
        )}

        <TooltipContent
          hidden={state === "expanded"}
          side="right"
          align="center"
        >
          Feedback
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-2xl  ">
        <DialogHeader>
          <DialogTitle>Leave Feedback</DialogTitle>
          <DialogDescription>
            {`We'd love to hear what went well or how we can improve the product
            experience.`}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={feedback || ""}
          onChange={(e) => {
            setfeedbackError(false);
            setFeedback(e.target.value);
          }}
          name="feedback"
          placeholder="Your feedback"
          rows={8}
          className={cn(
            "resize-none bg-gaia-200  border-gaia-400 shadow-none",
            feedbackError && "border! border-red-500!"
          )}
        />

        <DialogFooter>
          {/* <Button type="submit">Save changes</Button> */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full">
            <div className="flex w-full items-center justify-start gap-2">
              <StarRating rating={rating!} setRating={setRating} />
              <div></div>
            </div>
            <div
              className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end p-0 md:p-0"
              modal-footer=""
            >
              <DialogClose asChild className="">
                <Button
                  type="button"
                  variant="outline"
                  size={"tiny"}
                  className="h-7"
                >
                  Cancel
                </Button>
              </DialogClose>

              {submitLoading ? (
                <Button className="" size={"tiny"} disabled variant={"brand"}>
                  <Loader className="animate-spin " size={14} />
                  Loading...
                </Button>
              ) : (
                <Button
                  variant={"brand"}
                  size={"tiny"}
                  className="px-7"
                  onClick={handleSubmit}
                  type="submit"
                >
                  Submit
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default FeedbackModal;

const StarRating = ({
  rating,
  setRating,
}: {
  rating: number;
  setRating: any;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const handleClick = (value: number) => {
    setRating(value);
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className={`text-2xl cursor-pointer ${
            (rating && rating >= star) || (hovered && hovered >= star)
              ? "text-green-700"
              : "text-gray-300"
          } 
          `}
        >
          &#9733;
          {/* <StarFilledIcon width={24} height={24} /> */}
        </span>
      ))}
    </div>
  );
};
