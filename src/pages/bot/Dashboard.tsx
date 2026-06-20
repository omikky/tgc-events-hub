import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
    api,
    formatMoney,
    type Plan,
    type Subscription,
    type Payment,
    type ExchangeAccount,
    type Complaint,
} from "@/lib/bot-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function StatusBadge({ sub, active }: { sub: Subscription | null; active: boolean }) {
    if (active) return <Badge className="bg-green-600">Active</Badge>;
    if (!sub || sub.status === "inactive") return <Badge variant="secondary">No subscription</Badge>;
    return <Badge variant="destructive">{sub.status}</Badge>;
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();

    const [plans, setPlans] = useState<Plan[]>([]);
    const [sub, setSub] = useState<Subscription | null>(null);
    const [active, setActive] = useState(false);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [accounts, setAccounts] = useState<ExchangeAccount[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);

    const loadAll = useCallback(async () => {
        const [p, s, a, c] = await Promise.all([
            api.plans().catch(() => []),
            api.subscription().catch(() => ({ subscription: null, active: false, payments: [] })),
            api.exchangeAccounts().catch(() => []),
            api.complaints().catch(() => []),
        ]);
        setPlans(p);
        setSub(s.subscription);
        setActive(s.active);
        setPayments(s.payments);
        setAccounts(a);
        setComplaints(c);
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // If we returned from a Paystack checkout, verify the reference.
    useEffect(() => {
        const ref = params.get("ref");
        if (!ref) return;
        api.verifyPaystack(ref)
            .then((r) => {
                if (r.status === "success") toast.success("Payment confirmed — subscription updated!");
                else toast.message("Payment is still processing.");
            })
            .catch(() => {})
            .finally(() => {
                params.delete("ref");
                setParams(params, { replace: true });
                loadAll();
            });
    }, [params, setParams, loadAll]);

    const payWithPaystack = async (planId: string) => {
        try {
            const { authorizationUrl } = await api.payPaystack(planId);
            window.location.href = authorizationUrl;
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="flex items-center justify-between border-b bg-background px-6 py-4">
                <span className="font-bold">PDigital Trading Bot</span>
                <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">{user?.email}</span>
                    {user?.role === "admin" && (
                        <Button size="sm" variant="outline" onClick={() => navigate("/bot/admin")}>
                            Admin
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => { logout(); navigate("/bot/login"); }}>
                        Log out
                    </Button>
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-6 p-6">
                {/* Subscription status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Your subscription</CardTitle>
                            <CardDescription>{sub?.planName || "Choose a plan below to get started"}</CardDescription>
                        </div>
                        <StatusBadge sub={sub} active={active} />
                    </CardHeader>
                    <CardContent>
                        {active && sub?.dueDate ? (
                            <p className="text-sm">
                                Renews / expires on{" "}
                                <strong>{new Date(sub.dueDate).toLocaleDateString(undefined, { dateStyle: "medium" } as Intl.DateTimeFormatOptions)}</strong>
                                {" "}({Math.max(0, Math.ceil((new Date(sub.dueDate).getTime() - Date.now()) / 86400000))} days left)
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">You don't have an active subscription yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Tabs defaultValue="subscribe">
                    <TabsList>
                        <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
                        <TabsTrigger value="accounts">Exchange accounts</TabsTrigger>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="support">Support</TabsTrigger>
                    </TabsList>

                    <TabsContent value="subscribe">
                        <SubscribeTab plans={plans} onPaystack={payWithPaystack} onReload={loadAll} />
                    </TabsContent>
                    <TabsContent value="accounts">
                        <AccountsTab accounts={accounts} onReload={loadAll} />
                    </TabsContent>
                    <TabsContent value="payments">
                        <PaymentsTab payments={payments} />
                    </TabsContent>
                    <TabsContent value="support">
                        <SupportTab complaints={complaints} onReload={loadAll} />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function SubscribeTab({ plans, onPaystack, onReload }: { plans: Plan[]; onPaystack: (id: string) => void; onReload: () => void }) {
    const [cryptoPlan, setCryptoPlan] = useState<Plan | null>(null);
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                {plans.length === 0 && <p className="text-muted-foreground">No plans available yet.</p>}
                {plans.map((plan) => (
                    <Card key={plan._id}>
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-2xl font-bold">
                                {formatMoney(plan.amount, plan.currency)}
                                <span className="text-sm font-normal text-muted-foreground"> / {plan.intervalDays}d</span>
                            </div>
                            <Button className="w-full" onClick={() => onPaystack(plan._id)}>
                                Pay with card / bank
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => setCryptoPlan(plan)}>
                                Pay with crypto
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {cryptoPlan && <CryptoPay plan={cryptoPlan} onClose={() => setCryptoPlan(null)} onReload={onReload} />}
        </div>
    );
}

function CryptoPay({ plan, onClose, onReload }: { plan: Plan; onClose: () => void; onReload: () => void }) {
    const [wallets, setWallets] = useState<Array<{ asset: string; network: string; address: string }>>([]);
    const [form, setForm] = useState({ asset: "USDT", network: "TRON (TRC20)", txHash: "" });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.cryptoAddresses().then((r) => setWallets(r.wallets || [])).catch(() => setWallets([]));
    }, []);

    const submit = async () => {
        if (!form.txHash) return toast.error("Enter the transaction hash");
        setLoading(true);
        try {
            await api.submitCrypto({ planId: plan._id, ...form });
            toast.success("Submitted! Your subscription activates once we confirm the transfer.");
            onClose();
            onReload();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-primary">
            <CardHeader>
                <CardTitle>Pay {formatMoney(plan.amount, plan.currency)} with crypto</CardTitle>
                <CardDescription>Send the equivalent amount, then submit your transaction hash for confirmation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {wallets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No wallet addresses configured yet. Please contact support.</p>
                ) : (
                    <div className="space-y-2">
                        {wallets.map((w, i) => (
                            <div key={i} className="rounded border p-3 text-sm">
                                <div className="font-medium">{w.asset} · {w.network}</div>
                                <div className="break-all font-mono text-xs">{w.address}</div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Transaction hash</Label>
                    <Input value={form.txHash} onChange={(e) => setForm({ ...form, txHash: e.target.value })} placeholder="0x… / tx id" />
                </div>
                <div className="flex gap-2">
                    <Button onClick={submit} disabled={loading}>{loading ? "Submitting…" : "I've paid — submit"}</Button>
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function AccountsTab({ accounts, onReload }: { accounts: ExchangeAccount[]; onReload: () => void }) {
    const [form, setForm] = useState({ exchange: "binance", label: "", apiKey: "", apiSecret: "", passphrase: "" });
    const [loading, setLoading] = useState(false);

    const link = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.linkExchange(form);
            toast.success("Account linked securely.");
            setForm({ exchange: "binance", label: "", apiKey: "", apiSecret: "", passphrase: "" });
            onReload();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const unlink = async (id: string) => {
        try {
            await api.unlinkExchange(id);
            toast.success("Account removed.");
            onReload();
        } catch (err) {
            toast.error((err as Error).message);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Link an exchange</CardTitle>
                    <CardDescription>Use API keys with TRADE permission only — never enable withdrawals. Keys are encrypted at rest.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={link} className="space-y-3">
                        <div className="space-y-2">
                            <Label>Exchange</Label>
                            <Select value={form.exchange} onValueChange={(v) => setForm({ ...form, exchange: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["binance", "bybit", "bingx", "okx", "kucoin", "kraken"].map((x) => (
                                        <SelectItem key={x} value={x}>{x}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label>Label (optional)</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
                        <div className="space-y-2"><Label>API key</Label><Input value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>API secret</Label><Input type="password" value={form.apiSecret} onChange={(e) => setForm({ ...form, apiSecret: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Passphrase (OKX/KuCoin)</Label><Input type="password" value={form.passphrase} onChange={(e) => setForm({ ...form, passphrase: e.target.value })} /></div>
                        <Button type="submit" disabled={loading}>{loading ? "Linking…" : "Link account"}</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Linked accounts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {accounts.length === 0 && <p className="text-sm text-muted-foreground">No accounts linked yet.</p>}
                    {accounts.map((a) => (
                        <div key={a.id} className="flex items-center justify-between rounded border p-3">
                            <div>
                                <div className="font-medium capitalize">{a.exchange} <span className="text-muted-foreground">· {a.label}</span></div>
                                <div className="text-xs text-muted-foreground">Key ••••{a.apiKeyLast4}</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => unlink(a.id)}>Remove</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function PaymentsTab({ payments }: { payments: Payment[] }) {
    return (
        <Card>
            <CardHeader><CardTitle>Payment history</CardTitle></CardHeader>
            <CardContent className="space-y-2">
                {payments.length === 0 && <p className="text-sm text-muted-foreground">No payments yet.</p>}
                {payments.map((p) => (
                    <div key={p._id} className="flex items-center justify-between rounded border p-3 text-sm">
                        <div>
                            <div className="font-medium">{p.planName} · {formatMoney(p.amount, p.currency)}</div>
                            <div className="text-xs text-muted-foreground">{p.method} · {new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                        <Badge variant={p.status === "success" ? "default" : p.status === "pending" ? "secondary" : "destructive"}>{p.status}</Badge>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function SupportTab({ complaints, onReload }: { complaints: Complaint[]; onReload: () => void }) {
    const [form, setForm] = useState({ subject: "", message: "" });
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.submitComplaint(form);
            toast.success("Sent. We'll get back to you.");
            setForm({ subject: "", message: "" });
            onReload();
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader><CardTitle>Contact support</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-3">
                        <div className="space-y-2"><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
                        <div className="space-y-2"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} /></div>
                        <Button type="submit" disabled={loading}>{loading ? "Sending…" : "Send"}</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Your tickets</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {complaints.length === 0 && <p className="text-sm text-muted-foreground">No tickets yet.</p>}
                    {complaints.map((c) => (
                        <div key={c._id} className="rounded border p-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{c.subject}</span>
                                <Badge variant={c.status === "resolved" ? "default" : "secondary"}>{c.status}</Badge>
                            </div>
                            <p className="mt-1 text-muted-foreground">{c.message}</p>
                            {c.adminResponse && <p className="mt-2 rounded bg-muted p-2"><strong>Support:</strong> {c.adminResponse}</p>}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
