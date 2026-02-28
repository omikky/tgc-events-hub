import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { submissionService, Submission } from "@/lib/submission-service";
import { Clock, CheckCircle, Package, Layers, CalendarHeart, Search, ArrowRight, XCircle, DollarSign, Mail, Send, Landmark, Copy, Check, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [bankDetails, setBankDetails] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<string>("");
  const [paymentState, setPaymentState] = useState<"idle" | "loading" | "success">("idle");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Submission | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  useEffect(() => {
    submissionService.getBankDetails().then(setBankDetails);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const data = await submissionService.getAll();
      const userSubmissions = data.filter(s => s.email.toLowerCase() === email.toLowerCase());
      userSubmissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSubmissions(userSubmissions);
      setHasSearched(true);
    } catch (error) {
      console.error("Failed to fetch tracking details", error);
    } finally {
      setIsLoading(false);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 px-3 py-1"><Clock className="w-3.5 h-3.5 mr-1.5" /> Pending Review</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Details Confirmed</Badge>;
      case "invoiced":
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1"><Send className="w-3.5 h-3.5 mr-1.5" /> Invoice Ready</Badge>;
      case "paid":
        return <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-200 px-3 py-1"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Payment Sent</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1"><CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Event Completed</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Rejected/Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-12 lg:py-24 max-w-4xl pt-24">
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground">Track Your Bookings</h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Enter your email address to view the status of all your rental and event service bookings with TGC Events Hub.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="shadow-lg border-primary/20 bg-card overflow-hidden">
              <CardContent className="p-1 md:p-2">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Enter your email address..."
                      className="pl-12 h-14 bg-transparent border-0 focus-visible:ring-0 text-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-14 px-8 rounded-xl shrink-0" disabled={isLoading}>
                    {isLoading ? "Searching..." : (
                      <>Track Bookings <ArrowRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4 pt-8 border-t"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-heading font-bold">Your Bookings</h2>
                  <Badge variant="secondary" className="text-sm px-3 py-1">{submissions.length} Found</Badge>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-border/50">
                    <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
                    <p className="text-muted-foreground">We couldn't find any bookings associated with {email}.</p>
                  </div>
                ) : (() => {
                  const totalPages = Math.ceil(submissions.length / ITEMS_PER_PAGE);
                  const paged = submissions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
                  return (
                    <Card className="shadow-sm border-border/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="w-[130px]">Booking ID</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paged.map((s) => {
                              const date = s.rentalDetails?.date || s.eventDetails?.eventDate || new Date(s.createdAt).toLocaleDateString();
                              return (
                                <TableRow key={s.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedBooking(s)}>
                                  <TableCell className="font-mono text-xs text-muted-foreground">{s.id.substring(0, 12)}...</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5 capitalize font-medium">
                                      {s.type === "rentals" && <Package className="w-4 h-4 text-primary" />}
                                      {s.type === "services" && <CalendarHeart className="w-4 h-4 text-primary" />}
                                      {s.type === "both" && <Layers className="w-4 h-4 text-primary" />}
                                      {s.type === "client" && <Mail className="w-4 h-4 text-primary" />}
                                      {s.type === "both" ? "Event + Rental" : s.type}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">{date}</TableCell>
                                  <TableCell className="font-mono font-semibold">
                                    {s.invoice ? `₦${(s.invoice.total || 0).toFixed(2)}` : <span className="text-muted-foreground text-xs">—</span>}
                                  </TableCell>
                                  <TableCell><StatusBadge status={s.status} /></TableCell>
                                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setSelectedBooking(s)}>
                                      <Eye className="w-4 h-4 mr-1" /> View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10 flex-wrap gap-3">
                          <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>–<span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, submissions.length)}</span> of <span className="font-medium">{submissions.length}</span>
                          </p>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Booking Detail Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedBooking.type === "rentals" && <Package className="w-5 h-5 text-primary" />}
                  {selectedBooking.type === "services" && <CalendarHeart className="w-5 h-5 text-primary" />}
                  {selectedBooking.type === "both" && <Layers className="w-5 h-5 text-primary" />}
                  {selectedBooking.type === "both" ? "Event + Rental" : selectedBooking.type.charAt(0).toUpperCase() + selectedBooking.type.slice(1)} Booking
                </DialogTitle>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-xs text-muted-foreground">{selectedBooking.id}</span>
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {(selectedBooking.type === "rentals" || selectedBooking.type === "both") && selectedBooking.rentalDetails && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2"><Package className="w-3.5 h-3.5" /> Rental Details</p>
                    <div className="bg-secondary/30 rounded-xl p-4 grid sm:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{selectedBooking.rentalDetails.date}</p></div>
                      <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selectedBooking.rentalDetails.location}</p></div>
                      <div className="sm:col-span-1"><p className="text-xs text-muted-foreground">Items</p><p className="font-medium">{selectedBooking.rentalDetails.items}</p></div>
                    </div>
                  </div>
                )}

                {(selectedBooking.type === "services" || selectedBooking.type === "both") && selectedBooking.eventDetails && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2"><CalendarHeart className="w-3.5 h-3.5" /> Event Details</p>
                    <div className="bg-secondary/30 rounded-xl p-4 grid sm:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-xs text-muted-foreground">Event Date</p><p className="font-medium">{selectedBooking.eventDetails.eventDate}</p></div>
                      <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selectedBooking.eventDetails.location}</p></div>
                      <div><p className="text-xs text-muted-foreground">Guests</p><p className="font-medium">{selectedBooking.eventDetails.guests}</p></div>
                      <div className="sm:col-span-3">
                        <p className="text-xs text-muted-foreground mb-1">Services</p>
                        <div className="flex flex-wrap gap-1">{selectedBooking.eventDetails.services?.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBooking.invoice && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> Invoice Breakdown</p>
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      {selectedBooking.invoice.items?.length > 0 && (
                        <div className="mb-4 space-y-1.5">
                          <p className="text-xs text-muted-foreground uppercase font-semibold border-b border-blue-200 pb-2 mb-2">Itemized Bill</p>
                          {selectedBooking.invoice.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-slate-700">{item.name}</span>
                              <span className="font-mono font-medium">₦{(item.price || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-blue-100 text-sm">
                        <div><p className="text-xs text-muted-foreground uppercase font-semibold">Subtotal</p><p className="font-mono font-bold">₦{(selectedBooking.invoice.actualBill || 0).toFixed(2)}</p></div>
                        <div><p className="text-xs text-muted-foreground uppercase font-semibold">Fees</p><p className="font-mono">₦{((selectedBooking.invoice.cautionFee || 0) + (selectedBooking.invoice.logistics || 0)).toFixed(2)}</p></div>
                        <div><p className="text-xs text-muted-foreground uppercase font-semibold">VAT</p><p className="font-mono">₦{(selectedBooking.invoice.vat || 0).toFixed(2)}</p></div>
                        <div><p className="text-xs text-primary uppercase font-bold">Total</p><p className="font-mono font-extrabold text-lg text-primary">₦{(selectedBooking.invoice.total || 0).toFixed(2)}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedBooking.status === "invoiced" && (
                <DialogFooter>
                  <Button onClick={() => {
                    setSelectedForPayment(selectedBooking.id);
                    setSelectedBooking(null);
                    setPaymentModalOpen(true);
                  }}>
                    <Landmark className="w-4 h-4 mr-2" /> View Bank Details & Pay
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={(open) => { if (!open) { setPaymentModalOpen(false); setPaymentState("idle"); } }}>
        <DialogContent className="sm:max-w-md">
          {paymentState === "success" ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading text-foreground">Payment Notified!</h2>
                <p className="text-muted-foreground text-sm mt-1">Your payment has been submitted for verification. We'll confirm once received.</p>
              </div>
              <Button className="mt-4 w-full" onClick={() => { setPaymentModalOpen(false); setPaymentState("idle"); }}>
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Landmark className="w-5 h-5 text-primary" /> Bank Details</DialogTitle>
              </DialogHeader>
              <div className="py-6 space-y-4">
                <div className="bg-secondary/30 p-4 rounded-xl whitespace-pre-wrap font-medium text-foreground">
                  {bankDetails && typeof bankDetails === 'object' ? (
                    <div className="space-y-3 text-sm">
                      {bankDetails.bankName && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Bank Name:</span>
                          <span>{bankDetails.bankName}</span>
                        </div>
                      )}
                      {bankDetails.accountName && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Account Name:</span>
                          <div className="flex items-center gap-1.5">
                            <span>{bankDetails.accountName}</span>
                            <button type="button" onClick={() => copyToClipboard(bankDetails.accountName, 'accountName')} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Copy">
                              {copiedField === 'accountName' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {bankDetails.accountNumber && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-semibold">Account Number:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-base font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{bankDetails.accountNumber}</span>
                            <button type="button" onClick={() => copyToClipboard(bankDetails.accountNumber, 'accountNumber')} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Copy">
                              {copiedField === 'accountNumber' ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {bankDetails.additionalInfo && <div className="mt-4 pt-4 border-t border-border/50 text-muted-foreground text-sm">{bankDetails.additionalInfo}</div>}
                    </div>
                  ) : bankDetails ? (
                    String(bankDetails)
                  ) : "Contact Admin for Payment details."}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Once you have successfully transferred the funds, please click the button below to notify us.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setPaymentModalOpen(false); setPaymentState("idle"); }} disabled={paymentState === "loading"}>Cancel</Button>
                <Button
                  disabled={paymentState === "loading"}
                  onClick={async () => {
                    if (!selectedForPayment) return;
                    setPaymentState("loading");
                    try {
                      await submissionService.updateStatus(selectedForPayment, "paid");
                      const data = await submissionService.getAll();
                      const userSubmissions = data.filter(s => s.email.toLowerCase() === email.toLowerCase());
                      userSubmissions.sort((a, b) => b.id.localeCompare(a.id));
                      setSubmissions(userSubmissions);
                      setPaymentState("success");
                    } catch (e) {
                      console.error("Payment status update failed", e);
                      setPaymentState("idle");
                    }
                  }}
                >
                  {paymentState === "loading" ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : "I have made Payment"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Dashboard;
