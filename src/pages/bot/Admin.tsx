import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, formatMoney, type Plan, type Payment, type Complaint, type User, type Subscription } from "@/lib/bot-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Admin() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="flex items-center justify-between border-b bg-background px-6 py-4">
                <span className="font-bold">PDigital Admin</span>
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{user?.email}</span>
                    <Button size="sm" variant="outline" onClick={() => navigate("/bot/dashboard")}>User view</Button>
                    <Button size="sm" variant="ghost" onClick={() => { logout(); navigate("/bot/login"); }}>Log out</Button>
                </div>
            </header>
            <main className="mx-auto max-w-6xl space-y-6 p-6">
                <Stats />
                <Tabs defaultValue="payments">
                    <TabsList>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                        <TabsTrigger value="plans">Plans</TabsTrigger>
                        <TabsTrigger value="settings">Payment settings</TabsTrigger>
                        <TabsTrigger value="complaints">Complaints</TabsTrigger>
                    </TabsList>
                    <TabsContent value="payments"><PaymentsAdmin /></TabsContent>
                    <TabsContent value="subscribers"><SubscribersAdmin /></TabsContent>
                    <TabsContent value="plans"><PlansAdmin /></TabsContent>
                    <TabsContent value="settings"><SettingsAdmin /></TabsContent>
                    <TabsContent value="complaints"><ComplaintsAdmin /></TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function Stats() {
    const [s, setS] = useState<{ users: number; activeSubs: number; pendingPayments: number; openComplaints: number; revenue: Array<{ _id: string; total: number }> } | null>(null);
    useEffect(() => { adminApi.stats().then(setS).catch(() => {}); }, []);
    const cells = [
        { label: "Subscribers", value: s?.users ?? "—" },
        { label: "Active subs", value: s?.activeSubs ?? "—" },
        { label: "Pending payments", value: s?.pendingPayments ?? "—" },
        { label: "Open complaints", value: s?.openComplaints ?? "—" },
    ];
    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cells.map((c) => (
                <Card key={c.label}><CardContent className="p-4"><div className="text-2xl font-bold">{c.value}</div><div className="text-sm text-muted-foreground">{c.label}</div></CardContent></Card>
            ))}
        </div>
    );
}

