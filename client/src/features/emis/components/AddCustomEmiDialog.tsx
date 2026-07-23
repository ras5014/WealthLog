import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EMI_BANK_OPTIONS } from "@/lib/constants";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { useCreateCustomEmi } from "../hooks/useEmi";
import type { CreateCustomEmiInput } from "../type";

const today = new Date().toISOString().slice(0, 10);

const defaultForm: CreateCustomEmiInput = {
    bank: EMI_BANK_OPTIONS[0],
    description: "",
    merchant: "",
    totalAmount: 0,
    installmentAmount: 0,
    installmentCount: 1,
    firstPaymentDate: today,
    paidInstallments: 0,
};

export default function AddCustomEmiDialog() {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<CreateCustomEmiInput>(defaultForm);
    const createCustomEmi = useCreateCustomEmi();

    const updateField = <TKey extends keyof CreateCustomEmiInput>(
        key: TKey,
        value: CreateCustomEmiInput[TKey],
    ) => {
        setForm((current) => ({ ...current, [key]: value }));
    };

    const resetAndClose = () => {
        setForm(defaultForm);
        setOpen(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await createCustomEmi.mutateAsync({
            ...form,
            description: form.description.trim(),
            merchant: form.merchant?.trim() || undefined,
            paidInstallments: Math.min(form.paidInstallments, form.installmentCount),
        });
        resetAndClose();
    };

    const isInvalid =
        !form.description.trim() ||
        form.totalAmount <= 0 ||
        form.installmentAmount <= 0 ||
        form.installmentCount <= 0 ||
        form.paidInstallments < 0 ||
        form.paidInstallments > form.installmentCount ||
        !form.firstPaymentDate;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Plus className="size-4" />
                    Add EMI
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100vw-2rem)] !max-w-none sm:w-[min(calc(100vw-2rem),34rem)]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add Custom EMI</AlertDialogTitle>
                </AlertDialogHeader>

                <form id="custom-emi-form" onSubmit={handleSubmit} className="grid gap-3">
                    <div className="grid gap-1.5">
                        <label htmlFor="custom-emi-bank" className="text-sm font-medium">
                            Bank
                        </label>
                        <Select
                            value={form.bank}
                            onValueChange={(value) => updateField("bank", value)}
                            disabled={createCustomEmi.isPending}
                        >
                            <SelectTrigger id="custom-emi-bank" className="w-full">
                                <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                                {EMI_BANK_OPTIONS.map((bank) => (
                                    <SelectItem key={bank} value={bank}>
                                        {bank.replaceAll("_", " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-1.5">
                        <label htmlFor="custom-emi-description" className="text-sm font-medium">
                            Description
                        </label>
                        <Input
                            id="custom-emi-description"
                            value={form.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            placeholder="iPhone, laptop, trip booking..."
                            disabled={createCustomEmi.isPending}
                        />
                    </div>

                    <div className="grid gap-1.5">
                        <label htmlFor="custom-emi-merchant" className="text-sm font-medium">
                            Merchant
                        </label>
                        <Input
                            id="custom-emi-merchant"
                            value={form.merchant}
                            onChange={(event) => updateField("merchant", event.target.value)}
                            placeholder="Optional"
                            disabled={createCustomEmi.isPending}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label htmlFor="custom-emi-total" className="text-sm font-medium">
                                Total amount
                            </label>
                            <Input
                                id="custom-emi-total"
                                type="number"
                                min={1}
                                step="0.01"
                                value={form.totalAmount || ""}
                                onChange={(event) =>
                                    updateField("totalAmount", Number(event.target.value))
                                }
                                disabled={createCustomEmi.isPending}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="custom-emi-installment" className="text-sm font-medium">
                                EMI amount
                            </label>
                            <Input
                                id="custom-emi-installment"
                                type="number"
                                min={1}
                                step="0.01"
                                value={form.installmentAmount || ""}
                                onChange={(event) =>
                                    updateField("installmentAmount", Number(event.target.value))
                                }
                                disabled={createCustomEmi.isPending}
                            />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                            <label htmlFor="custom-emi-count" className="text-sm font-medium">
                                Installments
                            </label>
                            <Input
                                id="custom-emi-count"
                                type="number"
                                min={1}
                                max={120}
                                value={form.installmentCount}
                                onChange={(event) =>
                                    updateField("installmentCount", Number(event.target.value))
                                }
                                disabled={createCustomEmi.isPending}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="custom-emi-paid" className="text-sm font-medium">
                                Paid
                            </label>
                            <Input
                                id="custom-emi-paid"
                                type="number"
                                min={0}
                                max={form.installmentCount}
                                value={form.paidInstallments}
                                onChange={(event) =>
                                    updateField("paidInstallments", Number(event.target.value))
                                }
                                disabled={createCustomEmi.isPending}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <label htmlFor="custom-emi-first-date" className="text-sm font-medium">
                                First date
                            </label>
                            <Input
                                id="custom-emi-first-date"
                                type="date"
                                value={form.firstPaymentDate}
                                onChange={(event) =>
                                    updateField("firstPaymentDate", event.target.value)
                                }
                                disabled={createCustomEmi.isPending}
                            />
                        </div>
                    </div>
                </form>

                <AlertDialogFooter>
                    <AlertDialogCancel type="button" disabled={createCustomEmi.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        type="submit"
                        form="custom-emi-form"
                        disabled={isInvalid || createCustomEmi.isPending}
                    >
                        {createCustomEmi.isPending ? "Adding..." : "Add EMI"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
