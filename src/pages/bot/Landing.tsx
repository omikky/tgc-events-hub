import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatMoney, type Plan } from "@/lib/bot-api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
    "Automated scalping strategy with built-in risk management",
    "Link Binance, Bybit, BingX & more — keys encrypted at rest",
    "Auto take-profit and stop-loss on every trade",
    "Telegram alerts and control from your phone",
    "Paper mode to practice before going live",
];

export default function Landing() {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);

    useEffect(() => {
        api.plans().then(setPlans).catch(() => setPlans([]));
    }, []);

    return (
        <div className="min-h-screen bg-background">
            {/* Nav */}
            <header className="flex items-center justify-between border-b px-6 py-4">
                <span className="text-lg font-bold">PDigital Trading Bot</span>
                <nav className="flex items-center gap-3">
                    {user ? (
                        <Button asChild>
                            <Link to={user.role === "admin" ? "/bot/admin" : "/bot/dashboard"}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link to="/bot/login">Sign in</Link>
                            </Button>
                            <Button asChild>
                                <Link to="/bot/register">Get started</Link>
                            </Button>
                        </>
                    )}
                </nav>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-4xl px-6 py-20 text-center">
                <Badge className="mb-4">Automated crypto trading</Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                    Trade smarter with a risk-managed bot
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
                    Subscribe, link your exchange account, and let the bot scalp the market for you —
                    with automatic take-profit, stop-loss and a daily drawdown limit.
                </p>
                <div className="mt-8 flex justify-center gap-3">
                    <Button size="lg" asChild>
                        <Link to={user ? "/bot/dashboard" : "/bot/register"}>Start now</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <a href="#pricing">View pricing</a>
                    </Button>
                </div>
                <p className="mt-6 text-xs text-muted-foreground">
                    Trading carries risk. No bot guarantees profit. Use only funds you can afford to lose.
                </p>
            </section>

            {/* Features */}
            <section className="mx-auto max-w-4xl px-6 pb-12">
                <div className="grid gap-4 sm:grid-cols-2">
                    {FEATURES.map((f) => (
                        <div key={f} className="flex items-start gap-3 rounded-lg border p-4">
                            <span className="text-primary">✓</span>
                            <span className="text-sm">{f}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="mx-auto max-w-5xl px-6 py-16">
                <h2 className="mb-8 text-center text-3xl font-bold">Pricing</h2>
                {plans.length === 0 ? (
                    <p className="text-center text-muted-foreground">Plans coming soon. Check back shortly.</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-3">
                        {plans.map((plan) => (
                            <Card key={plan._id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col">
                                    <div className="mb-4">
                                        <span className="text-3xl font-bold">{formatMoney(plan.amount, plan.currency)}</span>
                                        <span className="text-muted-foreground"> / {plan.intervalDays} days</span>
                                    </div>
                                    <Button className="mt-auto w-full" asChild>
                                        <Link to={user ? "/bot/dashboard" : "/bot/register"}>Subscribe</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} PDigital Trading Bot. For educational use. Not financial advice.
            </footer>
        </div>
    );
}
