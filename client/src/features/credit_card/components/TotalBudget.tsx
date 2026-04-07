import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { cn, formatCurrency } from "@/lib/utils"
import { PiggyBank, TrendingUp, TriangleAlert } from "lucide-react"
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts"
import { useGetBudget } from "../hooks/useBudget";

export default function TotalBudget({ totalSpends }: { totalSpends: number }) {
    const { data: budgetData } = useGetBudget();
    const budgetAmount = Number(budgetData?.amount ?? 0);
    const hasBudget = budgetAmount > 0;
    const progress = hasBudget ? Math.min(totalSpends / budgetAmount, 1) : 0;
    const progressPercent = Math.round(progress * 100);
    const remainingAmount = Math.max(budgetAmount - totalSpends, 0);
    const overBudgetAmount = Math.max(totalSpends - budgetAmount, 0);

    const status = !hasBudget
        ? "unconfigured"
        : totalSpends > budgetAmount
            ? "exceeded"
            : progress >= 0.8
                ? "warning"
                : "healthy";

    const chartColor =
        status === "exceeded"
            ? "var(--destructive)"
            : status === "warning"
                ? "var(--chart-5)"
                : status === "healthy"
                    ? "var(--chart-2)"
                    : "var(--muted-foreground)";

    const chartConfig = {
        spent: {
            label: "Spent",
            color: chartColor,
        },
    } satisfies ChartConfig

    const chartData = [
        {
            name: "spent",
            value: Math.max(progressPercent, 0.0001),
            fill: "var(--color-spent)",
        },
    ]

    const headline = !hasBudget
        ? "Set your monthly budget to start tracking utilization"
        : overBudgetAmount > 0
            ? `${formatCurrency(overBudgetAmount)} over budget`
            : `${formatCurrency(remainingAmount)} left for this cycle`

    const description = !hasBudget
        ? "Budget target not set yet"
        : `${progressPercent}% of ${formatCurrency(budgetAmount)} budget used`

    return (
        <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/15">
            <CardHeader className="border-b border-border/60 bg-muted/10">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <PiggyBank className="size-5 text-muted-foreground" />
                            <CardTitle className="text-base font-semibold">Monthly Budget</CardTitle>
                        </div>
                        <CardDescription>Track budget usage against your current credit card spend</CardDescription>
                    </div>

                    <span
                        className={cn(
                            "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                            status === "exceeded" && "bg-destructive/10 text-destructive",
                            status === "warning" && "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                            status === "healthy" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                            status === "unconfigured" && "bg-muted text-muted-foreground"
                        )}
                    >
                        {status === "exceeded" && "Budget exceeded"}
                        {status === "warning" && "Near limit"}
                        {status === "healthy" && "On track"}
                        {status === "unconfigured" && "No budget"}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto h-[190px] w-[190px]"
                >
                    <RadialBarChart
                        data={chartData}
                        width={190}
                        height={190}
                        cx="50%"
                        cy="50%"
                        startAngle={90}
                        endAngle={90 - progress * 360}
                        innerRadius={58}
                        outerRadius={86}
                    >
                        <PolarGrid
                            gridType="circle"
                            radialLines={false}
                            stroke="none"
                            polarRadius={[66, 54]}
                            className="first:fill-muted/30 last:fill-background"
                        />
                        <RadialBar dataKey="value" cornerRadius={999} background />
                        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                            <Label
                                content={({ viewBox }) => {
                                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) {
                                        return null
                                    }

                                    return (
                                        <text
                                            x={viewBox.cx}
                                            y={viewBox.cy}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy - 8}
                                                className="fill-foreground text-lg font-semibold"
                                            >
                                                {formatCurrency(totalSpends)}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy + 18}
                                                className="fill-muted-foreground text-[11px]"
                                            >
                                                Spent
                                            </tspan>
                                        </text>
                                    )
                                }}
                            />
                        </PolarRadiusAxis>
                    </RadialBarChart>
                </ChartContainer>

                <div className="space-y-1.5 text-center">
                    <p className="text-sm font-semibold text-foreground">{headline}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            Budget target
                        </p>
                        <p className="mt-2 text-xl font-semibold text-foreground">
                            {hasBudget ? formatCurrency(budgetAmount) : "Not set"}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3.5">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                            {overBudgetAmount > 0 ? "Overspent" : "Available"}
                        </p>
                        <p
                            className={cn(
                                "mt-2 text-xl font-semibold",
                                overBudgetAmount > 0
                                    ? "text-destructive"
                                    : "text-foreground"
                            )}
                        >
                            {hasBudget
                                ? formatCurrency(overBudgetAmount > 0 ? overBudgetAmount : remainingAmount)
                                : formatCurrency(0)}
                        </p>
                    </div>
                </div>

                <div
                    className={cn(
                        "flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm",
                        status === "exceeded" && "border-destructive/20 bg-destructive/5 text-destructive",
                        status === "warning" && "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300",
                        status === "healthy" && "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
                        status === "unconfigured" && "border-border/60 bg-muted/30 text-muted-foreground"
                    )}
                >
                    {status === "exceeded" ? (
                        <TriangleAlert className="size-4 shrink-0" />
                    ) : (
                        <TrendingUp className="size-4 shrink-0" />
                    )}
                    <span>
                        {!hasBudget && "Add a budget to compare spend, remaining room, and alert thresholds."}
                        {status === "healthy" && "Spending is within a healthy range for this cycle."}
                        {status === "warning" && "You are approaching the budget cap. Review discretionary spend."}
                        {status === "exceeded" && "This cycle has crossed the set budget. Consider tightening upcoming spend."}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
