import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RentalForm from "@/components/RentalForm";
import EventForm from "@/components/EventForm";
import BothForm from "@/components/BothForm";
import { Package, CalendarHeart, Layers } from "lucide-react";

type BookingCategory = "rentals" | "services" | "both";

const categories = [
  { key: "rentals" as BookingCategory, label: "Rentals Only", icon: Package, desc: "Rent items for your event" },
  { key: "services" as BookingCategory, label: "Event Services", icon: CalendarHeart, desc: "Book our event management services" },
  { key: "both" as BookingCategory, label: "Both", icon: Layers, desc: "Rentals + Event services" },
];

const Booking = () => {
  const [category, setCategory] = useState<BookingCategory | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-3">
              Book <span className="text-gradient-pink">With Us</span>
            </h1>
            <p className="font-body text-muted-foreground text-lg">
              Select a category to get started
            </p>
          </motion.div>

          {/* Category Selector */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {categories.map((cat, i) => (
              <motion.button
                key={cat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setCategory(cat.key)}
                className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 ${category === cat.key
                  ? "border-primary bg-accent shadow-pink"
                  : "border-border bg-card hover:border-primary/50"
                  }`}
              >
                <cat.icon className={`w-8 h-8 mb-3 ${category === cat.key ? "text-primary" : "text-muted-foreground"}`} />
                <h3 className="font-heading text-lg font-semibold text-foreground">{cat.label}</h3>
                <p className="font-body text-sm text-muted-foreground mt-1">{cat.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* Forms */}
          {category && (
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card space-y-8">
              {category === "rentals" && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                    <Package className="inline w-6 h-6 mr-2 text-primary" />
                    Rental Details
                  </h2>
                  <RentalForm />
                </div>
              )}

              {category === "services" && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                    <CalendarHeart className="inline w-6 h-6 mr-2 text-primary" />
                    Event Service Details
                  </h2>
                  <EventForm />
                </div>
              )}

              {category === "both" && (
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                    <Layers className="inline w-6 h-6 mr-2 text-primary" />
                    Full Package Details
                  </h2>
                  <BothForm />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;
