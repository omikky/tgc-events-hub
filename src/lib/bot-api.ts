// API client for the trading-bot subscription platform.
const BASE_URL = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";

const TOKEN_KEY = "tgc_bot_token";

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = tokenStore.get();
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
    }
    return data as T;
}

// ---- Types ----
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: "user" | "admin";
    createdAt?: string;
}
export interface Plan {
    _id: string;
    name: string;
    amount: number;
    currency: string;
    intervalDays: number;
    description?: string;
    active: boolean;
    paystackPlanCode?: string;
}
export interface Subscription {
    _id: string;
    status: "inactive" | "active" | "expired" | "cancelled";
    planName?: string;
    startedAt?: string;
    dueDate?: string;
    provider?: string;
}
export interface Payment {
    _id: string;
    planName?: string;
    amount: number;
    currency: string;
    method: "paystack" | "crypto";
    status: "pending" | "success" | "failed";
    reference?: string;
    cryptoTxHash?: string;
    createdAt: string;
    user?: { name: string; email: string };
}
export interface ExchangeAccount {
    id: string;
    exchange: string;
    label?: string;
    apiKeyLast4?: string;
    createdAt: string;
}
export interface Complaint {
    _id: string;
    subject: string;
    message: string;
    status: "open" | "resolved";
    adminResponse?: string;
    createdAt: string;
    user?: { name: string; email: string };
}

// ---- Auth ----
export const authApi = {
    register: (body: { name: string; email: string; phone?: string; password: string }) =>
        request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: (body: { email: string; password: string }) =>
        request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    me: () => request<{ user: User }>("/auth/me"),
};

// ---- User-facing ----
export const api = {
    plans: () => request<Plan[]>("/plans"),
    subscription: () =>
        request<{ subscription: Subscription | null; active: boolean; payments: Payment[] }>("/subscription"),
    cancelSubscription: () => request("/subscription/cancel", { method: "POST" }),

    payPaystack: (planId: string) =>
        request<{ authorizationUrl: string; reference: string }>("/payments/paystack/initialize", {
            method: "POST",
            body: JSON.stringify({ planId }),
        }),
    verifyPaystack: (reference: string) =>
        request<{ status: string }>(`/payments/paystack/verify/${reference}`),
    cryptoAddresses: () => request<{ wallets: Array<{ asset: string; network: string; address: string }> }>("/payments/crypto/addresses"),
    submitCrypto: (body: { planId: string; asset: string; network: string; txHash: string }) =>
        request("/payments/crypto/submit", { method: "POST", body: JSON.stringify(body) }),

    exchangeAccounts: () => request<ExchangeAccount[]>("/exchange-accounts"),
    linkExchange: (body: { exchange: string; label?: string; apiKey: string; apiSecret: string; passphrase?: string }) =>
        request<ExchangeAccount>("/exchange-accounts", { method: "POST", body: JSON.stringify(body) }),
    unlinkExchange: (id: string) => request(`/exchange-accounts/${id}`, { method: "DELETE" }),

    complaints: () => request<Complaint[]>("/complaints"),
    submitComplaint: (body: { subject: string; message: string }) =>
        request<Complaint>("/complaints", { method: "POST", body: JSON.stringify(body) }),
};

// ---- Admin ----
export const adminApi = {
    stats: () => request<{ users: number; activeSubs: number; pendingPayments: number; openComplaints: number; revenue: Array<{ _id: string; total: number }> }>("/admin/stats"),
    subscribers: () => request<Array<User & { subscription: Subscription | null }>>("/admin/subscribers"),
    subscriber: (id: string) => request<{ user: User; subscription: Subscription | null; payments: Payment[]; complaints: Complaint[] }>(`/admin/subscribers/${id}`),
    payments: (status?: string) => request<Payment[]>(`/admin/payments${status ? `?status=${status}` : ""}`),
    confirmPayment: (id: string, note?: string) => request(`/admin/payments/${id}/confirm`, { method: "POST", body: JSON.stringify({ note }) }),
    rejectPayment: (id: string, note?: string) => request(`/admin/payments/${id}/reject`, { method: "POST", body: JSON.stringify({ note }) }),
    plans: () => request<Plan[]>("/admin/plans"),
    createPlan: (body: Partial<Plan>) => request<Plan>("/admin/plans", { method: "POST", body: JSON.stringify(body) }),
    updatePlan: (id: string, body: Partial<Plan>) => request<Plan>(`/admin/plans/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deletePlan: (id: string) => request(`/admin/plans/${id}`, { method: "DELETE" }),
    getSetting: (key: string) => request<{ key: string; value: unknown }>(`/admin/settings/${key}`),
    putSetting: (key: string, value: unknown) => request(`/admin/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
    complaints: (status?: string) => request<Complaint[]>(`/admin/complaints${status ? `?status=${status}` : ""}`),
    respondComplaint: (id: string, response: string, resolve: boolean) =>
        request(`/admin/complaints/${id}/respond`, { method: "POST", body: JSON.stringify({ response, resolve }) }),
};

export function formatMoney(amountMinor: number, currency = "NGN") {
    const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : `${currency} `;
    return `${symbol}${(amountMinor / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}
