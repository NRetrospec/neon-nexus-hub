import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ProfileContent } from "./ProfileContent";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileModal = ({ open, onOpenChange }: ProfileModalProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const content = (
    <>
      {isMobile ? (
        <SheetHeader className="pb-4">
          <SheetTitle className="text-2xl font-gaming text-gradient">
            YOUR PROFILE
          </SheetTitle>
        </SheetHeader>
      ) : (
        <DialogHeader>
          <DialogTitle className="text-2xl font-gaming text-gradient">
            YOUR PROFILE
          </DialogTitle>
        </DialogHeader>
      )}
      <ProfileContent onClose={() => onOpenChange(false)} />
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-[95vw] sm:w-[90vw] p-4 sm:p-6 overflow-y-auto gaming-card"
        >
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto gaming-card hover:!translate-y-[-50%] p-4 sm:p-6">
        {content}
      </DialogContent>
    </Dialog>
  );
};
