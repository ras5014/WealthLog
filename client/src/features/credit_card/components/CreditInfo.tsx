import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarClock,
    CalendarRange,
    Flame,
    Percent,
    Wallet2
} from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn, formatBillingCyclePeriod, formatCurrency, percentFormatter } from "@/lib/utils"
import type { BankDetailSchema, TotalSpentProps } from "../types"
import { useBankDetails } from "../hooks/useBankDetails"
import { useSelector } from "react-redux"
import type { RootState } from "@/lib/store"
import { BANK_OPTIONS } from "@/lib/constants"

const defaultProps = {
    totalSpent: 0,
    burnRatePerDay: 0,
    lastMonthSameTimeSpend: 0,
    billingCycleStartDate: "",
    billingCycleEndDate: "",
    lastMonthBill: 0,
    dueDate: "",
    totalEmiAmount: 0,
}

export default function CreditInfo(props: Readonly<TotalSpentProps>) {
    const {
        totalSpendsAllBanks = 0,
        totalSpent = 0,
        burnRatePerDay = 0,
        lastMonthSameTimeSpend = 0,
        billingCycleStartDate = "",
        billingCycleEndDate = "",
        dueDate = "",
        totalEmiAmount = 0,
    } = {
        ...defaultProps,
        ...props,
    }

    const billingCyclePeriod = formatBillingCyclePeriod(
        billingCycleStartDate,
        billingCycleEndDate
    )

    const trend =
        lastMonthSameTimeSpend === 0
            ? 0
            : (totalSpendsAllBanks - lastMonthSameTimeSpend) / lastMonthSameTimeSpend

    const dueDateValue = dueDate ? new Date(dueDate) : null
    const hasValidDueDate = !!dueDateValue && !Number.isNaN(dueDateValue.getTime())

    const { data: bankDetails } = useBankDetails();
    const bank = useSelector((state: RootState) => state.creditCard.bank) || BANK_OPTIONS[0]
    const normalizeBankName = (value: string) =>
        value.trim().replaceAll("_", " ").replaceAll(/\s+/g, " ").toUpperCase()

    const lastMonthBill = bank === BANK_OPTIONS[0]
        ? (bankDetails ?? []).reduce((total: number, detail: BankDetailSchema) => total + Number(detail.totalAmountDue ?? 0), 0)
        : Number(
            bankDetails?.find((detail: BankDetailSchema) => normalizeBankName(detail.bank) === normalizeBankName(bank))?.totalAmountDue ?? 0
        )
    const derivedBillStatus = lastMonthBill <= 0 ? "paid" : "pending";

    const dueDateLabel = hasValidDueDate
        ? new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(dueDateValue)
        : "N/A";

    const isUp = trend > 0
    const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight

    const creditUtilised = `${formatCurrency(totalSpent + totalEmiAmount + lastMonthBill)}/${formatCurrency(300000)}`;

    return (
        <Card className="flex-1 overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/20">
            <CardHeader className="border-b border-border/60 bg-muted/10 h-20">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Wallet2 className="size-6 text-muted-foreground" />
                            <CardTitle className="text-base font-semibold">Total Spent</CardTitle>
                        </div>
                        <CardDescription>Total card spend recorded for this statement period</CardDescription>
                    </div>

                    {billingCyclePeriod && (
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <CalendarRange className="size-3.5" />
                            <span>{billingCyclePeriod}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                <div className="space-y-1">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                Total Spent
                            </p>
                            <p className="mt-2 text-xl font-semibold text-foreground">
                                {formatCurrency(totalSpent)}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarClock className="size-4" />
                                <span>+ {formatCurrency(totalEmiAmount)} EMI</span>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                        Bill Due
                                    </p>
                                    <p className="mt-2 text-xl font-semibold text-foreground">
                                        {formatCurrency(Number(lastMonthBill ?? 0))}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                                        derivedBillStatus === "paid" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                                        derivedBillStatus === "pending" && "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                                    )}
                                >
                                    {derivedBillStatus === "paid" && "Paid"}
                                    {derivedBillStatus === "pending" && "Pending"}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarClock className="size-4" />
                                <span>Due {dueDateLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3">
                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <span className="flex size-8 items-center justify-center rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-300">
                                <Flame className="size-4" />
                            </span>
                            <span>Burn rate</span>
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatCurrency(burnRatePerDay)}/day
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <span
                                className={cn(
                                    "flex size-8 items-center justify-center rounded-full",
                                    isUp
                                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                        : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                )}
                            >
                                <TrendIcon className="size-4" />
                            </span>
                            <span>Vs last month</span>
                        </span>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold",
                                isUp
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            )}
                        >
                            <TrendIcon className="size-4" />
                            {percentFormatter.format(Math.abs(trend))}
                        </span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                <CalendarClock className="size-4" />
                            </span>
                            <span>Expected EMI</span>
                        </span>
                        <span className="font-semibold text-foreground">
                            {formatCurrency(totalEmiAmount)}/month
                        </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-3 py-3 text-sm">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300">
                                <Percent className="size-4" />
                            </span>
                            <span>Credit utilization</span>
                        </span>
                        <span className="font-semibold text-foreground">
                            {creditUtilised} ({((totalSpent + totalEmiAmount + lastMonthBill) / 300000 * 100).toFixed(1)}%)
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
