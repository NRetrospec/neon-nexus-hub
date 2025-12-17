import {
  Gift,
  Trophy,
  Zap,
  Star,
  Crown,
  Gamepad2,
  ShoppingCart,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignUpButton } from "@clerk/clerk-react";

const prizes = [
  {
    icon: "🎮",
    title: "Gaming Gear",
    description: "Premium controllers, headsets, and accessories from top brands.",
    color: "neon-pink",
  },
  {
    icon: "🎁",
    title: "Gift Cards",
    description: "Steam, PlayStation, Xbox, and Nintendo gift cards up to $100.",
    color: "neon-blue",
  },
  {
    icon: "👕",
    title: "Exclusive Merch",
    description: "Limited edition gaming apparel and collectibles.",
    color: "neon-purple",
  },
  {
    icon: "💎",
    title: "Digital Perks",
    description: "In-game items, skins, battle passes, and premium content.",
    color: "neon-orange",
  },
  {
    icon: "🎯",
    title: "Game Bundles",
    description: "AAA game bundles and indie game collections.",
    color: "neon-green",
  },
  {
    icon: "⭐",
    title: "Subscriptions",
    description: "Game Pass, PS Plus, Nintendo Online premium subscriptions.",
    color: "neon-pink",
  },
];

const howItWorks = [
  {
    icon: Gamepad2,
    title: "Complete Quests",
    description: "Finish video-based challenges and earn XP points.",
    step: "01",
  },
  {
    icon: Trophy,
    title: "Climb Leaderboards",
    description: "Compete with others and earn bonus points for ranking.",
    step: "02",
  },
  {
    icon: ShoppingCart,
    title: "Redeem Rewards",
    description: "Use your points to claim awesome prizes.",
    step: "03",
  },
];

const PrizesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient opacity-50" />
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="relative container mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
            <Gift className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-gaming text-primary uppercase tracking-wider">REWARDS STORE</span>
          </div>
          <h3 className="text-4xl md:text-5xl font-gaming font-bold mb-6">
            <span className="text-foreground">EPIC </span>
            <span className="text-gradient">REWARDS</span>
            <span className="text-foreground"> AWAIT</span>
          </h3>
          <p className="text-muted-foreground font-cyber text-lg max-w-2xl mx-auto">
            Earn points through quests and leaderboards, then redeem them for real gaming gear, gift cards, and exclusive perks.
          </p>
        </div>

        {/* Prizes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {prizes.map((prize, index) => (
            <div
              key={index}
              className="gaming-card group p-6 hover:cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 group-hover:border-primary/60 transition-all duration-300 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                  <span className="text-4xl">{prize.icon}</span>
                </div>
              </div>

              {/* Content */}
              <h4 className="text-lg font-gaming font-semibold text-foreground mb-2 text-center group-hover:text-primary transition-colors">
                {prize.title}
              </h4>
              <p className="text-sm text-muted-foreground font-cyber leading-relaxed text-center">
                {prize.description}
              </p>

              {/* Hover Effect Line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="gaming-card p-8 md:p-12 mb-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-4xl font-gaming font-bold mb-4">
              <span className="text-gradient">How It Works</span>
            </h3>
            <p className="text-muted-foreground font-cyber">
              Three simple steps to start earning and redeeming prizes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 text-6xl font-gaming font-bold text-primary/10">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="relative mb-6 z-10">
                  <div className="w-16 h-16 mx-auto rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-xl font-gaming font-semibold text-foreground mb-2 text-center">
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground font-cyber text-center">
                  {step.description}
                </p>

                {/* Connector Arrow */}
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 text-primary/30">
                    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 15H25M25 15L18 8M25 15L18 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Featured Prizes Showcase */}
        <div className="gaming-card p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/30">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-xs font-gaming text-primary uppercase">VIP REWARDS</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-gaming font-bold">
                <span className="text-gradient">Exclusive High-Tier Prizes</span>
              </h3>
              <p className="text-muted-foreground font-cyber text-lg">
                Top performers unlock access to premium gaming setups, high-value gift cards, and rare collectibles. The more you play, the better the rewards!
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <span className="font-cyber text-sm">100+ Prizes Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <span className="font-cyber text-sm">New Items Weekly</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-cyber text-sm">Limited Editions</span>
                </div>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="gaming-card p-4 text-center">
                <div className="text-4xl mb-2">🎮</div>
                <div className="text-sm font-cyber text-muted-foreground">Gaming Gear</div>
              </div>
              <div className="gaming-card p-4 text-center">
                <div className="text-4xl mb-2">🎁</div>
                <div className="text-sm font-cyber text-muted-foreground">Gift Cards</div>
              </div>
              <div className="gaming-card p-4 text-center">
                <div className="text-4xl mb-2">💎</div>
                <div className="text-sm font-cyber text-muted-foreground">Digital Perks</div>
              </div>
              <div className="gaming-card p-4 text-center">
                <div className="text-4xl mb-2">👕</div>
                <div className="text-sm font-cyber text-muted-foreground">Merch</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <SignUpButton mode="modal">
            <Button variant="neon" size="lg" className="font-gaming text-lg px-8">
              <Gift className="h-5 w-5 mr-2" />
              Start Earning Prizes
            </Button>
          </SignUpButton>
          <p className="text-sm text-muted-foreground font-cyber mt-4">
            Sign up now and get bonus starter points
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrizesSection;
