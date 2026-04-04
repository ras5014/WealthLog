import { ArrowDownRight, ArrowUpRight, Flame, Wallet2 } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn, formatCurrency, percentFormatter } from "@/lib/utils"
import type { TotalSpentProps } from "../types"

const defaultStats = {
    totalSpent: 18420,
    burnRatePerDay: 1535,
    lastMonthSameTimeSpend: 16980,
};

export default function TotalSpent(props: Readonly<TotalSpentProps>) {
    const { totalSpent, burnRatePerDay, lastMonthSameTimeSpend } = {
        ...defaultStats,
        ...props,
    }

    const trend =
        lastMonthSameTimeSpend === 0
            ? 0
            : (totalSpent - lastMonthSameTimeSpend) / lastMonthSameTimeSpend

    const isUp = trend > 0
    const TrendIcon = isUp ? ArrowUpRight : ArrowDownRight

    return (
        <Card className="flex-1">
            <CardHeader className="border-b border-border/60">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle>Total Spend</CardTitle>
                        <CardDescription>Current billing cycle</CardDescription>
                    </div>

                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Wallet2 className="size-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
                <div>
                    <p className="text-3xl font-semibold tracking-tight">
                        {formatCurrency(totalSpent)}
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Flame className="size-4" />
                            Burn rate
                        </span>
                        <span className="font-medium">
                            {formatCurrency(burnRatePerDay)}/day
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Vs last month</span>
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
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
