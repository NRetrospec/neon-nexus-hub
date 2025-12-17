import Navbar from "@/components/landing/Navbar";
import QuestsSection from "@/components/landing/QuestsSection";
import Footer from "@/components/landing/Footer";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <QuestsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Discover;
