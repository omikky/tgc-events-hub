import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const serviceOptions = [
  "Decorations",
  "Catering",
  "Drop-off Menu Order",
  "Event Coordination",
  "DJ / Music",
  "Photography",
  "Venue Setup",
];

const EventForm = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast({ title: "Please select at least one service", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Event Booking Submitted!", description: "We'll be in touch soon." });
      (e.target as HTMLFormElement).reset();
      setSelectedServices([]);
    }, 1500);
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-name">Full Name</Label>
          <Input id="event-name" name="name" placeholder="Your full name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-phone">Phone Number</Label>
          <Input id="event-phone" name="phone" type="tel" placeholder="+234..." required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-address">Address</Label>
        <Input id="event-address" name="address" placeholder="Your address" required />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-date">Event Date</Label>
          <Input id="event-date" name="eventDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-guests">Number of Guests</Label>
          <Input id="event-guests" name="guests" type="number" min="1" placeholder="e.g. 100" required />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-vendors">Number of Vendors</Label>
          <Input id="event-vendors" name="vendors" type="number" min="0" placeholder="e.g. 5" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-location">Event Location</Label>
          <Input id="event-location" name="location" placeholder="Venue name or address" required />
        </div>
      </div>

      {/* Services Selection */}
      <div className="space-y-3">
        <Label>Services Needed</Label>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
                selectedServices.includes(service)
                  ? "bg-primary text-primary-foreground border-primary shadow-pink"
                  : "bg-secondary text-secondary-foreground border-border hover:border-primary"
              }`}
            >
              {service}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-items">Items Needed</Label>
        <Textarea id="event-items" name="items" placeholder="Any specific items or equipment needed..." rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-details">Additional Details</Label>
        <Textarea id="event-details" name="details" placeholder="Theme, color scheme, special requests, dietary requirements..." rows={3} />
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit Event Booking"} <Send className="ml-2 w-4 h-4" />
      </Button>
    </motion.form>
  );
};

export default EventForm;
