import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Landmark, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { submissionService } from "@/lib/submission-service";

export default function BankSettings() {
    const [bankDetails, setBankDetails] = useState({
        bankName: "",
        accountName: "",
        accountNumber: "",
        additionalInfo: ""
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await submissionService.getBankDetails();
                if (data && typeof data === 'object') {
                    setBankDetails({
                        bankName: data.bankName || "",
                        accountName: data.accountName || "",
                        accountNumber: data.accountNumber || "",
                        additionalInfo: data.additionalInfo || ""
                    });
                } else if (typeof data === 'string' && data) {
                    // Legacy migration
                    setBankDetails(prev => ({ ...prev, additionalInfo: data }));
                }
            } catch (error) {
                console.error("Failed to load bank settings", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await submissionService.updateBankDetails(bankDetails);
            toast({
                title: "Settings Saved",
                description: "Bank details have been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save bank details.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="font-heading text-3xl font-bold mb-1 border-b-2 border-primary pb-2 inline-block">
                        Payment & Bank Settings
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2">Manage the bank details shown to your clients.</p>
                </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                <Card className="max-w-2xl shadow-soft">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Landmark className="w-5 h-5 text-primary" /> Bank Account Details
                        </CardTitle>
                        <CardDescription>
                            This information will be displayed to clients when they are asked to make an invoice payment.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input
                                            id="bankName"
                                            placeholder="e.g. Guaranty Trust Bank"
                                            value={bankDetails.bankName}
                                            onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="accountName">Account Name</Label>
                                        <Input
                                            id="accountName"
                                            placeholder="e.g. TGC Events Hub"
                                            value={bankDetails.accountName}
                                            onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="accountNumber">Account Number</Label>
                                        <Input
                                            id="accountNumber"
                                            placeholder="e.g. 0123456789"
                                            type="text"
                                            value={bankDetails.accountNumber}
                                            onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="additionalInfo">Additional Instructions (Optional)</Label>
                                        <textarea
                                            id="additionalInfo"
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Please use your booking ID as the payment reference."
                                            value={bankDetails.additionalInfo}
                                            onChange={(e) => setBankDetails({ ...bankDetails, additionalInfo: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex justify-end">
                                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                                        {isSaving ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                                        ) : (
                                            <><Save className="w-4 h-4 mr-2" /> Save Details</>
                                        )}
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </AdminLayout>
    );
}
