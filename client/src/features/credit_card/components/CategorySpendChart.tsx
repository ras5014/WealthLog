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
import { formatCurrency } from "@/lib/utils"
import { ChartPie } from "lucide-react"
import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"
import type { CreditCardTransaction } from "../types"

type CategorySpendChartProps = {
    transactions?: CreditCardTransaction[]
}

const chartColors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
    "var(--muted-foreground)",
]

const toCategoryKey = (category: string) =>
    category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")

export default function CategorySpendChart({ transactions = [] }: CategorySpendChartProps) {
    const chartData = useMemo(() => {
        const totals = new Map<string, number>()

        for (const transaction of transactions) {
            if (transaction.type !== "Dr") {
                continue
            }

            const amount = Number(transaction.amount)
            if (!Number.isFinite(amount) || amount <= 0) {
                continue
            }

            const category = transaction.category?.trim() || "Uncategorized"
            totals.set(category, (totals.get(category) ?? 0) + amount)
        }

        const sortedCategories = Array.from(totals.entries())
            .map(([category, spend]) => ({ category, spend }))
            .sort((a, b) => b.spend - a.spend)

        const primaryCategories = sortedCategories.slice(0, 5)
        const remainingSpend = sortedCategories
            .slice(5)
            .reduce((sum, item) => sum + item.spend, 0)

        const groupedCategories = remainingSpend > 0
            ? [...primaryCategories, { category: "Other Categories", spend: remainingSpend }]
            : primaryCategories

        return groupedCategories.map((item, index) => ({
            ...item,
            categoryKey: toCategoryKey(item.category),
            fill: chartColors[index % chartColors.length],
        }))
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
                    <CardDescription>Spend mix for the selected billing cycle</CardDescription>
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
                                                        Categorized
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

                                return (
                                    <div
                                        key={item.categoryKey}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        <span
                                            className="size-2.5 shrink-0 rounded-[2px]"
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
                                    </div>
                                )
                            })}
                        </div>

                        {topCategory && (
                            <div className="rounded-lg border border-border/60 bg-background/60 px-3.5 py-2.5 text-sm text-center">
                                <span className="text-muted-foreground">Top category: </span>
                                <span className="font-medium text-foreground">{topCategory.category}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex h-[220px] items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
                        No categorized spending yet
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
