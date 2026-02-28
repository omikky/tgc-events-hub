import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Send, Package, CalendarHeart, User } from "lucide-react";
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
import { submissionService } from "@/lib/submission-service";

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

const bothSchema = z.object({
    // Contact Details
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
    address: z.string().min(5, "Address must be at least 5 characters"),

    // Rental Details
    rentalItems: z.string().min(3, "Please list at least one rental item"),
    rentalDate: z.string().min(1, "Rental date is required"),
    rentalLocation: z.string().min(3, "Rental location is required"),
    agreed: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the rental terms" }),
    }),

    // Event Details
    eventDate: z.string().min(1, "Event date is required"),
    guests: z.string().min(1, "Number of guests is required"),
    vendors: z.string().optional(),
    eventLocation: z.string().min(3, "Event location is required"),
    services: z.array(z.string()).min(1, "Please select at least one service"),
    otherServiceDetails: z.string().optional(),
    eventItems: z.string().optional(),
    eventDetails: z.string().optional(),
}).refine(data => {
    if (data.services.includes("Other (Please specify)") && (!data.otherServiceDetails || data.otherServiceDetails.trim() === "")) {
        return false;
    }
    return true;
}, {
    message: "Please specify your other service requirements",
    path: ["otherServiceDetails"]
});

type BothFormValues = z.infer<typeof bothSchema>;