function PaymentsAdmin() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [filter, setFilter] = useState<string>("pending");
    const load = useCallback(() => { adminApi.payments(filter || undefined).then(setPayments).catch(() => {}); }, [filter]);
    useEffect(() => { load(); }, [load]);

    const confirm = async (id: string) => {
        try { await adminApi.confirmPayment(id); toast.success("Confirmed & subscription extended"); load(); }
        catch (err) { toast.error((err as Error).message); }
    };
    const reject = async (id: string) => {
        try { await adminApi.rejectPayment(id); toast.success("Rejected"); load(); }
        catch (err) { toast.error((err as Error).message); }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Payments</CardTitle>
                <div className="flex gap-2">
                    {["pending", "success", "failed", ""].map((f) => (
                        <Button key={f || "all"} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f || "all"}</Button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow><TableHead>User</TableHead><TableHead>Plan</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Ref / Tx</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.map((p) => (
                            <TableRow key={p._id}>
                                <TableCell>{p.user?.email}</TableCell>
                                <TableCell>{p.planName}</TableCell>
                                <TableCell>{formatMoney(p.amount, p.currency)}</TableCell>
                                <TableCell>{p.method}</TableCell>
                                <TableCell className="max-w-[160px] truncate font-mono text-xs">{p.cryptoTxHash || p.reference}</TableCell>
                                <TableCell><Badge variant={p.status === "success" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>{p.status}</Badge></TableCell>
                                <TableCell>
                                    {p.status === "pending" && (
                                        <div className="flex gap-1">
                                            <Button size="sm" onClick={() => confirm(p._id)}>Confirm</Button>
                                            <Button size="sm" variant="ghost" onClick={() => reject(p._id)}>Reject</Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {payments.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No payments</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function SubscribersAdmin() {
    const [rows, setRows] = useState<Array<User & { subscription: Subscription | null }>>([]);
    useEffect(() => { adminApi.subscribers().then(setRows).catch(() => {}); }, []);
    return (
        <Card>
            <CardHeader><CardTitle>Subscribers</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead>Due date</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {rows.map((r) => (
                            <TableRow key={r.id}>
                                <TableCell>{r.name}</TableCell>
                                <TableCell>{r.email}</TableCell>
                                <TableCell>{r.phone || "—"}</TableCell>
                                <TableCell><Badge variant={r.subscription?.status === "active" ? "default" : "secondary"}>{r.subscription?.status || "none"}</Badge></TableCell>
                                <TableCell>{r.subscription?.dueDate ? new Date(r.subscription.dueDate).toLocaleDateString() : "—"}</TableCell>
                            </TableRow>
                        ))}
                        {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No subscribers</TableCell></TableRow>}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function PlansAdmin() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [form, setForm] = useState({ name: "", amount: "", currency: "NGN", intervalDays: "30", description: "", paystackPlanCode: "" });
    const load = useCallback(() => { adminApi.plans().then(setPlans).catch(() => {}); }, []);
    useEffect(() => { load(); }, [load]);

    const create = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await adminApi.createPlan({
                name: form.name,
                amount: Math.round(Number(form.amount) * 100), // major -> minor units
                currency: form.currency,
                intervalDays: Number(form.intervalDays),
                description: form.description,
                paystackPlanCode: form.paystackPlanCode || undefined,
            });
            toast.success("Plan created");
            setForm({ name: "", amount: "", currency: "NGN", intervalDays: "30", description: "", paystackPlanCode: "" });
            load();
        } catch (err) { toast.error((err as Error).message); }
    };
    const remove = async (id: string) => { await adminApi.deletePlan(id); toast.success("Plan deactivated"); load(); };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Create plan</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={create} className="space-y-3">
                        <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label>Price (major units)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                            <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
                        </div>
                        <div className="space-y-2"><Label>Interval (days)</Label><Input type="number" value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                        <div className="space-y-2"><Label>Paystack plan code (optional, for auto-renew)</Label><Input value={form.paystackPlanCode} onChange={(e) => setForm({ ...form, paystackPlanCode: e.target.value })} /></div>
                        <Button type="submit">Create</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Existing plans</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {plans.map((p) => (
                        <div key={p._id} className="flex items-center justify-between rounded border p-3 text-sm">
                            <div>
                                <div className="font-medium">{p.name} · {formatMoney(p.amount, p.currency)}/{p.intervalDays}d {!p.active && <Badge variant="secondary">inactive</Badge>}</div>
                                <div className="text-xs text-muted-foreground">{p.description}</div>
                            </div>
                            {p.active && <Button size="sm" variant="ghost" onClick={() => remove(p._id)}>Deactivate</Button>}
                        </div>
                    ))}
                    {plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
                </CardContent>
            </Card>
        </div>
    );
}

function SettingsAdmin() {
    const [wallets, setWallets] = useState<Array<{ asset: string; network: string; address: string }>>([]);
    const [bank, setBank] = useState("");

    useEffect(() => {
        adminApi.getSetting("cryptoWallets").then((r) => setWallets((r.value as typeof wallets) || [])).catch(() => {});
        adminApi.getSetting("bankDetails").then((r) => setBank((r.value as string) || "")).catch(() => {});
    }, []);

    const addWallet = () => setWallets([...wallets, { asset: "USDT", network: "TRON (TRC20)", address: "" }]);
    const updateWallet = (i: number, k: string, v: string) => setWallets(wallets.map((w, idx) => (idx === i ? { ...w, [k]: v } : w)));
    const removeWallet = (i: number) => setWallets(wallets.filter((_, idx) => idx !== i));

    const save = async () => {
        try {
            await adminApi.putSetting("cryptoWallets", wallets);
            await adminApi.putSetting("bankDetails", bank);
            toast.success("Payment settings saved");
        } catch (err) { toast.error((err as Error).message); }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Payment settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Crypto wallet addresses</Label>
                        <Button size="sm" variant="outline" onClick={addWallet}>Add wallet</Button>
                    </div>
                    {wallets.map((w, i) => (
                        <div key={i} className="grid grid-cols-1 gap-2 rounded border p-3 md:grid-cols-[1fr_1fr_2fr_auto]">
                            <Input placeholder="Asset (USDT)" value={w.asset} onChange={(e) => updateWallet(i, "asset", e.target.value)} />
                            <Input placeholder="Network" value={w.network} onChange={(e) => updateWallet(i, "network", e.target.value)} />
                            <Input placeholder="Address" value={w.address} onChange={(e) => updateWallet(i, "address", e.target.value)} />
                            <Button variant="ghost" size="sm" onClick={() => removeWallet(i)}>✕</Button>
                        </div>
                    ))}
                </div>
                <div className="space-y-2">
                    <Label>Bank / payment instructions (shown to users)</Label>
                    <Textarea value={bank} onChange={(e) => setBank(e.target.value)} rows={3} />
                </div>
                <Button onClick={save}>Save settings</Button>
                <p className="text-xs text-muted-foreground">Note: Paystack keys are configured via server environment variables, not here.</p>
            </CardContent>
        </Card>
    );
}

function ComplaintsAdmin() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [responses, setResponses] = useState<Record<string, string>>({});
    const load = useCallback(() => { adminApi.complaints().then(setComplaints).catch(() => {}); }, []);
    useEffect(() => { load(); }, [load]);

    const respond = async (id: string, resolve: boolean) => {
        try {
            await adminApi.respondComplaint(id, responses[id] || "", resolve);
            toast.success(resolve ? "Responded & resolved" : "Response sent");
            load();
        } catch (err) { toast.error((err as Error).message); }
    };

    return (
        <Card>
            <CardHeader><CardTitle>Complaints</CardTitle></CardHeader>
            <CardContent className="space-y-3">
                {complaints.length === 0 && <p className="text-sm text-muted-foreground">No complaints.</p>}
                {complaints.map((c) => (
                    <div key={c._id} className="rounded border p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">{c.subject} <span className="text-muted-foreground">· {c.user?.email}</span></span>
                            <Badge variant={c.status === "resolved" ? "default" : "secondary"}>{c.status}</Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground">{c.message}</p>
                        {c.adminResponse && <p className="mt-2 rounded bg-muted p-2"><strong>Replied:</strong> {c.adminResponse}</p>}
                        {c.status !== "resolved" && (
                            <div className="mt-2 space-y-2">
                                <Textarea placeholder="Write a response…" value={responses[c._id] || ""} onChange={(e) => setResponses({ ...responses, [c._id]: e.target.value })} rows={2} />
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => respond(c._id, false)}>Send</Button>
                                    <Button size="sm" variant="outline" onClick={() => respond(c._id, true)}>Send & resolve</Button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
