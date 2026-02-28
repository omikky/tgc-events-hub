import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { submissionService, Submission } from "@/lib/submission-service";
import { Clock, CheckCircle, Package, Layers, CalendarHeart, ChevronLeft, ChevronRight, Search, Eye, Download, Loader2, DollarSign, XCircle, Send, Plus, Trash2, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

    useEffect(() => {
        const fetchSubmissions = async () => {
            const data = await submissionService.getAll();
            // Sort newest first by createdAt
            data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setSubmissions(data);
        };
        fetchSubmissions();
    }, []);

    const [actionModalState, setActionModalState] = useState<{
        isOpen: boolean;
        status: "idle" | "loading" | "success" | "error";
        message: string;
    }>({
        isOpen: false,
        status: "idle",
        message: "",
    });

    const [invoiceModal, setInvoiceModal] = useState<{
        isOpen: boolean;
        submissionId: string;
        type: string;
    }>({ isOpen: false, submissionId: "", type: "" });

    const [invoiceItems, setInvoiceItems] = useState<{ name: string, price: string }[]>([{ name: "", price: "" }]);
    const [invoiceData, setInvoiceData] = useState({
        cautionFee: "", logistics: "", vat: "", other: ""
    });

    const handleConfirmBookingClick = (s: Submission) => {
        setInvoiceModal({ isOpen: true, submissionId: s.id, type: s.type });
        setInvoiceItems([{ name: "", price: "" }]);
        setInvoiceData({ cautionFee: "", logistics: "", vat: "", other: "" });
    };

    const handleConfirmWithInvoice = async () => {
        setInvoiceModal({ ...invoiceModal, isOpen: false });

        const validItems = invoiceItems.filter(item => item.name.trim() !== "");
        const actualBill = validItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

        const invoice = {
            items: validItems.map(item => ({ name: item.name, price: Number(item.price) || 0 })),
            actualBill: actualBill,
            cautionFee: Number(invoiceData.cautionFee) || 0,
            logistics: Number(invoiceData.logistics) || 0,
            vat: Number(invoiceData.vat) || 0,
            other: Number(invoiceData.other) || 0,
            total: 0
        };
        invoice.total = invoice.actualBill + invoice.cautionFee + invoice.logistics + invoice.vat + invoice.other;

        await submitStatusChange(invoiceModal.submissionId, "invoiced", invoice);
    };

    const submitStatusChange = async (id: string, status: Submission["status"], invoice?: any) => {
        setActionModalState({ isOpen: true, status: "loading", message: "Updating booking..." });
        try {
            await submissionService.updateStatus(id, status, invoice);
            const data = await submissionService.getAll();
            setSubmissions(data.reverse());
            if (selectedSubmission && selectedSubmission.id === id) {
                setSelectedSubmission({ ...selectedSubmission, status });
            }
            setActionModalState({ isOpen: true, status: "success", message: "Status updated successfully!" });
            setTimeout(() => setActionModalState(prev => ({ ...prev, isOpen: false })), 2000);
        } catch (error) {
            setActionModalState({ isOpen: true, status: "error", message: "Failed to update status." });
            setTimeout(() => setActionModalState(prev => ({ ...prev, isOpen: false })), 3000);
        }
    };

    // Filtering
    const filteredSubmissions = submissions.filter((s) => {
        const matchesTab = activeTab === "all" || s.type === activeTab;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            s.name.toLowerCase().includes(searchLower) ||
            s.email.toLowerCase().includes(searchLower) ||
            s.id.toLowerCase().includes(searchLower);
        return matchesTab && matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredSubmissions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const handleExportCSV = () => {
        const headers = ["ID", "Name", "Email", "Phone", "Type", "Status", "Date"];
        const rows = filteredSubmissions.map(s => [
            s.id, `"${s.name}"`, `"${s.email}"`, `"${s.phone}"`, s.type, s.status, new Date(s.createdAt || Date.now()).toLocaleDateString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tgc_submissions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Successful", description: "Submissions downloaded as CSV." });
    };

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

    const TypeBadge = ({ type }: { type: string }) => {
        return (
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-sm capitalize">
                {type === "rentals" && <Package className="w-4 h-4" />}
                {type === "services" && <CalendarHeart className="w-4 h-4" />}
                {type === "both" && <Layers className="w-4 h-4" />}
                <span>{type}</span>
            </div>
        );
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="font-heading text-3xl font-bold mb-1 border-b-2 border-primary pb-2 inline-block">
                        Submissions
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">Manage all booking and rental requests.</p>
                </motion.div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Link to="/admin/settings/bank">
                        <Button variant="outline" className="bg-background shadow-sm">
                            <Landmark className="w-4 h-4 mr-2" /> Bank Settings
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleExportCSV} className="bg-background shadow-sm">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                        Total: {submissions.length}
                    </Badge>
                </div>
            </div>

            <Card className="shadow-soft border-border/50">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between gap-4 items-center bg-muted/20">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                            <TabsList className="bg-background border shadow-sm h-auto flex-wrap justify-start w-full sm:w-auto">
                                <TabsTrigger value="all" className="px-4 flex-grow sm:flex-grow-0">All</TabsTrigger>
                                <TabsTrigger value="rentals" className="px-4 flex-grow sm:flex-grow-0">Rentals</TabsTrigger>
                                <TabsTrigger value="services" className="px-4 flex-grow sm:flex-grow-0">Services</TabsTrigger>
                                <TabsTrigger value="both" className="px-4 flex-grow sm:flex-grow-0">Pkg (Both)</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-background shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {paginatedSubmissions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                                No submissions found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedSubmissions.map((s) => (
                                            <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell className="font-mono text-xs text-muted-foreground">{s.id.substring(0, 8)}...</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-foreground">{s.name}</span>
                                                        <span className="text-xs text-muted-foreground">{s.email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <TypeBadge type={s.type} />
                                                </TableCell>
                                                <TableCell>
                                                    <StatusBadge status={s.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 shadow-none" onClick={() => setSelectedSubmission(s)}>
                                                                <Eye className="w-4 h-4 mr-2" /> View Details
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle className="flex items-center gap-2 border-b pb-4">
                                                                    Submission <span className="font-mono text-muted-foreground text-sm font-normal">#{s.id}</span>
                                                                    <div className=""><StatusBadge status={s.status} /></div>
                                                                </DialogTitle>
                                                            </DialogHeader>

                                                            <div className="space-y-6 py-4">
                                                                {/* Customer Info */}
                                                                <div className="grid grid-cols-2 gap-4 bg-secondary/50 p-4 rounded-xl">
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Customer Name</p>
                                                                        <p className="font-medium">{s.name}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Email / Phone</p>
                                                                        <p className="font-medium text-sm">{s.email}</p>
                                                                        <p className="font-medium text-sm">{s.phone}</p>
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                        <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Address</p>
                                                                        <p className="font-medium text-sm">{s.address}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Rental Details */}
                                                                {(s.type === "rentals" || s.type === "both") && s.rentalDetails && (
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-heading font-semibold text-primary flex items-center gap-2 border-b pb-2">
                                                                            <Package className="w-4 h-4" /> Rental Details
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <p className="text-xs text-muted-foreground">Date Needed</p>
                                                                                <p className="font-medium text-sm">{s.rentalDetails.date}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-muted-foreground">Location</p>
                                                                                <p className="font-medium text-sm">{s.rentalDetails.location}</p>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <p className="text-xs text-muted-foreground mb-1">Items Requested</p>
                                                                                <div className="bg-background border rounded-lg p-3 text-sm whitespace-pre-wrap">
                                                                                    {s.rentalDetails.items}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Event Details */}
                                                                {(s.type === "services" || s.type === "both") && s.eventDetails && (
                                                                    <div className="space-y-3">
                                                                        <h4 className="font-heading font-semibold text-primary flex items-center gap-2 border-b pb-2">
                                                                            <CalendarHeart className="w-4 h-4" /> Event Details
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 gap-4">
                                                                            <div>
                                                                                <p className="text-xs text-muted-foreground">Event Date</p>
                                                                                <p className="font-medium text-sm">{s.eventDetails.eventDate}</p>
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs text-muted-foreground">Guests / Vendors</p>
                                                                                <p className="font-medium text-sm">{s.eventDetails.guests} Guests, {s.eventDetails.vendors || "0"} Vendors</p>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <p className="text-xs text-muted-foreground">Location</p>
                                                                                <p className="font-medium text-sm">{s.eventDetails.location}</p>
                                                                            </div>
                                                                            <div className="col-span-2">
                                                                                <p className="text-xs text-muted-foreground mb-2">Requested Services</p>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {s.eventDetails.services.map((svc) => (
                                                                                        <Badge key={svc} variant="secondary">{svc}</Badge>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                            {s.eventDetails.items && (
                                                                                <div className="col-span-2">
                                                                                    <p className="text-xs text-muted-foreground mb-1">Additional Items/Additions</p>
                                                                                    <p className="text-sm bg-background border p-2 rounded-md">{s.eventDetails.items}</p>
                                                                                </div>
                                                                            )}
                                                                            {s.eventDetails.details && (
                                                                                <div className="col-span-2">
                                                                                    <p className="text-xs text-muted-foreground mb-1">Additional Details/Requests</p>
                                                                                    <p className="text-sm bg-background border p-2 rounded-md">{s.eventDetails.details}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Invoice Details Display */}
                                                                {s.invoice && (
                                                                    <div className="space-y-3 pt-4 border-t">
                                                                        <h4 className="font-heading font-semibold text-primary flex items-center gap-2 border-b pb-2">
                                                                            <DollarSign className="w-4 h-4" /> Final Invoice Breakdown
                                                                        </h4>
                                                                        <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/30 p-4 rounded-xl">
                                                                            <div className="flex justify-between col-span-2 sm:col-span-1">
                                                                                <span className="text-muted-foreground text-xs uppercase font-semibold">Actual Bill:</span>
                                                                                <span className="font-medium font-mono">₦{(s.invoice.actualBill || 0).toFixed(2)}</span>
                                                                            </div>
                                                                            {(s.type === 'rentals' || s.type === 'both') && (
                                                                                <div className="flex justify-between col-span-2 sm:col-span-1">
                                                                                    <span className="text-muted-foreground text-xs uppercase font-semibold">Caution Fee:</span>
                                                                                    <span className="font-medium font-mono">₦{(s.invoice.cautionFee || 0).toFixed(2)}</span>
                                                                                </div>
                                                                            )}
                                                                            {(s.type === 'services' || s.type === 'both') && (
                                                                                <div className="flex justify-between col-span-2 sm:col-span-1">
                                                                                    <span className="text-muted-foreground text-xs uppercase font-semibold">Logistics:</span>
                                                                                    <span className="font-medium font-mono">₦{(s.invoice.logistics || 0).toFixed(2)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between col-span-2 sm:col-span-1">
                                                                                <span className="text-muted-foreground text-xs uppercase font-semibold">VAT:</span>
                                                                                <span className="font-medium font-mono">₦{(s.invoice.vat || 0).toFixed(2)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between col-span-2 sm:col-span-1">
                                                                                <span className="text-muted-foreground text-xs uppercase font-semibold">Other:</span>
                                                                                <span className="font-medium font-mono">₦{(s.invoice.other || 0).toFixed(2)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between col-span-2 border-t border-border/50 pt-2 mt-2">
                                                                                <span className="text-foreground text-sm uppercase font-bold">Total Amount:</span>
                                                                                <span className="font-bold text-primary text-lg font-mono">₦{(s.invoice.total || 0).toFixed(2)}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Action Buttons */}
                                                                <div className="flex justify-end gap-3 pt-4 border-t">
                                                                    {s.status === "pending" && (
                                                                        <>
                                                                            <Button variant="destructive" onClick={() => submitStatusChange(s.id, "rejected")}>
                                                                                Reject
                                                                            </Button>
                                                                            <Button onClick={() => submitStatusChange(s.id, "confirmed")}>
                                                                                Confirm (Date & Details)
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                    {s.status === "confirmed" && (
                                                                        <Button onClick={() => handleConfirmBookingClick(s)}>
                                                                            Generate Invoice
                                                                        </Button>
                                                                    )}
                                                                    {(s.status === "invoiced" || s.status === "paid") && (
                                                                        <Button onClick={() => submitStatusChange(s.id, "completed")} variant="default" className="bg-green-600 hover:bg-green-700">
                                                                            {s.status === "paid" ? "Verify & Complete" : "Force Complete"}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/10 flex-wrap gap-3">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-medium">{startIndex + 1}</span>–<span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredSubmissions.length)}</span> of <span className="font-medium">{filteredSubmissions.length}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(page)}>
                                        {page}
                                    </Button>
                                ))}
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Action Output Modal */}
            <AlertDialog open={actionModalState.isOpen}>
                <AlertDialogContent className="sm:max-w-md text-center focus:outline-none focus-visible:ring-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="hidden">Status Update</AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="flex flex-col items-center justify-center py-6 space-y-4">
                        {actionModalState.status === "loading" && (
                            <>
                                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                                <p className="text-lg font-medium">{actionModalState.message}</p>
                            </>
                        )}
                        {actionModalState.status === "success" && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <p className="text-lg font-medium text-green-700">{actionModalState.message}</p>
                            </>
                        )}
                        {actionModalState.status === "error" && (
                            <>
                                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                                    <span className="text-2xl font-bold text-destructive">!</span>
                                </div>
                                <p className="text-lg font-medium text-destructive">{actionModalState.message}</p>
                            </>
                        )}
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* Invoice Generation Modal */}
            <Dialog open={invoiceModal.isOpen} onOpenChange={(open) => setInvoiceModal({ ...invoiceModal, isOpen: open })}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Generate Booking Invoice</DialogTitle>
                        <p className="text-sm text-muted-foreground">Confirming will formally generate the invoice amounts.</p>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="space-y-3">
                            <Label>Itemized Bill</Label>
                            {invoiceItems.map((item, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <Input
                                        placeholder="Item description..."
                                        value={item.name}
                                        onChange={(e) => {
                                            const newItems = [...invoiceItems];
                                            newItems[index].name = e.target.value;
                                            setInvoiceItems(newItems);
                                        }}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number" min="0" placeholder="0.00"
                                        value={item.price}
                                        onChange={(e) => {
                                            const newItems = [...invoiceItems];
                                            newItems[index].price = e.target.value;
                                            setInvoiceItems(newItems);
                                        }}
                                        className="w-24"
                                    />
                                    {invoiceItems.length > 1 && (
                                        <Button variant="ghost" size="icon" className="text-destructive h-10 w-10 shrink-0" onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== index))}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setInvoiceItems([...invoiceItems, { name: "", price: "" }])}>
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                            <div className="flex justify-between items-center text-sm font-semibold pt-2">
                                <span className="text-muted-foreground">Subtotal (Actual Bill)</span>
                                <span>₦{invoiceItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0).toFixed(2)}</span>
                            </div>
                        </div>

                        {(invoiceModal.type === 'rentals' || invoiceModal.type === 'both') && (
                            <div className="grid gap-2">
                                <Label htmlFor="cautionFee">Caution Fee / Security Deposit (₦)</Label>
                                <Input id="cautionFee" type="number" min="0" placeholder="0.00" value={invoiceData.cautionFee} onChange={(e) => setInvoiceData({ ...invoiceData, cautionFee: e.target.value })} />
                            </div>
                        )}

                        {(invoiceModal.type === 'services' || invoiceModal.type === 'both') && (
                            <div className="grid gap-2">
                                <Label htmlFor="logistics">Logistics / Travel (₦)</Label>
                                <Input id="logistics" type="number" min="0" placeholder="0.00" value={invoiceData.logistics} onChange={(e) => setInvoiceData({ ...invoiceData, logistics: e.target.value })} />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="vat">VAT / Taxes (₦)</Label>
                                <Input id="vat" type="number" min="0" placeholder="0.00" value={invoiceData.vat} onChange={(e) => setInvoiceData({ ...invoiceData, vat: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="other">Other Fees (₦)</Label>
                                <Input id="other" type="number" min="0" placeholder="0.00" value={invoiceData.other} onChange={(e) => setInvoiceData({ ...invoiceData, other: e.target.value })} />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex justify-between items-center text-lg font-bold">
                            <span>Total calculation:</span>
                            <span className="text-primary font-mono">
                                ₦{(invoiceItems.reduce((acc, item) => acc + (Number(item.price) || 0), 0) + Number(invoiceData.cautionFee || 0) + Number(invoiceData.logistics || 0) + Number(invoiceData.vat || 0) + Number(invoiceData.other || 0)).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInvoiceModal({ ...invoiceModal, isOpen: false })}>Cancel</Button>
                        <Button onClick={handleConfirmWithInvoice}>Confirm & Lock Invoice</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AdminLayout>
    );
};

export default AdminDashboard;
