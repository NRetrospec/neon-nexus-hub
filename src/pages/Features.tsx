import Navbar from "@/components/landing/Navbar";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Features;
