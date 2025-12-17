import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Privacy Policy Display Page
 * Public page that displays current Privacy Policy
 * Used for Clerk Privacy URL and general reference
 */
const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const activePrivacy = useQuery(api.legal.getActiveDocument, {
    documentType: "privacy_policy",
  });

  if (!activePrivacy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="font-cyber text-muted-foreground">Loading Privacy Policy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 relative z-10 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 font-cyber"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-gaming font-bold text-foreground">
                Privacy Policy
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-cyber mt-1">
                <span>Version {activePrivacy.version}</span>
                <span>•</span>
                <span>
                  Effective: {new Date(activePrivacy.effectiveDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Document Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gaming-card p-8"
        >
          <ScrollArea className="h-[70vh] w-full pr-4">
            <div
              className="prose prose-sm dark:prose-invert max-w-none font-cyber"
              dangerouslySetInnerHTML={{ __html: activePrivacy.content }}
            />
          </ScrollArea>

          {/* Footer Actions */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <p className="text-xs text-muted-foreground font-cyber">
                Last updated: {new Date(activePrivacy.createdAt).toLocaleDateString()}
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.print()}
                  className="font-cyber"
                >
                  Print
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/legal/accept-terms")}
                  className="font-cyber"
                >
                  View Terms of Service
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Info */}
        <p className="text-center text-xs text-muted-foreground font-cyber mt-6">
          Privacy questions? Contact{" "}
          <a href="mailto:privacy@neonnexus.com" className="text-primary hover:underline">
            privacy@neonnexus.com
          </a>
          <br />
          <span className="mt-2 block">
            California residents:{" "}
            <a href="/legal/opt-out" className="text-primary hover:underline">
              Do Not Sell My Personal Information
            </a>
          </span>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
