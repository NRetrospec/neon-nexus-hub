import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 animated-gradient" />
      <div className="absolute inset-0 cyber-grid opacity-20" />
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/30 rounded-full blur-[150px]" />

      <div className="relative container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-primary/30 backdrop-blur-sm mb-8">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-cyber text-muted-foreground">
              Join 50,000+ Gamers Today
            </span>
          </div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-gaming font-bold mb-6">
            <span className="text-foreground">READY TO </span>
            <span className="text-gradient neon-text">DOMINATE?</span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground font-cyber max-w-2xl mx-auto mb-10">
            Create your free account and start earning XP, completing quests, 
            and climbing the leaderboards. Your gaming legacy awaits.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="xl" className="group">
              <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground font-cyber text-sm">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Free to Join</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-neon-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Instant Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default CTASection;