const BothForm = () => {
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
    } = useForm<BothFormValues>({
        resolver: zodResolver(bothSchema),
        mode: "onChange",
        defaultValues: {
            services: [],
            agreed: false as unknown as true,
        },
    });

    const selectedServices = watch("services") || [];
    const showOtherInput = selectedServices.includes("Other (Please specify)");
    const agreed = watch("agreed");

    const toggleService = (service: string) => {
        const updated = selectedServices.includes(service)
            ? selectedServices.filter((s) => s !== service)
            : [...selectedServices, service];
        setValue("services", updated, { shouldValidate: true });
    };

    const onSubmit = async (data: BothFormValues) => {
        setLoading(true);
        setModalState({
            isOpen: true,
            type: "loading",
            title: "Submitting Request...",
            message: "Please wait while we process your booking details.",
        });

        try {
            // Append "Other" details to services string array if applicable
            const finalServices = [...data.services];
            if (showOtherInput && data.otherServiceDetails) {
                finalServices.push(`Other: ${data.otherServiceDetails}`);
            }

            await submissionService.submit({
                type: "both",
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address,
                rentalDetails: {
                    items: data.rentalItems,
                    date: data.rentalDate,
                    location: data.rentalLocation,
                },
                eventDetails: {
                    eventDate: data.eventDate,
                    guests: data.guests,
                    vendors: data.vendors,
                    location: data.eventLocation,
                    services: finalServices.filter(s => s !== "Other (Please specify)"),
                    items: data.eventItems,
                    details: data.eventDetails,
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
            className="space-y-8"
        >
            {/* SECTION 1: CONTACT DETAILS */}
            <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 border-b pb-2">
                    <User className="w-5 h-5 text-primary" /> Contact Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="both-name">Full Name</Label>
                        <Input id="both-name" placeholder="Your full name" {...register("name")} className={errors.name ? "border-destructive" : ""} />
                        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="both-email">Email Address</Label>
                        <Input id="both-email" type="email" placeholder="your@email.com" {...register("email")} className={errors.email ? "border-destructive" : ""} />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="both-phone">Phone Number</Label>
                        <Input id="both-phone" type="tel" placeholder="+234..." {...register("phone")} className={errors.phone ? "border-destructive" : ""} />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="both-address">Address</Label>
                        <Input id="both-address" placeholder="Your current address" {...register("address")} className={errors.address ? "border-destructive" : ""} />
                        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
                    </div>
                </div>
            </div>

            {/* SECTION 2: RENTAL DETAILS */}
            <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 border-b pb-2">
                    <Package className="w-5 h-5 text-primary" /> Rental Requirements
                </h2>
                <div className="space-y-2">
                    <Label htmlFor="both-rental-items">Items Needed</Label>
                    <Textarea id="both-rental-items" placeholder="List items (e.g., 50 chairs, 10 tables...)" rows={3} {...register("rentalItems")} className={errors.rentalItems ? "border-destructive" : ""} />
                    {errors.rentalItems && <p className="text-xs text-destructive">{errors.rentalItems.message}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="both-rental-date">Date Item(s) Needed</Label>
                        <Input id="both-rental-date" type="date" {...register("rentalDate")} className={errors.rentalDate ? "border-destructive" : ""} />
                        {errors.rentalDate && <p className="text-xs text-destructive">{errors.rentalDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="both-rental-location">Location Items Will Be Used</Label>
                        <Input id="both-rental-location" placeholder="Rental drop-off location" {...register("rentalLocation")} className={errors.rentalLocation ? "border-destructive" : ""} />
                        {errors.rentalLocation && <p className="text-xs text-destructive">{errors.rentalLocation.message}</p>}
                    </div>
                </div>
            </div>

            {/* SECTION 3: EVENT DETAILS */}
            <div className="space-y-5">
                <h2 className="font-heading text-xl font-bold text-foreground flex items-center gap-2 border-b pb-2">
                    <CalendarHeart className="w-5 h-5 text-primary" /> Event Services
                </h2>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="both-event-date">Event Date</Label>
                        <Input id="both-event-date" type="date" {...register("eventDate")} className={errors.eventDate ? "border-destructive" : ""} />
                        {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="both-guests">Number of Guests</Label>
                        <Input id="both-guests" type="number" min="1" placeholder="e.g. 100" {...register("guests")} className={errors.guests ? "border-destructive" : ""} />
                        {errors.guests && <p className="text-xs text-destructive">{errors.guests.message}</p>}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="both-vendors">Number of Vendors</Label>
                        <Input id="both-vendors" type="number" min="0" placeholder="e.g. 5" {...register("vendors")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="both-event-location">Event Location</Label>
                        <Input id="both-event-location" placeholder="Venue name or address" {...register("eventLocation")} className={errors.eventLocation ? "border-destructive" : ""} />
                        {errors.eventLocation && <p className="text-xs text-destructive">{errors.eventLocation.message}</p>}
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
                                className={`px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${selectedServices.includes(service)
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

                {/* Other Service Details */}
                {showOtherInput && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
                        <Label htmlFor="both-other-details">Please specify your other service requirements</Label>
                        <Input id="both-other-details" placeholder="Describe the requested services..." {...register("otherServiceDetails")} className={errors.otherServiceDetails ? "border-destructive" : ""} />
                        {errors.otherServiceDetails && <p className="text-xs text-destructive">{errors.otherServiceDetails.message}</p>}
                    </motion.div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="both-event-items">Additional Event Items / Additions (Optional)</Label>
                    <Textarea id="both-event-items" placeholder="Any specific items, equipment, or additions needed for the event..." rows={2} {...register("eventItems")} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="both-event-details">Additional Information / Special Requests (Optional)</Label>
                    <Textarea id="both-event-details" placeholder="Theme, color scheme, special requests, or any other details..." rows={3} {...register("eventDetails")} />
                </div>
            </div>

            {/* Terms & Conditions (Rental) */}
            <div className="bg-secondary rounded-xl p-5 space-y-3">
                <h4 className="font-heading text-foreground font-semibold">Rental Terms & Conditions</h4>
                <ul className="space-y-2 font-body text-sm text-muted-foreground">
                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> A refundable caution fee will be charged.</li>
                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> Delays after the expected return day attract extra charges.</li>
                    <li className="flex gap-2"><span className="text-primary font-bold">•</span> Items damaged upon return will attract a fee.</li>
                </ul>
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 pt-2">
                        <Checkbox id="both-terms" checked={agreed} onCheckedChange={(v) => setValue("agreed", (v === true) as true, { shouldValidate: true })} />
                        <Label htmlFor="both-terms" className="text-sm font-body cursor-pointer">I have read and agreed to the terms and conditions</Label>
                    </div>
                    {errors.agreed && <p className="text-xs text-destructive ml-8">{errors.agreed.message}</p>}
                </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading || !isValid}>
                {loading ? "Submitting..." : "Submit Full Package Request"} <Send className="ml-2 w-4 h-4" />
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

export default BothForm;
