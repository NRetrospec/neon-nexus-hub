import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Calendar } from "lucide-react";
import { toast } from "sonner";

/**
 * Age Verification Page
 *
 * LEGAL CRITICALITY: HIGH
 *
 * Purpose:
 * - COPPA Compliance: Blocks users under 13
 * - Age-appropriate content gating
 * - Parental consent tracking for minors
 * - Audit trail for age verification
 *
 * Legal Protection:
 * - Hard block for under-13 (COPPA requirement)
 * - Collects verifiable age data
 * - Creates immutable age verification record
 * - Prevents data collection before age verification
 */
const AgeVerification = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [dateOfBirth, setDateOfBirth] = useState({
    year: "",
    month: "",
    day: "",
  });
  const [guardianEmail, setGuardianEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dbUser = useQuery(
    api.users.getUserByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const recordAge = useMutation(api.legal.recordAgeVerification);

  // Get user's IP and user agent for audit trail
  const getUserFingerprint = () => {
    return {
      ipAddress: "CLIENT_IP", // In production, get from server or IP API
      userAgent: navigator.userAgent,
    };
  };

  const calculateAge = (year: number, month: number, day: number) => {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!dbUser) {
      setError("User data not loaded. Please refresh the page.");
      return;
    }

    // Validation
    const year = parseInt(dateOfBirth.year);
    const month = parseInt(dateOfBirth.month);
    const day = parseInt(dateOfBirth.day);

    if (!year || !month || !day) {
      setError("Please enter your complete date of birth");
      return;
    }

    if (year < 1900 || year > new Date().getFullYear()) {
      setError("Please enter a valid year");
      return;
    }

    if (month < 1 || month > 12) {
      setError("Please enter a valid month (1-12)");
      return;
    }

    if (day < 1 || day > 31) {
      setError("Please enter a valid day");
      return;
    }

    // Check age before submission
    const age = calculateAge(year, month, day);

    if (age < 13) {
      setError(
        "You must be at least 13 years old to use this service. If you believe this is an error, please contact support."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const fingerprint = getUserFingerprint();
      const dobString = `${year}-${month.toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;

      await recordAge({
        userId: dbUser._id,
        clerkId: user!.id,
        dateOfBirth: dobString,
        ipAddress: fingerprint.ipAddress,
        userAgent: fingerprint.userAgent,
        guardianEmail: age < 18 && guardianEmail ? guardianEmail : undefined,
      });

      toast.success("Age verified successfully!");

      // Redirect to terms acceptance
      navigate("/legal/accept-terms");
    } catch (err: any) {
      console.error("Age verification error:", err);
      setError(err.message || "Failed to verify age. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 animated-gradient opacity-20 pointer-events-none" />
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="gaming-card max-w-2xl w-full p-8 relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-gaming font-bold text-foreground mb-2">
            Age Verification Required
          </h1>
          <p className="text-muted-foreground font-cyber">
            We need to verify your age to comply with legal requirements
          </p>
        </div>

        {/* COPPA Notice */}
        <Alert className="mb-6 border-primary/30 bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
          <AlertDescription className="font-cyber text-sm">
            <strong>Why we ask:</strong> Federal law (COPPA) requires us to verify that
            users are at least 13 years old before collecting any personal information.
            Your date of birth is encrypted and stored securely.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="dob" className="font-gaming text-foreground mb-3 block">
                Date of Birth
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="month" className="font-cyber text-xs text-muted-foreground">
                    Month
                  </Label>
                  <select
                    id="month"
                    value={dateOfBirth.month}
                    onChange={(e) =>
                      setDateOfBirth({ ...dateOfBirth, month: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md font-cyber text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Month</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="day" className="font-cyber text-xs text-muted-foreground">
                    Day
                  </Label>
                  <select
                    id="day"
                    value={dateOfBirth.day}
                    onChange={(e) =>
                      setDateOfBirth({ ...dateOfBirth, day: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md font-cyber text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Day</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="year" className="font-cyber text-xs text-muted-foreground">
                    Year
                  </Label>
                  <select
                    id="year"
                    value={dateOfBirth.year}
                    onChange={(e) =>
                      setDateOfBirth({ ...dateOfBirth, year: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md font-cyber text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Year</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Conditional Guardian Email for Minors */}
            {dateOfBirth.year &&
              dateOfBirth.month &&
              dateOfBirth.day &&
              calculateAge(
                parseInt(dateOfBirth.year),
                parseInt(dateOfBirth.month),
                parseInt(dateOfBirth.day)
              ) < 18 &&
              calculateAge(
                parseInt(dateOfBirth.year),
                parseInt(dateOfBirth.month),
                parseInt(dateOfBirth.day)
              ) >= 13 && (
                <div>
                  <Label htmlFor="guardianEmail" className="font-gaming text-foreground">
                    Parent/Guardian Email (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground font-cyber mb-2">
                    We may contact your parent/guardian for certain features
                  </p>
                  <Input
                    id="guardianEmail"
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    placeholder="parent@example.com"
                    className="font-cyber"
                  />
                </div>
              )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-cyber">{error}</AlertDescription>
            </Alert>
          )}

          {/* Privacy Notice */}
          <div className="bg-muted/50 p-4 rounded-md">
            <p className="text-xs text-muted-foreground font-cyber leading-relaxed">
              <strong>Your Privacy:</strong> Your date of birth is encrypted and used only
              for age verification. We do not share this information with third parties. By
              continuing, you certify that the information provided is accurate.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="neon"
            size="lg"
            className="w-full font-gaming"
            disabled={isSubmitting || !dateOfBirth.year || !dateOfBirth.month || !dateOfBirth.day}
          >
            {isSubmitting ? "Verifying..." : "Verify Age & Continue"}
          </Button>
        </form>

        {/* Legal Footer */}
        <p className="text-center text-xs text-muted-foreground font-cyber mt-6">
          Users under 13 cannot create accounts due to federal law (COPPA).
          <br />
          If you need assistance, please contact{" "}
          <a href="mailto:support@neonnexus.com" className="text-primary hover:underline">
            support@neonnexus.com
          </a>
        </p>
      </motion.div>
    </div>
  );
};

export default AgeVerification;
