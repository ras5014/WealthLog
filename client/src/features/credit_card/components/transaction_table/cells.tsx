import { Button } from "@/components/ui/button"
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
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TRANSACTION_CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { useAddToEMI } from "../../hooks/useAddToEMI"
import { useUpdateTransactionCategory } from "../../hooks/useUpdateTransactionCategory"
import type { CreditCardTransaction } from "../../types"

export const ActionsCell = ({ transaction }: { transaction: CreditCardTransaction }) => {
    const addToEMIMutation = useAddToEMI();

    return (
        <div className="flex w-full justify-center">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        Add to EMI
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Add to EMI</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to add this transaction to EMI?
                            <br />
                            <strong>{transaction.details}</strong> -{" "}
                            {new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                            }).format(Number(transaction.amount))}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                addToEMIMutation.mutate({
                                    bank: transaction.bank,
                                    referenceNumber: transaction.referenceNumber,
                                    statementStartDate: transaction.statementStartDate,
                                });
                            }}
                        >
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

export const CategoryCell = ({ transaction }: { transaction: CreditCardTransaction }) => {
    const updateCategoryMutation = useUpdateTransactionCategory();
    const [isEditing, setIsEditing] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const category = transaction.category?.trim();
    const selectedCategory = TRANSACTION_CATEGORIES.find((item) => item === category);
    const displayCategory = selectedCategory ?? "Uncategorized";

    if (!isEditing) {
        return (
            <button
                type="button"
                className={cn(
                    "group/category flex h-8 w-44 items-center justify-between rounded-lg px-3 text-left text-sm font-medium text-foreground transition",
                    "hover:bg-muted/70 hover:ring-1 hover:ring-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    !selectedCategory && "text-muted-foreground",
                )}
                onClick={() => {
                    setIsEditing(true);
                    setIsOpen(true);
                }}
                disabled={updateCategoryMutation.isPending}
            >
                <span className="truncate">{displayCategory}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover/category:opacity-100 group-focus-visible/category:opacity-100" />
            </button>
        )
    }

    return (
        <Select
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) {
                    setIsEditing(false);
                }
            }}
            value={selectedCategory}
            onValueChange={(value) => {
                setIsOpen(false);
                setIsEditing(false);
                if (value === transaction.category) return;

                updateCategoryMutation.mutate({
                    id: transaction.id,
                    category: value,
                });
            }}
            disabled={updateCategoryMutation.isPending}
        >
            <SelectTrigger size="sm" className="w-44">
                <SelectValue placeholder="Uncategorized" />
            </SelectTrigger>
            <SelectContent>
                {TRANSACTION_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                        {category}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
