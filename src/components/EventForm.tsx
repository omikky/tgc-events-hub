import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { submissionService } from "@/lib/submission-service";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

const serviceOptions = [
  "Decorations",
  "Catering",
  "Drop-off Menu Order",
  "Event Coordination",
  "DJ / Music",
  "Photography",
  "Venue Setup",
  "Other (Please specify)",
];

const eventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  eventDate: z.string().min(1, "Event date is required"),
  guests: z.string().min(1, "Number of guests is required"),
  vendors: z.string().optional(),
  location: z.string().min(3, "Event location is required"),
  services: z.array(z.string()).min(1, "Please select at least one service"),
  items: z.string().optional(),
  details: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const EventForm = () => {
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "loading" | "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "loading",
    title: "",
    message: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    mode: "onChange",
    defaultValues: {
      services: [],
    },
  });

  const selectedServices = watch("services");

  const toggleService = (service: string) => {
    const current = selectedServices || [];
    const updated = current.includes(service)
      ? current.filter((s) => s !== service)
      : [...current, service];
    setValue("services", updated, { shouldValidate: true });
  };

  const onSubmit = async (data: EventFormValues) => {
    setLoading(true);
    setModalState({
      isOpen: true,
      type: "loading",
      title: "Submitting Request...",
      message: "Please wait while we process your booking details.",
    });

    try {
      await submissionService.submit({
        type: "services",
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        eventDetails: {
          eventDate: data.eventDate,
          guests: data.guests,
          vendors: data.vendors,
          location: data.location,
          services: data.services,
          items: data.items,
          details: data.details,
        },
      });
      setModalState({
        isOpen: true,
        type: "success",
        title: "Booking Submitted Successfully!",
        message: "We've received your request and will be in touch soon with your full package details.",
      });
      reset();
    } catch (error) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Submission Failed",
        message: "There was an error submitting your request. Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-name">Full Name</Label>
          <Input
            id="event-name"
            placeholder="Your full name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-email">Email Address</Label>
          <Input
            id="event-email"
            type="email"
            placeholder="your@email.com"
            {...register("email")}
            className={errors.email ? "border-destructive" : ""}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-phone">Phone Number</Label>
          <Input
            id="event-phone"
            type="tel"
            placeholder="+234..."
            {...register("phone")}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-address">Address</Label>
          <Input
            id="event-address"
            placeholder="Your address"
            {...register("address")}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-date">Event Date</Label>
          <Input
            id="event-date"
            type="date"
            {...register("eventDate")}
            className={errors.eventDate ? "border-destructive" : ""}
          />
          {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-guests">Number of Guests</Label>
          <Input
            id="event-guests"
            type="number"
            min="1"
            placeholder="e.g. 100"
            {...register("guests")}
            className={errors.guests ? "border-destructive" : ""}
          />
          {errors.guests && <p className="text-xs text-destructive">{errors.guests.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="event-vendors">Number of Vendors</Label>
          <Input id="event-vendors" type="number" min="0" placeholder="e.g. 5" {...register("vendors")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-location">Event Location</Label>
          <Input
            id="event-location"
            placeholder="Venue name or address"
            {...register("location")}
            className={errors.location ? "border-destructive" : ""}
          />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
        </div>
      </div>

      {/* Services Selection */}
      <div className="space-y-3">
        <Label className={errors.services ? "text-destructive" : ""}>Services Needed</Label>
        <div className="flex flex-wrap gap-2">
          {serviceOptions.map((service) => (
            <button
              key={service}
              type="button"
              onClick={() => toggleService(service)}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${selectedServices?.includes(service)
                ? "bg-primary text-primary-foreground border-primary shadow-pink"
                : "bg-secondary text-secondary-foreground border-border hover:border-primary"
                }`}
            >
              {service}
            </button>
          ))}
        </div>
        {errors.services && <p className="text-xs text-destructive">{errors.services.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-items">Additional Event Items / Additions (Optional)</Label>
        <Textarea id="event-items" placeholder="Any specific items, equipment, or additions needed for the event..." rows={2} {...register("items")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-details">Additional Information / Special Requests (Optional)</Label>
        <Textarea id="event-details" placeholder="Theme, color scheme, special requests, or any other details..." rows={3} {...register("details")} />
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !isValid}>
        {loading ? "Submitting..." : "Submit Event Booking"} <Send className="ml-2 w-4 h-4" />
      </Button>

      {/* Status Modal */}
      <AlertDialog open={modalState.isOpen} onOpenChange={(open) => {
        if (!open && modalState.type !== "loading") {
          setModalState(s => ({ ...s, isOpen: false }));
        }
      }}>
        <AlertDialogContent className="sm:max-w-md text-center flex flex-col items-center">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">{modalState.title}</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base mt-2">
              {modalState.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {modalState.type === "loading" && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          )}

          {modalState.type === "success" && (
            <div className="flex justify-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Send className="w-8 h-8" />
              </div>
            </div>
          )}

          {modalState.type === "error" && (
            <div className="flex justify-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <span className="text-3xl font-bold">!</span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="sm:justify-center w-full mt-4">
            {modalState.type !== "loading" && (
              <AlertDialogAction onClick={() => setModalState(s => ({ ...s, isOpen: false }))}>
                Close
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.form>
  );
};

export default EventForm;
