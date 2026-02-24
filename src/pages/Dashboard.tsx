import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, FileText, AlertCircle } from "lucide-react";

// Mock data for demonstration
const mockBookings = [
  {
    id: "TGC-2025-001",
    type: "Event Service",
    date: "2025-03-15",
    status: "confirmed",
    items: "Wedding Reception - 200 guests",
    total: "₦850,000",
  },
  {
    id: "TGC-2025-002",
    type: "Rental",
    date: "2025-04-02",
    status: "pending",
    items: "50 Chairs, 10 Tables, 5 Canopies",
    total: "₦120,000",
  },
  {
    id: "TGC-2025-003",
    type: "Both",
    date: "2025-02-28",
    status: "completed",
    items: "Birthday Party - Full Service + Rentals",
    total: "₦450,000",
  },
];

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-gold/20 text-gold" },
  confirmed: { label: "Confirmed", icon: CheckCircle, color: "bg-primary/20 text-primary" },
  completed: { label: "Completed", icon: CheckCircle, color: "bg-green-100 text-green-700" },
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-3">
              My <span className="text-gradient-pink">Bookings</span>
            </h1>
            <p className="font-body text-muted-foreground text-lg">
              Track your booking status and view invoices
            </p>
          </motion.div>

          {/* Info Banner */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-accent rounded-2xl p-5 mb-8 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <p className="font-body text-sm text-accent-foreground">
              This is a demo dashboard. Once connected to a backend, your actual bookings will appear here with real-time status updates and downloadable invoices.
            </p>
          </motion.div>

          {/* Bookings List */}
          <div className="space-y-4">
            {mockBookings.map((booking, i) => {
              const status = statusConfig[booking.status as keyof typeof statusConfig];
              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="shadow-card hover:shadow-soft transition-shadow duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle className="font-heading text-lg">{booking.id}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-body">{booking.type}</Badge>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-body font-medium ${status.color}`}>
                            <status.icon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4 font-body text-sm">
                        <div>
                          <span className="text-muted-foreground">Items/Service</span>
                          <p className="text-foreground font-medium mt-1">{booking.items}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Event Date</span>
                          <p className="text-foreground font-medium mt-1">{booking.date}</p>
                        </div>
                        <div className="flex items-center justify-between md:flex-col md:items-start">
                          <div>
                            <span className="text-muted-foreground">Total</span>
                            <p className="text-foreground font-bold text-lg mt-1">{booking.total}</p>
                          </div>
                          <button className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
                            <FileText className="w-4 h-4" /> View Invoice
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
