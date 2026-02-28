import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { submissionService, Submission } from "@/lib/submission-service";
import { ChevronLeft, ChevronRight, Search, Eye, Users, Download, Plus, Mail, Phone, MapPin, Package, CalendarHeart, Layers, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

export interface ClientData {
    name: string;
    email: string;
    phone: string;
    address: string;
    totalBookings: number;
    lastBookingDate: string;
}

type BookingType = "client" | "rentals" | "services" | "both";

const SERVICE_OPTIONS = [
    "Decorations", "Catering", "Drop-off Menu Order",
    "Event Coordination", "DJ / Music", "Photography",
    "Venue Setup", "Other (Please specify)",
];

const defaultForm = {
    name: "", email: "", phone: "", address: "",
    type: "client" as BookingType,
    // Rental fields
    rentalItems: "", rentalDate: "", rentalLocation: "",
    // Service / Event fields
    eventDate: "", guests: "", eventLocation: "", vendors: "", details: "",
    services: [] as string[],
};

const ClientsList = () => {
    const [clients, setClients] = useState<ClientData[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

    const [form, setForm] = useState(defaultForm);
    const [isAdding, setIsAdding] = useState(false);

    const fetchAndExtractClients = async () => {
        const data = await submissionService.getAll();
        const clientMap = new Map<string, ClientData>();

        data.forEach((sub) => {
            const existing = clientMap.get(sub.email);
            let subDate = "";
            if (sub.type === "rentals" && sub.rentalDetails) subDate = sub.rentalDetails.date;
            if (sub.type === "services" && sub.eventDetails) subDate = sub.eventDetails.eventDate;
            if (sub.type === "both" && sub.eventDetails) subDate = sub.eventDetails.eventDate;
            if (sub.type === "client") subDate = new Date(sub.createdAt || Date.now()).toLocaleDateString();

            if (existing) {
                if (sub.type !== "client") existing.totalBookings += 1;
                if (subDate && subDate !== "N/A") existing.lastBookingDate = subDate;
            } else {
                clientMap.set(sub.email, {
                    name: sub.name,
                    email: sub.email,
                    phone: sub.phone,
                    address: sub.address,
                    totalBookings: sub.type === "client" ? 0 : 1,
                    lastBookingDate: subDate || "N/A"
                });
            }
        });

        const uniqueClients = Array.from(clientMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
        setClients(uniqueClients);
    };

    useEffect(() => {
        fetchAndExtractClients();
    }, []);

    // Filtering
    const filteredClients = clients.filter((c) => {
        const searchLower = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(searchLower) ||
            c.email.toLowerCase().includes(searchLower) ||
            c.phone.includes(searchLower)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleExportCSV = () => {
        const headers = ["Name", "Email", "Phone", "Address", "Total Bookings", "Last Booking Date"];
        const rows = filteredClients.map(c => [
            `"${c.name}"`, `"${c.email}"`, `"${c.phone}"`, `"${c.address}"`, c.totalBookings, `"${c.lastBookingDate}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "tgc_clients.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Export Successful", description: "Your clients list has been downloaded CSV." });
    };

    const toggleService = (svc: string) => {
        setForm(prev => ({
            ...prev,
            services: prev.services.includes(svc)
                ? prev.services.filter(s => s !== svc)
                : [...prev.services, svc]
        }));
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const payload: any = {
                type: form.type,
                name: form.name,
                email: form.email,
                phone: form.phone,
                address: form.address,
            };

            if (form.type === "rentals" || form.type === "both") {
                payload.rentalDetails = {
                    items: form.rentalItems,
                    date: form.rentalDate,
                    location: form.rentalLocation,
                };
            }

            if (form.type === "services" || form.type === "both") {
                payload.eventDetails = {
                    eventDate: form.eventDate,
                    guests: form.guests,
                    location: form.eventLocation,
                    vendors: form.vendors,
                    services: form.services,
                    details: form.details,
                };
            }

            await submissionService.submit(payload);
            toast({ title: "Booking Added", description: `${form.name}'s booking has been successfully created.` });
            setIsAddClientOpen(false);
            setForm(defaultForm);
            fetchAndExtractClients();
        } catch (error) {
            toast({ title: "Failed to Add Client", variant: "destructive" });
        } finally {
            setIsAdding(false);
        }
    };

    const BookingTypeCard = ({ type, label, icon: Icon, desc }: { type: BookingType; label: string; icon: any; desc: string }) => (
        <button
            type="button"
            onClick={() => setForm(prev => ({ ...prev, type }))}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${form.type === type
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border bg-background hover:border-primary/40"
                }`}
        >
            <Icon className={`w-6 h-6 mb-2 ${form.type === type ? "text-primary" : "text-muted-foreground"}`} />
            <p className="font-semibold text-sm text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </button>
    );

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="font-heading text-3xl font-bold mb-1 border-b-2 border-primary pb-2 inline-flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" /> Clients Directory
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">Manage and view your customer directory.</p>
                </motion.div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleExportCSV} className="bg-background">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                    <Dialog open={isAddClientOpen} onOpenChange={(open) => { setIsAddClientOpen(open); if (!open) setForm(defaultForm); }}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground">
                                <Plus className="w-4 h-4 mr-2" /> Add Booking
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <form onSubmit={handleAddClient}>
                                <DialogHeader>
                                    <DialogTitle>Add New Client / Booking</DialogTitle>
                                    <p className="text-sm text-muted-foreground">Fill in the client's details and select a booking type.</p>
                                </DialogHeader>
                                <div className="space-y-6 py-4">

                                    {/* Contact Info */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Contact Information</p>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-name">Full Name *</Label>
                                                <Input id="ac-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Adaeze Okafor" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-email">Email Address *</Label>
                                                <Input id="ac-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-phone">Phone Number *</Label>
                                                <Input id="ac-phone" type="tel" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 08012345678" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-address">Address *</Label>
                                                <Input id="ac-address" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Client's address" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Booking Type Selector */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Booking Type</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <BookingTypeCard type="client" label="Client Only" icon={Users} desc="Add to directory, no booking" />
                                            <BookingTypeCard type="rentals" label="Rentals" icon={Package} desc="Rent items for their event" />
                                            <BookingTypeCard type="services" label="Services" icon={CalendarHeart} desc="Event management services" />
                                            <BookingTypeCard type="both" label="Both" icon={Layers} desc="Rentals + Event services" />
                                        </div>
                                    </div>

                                    {/* Rental Details */}
                                    {(form.type === "rentals" || form.type === "both") && (
                                        <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
                                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                                <Package className="w-4 h-4" /> Rental Details
                                            </p>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-ritems">Items Requested *</Label>
                                                <Textarea id="ac-ritems" required={form.type === "rentals" || form.type === "both"} value={form.rentalItems} onChange={e => setForm({ ...form, rentalItems: e.target.value })} placeholder="e.g. 10 chairs, 2 canopies, 1 generator..." className="min-h-[80px]" />
                                            </div>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-rdate">Rental Date *</Label>
                                                    <Input id="ac-rdate" type="date" required={form.type === "rentals" || form.type === "both"} value={form.rentalDate} onChange={e => setForm({ ...form, rentalDate: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-rlocation">Delivery Location *</Label>
                                                    <Input id="ac-rlocation" required={form.type === "rentals" || form.type === "both"} value={form.rentalLocation} onChange={e => setForm({ ...form, rentalLocation: e.target.value })} placeholder="Where to deliver" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Event / Service Details */}
                                    {(form.type === "services" || form.type === "both") && (
                                        <div className="space-y-3 p-4 bg-secondary/20 rounded-xl border border-border/50">
                                            <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                                <CalendarHeart className="w-4 h-4" /> Event Details
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-edate">Event Date *</Label>
                                                    <Input id="ac-edate" type="date" required={form.type === "services" || form.type === "both"} value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-guests">Number of Guests *</Label>
                                                    <Input id="ac-guests" required={form.type === "services" || form.type === "both"} value={form.guests} onChange={e => setForm({ ...form, guests: e.target.value })} placeholder="e.g. 200" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-elocation">Event Location *</Label>
                                                    <Input id="ac-elocation" required={form.type === "services" || form.type === "both"} value={form.eventLocation} onChange={e => setForm({ ...form, eventLocation: e.target.value })} placeholder="Venue address" />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="ac-vendors">Preferred Vendors</Label>
                                                    <Input id="ac-vendors" value={form.vendors} onChange={e => setForm({ ...form, vendors: e.target.value })} placeholder="Optional" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Services Required *</Label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                    {SERVICE_OPTIONS.map(svc => (
                                                        <label key={svc} className={`flex items-center gap-2 text-sm p-2.5 rounded-lg border cursor-pointer transition-all ${form.services.includes(svc) ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={form.services.includes(svc)}
                                                                onChange={() => toggleService(svc)}
                                                            />
                                                            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${form.services.includes(svc) ? "bg-primary border-primary" : "border-muted-foreground"}`}>
                                                                {form.services.includes(svc) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </span>
                                                            {svc}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="ac-details">Additional Notes</Label>
                                                <Textarea id="ac-details" value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Any other information..." className="min-h-[70px]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={isAdding}>
                                        {isAdding ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Booking"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <div className="bg-secondary px-4 py-2 rounded-xl text-sm font-medium shadow-sm border border-border">
                        Total Clients: <span className="text-primary font-bold">{clients.length}</span>
                    </div>
                </div>
            </div>

            <Card className="shadow-soft border-border/50">
                <CardContent className="p-0">
                    <div className="p-4 border-b border-border/50 flex justify-end bg-muted/20">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search clients by name, email, or phone..."
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
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Contact Info</TableHead>
                                    <TableHead className="text-center">Total Bookings</TableHead>
                                    <TableHead>Last Booking Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {paginatedClients.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                                                No clients found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedClients.map((client) => (
                                            <TableRow
                                                key={client.email}
                                                className="group hover:bg-muted/30 transition-colors cursor-pointer"
                                                onClick={() => setSelectedClient(client)}
                                            >
                                                <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">{client.email}</span>
                                                        <span className="text-xs text-muted-foreground">{client.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                        {client.totalBookings}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{client.lastBookingDate}</TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    <Link to={`/admin/clients/${encodeURIComponent(client.email)}`}>
                                                        <Button variant="ghost" size="sm" className="h-8 shadow-none group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                            <Eye className="w-4 h-4 mr-2" /> Full Profile
                                                        </Button>
                                                    </Link>
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
                                Showing <span className="font-medium">{startIndex + 1}</span>–<span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)}</span> of <span className="font-medium">{filteredClients.length}</span> clients
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

            {/* Quick View Modal */}
            <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Client Quick View</DialogTitle>
                    </DialogHeader>
                    {selectedClient && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold font-heading">{selectedClient.name}</h3>
                                    <Badge variant="secondary" className="mt-1">{selectedClient.totalBookings} Total Bookings</Badge>
                                </div>
                            </div>
                            <div className="space-y-3 bg-secondary/50 p-4 rounded-xl border border-border/50">
                                <div className="flex items-center gap-3 text-sm font-body">
                                    <Mail className="w-4 h-4 text-primary shrink-0" />
                                    <span>{selectedClient.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-body">
                                    <Phone className="w-4 h-4 text-primary shrink-0" />
                                    <span>{selectedClient.phone}</span>
                                </div>
                                <div className="flex items-start gap-3 text-sm font-body">
                                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span>{selectedClient.address}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {selectedClient && (
                            <Link to={`/admin/clients/${encodeURIComponent(selectedClient.email)}`} className="w-full">
                                <Button className="w-full" onClick={() => setSelectedClient(null)}>View Full Profile & Transactions</Button>
                            </Link>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </AdminLayout>
    );
};

export default ClientsList;
