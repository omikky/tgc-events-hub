export type SubmissionType = "rentals" | "services" | "both" | "client";

export interface RentalDetails {
    items: string;
    date: string;
    location: string;
}

export interface EventDetails {
    eventDate: string;
    guests: string;
    vendors?: string;
    location: string;
    services: string[];
    items?: string;
    details?: string;
}

export interface InvoiceItem {
    name: string;
    price: number;
}

export interface InvoiceDetails {
    items: InvoiceItem[];
    actualBill: number;
    cautionFee: number;
    logistics: number;
    vat: number;
    other: number;
    total: number;
}

export interface Submission {
    id: string;
    type: SubmissionType;
    name: string;
    email: string;
    phone: string;
    address: string;
    rentalDetails?: RentalDetails;
    eventDetails?: EventDetails;
    invoice?: InvoiceDetails;
    status: "pending" | "confirmed" | "invoiced" | "paid" | "completed" | "rejected";
    createdAt: string;
}

// Base API URL (no trailing path)
const BASE_URL = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";
const SUBMISSIONS_URL = `${BASE_URL}/submissions`;

export const submissionService = {
    submit: async (submission: Omit<Submission, "id" | "status" | "createdAt">): Promise<Submission> => {
        try {
            const response = await fetch(SUBMISSIONS_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(submission),
            });

            if (!response.ok) {
                throw new Error("Failed to save submission");
            }

            const data = await response.json();
            console.log("%c[BACKEND SYNC SUCCESS]", "color: green; font-weight: bold", data);
            return data;
        } catch (error) {
            console.error("Submission error:", error);
            // Fallback or rethrow
            throw error;
        }
    },

    getAll: async (): Promise<Submission[]> => {
        try {
            const response = await fetch(SUBMISSIONS_URL);
            if (!response.ok) throw new Error("Failed to fetch submissions");
            return await response.json();
        } catch (error) {
            console.error("Fetch error:", error);
            return [];
        }
    },

    updateStatus: async (id: string, status: Submission["status"], invoice?: InvoiceDetails) => {
        const res = await fetch(`${SUBMISSIONS_URL}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, invoice }),
        });
        if (!res.ok) throw new Error("Failed to update status");
        return res.json();
    },

    getBankDetails: async () => {
        try {
            const res = await fetch(`${BASE_URL}/settings/bankDetails`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.value;
        } catch {
            return "";
        }
    },

    updateBankDetails: async (value: any) => {
        const res = await fetch(`${BASE_URL}/settings/bankDetails`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
        });
        if (!res.ok) throw new Error("Failed to update bank details");
        return res.json();
    }
};
