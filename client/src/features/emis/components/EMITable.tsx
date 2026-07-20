import { Fragment, useState } from "react";
import { Check, ChevronDown, ChevronRight, Landmark, Pencil, Trash2, X } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useDeleteEmi, useEmiInfo, useUpdateEmiDescription } from "@/features/emis/hooks/useEmi";
import type { EmiInfoItem } from "../type";
import AddCustomEmiDialog from "./AddCustomEmiDialog";

function AmortizationTable({ emi }: { emi: EmiInfoItem }) {
    const schedule = emi.amortizationSchedule ?? [];
    const label = emi.description || emi.merchant || "Unknown";

    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={7} className="p-0">
                <div className="border-l-4 border-l-blue-500 bg-muted/10 px-8 py-4">
                    <p className="mb-3 text-sm font-semibold text-foreground">
                        Amortization Schedule — <span className="text-blue-600">{label}</span>
                    </p>
                    <Table>
                        <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">EMI #</TableHead>
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Payment Date</TableHead>
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Principal</TableHead>
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Interest</TableHead>
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Installment</TableHead>
                                <TableHead className="h-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((item, idx) => (
                                <TableRow
                                    key={item.emiNo}
                                    className={cn(
                                        "border-border/60",
                                        idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                                    )}
                                >
                                    <TableCell className="px-4 py-3">
                                        <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                            #{item.emiNo}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <p className="font-medium text-foreground">{formatDate(item.paymentDate)}</p>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-semibold tabular-nums text-foreground">
                                        {formatCurrency(item.principalAmount)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                                        {formatCurrency(item.interestAmount)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3 font-semibold tabular-nums text-foreground">
                                        {formatCurrency(item.installmentAmount)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <span
                                            className={cn(
                                                "inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
                                                item.paymentStatus === "paid"
                                                    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20"
                                                    : "bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20",
                                            )}
                                        >
                                            {item.paymentStatus === "paid" ? "Paid" : "Pending"}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </TableCell>
        </TableRow>
    );
}

function DeleteEmiAction({ emi }: { emi: EmiInfoItem }) {
    const deleteEmi = useDeleteEmi();
    const label = emi.description || emi.merchant || "this EMI";

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    aria-label="Delete EMI"
                    onClick={(event) => event.stopPropagation()}
                    disabled={deleteEmi.isPending}
                >
                    <Trash2 className="size-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(event) => event.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete EMI</AlertDialogTitle>
                    <AlertDialogDescription>
                        Delete <strong>{label}</strong>? This removes the EMI and recalculates your loan summary and forecast.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteEmi.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        variant="destructive"
                        onClick={() => deleteEmi.mutate(emi.id)}
                        disabled={deleteEmi.isPending}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function EditableDescriptionCell({ emi }: { emi: EmiInfoItem }) {
    const updateDescription = useUpdateEmiDescription();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(emi.description || emi.merchant || "");
    const label = emi.description || emi.merchant || "Unknown";

    const startEditing = () => {
        setDraft(label);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setDraft(label);
        setIsEditing(false);
    };

    const saveDescription = async () => {
        const nextDescription = draft.trim();
        if (!nextDescription || nextDescription === emi.description) {
            cancelEditing();
            return;
        }

        try {
            await updateDescription.mutateAsync({
                id: emi.id,
                description: nextDescription,
            });
            setIsEditing(false);
        } catch {
            // The mutation already shows a toast; keep the input open for correction or retry.
        }
    };

    if (isEditing) {
        return (
            <div
                className="flex min-w-64 items-center gap-2"
                onClick={(event) => event.stopPropagation()}
            >
                <Input
                    value={draft}
                    autoFocus
                    maxLength={512}
                    disabled={updateDescription.isPending}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            void saveDescription();
                        }

                        if (event.key === "Escape") {
                            cancelEditing();
                        }
                    }}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Save EMI description"
                    disabled={updateDescription.isPending}
                    onClick={() => void saveDescription()}
                >
                    <Check className="size-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Cancel editing"
                    disabled={updateDescription.isPending}
                    onClick={cancelEditing}
                >
                    <X className="size-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="group/description flex min-w-48 items-center gap-2">
            <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                    {label}
                </p>
                {emi.merchant && emi.description && (
                    <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {emi.merchant}
                    </p>
                )}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Edit EMI description"
                className="opacity-0 transition group-hover/description:opacity-100 focus-visible:opacity-100"
                onClick={(event) => {
                    event.stopPropagation();
                    startEditing();
                }}
            >
                <Pencil className="size-4" />
            </Button>
        </div>
    );
}

export default function EMITable() {
    const { data: emis, isPending, isError } = useEmiInfo();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedTab, setSelectedTab] = useState<"active" | "paid">("active");

    const toggleRow = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    if (isPending) return <p>Loading EMI info...</p>;
    if (isError) return <p>Error loading EMI info</p>;
    if (!emis || emis.length === 0) return <p>No EMIs found</p>;

    const isPaidOff = (emi: EmiInfoItem) => {
        const schedule = emi.amortizationSchedule ?? [];
        return schedule.length > 0 && schedule.every((item) => item.paymentStatus === "paid");
    };

    const activeEmis = emis.filter((emi) => !isPaidOff(emi));
    const paidEmis = emis.filter(isPaidOff);
    const visibleEmis = selectedTab === "active" ? activeEmis : paidEmis;

    return (
        <div className="xl:col-span-3 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-blue-500/5 via-transparent to-violet-500/5 px-4 py-3">
                <div>
                    <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Landmark className="h-5 w-5" /> EMI Details
                        <span className="text-xs text-muted-foreground">
                            {activeEmis.length} active {activeEmis.length === 1 ? "loan" : "loans"}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-lg border border-border bg-background p-1">
                        <button
                            type="button"
                            onClick={() => setSelectedTab("active")}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                                selectedTab === "active"
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            Active ({activeEmis.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedTab("paid")}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                                selectedTab === "paid"
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            Paid ({paidEmis.length})
                        </button>
                    </div>
                    <AddCustomEmiDialog />
                </div>
            </div>

            <Table>
                <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="h-12 w-10 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground" />
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Description</TableHead>
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Bank</TableHead>
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Total Amount</TableHead>
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center">Installments</TableHead>
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center">Progress</TableHead>
                        <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground text-center">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {visibleEmis.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-32 px-4 text-center">
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        No {selectedTab === "active" ? "active" : "paid"} EMIs found
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedTab === "active"
                                            ? "Completed loans will move to the Paid tab automatically."
                                            : "Fully paid loans will appear here."}
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : visibleEmis.map((emi, idx) => {
                        const isExpanded = expandedIds.has(emi.id);
                        const schedule = emi.amortizationSchedule ?? [];
                        const paidCount = schedule.filter((i) => i.paymentStatus === "paid").length;
                        const totalCount = schedule.length;

                        return (
                            <Fragment key={emi.id}>
                                <TableRow
                                    className={cn(
                                        "cursor-pointer transition-colors",
                                        isExpanded
                                            ? "border-l-4 border-l-blue-500 bg-blue-500/5"
                                            : cn("border-border/60", idx % 2 === 0 ? "bg-background" : "bg-muted/20"),
                                    )}
                                    aria-expanded={isExpanded}
                                    onClick={() => toggleRow(emi.id)}
                                >
                                    <TableCell className="px-4 py-3">
                                        {isExpanded ? (
                                            <ChevronDown className="size-4 text-muted-foreground" />
                                        ) : (
                                            <ChevronRight className="size-4 text-muted-foreground" />
                                        )}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <EditableDescriptionCell emi={emi} />
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                            {emi.bank.replaceAll("_", " ")}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                        <p className="font-semibold tabular-nums text-foreground">
                                            {formatCurrency(emi.totalAmount ?? 0)}
                                        </p>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                                            {totalCount}
                                        </code>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        <span
                                            className={cn(
                                                "inline-flex min-w-20 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
                                                paidCount === totalCount
                                                    ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20"
                                                    : "bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20",
                                            )}
                                        >
                                            {paidCount} / {totalCount}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-4 py-3 text-center">
                                        <DeleteEmiAction emi={emi} />
                                    </TableCell>
                                </TableRow>
                                {isExpanded && (
                                    <AmortizationTable emi={emi} />
                                )}
                                {isExpanded && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="h-2 bg-border/30 p-0" />
                                    </TableRow>
                                )}
                            </Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
