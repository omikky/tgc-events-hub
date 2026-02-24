import { motion } from "framer-motion";
import { UtensilsCrossed, Package, CalendarHeart } from "lucide-react";

const services = [
  {
    icon: UtensilsCrossed,
    title: "Catering Services",
    description: "Exquisite menus tailored to your event, from intimate dinners to grand receptions.",
  },
  {
    icon: Package,
    title: "Event Rentals",
    description: "Premium chairs, tables, decorations, and equipment for any occasion.",
  },
  {
    icon: CalendarHeart,
    title: "Event Management",
    description: "Full-service planning and coordination to make your event seamless and memorable.",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
            What We <span className="text-gradient-pink">Offer</span>
          </h2>
          <p className="font-body text-muted-foreground text-lg max-w-xl mx-auto">
            Comprehensive event solutions under one roof
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-card rounded-2xl p-8 shadow-card hover:shadow-pink transition-shadow duration-500 group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-pink flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-heading text-xl font-semibold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="font-body text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
