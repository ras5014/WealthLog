import {
    ArrowDownRight,
    ArrowUpRight,
    CalendarRange,
    Flame,
    Wallet2
} from "lucide-react"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn, formatBillingCyclePeriod, formatCurrency, percentFormatter } from "@/lib/utils"
import type { TotalSpentProps } from "../types"

const defaultProps = {
    totalSpent: 0,
    burnRatePerDay: 0,
    lastMonthSameTimeSpend: 0,
    billingCycleStartDate: "",
    billingCycleEndDate: "",
}

export default function TotalSpent(props: Readonly<TotalSpentProps>) {
    const {
        totalSpent,
        burnRatePerDay,
        lastMonthSameTimeSpend,
        billingCycleStartDate,
        billingCycleEndDate,
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
            : (totalSpent - lastMonthSameTimeSpend) / lastMonthSameTimeSpend

    const isUp = trend > 0
    const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight

    return (
        <Card className="flex-1 overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/20">
            <CardHeader className="gap-4 border-b border-border/60 bg-muted/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex items-center gap-2">
                        <Wallet2 className="size-6 text-muted-foreground" />
                        <CardTitle className="text-base font-semibold">Total Spend</CardTitle>
                    </div>

                    {billingCyclePeriod && (
                        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            <CalendarRange className="size-3.5" />
                            <span>{billingCyclePeriod}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="space-y-1">
                    <p className="text-4xl font-semibold tracking-tight text-foreground">
                        {formatCurrency(totalSpent)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Total card spend recorded for this statement period
                    </p>
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
                </div>
            </CardContent>
        </Card>
    )
}
