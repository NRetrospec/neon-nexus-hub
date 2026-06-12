import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Home,
  Users,
  Gamepad2,
  CalendarDays,
  Clapperboard,
  ShoppingBag,
  LifeBuoy,
  User,
  Menu,
  X,
  Trophy,
} from "lucide-react";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { playUI } from "@/lib/sound";

/**
 * HoloSidebar — floating holographic navigation.
 * Desktop: fixed glass panel on the left with glowing active indicator.
 * Mobile: hamburger button + slide-out futuristic panel.
 *
 * Two modes:
 *  - Modal mode (Home dashboard): pass `onOpenSection` + `activeSection` and
 *    every item opens an in-place HoloModal — the user never leaves the hub.
 *  - Route mode (fallback): items navigate to their routes.
 */

export type SectionKey =
  | "home"
  | "community"
  | "games"
  | "events"
  | "media"
  | "rankings"
  | "shop"
  | "support";

const NAV_ITEMS: {
  label: string;
  icon: typeof Home;
  href: string;
  section: SectionKey;
}[] = [
  { label: "Home", icon: Home, href: "/home", section: "home" },
  { label: "Community", icon: Users, href: "/social", section: "community" },
  { label: "Games", icon: Gamepad2, href: "/quests", section: "games" },
  { label: "Events", icon: CalendarDays, href: "/polls", section: "events" },
  { label: "Media", icon: Clapperboard, href: "/podcast", section: "media" },
  { label: "Rankings", icon: Trophy, href: "/leaderboard", section: "rankings" },
  { label: "Shop", icon: ShoppingBag, href: "/prizes", section: "shop" },
  { label: "Support", icon: LifeBuoy, href: "/legal/terms", section: "support" },
];

const PTLogo = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="flex items-center gap-2.5 group px-1">
    <div className="relative">
      <span
        className="font-gaming font-black italic text-2xl text-primary"
        style={{
          textShadow:
            "0 0 14px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.4)",
        }}
      >
        PT
      </span>
      <span
        className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] text-primary"
        style={{ filter: "drop-shadow(0 0 4px hsl(var(--primary) / 0.8))" }}
      >
        ♛
      </span>
    </div>
    <span className="font-gaming font-bold text-xs tracking-widest text-foreground/90 group-hover:text-primary transition-colors">
      PHRESH
      <br />
      TEAMTV
    </span>
  </button>
);

interface NavListProps {
  onSelect: (item: (typeof NAV_ITEMS)[number]) => void;
  isActive: (item: (typeof NAV_ITEMS)[number]) => boolean;
  onProfileClick: () => void;
}

const NavList = ({ onSelect, isActive, onProfileClick }: NavListProps) => (
  <nav className="flex flex-col gap-1 mt-2">
    {NAV_ITEMS.map((item) => {
      const active = isActive(item);
      const Icon = item.icon;
      return (
        <button
          key={item.label}
          onClick={() => onSelect(item)}
          onMouseEnter={() => playUI("hover")}
          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-cyber font-medium text-sm tracking-wide transition-all duration-200 group ${
            active
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
          }`}
        >
          {active && (
            <motion.span
              layoutId="nav-glow"
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary"
              style={{ boxShadow: "0 0 12px hsl(var(--primary))" }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            />
          )}
          <Icon
            className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
              active ? "drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]" : ""
            }`}
          />
          {item.label}
        </button>
      );
    })}
    <button
      onClick={onProfileClick}
      onMouseEnter={() => playUI("hover")}
      className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg font-cyber font-medium text-sm tracking-wide text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all duration-200 group"
    >
      <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
      Profile
    </button>
  </nav>
);

const UserCard = () => {
  const { user } = useUser();
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  return (
    <div className="mt-auto pt-4 border-t border-border/50">
      <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors">
        <UserButton
          appearance={{
            elements: { avatarBox: "w-9 h-9 ring-2 ring-primary/40" },
          }}
        />
        <div className="min-w-0">
          <p className="font-cyber font-semibold text-sm text-foreground truncate">
            {dbUser?.username || user?.firstName || "Player"}
          </p>
          <p className="font-cyber text-xs text-primary">
            Level {dbUser?.level ?? 1}
          </p>
        </div>
        <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" 
          style={{ boxShadow: "0 0 6px hsl(var(--primary))" }} />
      </div>
    </div>
  );
};

interface HoloSidebarProps {
  /** Modal mode: open a section as an in-place modal instead of navigating. */
  onOpenSection?: (section: SectionKey) => void;
  /** Modal mode: which section is currently open ("home" = none). */
  activeSection?: SectionKey;
}

const HoloSidebar = ({ onOpenSection, activeSection }: HoloSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const modalMode = typeof onOpenSection === "function";

  const handleSelect = (item: (typeof NAV_ITEMS)[number]) => {
    playUI("select");
    setMobileOpen(false);
    if (modalMode) {
      onOpenSection!(item.section);
    } else {
      navigate(item.href);
    }
  };

  const isActive = (item: (typeof NAV_ITEMS)[number]) =>
    modalMode
      ? (activeSection ?? "home") === item.section
      : location.pathname === item.href;

  const goHome = () => {
    playUI("select");
    setMobileOpen(false);
    if (modalMode) {
      onOpenSection!("home");
    } else {
      navigate("/home");
    }
  };

  const openProfile = () => {
    playUI("select");
    setMobileOpen(false);
    setProfileModalOpen(true);
  };

  return (
    <>
      {/* ===== Desktop: floating holographic panel ===== */}
      <motion.aside
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex fixed left-4 top-4 bottom-4 w-56 z-40 flex-col p-4 rounded-2xl"
        style={{
          background:
            "linear-gradient(165deg, hsl(250 28% 9% / 0.85) 0%, hsl(252 32% 5% / 0.9) 100%)",
          backdropFilter: "blur(18px)",
          border: "1px solid hsl(var(--primary) / 0.14)",
          boxShadow:
            "0 0 40px hsl(250 35% 2% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.05), 0 0 24px hsl(var(--primary) / 0.05)",
        }}
      >
        <PTLogo onClick={goHome} />
        <NavList
          onSelect={handleSelect}
          isActive={isActive}
          onProfileClick={openProfile}
        />
        <UserCard />
      </motion.aside>

      {/* ===== Mobile: hamburger + slide-out panel ===== */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2.5 rounded-xl text-foreground"
          style={{
            background: "hsl(250 28% 9% / 0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid hsl(var(--primary) / 0.2)",
            boxShadow: "0 0 16px hsl(var(--primary) / 0.1)",
          }}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 text-primary" />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col p-5"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              style={{
                background:
                  "linear-gradient(165deg, hsl(250 28% 8% / 0.97) 0%, hsl(252 32% 4% / 0.99) 100%)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid hsl(var(--primary) / 0.18)",
                boxShadow: "0 0 60px hsl(var(--primary) / 0.12)",
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <PTLogo onClick={goHome} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavList
                onSelect={handleSelect}
                isActive={isActive}
                onProfileClick={openProfile}
              />
              <UserCard />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </>
  );
};

export default HoloSidebar;
