import { Button } from "@/components/ui/button";
import { Play, Clock, Coins, Star, ChevronRight } from "lucide-react";

const quests = [
  {
    id: 1,
    title: "Speed Run Challenge",
    description: "Complete the tutorial level in under 2 minutes",
    reward: 500,
    xp: 150,
    duration: "15 min",
    difficulty: "Easy",
    progress: 75,
    thumbnail: "🎮",
  },
  {
    id: 2,
    title: "Social Butterfly",
    description: "Follow 10 new gamers and engage with their posts",
    reward: 750,
    xp: 200,
    duration: "30 min",
    difficulty: "Medium",
    progress: 40,
    thumbnail: "🦋",
  },
  {
    id: 3,
    title: "Content Creator",
    description: "Share 5 gaming moments with the community",
    reward: 1000,
    xp: 300,
    duration: "1 hour",
    difficulty: "Hard",
    progress: 20,
    thumbnail: "📸",
  },
];

const QuestsSection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[150px] -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[150px] -translate-y-1/2" />

      <div className="relative container mx-auto px-4 z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div>
            <h2 className="text-xs sm:text-sm font-gaming uppercase tracking-[0.3em] text-primary mb-4">
              Daily Quests
            </h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-gaming font-bold mb-6">
              <span className="text-foreground">COMPLETE QUESTS.</span>
              <br />
              <span className="text-gradient">EARN REWARDS.</span>
            </h3>
            <p className="text-muted-foreground font-cyber text-sm sm:text-base md:text-lg mb-8">
              Take on daily challenges, complete video-based quests, and earn points
              to unlock exclusive rewards in our prize store. Every quest brings you
              closer to legendary status.
            </p>

            {/* Quest Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
              {[
                { value: "100+", label: "Active Quests" },
                { value: "50K", label: "Points Available" },
                { value: "24h", label: "New Quests" },
              ].map((stat, index) => (
                <div key={index} className="text-center p-3 sm:p-4 rounded-xl bg-card/50 border border-border">
                  <div className="text-lg sm:text-2xl font-gaming font-bold text-primary">{stat.value}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground font-cyber">{stat.label}</div>
                </div>
              ))}
            </div>

            <Button variant="cyber" size="lg">
              View All Quests
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Right - Quest Cards */}
          <div className="space-y-4">
            {quests.map((quest, index) => (
              <div
                key={quest.id}
                className="gaming-card p-4 sm:p-5 flex gap-3 sm:gap-4 items-center group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center text-2xl sm:text-3xl shrink-0 group-hover:scale-110 transition-transform">
                  {quest.thumbnail}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-gaming font-semibold text-foreground truncate text-sm sm:text-base">
                      {quest.title}
                    </h4>
                    <span className={`
                      text-xs px-2 py-0.5 rounded font-cyber
                      ${quest.difficulty === 'Easy' ? 'bg-neon-green/20 text-neon-green' : ''}
                      ${quest.difficulty === 'Medium' ? 'bg-neon-orange/20 text-neon-orange' : ''}
                      ${quest.difficulty === 'Hard' ? 'bg-destructive/20 text-destructive' : ''}
                    `}>
                      {quest.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-cyber truncate mb-2">
                    {quest.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="xp-bar mb-2">
                    <div className="xp-bar-fill" style={{ width: `${quest.progress}%` }} />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground font-cyber">
                    <span className="flex items-center gap-1">
                      <Coins className="h-3 w-3 text-primary" />
                      {quest.reward} pts
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-accent" />
                      {quest.xp} XP
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {quest.duration}
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <Button variant="neon" size="icon" className="shrink-0">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuestsSection;
