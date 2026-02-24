import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-foreground/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-2 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-body text-primary-foreground font-medium">Catering • Rentals • Event Management</span>
          </motion.div>

          <h1 className="font-heading text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Creating{" "}
            <span className="text-gradient-pink">Unforgettable</span>
            <br />
            Moments
          </h1>

          <p className="font-body text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-xl mx-auto">
            From elegant weddings to corporate galas, we bring your vision to life with impeccable service and stunning execution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/booking">
              <Button variant="hero" size="lg" className="text-base px-8 py-6">
                Book Now <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <Link to="/#services">
              <Button variant="hero-outline" size="lg" className="text-base px-8 py-6 border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                Our Services
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
