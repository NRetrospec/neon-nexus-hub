import { Button } from "@/components/ui/button";
import { Gamepad2, Users, Trophy, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/videos/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Video Overlay */}
        <div className="absolute inset-0 video-overlay" />
      </div>

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 cyber-grid opacity-30 z-10" />

      {/* Floating Particles */}
      <div className="particles z-10">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm mb-8 opacity-0 animate-slide-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-cyber text-muted-foreground">
              The Ultimate Gaming Social Platform
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-gaming font-bold mb-6 opacity-0 animate-slide-up stagger-1">
            <span className="text-foreground">LEVEL UP</span>
            <br />
            <span className="text-gradient neon-text">YOUR GAME</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground font-cyber max-w-2xl mx-auto mb-10 opacity-0 animate-slide-up stagger-2">
            Connect with gamers worldwide. Complete quests. Earn rewards.
            Dominate the leaderboards. Your gaming journey starts here.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 opacity-0 animate-slide-up stagger-3">
            <Button variant="hero" size="xl">
              <Zap className="mr-2 h-5 w-5" />
              Start Your Journey
            </Button>
            <Button variant="outline" size="xl" className="font-gaming">
              <Gamepad2 className="mr-2 h-5 w-5" />
              Explore Features
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 opacity-0 animate-slide-up stagger-4">
            {[
              { icon: Users, value: "50K+", label: "Active Gamers" },
              { icon: Trophy, value: "10K+", label: "Quests Completed" },
              { icon: Gamepad2, value: "500+", label: "Daily Rewards" },
              { icon: Zap, value: "1M+", label: "XP Earned" },
            ].map((stat, index) => (
              <div
                key={index}
                className="gaming-card p-4 md:p-6 backdrop-blur-sm"
              >
                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-gaming font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-cyber">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 opacity-0 animate-slide-up stagger-5">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-muted-foreground font-cyber uppercase tracking-widest">
            Scroll to Explore
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-primary/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
