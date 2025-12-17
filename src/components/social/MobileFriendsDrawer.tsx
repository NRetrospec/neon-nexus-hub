import { useState } from "react";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle } from "lucide-react";
import { FriendsPanel } from "./FriendsPanel";
import { ChatBox } from "./ChatBox";

interface MobileFriendsDrawerProps {
  currentUserId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MobileFriendsDrawer = ({
  currentUserId,
  open,
  onOpenChange,
}: MobileFriendsDrawerProps) => {
  const [activeChatRoom, setActiveChatRoom] = useState<Id<"chatRooms"> | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[90vw] sm:w-[400px] p-0 gaming-card">
        <SheetHeader className="p-4 sm:p-6 border-b border-border">
          <SheetTitle className="font-gaming text-gradient flex items-center gap-2">
            {activeChatRoom ? (
              <>
                <MessageCircle className="h-5 w-5" />
                CHAT
              </>
            ) : (
              <>
                <Users className="h-5 w-5" />
                FRIENDS
              </>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="h-[calc(100vh-5rem)] overflow-y-auto p-4 sm:p-6">
          {activeChatRoom ? (
            <ChatBox
              roomId={activeChatRoom}
              currentUserId={currentUserId}
              onClose={() => setActiveChatRoom(null)}
            />
          ) : (
            <FriendsPanel
              currentUserId={currentUserId}
              onStartChat={(roomId) => setActiveChatRoom(roomId)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
