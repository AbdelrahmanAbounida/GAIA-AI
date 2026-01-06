import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
  newlyCreatedKey: string | null;
}

export function CreateKeyModal({
  open,
  onOpenChange,
  onCreate,
  newlyCreatedKey,
}: CreateKeyDialogProps) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
    }
  };

  const handleCopy = async () => {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setName("");
    setCopied(false);
    setShowKey(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn("sm:max-w-lg p-0", newlyCreatedKey && "max-w-lg! p-3")}
        onInteractOutside={(e) => {
          if (newlyCreatedKey) e.preventDefault();
        }}
      >
        <DialogHeader className="p-5">
          <DialogTitle>
            {newlyCreatedKey ? "API Key Created" : "Create New API Key"}
          </DialogTitle>
          <DialogDescription>
            {newlyCreatedKey ? (
              <span>
                {
                  "Make sure to copy your API key now. You won't be able to see it again!"
                }
              </span>
            ) : (
              <span className="text-sm">
                {
                  "API Key created successfully! Please save this key somewhere safe, and make sure it is only accessible by you."
                }
                <span className="font-semibold  dark:text-white">
                  {"You won't be able to view this key again. "}
                </span>
                once you close this dialog for security reasons.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {newlyCreatedKey ? (
          <div className="space-y-4">
            <div className="space-y-2 px-4">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    value={showKey ? newlyCreatedKey : "•".repeat(40)}
                    className="font-mono pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowKey(!showKey)}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-11 h-9.5"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter className="border-t my-3 pt-3 pr-3">
              <Button
                onClick={handleClose}
                className="px-9"
                variant={"brand"}
                size={"sm"}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 px-4 pb-4">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API, Development"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <DialogFooter className="pr-2 border-t pt-5 pb-3">
              <Button size={"sm"} variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant={"brand"}
                size={"sm"}
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Create Key
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
