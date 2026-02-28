import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import SocialMedia from "@/components/SocialMedia";
import Footer from "@/components/Footer";
import Socialcarousel from "@/components/Socialcarousel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Services />
      <SocialMedia />
      <Socialcarousel />
      <Footer />
    </div>
  );
};

export default Index;
