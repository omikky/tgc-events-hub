import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submissionService, Submission } from "@/lib/submission-service";
import {
    ArrowLeft, User, Phone, Mail, MapPin, Package, CalendarHeart,
    Layers, Clock, CheckCircle, Download, Search, ChevronLeft,
    ChevronRight, XCircle, Send, Eye, DollarSign
} from "lucide-react";
import { ClientData } from "./ClientsList";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ITEMS_PER_PAGE = 5;

const ClientDetails = () => {
    const { email } = useParams<{ email: string }>();
    const decodedEmail = email ? decodeURIComponent(email) : "";
    const [clientData, setClientData] = useState<ClientData | null>(null);
    const [clientSubmissions, setClientSubmissions] = useState<Submission[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<Submission | null>(null); // ✅ FIX: was missing

    // History Filters & Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        const fetchDetails = async () => {
            if (!decodedEmail) return;
            const data = await submissionService.getAll();
            const relevant = data.filter(s => s.email === decodedEmail);

            // Sort by newest first
            relevant.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setClientSubmissions(relevant);

            if (relevant.length > 0) {
                const latest = relevant[0];
                setClientData({
                    name: latest.name,
                    email: latest.email,
                    phone: latest.phone,
                    address: latest.address,
                    totalBookings: relevant.length,
                    lastBookingDate: "Various"
                });
            }
        };
        fetchDetails();
    }, [decodedEmail]);

    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case "confirmed":
                return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed (No Invoice)</Badge>;
            case "invoiced":
                return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200"><Send className="w-3 h-3 mr-1" /> Invoiced</Badge>;
            case "paid":
                return <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-200"><CheckCircle className="w-3 h-3 mr-1" /> Paid (Verify)</Badge>;
            case "completed":
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
            case "rejected":
                return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleExportPDF = () => {
        if (!clientData) return;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("TGC Events Hub - Client Profile", 14, 22);

        doc.setFontSize(14);
        doc.text("Client Information", 14, 38);
        doc.setFontSize(11);
        doc.text(`Name: ${clientData.name}`, 14, 46);
        doc.text(`Email: ${clientData.email}`, 14, 53);
        doc.text(`Phone: ${clientData.phone}`, 14, 60);
        doc.text(`Address: ${clientData.address}`, 14, 67);
        doc.text(`Total Lifetime Bookings: ${clientData.totalBookings}`, 14, 74);

        const tableData = clientSubmissions.map(s => [
            s.id,
            s.type.toUpperCase(),
            s.status.toUpperCase(),
            s.rentalDetails ? s.rentalDetails.date : (s.eventDetails ? s.eventDetails.eventDate : "N/A"),
            s.rentalDetails ? "Yes" : "No",
            s.eventDetails ? "Yes" : "No"
        ]);

        autoTable(doc, {
            startY: 85,
            head: [['Submission ID', 'Type', 'Status', 'Date', 'Rentals', 'Services']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [219, 39, 119] }
        });

        doc.save(`${clientData.name.replace(/\s+/g, '_')}_Profile.pdf`);
        toast({ title: "Export Successful", description: "Client profile downloaded as PDF." });
    };

    // Filter Logic
    const filteredHistory = clientSubmissions.filter((s) => {
        const matchesTab = activeTab === "all" || s.type === activeTab;
        const searchLower = searchQuery.toLowerCase();

        let searchString = `${s.id} ${s.status}`;
        if (s.rentalDetails) searchString += ` ${s.rentalDetails.items} ${s.rentalDetails.location}`;
        if (s.eventDetails) searchString += ` ${s.eventDetails.location} ${s.eventDetails.services.join(" ")}`;

        const matchesSearch = searchString.toLowerCase().includes(searchLower);
        return matchesTab && matchesSearch;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    if (!clientData) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground animate-pulse">Loading client profile...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <Link to="/admin/clients">
                    <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
                    </Button>
                </Link>
                <Button variant="outline" onClick={handleExportPDF} className="bg-background shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Export PDF
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Client Profile Card */}
                <div className="lg:col-span-1">
                    <Card className="shadow-soft border-border/50 sticky top-4">
                        <CardHeader className="text-center pb-2">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-sm">
                                <User className="w-10 h-10 text-primary" />
                            </div>
                            <CardTitle className="font-heading text-2xl font-bold">{clientData.name}</CardTitle>
                            <Badge variant="secondary" className="w-fit mx-auto mt-2">
                                {clientData.totalBookings} Lifetime Bookings
                            </Badge>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex items-center gap-3 text-sm font-body p-3 bg-secondary/50 rounded-xl">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{clientData.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-body p-3 bg-secondary/50 rounded-xl">
                                <Phone className="w-4 h-4 text-primary shrink-0" />
                                <span>{clientData.phone}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm font-body p-3 bg-secondary/50 rounded-xl">
                                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span>{clientData.address}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transaction History */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b pb-4"
                    >
                        <div>
                            <h2 className="font-heading text-2xl font-bold">Booking History</h2>
                            <p className="text-muted-foreground text-sm mt-1">All past and current transactions for this client.</p>
                        </div>
                        <Badge variant="secondary">{filteredHistory.length} Matches</Badge>
                    </motion.div>

                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-muted/20 p-3 rounded-xl border border-border/50">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                            <TabsList className="bg-background border shadow-sm h-9">
                                <TabsTrigger value="all" className="px-3 text-xs">All</TabsTrigger>
                                <TabsTrigger value="rentals" className="px-3 text-xs">Rentals</TabsTrigger>
                                <TabsTrigger value="services" className="px-3 text-xs">Services</TabsTrigger>
                                <TabsTrigger value="both" className="px-3 text-xs">Both</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search history..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-sm bg-background shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Booking Cards */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {paginatedHistory.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-10 border-2 border-dashed rounded-xl text-muted-foreground"
                                >
                                    No history found matching your filters.
                                </motion.div>
                            ) : (
                                paginatedHistory.map((s, idx) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                                    >
                                        <Card
                                            className="shadow-sm border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedHistory(s)}
                                        >
                                            <div className="p-5">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="font-mono text-xs text-muted-foreground bg-muted/20">
                                                            #{s.id.substring(0, 8)}
                                                        </Badge>
                                                        <div className="flex items-center gap-1.5 font-medium text-sm capitalize">
                                                            {s.type === "rentals" && <Package className="w-4 h-4 text-primary" />}
                                                            {s.type === "services" && <CalendarHeart className="w-4 h-4 text-primary" />}
                                                            {s.type === "both" && <Layers className="w-4 h-4 text-primary" />}
                                                            {s.type === "both" ? "Event + Rental" : s.type}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <StatusBadge status={s.status} />
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedHistory(s); }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" /> View
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="grid sm:grid-cols-2 gap-4 text-sm bg-secondary/20 p-4 rounded-xl border border-border/30">
                                                    {(s.type === "rentals" || s.type === "both") && s.rentalDetails && (
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Rental Date</span>
                                                            <p className="font-medium">{s.rentalDetails.date}</p>
                                                            <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{s.rentalDetails.items}</p>
                                                        </div>
                                                    )}
                                                    {(s.type === "services" || s.type === "both") && s.eventDetails && (
                                                        <div className="space-y-1">
                                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Event Date</span>
                                                            <p className="font-medium">{s.eventDetails.eventDate}</p>
                                                            <p className="text-muted-foreground text-xs mt-1 line-clamp-1">{s.eventDetails.location}</p>
                                                        </div>
                                                    )}
                                                    {s.invoice && (
                                                        <div className="space-y-1 sm:col-span-2 border-t border-border/30 pt-3 mt-1">
                                                            <span className="text-xs font-semibold uppercase text-muted-foreground">Invoice Total</span>
                                                            <p className="font-mono font-bold text-primary text-base">
                                                                ₦{(s.invoice.total || 0).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t flex-wrap gap-3">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-medium">{startIndex + 1}</span>–
                                <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)}</span> of{" "}
                                <span className="font-medium">{filteredHistory.length}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline" size="sm" className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        size="sm" className="h-8 w-8 p-0"
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline" size="sm" className="h-8 w-8 p-0"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Booking Detail Dialog */}
            <Dialog open={!!selectedHistory} onOpenChange={(open) => !open && setSelectedHistory(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    {selectedHistory && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {selectedHistory.type === "rentals" && <Package className="w-5 h-5 text-primary" />}
                                    {selectedHistory.type === "services" && <CalendarHeart className="w-5 h-5 text-primary" />}
                                    {selectedHistory.type === "both" && <Layers className="w-5 h-5 text-primary" />}
                                    {selectedHistory.type === "both"
                                        ? "Event + Rental"
                                        : selectedHistory.type.charAt(0).toUpperCase() + selectedHistory.type.slice(1)} Booking
                                </DialogTitle>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="font-mono text-xs text-muted-foreground">{selectedHistory.id}</span>
                                    <StatusBadge status={selectedHistory.status} />
                                </div>
                            </DialogHeader>

                            <div className="space-y-5 py-2">
                                {(selectedHistory.type === "rentals" || selectedHistory.type === "both") && selectedHistory.rentalDetails && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                            <Package className="w-3.5 h-3.5" /> Rental Details
                                        </p>
                                        <div className="bg-secondary/30 rounded-xl p-4 grid sm:grid-cols-3 gap-4 text-sm">
                                            <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{selectedHistory.rentalDetails.date}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selectedHistory.rentalDetails.location}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Items</p><p className="font-medium">{selectedHistory.rentalDetails.items}</p></div>
                                        </div>
                                    </div>
                                )}

                                {(selectedHistory.type === "services" || selectedHistory.type === "both") && selectedHistory.eventDetails && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                            <CalendarHeart className="w-3.5 h-3.5" /> Event Details
                                        </p>
                                        <div className="bg-secondary/30 rounded-xl p-4 grid sm:grid-cols-3 gap-4 text-sm">
                                            <div><p className="text-xs text-muted-foreground">Event Date</p><p className="font-medium">{selectedHistory.eventDetails.eventDate}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{selectedHistory.eventDetails.location}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Guests</p><p className="font-medium">{selectedHistory.eventDetails.guests}</p></div>
                                            <div className="sm:col-span-3">
                                                <p className="text-xs text-muted-foreground mb-1">Services</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {selectedHistory.eventDetails.services?.map(svc => (
                                                        <Badge key={svc} variant="secondary" className="text-xs">{svc}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedHistory.invoice && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                            <DollarSign className="w-3.5 h-3.5" /> Invoice
                                        </p>
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                                            {selectedHistory.invoice.items?.length > 0 && (
                                                <div className="mb-4 space-y-1.5">
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold border-b border-blue-200 pb-2 mb-2">Itemized Bill</p>
                                                    {selectedHistory.invoice.items.map((item, i) => (
                                                        <div key={i} className="flex justify-between text-sm">
                                                            <span className="text-slate-700">{item.name}</span>
                                                            <span className="font-mono font-medium">₦{(item.price || 0).toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-blue-100 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Subtotal</p>
                                                    <p className="font-mono font-bold">₦{(selectedHistory.invoice.actualBill || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Fees</p>
                                                    <p className="font-mono">₦{((selectedHistory.invoice.cautionFee || 0) + (selectedHistory.invoice.logistics || 0)).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase font-semibold">VAT</p>
                                                    <p className="font-mono">₦{(selectedHistory.invoice.vat || 0).toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-primary uppercase font-bold">Total</p>
                                                    <p className="font-mono font-extrabold text-lg text-primary">₦{(selectedHistory.invoice.total || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default ClientDetails;