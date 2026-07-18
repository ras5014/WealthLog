import type { ColumnDef } from "@tanstack/react-table"
import type { CreditCardTransaction } from "../../types"
import { cn } from "@/lib/utils"
import { ActionsCell, CategoryCell } from "./cells"

export type Payment = CreditCardTransaction

const formatCurrency = (value: string | number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value))

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value))


const formatDetails = (details: string) => {
    if (details.startsWith("UPI")) {
        return details.split("-").pop()?.trim() ?? "";
    }
    return details;
}


export const columns: ColumnDef<CreditCardTransaction>[] = [
    {
        accessorKey: "transactionDate",
        header: "Date",
        cell: ({ row }) => (
            <div className="min-w-28">
                <p className="font-medium text-foreground">
                    {formatDate(row.original.transactionDate)}
                </p>
                <p className="text-xs text-muted-foreground">
                    Billing: {formatDate(row.original.statementEndDate)}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "details",
        header: "Details",
        cell: ({ row }) => (
            <div className="min-w-72 max-w-xl">
                <p className="truncate font-medium text-foreground">
                    {formatDetails(row.original.details)}
                </p>
                <p className="truncate text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {row.original.bank.replaceAll("_", " ")}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => {
            const isDebit = row.original.type === "Dr";
            return (
                <div className="min-w-32">
                    <p
                        className={cn(
                            "font-semibold tabular-nums",
                            isDebit ? "text-rose-600" : "text-emerald-600",
                        )}
                    >
                        {isDebit ? "-" : "+"}
                        {formatCurrency(row.original.amount)}
                    </p>
                </div>
            )
        },
    },
    {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <CategoryCell transaction={row.original} />,
    },
    {
        accessorKey: "type",
        header: () => <div className="text-center">Type</div>,
        cell: ({ row }) => {
            const isDebit = row.original.type === "Dr";
            return (
                <div className="flex w-full justify-center">
                    <span
                        className={cn(
                            "inline-flex min-w-16 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
                            isDebit
                                ? "bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
                        )}
                    >
                        {isDebit ? "Debit" : "Credit"}
                    </span>
                </div>
            )
        },
    },
    {
        accessorKey: "referenceNumber",
        header: "Reference",
        cell: ({ row }) => (
            <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {row.original.referenceNumber}
            </code>
        ),
    },
    {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => <ActionsCell transaction={row.original} />,
    },
]
