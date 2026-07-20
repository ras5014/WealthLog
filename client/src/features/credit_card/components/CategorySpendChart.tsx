import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { BUDGET_GROUPS, CATEGORY_TO_BUDGET_GROUP, type BudgetGroupName } from "@/lib/constants"
import { formatCurrency } from "@/lib/utils"
import { ChartPie } from "lucide-react"
import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"
import type { CreditCardTransaction } from "../types"

type CategorySpendChartProps = {
    transactions?: CreditCardTransaction[]
}

const budgetGroupColors: Record<BudgetGroupName, string> = {
    Essentials: "var(--chart-2)",
    Entertainment: "var(--chart-1)",
    Savings: "var(--chart-3)",
}

const toCategoryKey = (category: string) =>
    category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")

type BudgetGroupChartItem = {
    category: BudgetGroupName
    categoryKey: string
    spend: number
    targetPercentage: number
    fill: string
    topCategories: string[]
}

export default function CategorySpendChart({ transactions = [] }: CategorySpendChartProps) {
    const chartData = useMemo(() => {
        const totals = new Map<BudgetGroupName, number>()
        const categoryTotals = new Map<BudgetGroupName, Map<string, number>>()

        for (const transaction of transactions) {
            if (transaction.type !== "Dr") {
                continue
            }

            const amount = Number(transaction.amount)
            if (!Number.isFinite(amount) || amount <= 0) {
                continue
            }

            const detailedCategory = transaction.category?.trim() || "Other"
            const group = CATEGORY_TO_BUDGET_GROUP[detailedCategory] ?? "Entertainment"
            totals.set(group, (totals.get(group) ?? 0) + amount)

            const groupCategories = categoryTotals.get(group) ?? new Map<string, number>()
            groupCategories.set(detailedCategory, (groupCategories.get(detailedCategory) ?? 0) + amount)
            categoryTotals.set(group, groupCategories)
        }

        return BUDGET_GROUPS.map((group) => {
            const categories = categoryTotals.get(group.name) ?? new Map<string, number>()
            const topCategories = Array.from(categories.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([category]) => category)

            return {
                category: group.name,
                categoryKey: toCategoryKey(group.name),
                spend: totals.get(group.name) ?? 0,
                targetPercentage: group.targetPercentage,
                fill: budgetGroupColors[group.name],
                topCategories,
            } satisfies BudgetGroupChartItem
        }).filter((item) => item.spend > 0)
    }, [transactions])

    const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0)
    const topCategory = chartData[0]

    const chartConfig = chartData.reduce<ChartConfig>((config, item) => {
        config[item.categoryKey] = {
            label: item.category,
            color: item.fill,
        }

        return config
    }, {})

    return (
        <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/15">
            <CardHeader className="h-20 border-b border-border/60 bg-muted/10">
                <div className="space-y-1">
                    <div className="flex items-start gap-2">
                        <ChartPie className="mt-0.5 size-5 text-muted-foreground" />
                        <CardTitle className="text-base font-semibold">Category Spending</CardTitle>
                    </div>
                    <CardDescription>Essentials, entertainment, and savings rollup</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                {chartData.length > 0 ? (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto h-[220px] w-full"
                        >
                            <PieChart accessibilityLayer>
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel
                                            nameKey="categoryKey"
                                            formatter={(value, _name, item) => (
                                                <div className="flex min-w-36 items-center justify-between gap-4">
                                                    <span className="text-muted-foreground">
                                                        {item.payload.category}
                                                    </span>
                                                    <span className="font-mono font-medium text-foreground">
                                                        {formatCurrency(Number(value))}
                                                    </span>
                                                </div>
                                            )}
                                        />
                                    }
                                />
                                <Pie
                                    data={chartData}
                                    dataKey="spend"
                                    nameKey="categoryKey"
                                    innerRadius={58}
                                    outerRadius={86}
                                    paddingAngle={2}
                                    strokeWidth={4}
                                >
                                    {chartData.map((item) => (
                                        <Cell key={item.categoryKey} fill={item.fill} />
                                    ))}
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
                                                        {formatCurrency(totalSpend)}
                                                    </tspan>
                                                    <tspan
                                                        x={viewBox.cx}
                                                        y={viewBox.cy + 18}
                                                        className="fill-muted-foreground text-[11px]"
                                                    >
                                                        Allocated
                                                    </tspan>
                                                </text>
                                            )
                                        }}
                                    />
                                </Pie>
                            </PieChart>
                        </ChartContainer>

                        <div className="space-y-2">
                            {chartData.map((item) => {
                                const percentage = totalSpend > 0
                                    ? Math.round((item.spend / totalSpend) * 100)
                                    : 0
                                const targetDifference = percentage - item.targetPercentage

                                return (
                                    <div
                                        key={item.categoryKey}
                                        className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1 text-sm"
                                    >
                                        <span
                                            className="row-span-2 size-2.5 shrink-0 rounded-[2px]"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                                            {item.category}
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {formatCurrency(item.spend)}
                                        </span>
                                        <span className="w-9 text-right font-mono text-xs text-muted-foreground">
                                            {percentage}%
                                        </span>
                                        <span className="col-start-2 min-w-0 truncate text-xs text-muted-foreground/75">
                                            {item.topCategories.length > 0 ? item.topCategories.join(", ") : "No detailed categories"}
                                        </span>
                                        <span className="col-span-2 text-right text-xs text-muted-foreground/75">
                                            Target {item.targetPercentage}%{targetDifference === 0 ? "" : `, ${Math.abs(targetDifference)}% ${targetDifference > 0 ? "over" : "under"}`}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {topCategory && (
                            <div className="rounded-lg border border-border/60 bg-background/60 px-3.5 py-2.5 text-sm text-center">
                                <span className="text-muted-foreground">Largest bucket: </span>
                                <span className="font-medium text-foreground">{topCategory.category}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                        No grouped spending yet
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
