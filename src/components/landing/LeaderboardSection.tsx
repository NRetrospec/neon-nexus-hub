import { Button } from "@/components/ui/button";
import { Crown, Medal, TrendingUp, ChevronRight } from "lucide-react";

const topPlayers = [
  { rank: 1, name: "ShadowStrike", xp: 125000, avatar: "🦊", badge: "👑", trend: "+12" },
  { rank: 2, name: "NeonBlade", xp: 118500, avatar: "🐺", badge: "⚔️", trend: "+8" },
  { rank: 3, name: "CyberPhantom", xp: 112000, avatar: "🦅", badge: "🔥", trend: "+15" },
  { rank: 4, name: "PixelQueen", xp: 98700, avatar: "🦋", badge: "💎", trend: "+5" },
  { rank: 5, name: "GlitchMaster", xp: 95200, avatar: "🐉", badge: "⚡", trend: "+3" },
];

const LeaderboardSection = () => {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "rank-gold";
      case 2:
        return "rank-silver";
      case 3:
        return "rank-bronze";
      default:
        return "text-muted-foreground";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-lg font-gaming">{rank}</span>;
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      <div className="absolute inset-0 cyber-grid opacity-10" />

      <div className="relative container mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-sm font-gaming uppercase tracking-[0.3em] text-primary mb-4">
            Leaderboard
          </h2>
          <h3 className="text-4xl md:text-5xl font-gaming font-bold mb-6">
            <span className="text-foreground">TOP </span>
            <span className="text-gradient">PLAYERS</span>
          </h3>
          <p className="text-muted-foreground font-cyber text-lg max-w-2xl mx-auto">
            Rise through the ranks and claim your spot among the elite.
            Every point counts towards legendary status.
          </p>
        </div>

        {/* Leaderboard Card */}
        <div className="max-w-3xl mx-auto">
          <div className="gaming-card overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="font-gaming text-sm uppercase tracking-wider">
                    Weekly Rankings
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-cyber">
                  Updates in 3h 24m
                </span>
              </div>
            </div>

            {/* Players List */}
            <div className="divide-y divide-border">
              {topPlayers.map((player, index) => (
                <div
                  key={player.rank}
                  className={`
                    flex items-center gap-4 px-6 py-4 transition-all duration-300
                    hover:bg-primary/5 group cursor-pointer
                    ${player.rank === 1 ? 'bg-gradient-to-r from-yellow-500/5 to-transparent' : ''}
                  `}
                >
                  {/* Rank */}
                  <div className={`w-10 text-center ${getRankStyle(player.rank)}`}>
                    {getRankIcon(player.rank)}
                  </div>

                  {/* Avatar */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                    bg-gradient-to-br from-primary/20 to-accent/20 border border-border
                    group-hover:border-primary/50 transition-colors
                    ${player.rank === 1 ? 'neon-border' : ''}
                  `}>
                    {player.avatar}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-gaming font-semibold text-foreground">
                        {player.name}
                      </span>
                      <span className="text-lg">{player.badge}</span>
                    </div>
                    <div className="text-sm text-muted-foreground font-cyber">
                      Level {Math.floor(player.xp / 1000)}
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="font-gaming font-bold text-primary">
                      {player.xp.toLocaleString()} XP
                    </div>
                    <div className="text-xs text-neon-green font-cyber flex items-center justify-end gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {player.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-card/50 border-t border-border">
              <Button variant="glow" className="w-full font-gaming">
                View Full Leaderboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
