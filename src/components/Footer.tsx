import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <span className="font-heading text-2xl font-bold text-gradient-pink">TGC</span>
            <span className="font-heading text-lg font-medium text-background ml-1">EVENTS</span>
            <p className="font-body text-background/60 mt-3 text-sm">
              Creating unforgettable moments through exceptional catering, rentals, and event management.
            </p>
          </div>

          <div>
            <h4 className="font-heading text-background font-semibold mb-3">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="font-body text-background/60 hover:text-primary text-sm transition-colors">Home</Link>
              <Link to="/booking" className="font-body text-background/60 hover:text-primary text-sm transition-colors">Book Now</Link>
              <Link to="/dashboard" className="font-body text-background/60 hover:text-primary text-sm transition-colors">My Bookings</Link>
            </div>
          </div>

          <div>
            <h4 className="font-heading text-background font-semibold mb-3">Contact</h4>
            <p className="font-body text-background/60 text-sm">Email: info@tgcevents.com</p>
            <p className="font-body text-background/60 text-sm mt-1">Phone: +234 XXX XXX XXXX</p>
          </div>
        </div>

        <div className="border-t border-background/10 pt-6 text-center">
          <p className="font-body text-background/40 text-sm flex items-center justify-center gap-1">
            Made with <Heart className="w-3 h-3 text-primary fill-primary" /> TGC Events © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
