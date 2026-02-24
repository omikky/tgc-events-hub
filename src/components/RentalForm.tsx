import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const RentalForm = () => {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      toast({ title: "Please agree to the terms and conditions", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Rental Request Submitted!", description: "We'll get back to you shortly." });
      (e.target as HTMLFormElement).reset();
      setAgreed(false);
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
          <Label htmlFor="rental-name">Full Name</Label>
          <Input id="rental-name" name="name" placeholder="Your full name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-phone">Phone Number</Label>
          <Input id="rental-phone" name="phone" type="tel" placeholder="+234..." required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rental-address">Address</Label>
        <Input id="rental-address" name="address" placeholder="Your address" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rental-items">Items Needed</Label>
        <Textarea id="rental-items" name="items" placeholder="List items you'd like to rent (e.g., 50 chairs, 10 tables, decorations...)" required rows={3} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rental-date">Date Item(s) Needed</Label>
          <Input id="rental-date" name="date" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-location">Location Items Will Be Used</Label>
          <Input id="rental-location" name="location" placeholder="Event location" required />
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="bg-secondary rounded-xl p-5 space-y-3">
        <h4 className="font-heading text-foreground font-semibold">Terms & Conditions</h4>
        <ul className="space-y-2 font-body text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            A refundable caution fee will be charged and paid alongside the original rental fee.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            Any delay after the expected day of return will attract extra charges and risk forfeiture of the refundable caution fee.
          </li>
          <li className="flex gap-2">
            <span className="text-primary font-bold">•</span>
            Items damaged upon return will attract a fee or forfeiture of caution fee depending on the severity of the damage. In some cases, the client might need to replace the damaged items completely.
          </li>
        </ul>

        <div className="flex items-center gap-3 pt-2">
          <Checkbox
            id="rental-terms"
            checked={agreed}
            onCheckedChange={(v) => setAgreed(v === true)}
          />
          <Label htmlFor="rental-terms" className="text-sm font-body cursor-pointer">
            I have read and agreed to the terms and conditions
          </Label>
        </div>
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !agreed}>
        {loading ? "Submitting..." : "Submit Rental Request"} <Send className="ml-2 w-4 h-4" />
      </Button>
    </motion.form>
  );
};

export default RentalForm;
