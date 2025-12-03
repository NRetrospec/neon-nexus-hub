import { 
  Gamepad2, 
  Trophy, 
  Users, 
  Gift, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  Music 
} from "lucide-react";

const features = [
  {
    icon: Gamepad2,
    title: "Epic Quests",
    description: "Complete video-based quests and challenges to earn XP and exclusive rewards.",
    color: "neon-pink",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Compete against gamers worldwide and climb the ranks to prove your skills.",
    color: "neon-orange",
  },
  {
    icon: Users,
    title: "Social Feed",
    description: "Share your gaming moments, follow friends, and engage with the community.",
    color: "neon-blue",
  },
  {
    icon: Gift,
    title: "Prize Store",
    description: "Redeem your hard-earned points for exclusive gaming gear and rewards.",
    color: "neon-purple",
  },
  {
    icon: Zap,
    title: "XP System",
    description: "Level up through engagement, unlock badges, and showcase your achievements.",
    color: "neon-green",
  },
  {
    icon: MessageSquare,
    title: "Real-time Chat",
    description: "Connect with gamers instantly through direct messages and group chats.",
    color: "neon-pink",
  },
  {
    icon: BarChart3,
    title: "Polls & Voting",
    description: "Have your say in gaming topics and influence the community direction.",
    color: "neon-blue",
  },
  {
    icon: Music,
    title: "Music Integration",
    description: "Attach your favorite gaming tracks to your profile and share with friends.",
    color: "neon-purple",
  },
];

const FeaturesSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 animated-gradient opacity-50" />
      <div className="absolute inset-0 cyber-grid opacity-20" />

      <div className="relative container mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-gaming uppercase tracking-[0.3em] text-primary mb-4">
            Features
          </h2>
          <h3 className="text-4xl md:text-5xl font-gaming font-bold mb-6">
            <span className="text-foreground">POWER UP YOUR </span>
            <span className="text-gradient">EXPERIENCE</span>
          </h3>
          <p className="text-muted-foreground font-cyber text-lg max-w-2xl mx-auto">
            Everything you need to connect, compete, and conquer in one ultimate gaming platform.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="gaming-card group p-6 hover:cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="relative mb-6">
                <div className={`
                  w-14 h-14 rounded-xl flex items-center justify-center
                  bg-gradient-to-br from-primary/20 to-accent/20
                  border border-primary/30 group-hover:border-primary/60
                  transition-all duration-300 group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                `}>
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
              </div>

              {/* Content */}
              <h4 className="text-lg font-gaming font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h4>
              <p className="text-sm text-muted-foreground font-cyber leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect Line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
