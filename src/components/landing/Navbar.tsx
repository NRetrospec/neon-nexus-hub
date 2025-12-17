import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Gamepad2, Menu, X } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { ProfileModal } from "@/components/profile/ProfileModal";

const publicNavLinks = [
  { label: "Features", href: "/features" },
  { label: "Discover", href: "/discover" },
  { label: "Rankings", href: "/rankings" },
  { label: "Prizes", href: "/prizes" },
];

const authenticatedNavLinks = [
  { label: "Quests", href: "/quests" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Social", href: "/social" },
  { label: "Prizes", href: "/prizes" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-b border-border/50" />

      <div className="relative container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button onClick={() => navigate(isSignedIn ? "/home" : "/")} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-shadow">
              <Gamepad2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-gaming font-bold text-xl text-foreground hidden sm:block">
              PHRESH<span className="text-primary">TEAM</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {(isSignedIn ? authenticatedNavLinks : publicNavLinks).map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.href)}
                className="font-cyber text-sm text-muted-foreground hover:text-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <div className="relative group cursor-pointer">
                  <img
                    src="/PHRESHTEAMLOGO.png"
                    alt="Sign In"
                    className="h-8 w-8 rounded-lg transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.8)] group-hover:scale-110"
                  />
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-background/90 text-primary text-xs font-cyber px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Sign In
                  </span>
                </div>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button variant="neon" size="sm">
                  Get Started
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProfileModalOpen(true)}
                className="font-cyber"
              >
                Profile
              </Button>
              <Button
                variant="cyber"
                size="sm"
                onClick={() => navigate("/home")}
                className="font-cyber"
              >
                Dashboard
              </Button>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-9 h-9 rounded-xl border-2 border-primary/30 hover:border-primary/60 transition-colors shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                  }
                }}
              />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border p-4 animate-slide-up">
            <div className="flex flex-col gap-4">
              {(isSignedIn ? authenticatedNavLinks : publicNavLinks).map((link) => (
                <button
                  key={link.label}
                  onClick={() => {
                    navigate(link.href);
                    setIsOpen(false);
                  }}
                  className="font-cyber text-muted-foreground hover:text-primary transition-colors py-2 text-left"
                >
                  {link.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="font-cyber justify-start">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button variant="neon">Get Started</Button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProfileModalOpen(true);
                      setIsOpen(false);
                    }}
                    className="font-cyber justify-start"
                  >
                    Profile
                  </Button>
                  <Button
                    variant="cyber"
                    onClick={() => {
                      navigate("/home");
                      setIsOpen(false);
                    }}
                    className="font-cyber justify-start"
                  >
                    Dashboard
                  </Button>
                  <div className="flex items-center gap-3 pt-2">
                    <UserButton
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10 rounded-xl border-2 border-primary/30"
                        }
                      }}
                    />
                    <span className="text-sm text-muted-foreground font-cyber">My Account</span>
                  </div>
                </SignedIn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </nav>
  );
};

export default Navbar;
