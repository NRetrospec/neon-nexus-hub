import { Button } from "@/components/ui/button";
import { Gamepad2, Users, Trophy, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SignUpButton } from "@clerk/clerk-react";

const HeroSection = () => {
  const navigate = useNavigate();
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

      {/* Stats - Left Side */}
      <div className="absolute left-16 md:left-32 top-1/2 -translate-y-1/2 z-20">
        <div className="grid grid-cols-1 gap-6 opacity-0 animate-slide-up stagger-4">
          {[
            {
              image: "/Q - 16-12-2025 19-14-22321564185.png",
              name: "Que",
              description: "Steamer"
            },
            {
              image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=300&fit=crop",
              name: "Quests Completed",
              description: "Challenge yourself daily"
            },
            {
              image: "https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=400&h=300&fit=crop",
              name: "Daily Rewards",
              description: "Earn exclusive prizes"
            },
          ].map((item, index) => (
            <div
              key={index}
              className="relative group cursor-pointer"
            >
              {/* Circle Container */}
              <div className="w-30 h-30 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-primary/30 shadow-lg shadow-primary/20 transition-all duration-500 group-hover:border-primary group-hover:shadow-primary/60 group-hover:shadow-2xl group-hover:scale-110">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
              </div>

              {/* Text Appears to the Right on Hover */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 pointer-events-none whitespace-nowrap">
                <div className="relative bg-gradient-to-r from-primary/95 via-primary/90 to-primary/70 backdrop-blur-md rounded-lg px-4 py-2.5 shadow-lg shadow-primary/40 border border-primary/50">
                  {/* Connecting Glow */}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-3 h-[2px] bg-gradient-to-l from-primary to-transparent"></div>

                  <h3 className="text-sm md:text-base font-gaming font-bold text-white mb-0.5">
                    {item.name}
                  </h3>
                  <p className="text-[10px] md:text-xs text-white/80 font-cyber">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-slide-up stagger-3">
            <SignUpButton mode="modal">
              <Button variant="hero" size="xl">
                <Zap className="mr-2 h-5 w-5" />
                Join The Team
              </Button>
            </SignUpButton>
            <Button
              variant="outline"
              size="xl"
              className="font-gaming"
              onClick={() => navigate("/features")}
            >
              <Gamepad2 className="mr-2 h-5 w-5" />
              Explore Features
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
