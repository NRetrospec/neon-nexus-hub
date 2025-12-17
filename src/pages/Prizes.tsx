import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Package,
  Star,
  Zap,
  Check,
  X,
  Sparkles,
  TrendingUp,
  Gift,
  Crown,
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PrizesSection from "@/components/landing/PrizesSection";
import { useToast } from "@/hooks/use-toast";
import { Id } from "../../convex/_generated/dataModel";

interface Prize {
  _id: Id<"prizes">;
  name: string;
  description: string;
  image: string;
  pointCost: number;
  category: string;
  stock: number;
  isAvailable: boolean;
  featured?: boolean;
}

const Prizes = () => {
  const { user, isSignedIn } = useUser();
  const { toast } = useToast();
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Only fetch data if user is signed in
  const prizes = useQuery(
    api.prizes.getAllPrizes,
    isSignedIn ? {} : "skip"
  );
  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user && isSignedIn ? { clerkId: user.id } : "skip"
  );
  const userStats = useQuery(
    api.users.getUserStats,
    dbUser ? { userId: dbUser._id } : "skip"
  );
  const redeemPrize = useMutation(api.prizes.redeemPrize);

  const categories = ["All", "Gaming Gear", "Gift Cards", "Digital Perks", "Bundles", "Subscriptions"];

  const filteredPrizes = prizes
    ? selectedCategory === "All"
      ? prizes
      : prizes.filter((p) => p.category === selectedCategory)
    : [];

  const handleRedeemClick = (prize: Prize) => {
    if (!isSignedIn) {
      toast({
        title: "Sign in required",
        description: "Please sign in to redeem prizes",
        variant: "destructive",
      });
      return;
    }

    if (!userStats || userStats.points < prize.pointCost) {
      toast({
        title: "Insufficient points",
        description: `You need ${prize.pointCost} points to redeem this item`,
        variant: "destructive",
      });
      return;
    }

    setSelectedPrize(prize);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedPrize || !dbUser) return;

    setIsRedeeming(true);
    try {
      await redeemPrize({
        userId: dbUser._id,
        prizeId: selectedPrize._id,
      });

      toast({
        title: "Success!",
        description: `${selectedPrize.name} redeemed successfully!`,
      });

      setSelectedPrize(null);
    } catch (error: any) {
      toast({
        title: "Redemption failed",
        description: error.message || "Failed to redeem prize",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  // Show marketing page for logged-out users
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16">
          <PrizesSection />
        </main>
        <Footer />
      </div>
    );
  }

  // Show e-commerce page for logged-in users
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        {/* Background Effects */}
        <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
        <div className="fixed inset-0 cyber-grid opacity-5 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
            >
              <ShoppingCart className="h-5 w-5 text-primary animate-pulse" />
              <span className="text-sm font-gaming text-primary">REWARDS STORE</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-gaming font-bold mb-4">
              <span className="text-gradient">Prize Shop</span>
            </h1>
            <p className="text-muted-foreground font-cyber text-lg max-w-2xl mx-auto">
              Redeem your hard-earned points for exclusive rewards and gaming gear
            </p>

            {/* User Points Display */}
            {isSignedIn && userStats && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
              >
                <Zap className="h-6 w-6 text-primary" />
                <div className="text-left">
                  <div className="text-sm text-muted-foreground font-cyber">Your Balance</div>
                  <div className="text-2xl font-gaming font-bold text-primary">
                    {userStats.points.toLocaleString()} pts
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Category Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "cyber" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="font-cyber"
              >
                {category}
              </Button>
            ))}
          </motion.div>

          {/* Products Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredPrizes.map((prize) => (
                <motion.div
                  key={prize._id}
                  variants={itemVariants}
                  layout
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ y: -8 }}
                  className="gaming-card p-0 overflow-hidden group cursor-pointer"
                  onClick={() => handleRedeemClick(prize)}
                >
                  {/* Image Section */}
                  <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-card to-cyber-darker border-b border-border group-hover:from-primary/10 group-hover:to-accent/10 transition-all duration-300">
                    <div className="text-7xl group-hover:scale-110 transition-transform duration-300">
                      {prize.image}
                    </div>
                    {prize.featured && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-gaming gap-1">
                        <Star className="h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                    {prize.stock < 5 && (
                      <Badge variant="destructive" className="absolute top-3 left-3 font-cyber">
                        {prize.stock} left
                      </Badge>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Category Badge */}
                    <Badge variant="outline" className="mb-3 font-cyber text-xs">
                      {prize.category}
                    </Badge>

                    {/* Title */}
                    <h3 className="text-lg font-gaming font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                      {prize.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground font-cyber mb-4 line-clamp-2 min-h-[2.5rem]">
                      {prize.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-primary" />
                        <span className="text-xl font-gaming font-bold text-primary">
                          {prize.pointCost.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="neon"
                        className="font-gaming text-xs"
                        disabled={!prize.isAvailable || prize.stock === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRedeemClick(prize);
                        }}
                      >
                        Redeem
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty State */}
          {filteredPrizes.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <Package className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-2xl font-gaming font-bold text-foreground mb-2">
                No prizes found
              </h3>
              <p className="text-muted-foreground font-cyber">
                Check back soon for more amazing rewards!
              </p>
            </motion.div>
          )}

          {/* Benefits Section */}
          {isSignedIn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 grid md:grid-cols-3 gap-6"
            >
              <div className="gaming-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-gaming font-bold text-foreground mb-2">
                  Earn More Points
                </h3>
                <p className="text-sm text-muted-foreground font-cyber">
                  Complete quests and climb the leaderboard to earn more points
                </p>
              </div>

              <div className="gaming-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/30 flex items-center justify-center">
                  <Gift className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-gaming font-bold text-foreground mb-2">
                  Exclusive Rewards
                </h3>
                <p className="text-sm text-muted-foreground font-cyber">
                  Get access to exclusive gaming gear and digital perks
                </p>
              </div>

              <div className="gaming-card p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-gaming font-bold text-foreground mb-2">
                  VIP Benefits
                </h3>
                <p className="text-sm text-muted-foreground font-cyber">
                  Unlock special perks and early access to new prizes
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      {/* Redemption Confirmation Dialog */}
      <Dialog open={!!selectedPrize} onOpenChange={() => setSelectedPrize(null)}>
        <DialogContent className="gaming-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-gaming text-2xl flex items-center gap-3">
              <div className="text-4xl">{selectedPrize?.image}</div>
              Confirm Redemption
            </DialogTitle>
            <DialogDescription className="font-cyber text-base">
              Are you sure you want to redeem this prize?
            </DialogDescription>
          </DialogHeader>

          {selectedPrize && (
            <div className="space-y-4 py-4">
              <div className="gaming-card p-4 bg-card/50">
                <h3 className="font-gaming font-bold text-lg mb-2">{selectedPrize.name}</h3>
                <p className="text-sm text-muted-foreground font-cyber mb-3">
                  {selectedPrize.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground font-cyber">Cost:</span>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-xl font-gaming font-bold text-primary">
                      {selectedPrize.pointCost.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              </div>

              {userStats && (
                <div className="gaming-card p-4 bg-card/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-cyber">
                      Current Balance:
                    </span>
                    <span className="font-gaming font-bold text-foreground">
                      {userStats.points.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-cyber">
                      After Redemption:
                    </span>
                    <span className="font-gaming font-bold text-primary">
                      {(userStats.points - selectedPrize.pointCost).toLocaleString()} pts
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedPrize(null)}
              disabled={isRedeeming}
              className="font-cyber"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="cyber"
              onClick={handleConfirmRedeem}
              disabled={isRedeeming}
              className="font-gaming"
            >
              {isRedeeming ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Redeeming...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm Redeem
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Prizes;
