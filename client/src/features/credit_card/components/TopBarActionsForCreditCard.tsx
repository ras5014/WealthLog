import { useState } from "react"
import { BANK_OPTIONS } from "@/lib/constants"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import SetBudget from "./SetBudget"
import { useGetBudget } from "../hooks/useBudget"

export default function TopBarActionsForCreditCard() {
    const { data: budgetData } = useGetBudget();
    const [selectedBank, setSelectedBank] = useState<(typeof BANK_OPTIONS)[number]>(BANK_OPTIONS[0])
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button
                variant="outline"
                className="w-56 justify-center border-red-500/80 text-red-500 hover:border-red-500 hover:bg-red-500/10 hover:text-red-400"
            >
                Synchronize
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-56 justify-between border-emerald-500/80 text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                    >
                        {selectedBank}
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {BANK_OPTIONS.map((bank) => (
                        <DropdownMenuItem key={bank} onClick={() => setSelectedBank(bank)}>
                            {bank}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <SetBudget budgetAmount={budgetData?.amount} />
        </div>
    )

}
