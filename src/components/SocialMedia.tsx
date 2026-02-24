import { Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";

const socials = [
  {
    name: "Instagram",
    icon: Instagram,
    url: "#",
    color: "hover:text-pink-glow",
  },
  {
    name: "TikTok",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.7a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.13z" />
      </svg>
    ),
    url: "#",
    color: "hover:text-foreground",
  },
  {
    name: "YouTube",
    icon: Youtube,
    url: "#",
    color: "hover:text-destructive",
  },
];

const SocialMedia = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Follow Us
          </h2>
          <p className="font-body text-muted-foreground mb-10">
            Stay connected for inspiration and updates
          </p>
        </motion.div>

        <div className="flex justify-center gap-6">
          {socials.map((social, i) => (
            <motion.a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.1, y: -4 }}
              className={`w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground ${social.color} transition-colors duration-300 shadow-soft`}
              title={social.name}
            >
              <social.icon className="w-6 h-6" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialMedia;
