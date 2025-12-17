import Navbar from "@/components/landing/Navbar";
import LeaderboardSection from "@/components/landing/LeaderboardSection";
import Footer from "@/components/landing/Footer";

const Rankings = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <LeaderboardSection />
      </main>
      <Footer />
    </div>
  );
};

export default Rankings;
