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

const rentalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  items: z.string().min(3, "Please list at least one item"),
  date: z.string().min(1, "Date is required"),
  location: z.string().min(3, "Location is required"),
  agreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

type RentalFormValues = z.infer<typeof rentalSchema>;

const RentalForm = () => {
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
  } = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema),
    mode: "onChange",
    defaultValues: {
      agreed: false as unknown as true,
    },
  });

  const agreed = watch("agreed");

  const onSubmit = async (data: RentalFormValues) => {
    setLoading(true);
    setModalState({
      isOpen: true,
      type: "loading",
      title: "Submitting Request...",
      message: "Please wait while we process your booking details.",
    });

    try {
      await submissionService.submit({
        type: "rentals",
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        rentalDetails: {
          items: data.items,
          date: data.date,
          location: data.location,
        },
      });
      setModalState({
        isOpen: true,
        type: "success",
        title: "Booking Submitted Successfully!",
        message: "We've received your request and will be in touch soon.",
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
          <Label htmlFor="rental-name">Full Name</Label>
          <Input
            id="rental-name"
            placeholder="Your full name"
            {...register("name")}
            className={errors.name ? "border-destructive" : ""}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-email">Email Address</Label>
          <Input
            id="rental-email"
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
          <Label htmlFor="rental-phone">Phone Number</Label>
          <Input
            id="rental-phone"
            type="tel"
            placeholder="+234..."
            {...register("phone")}
            className={errors.phone ? "border-destructive" : ""}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-address">Address</Label>
          <Input
            id="rental-address"
            placeholder="Your address"
            {...register("address")}
            className={errors.address ? "border-destructive" : ""}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rental-items">Items Needed / Additions</Label>
        <Textarea
          id="rental-items"
          placeholder="List items, additions, or special requests (e.g., 50 chairs, 10 tables...)"
          rows={3}
          {...register("items")}
          className={errors.items ? "border-destructive" : ""}
        />
        {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rental-date">Date Item(s) Needed</Label>
          <Input
            id="rental-date"
            type="date"
            {...register("date")}
            className={errors.date ? "border-destructive" : ""}
          />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="rental-location">Location Items Will Be Used</Label>
          <Input
            id="rental-location"
            placeholder="Event location"
            {...register("location")}
            className={errors.location ? "border-destructive" : ""}
          />
          {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
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
            Items damaged upon return will attract a fee or forfeiture of caution fee.
          </li>
        </ul>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 pt-2">
            <Checkbox
              id="rental-terms"
              checked={agreed}
              onCheckedChange={(v) => setValue("agreed", (v === true) as true, { shouldValidate: true })}
            />
            <Label htmlFor="rental-terms" className="text-sm font-body cursor-pointer">
              I have read and agreed to the terms and conditions
            </Label>
          </div>
          {errors.agreed && <p className="text-xs text-destructive ml-8">{errors.agreed.message}</p>}
        </div>
      </div>

      <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !isValid}>
        {loading ? "Submitting..." : "Submit Rental Request"} <Send className="ml-2 w-4 h-4" />
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

export default RentalForm;
