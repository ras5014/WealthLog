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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
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
}

const toCategoryKey = (category: string) =>
    category.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/(^-|-$)/g, "")

const visibleSubCategoryCount = 4

type BudgetGroupChartItem = {
    category: BudgetGroupName
    categoryKey: string
    spend: number
    fill: string
    subCategories: {
        category: string
        spend: number
    }[]
}

export default function CategorySpendChart({ transactions = [] }: CategorySpendChartProps) {
    const { chartData, subCategoryData } = useMemo(() => {
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

        const groupedData = BUDGET_GROUPS.map((group) => {
            const categories = categoryTotals.get(group.name) ?? new Map<string, number>()
            const subCategories = Array.from(categories.entries())
                .map(([category, spend]) => ({ category, spend }))
                .sort((a, b) => b.spend - a.spend)

            return {
                category: group.name,
                categoryKey: toCategoryKey(group.name),
                spend: totals.get(group.name) ?? 0,
                fill: budgetGroupColors[group.name],
                subCategories,
            } satisfies BudgetGroupChartItem
        }).filter((item) => item.spend > 0)
            .reduce(
                (result, item) => {
                    result.chartData.push(item)
                    result.subCategoryData.push(
                        ...item.subCategories.map((subCategory) => ({
                            ...subCategory,
                            group: item.category,
                            fill: item.fill,
                            categoryKey: `${item.categoryKey}-${toCategoryKey(subCategory.category)}`,
                        })),
                    )

                    return result
                },
                {
                    chartData: [] as BudgetGroupChartItem[],
                    subCategoryData: [] as {
                        category: string
                        categoryKey: string
                        group: BudgetGroupName
                        spend: number
                        fill: string
                    }[],
                },
            )

        groupedData.subCategoryData.sort((a, b) => b.spend - a.spend)

        return groupedData
    }, [transactions])

    const totalSpend = chartData.reduce((sum, item) => sum + item.spend, 0)
    const topCategory = chartData[0]
    const visibleSubCategories = subCategoryData.slice(0, visibleSubCategoryCount)
    const hiddenSubCategories = subCategoryData.slice(visibleSubCategoryCount)

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
                    <CardDescription>Essentials and entertainment spend for this card cycle</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 px-3 pt-3">
                {chartData.length > 0 ? (
                    <>
                        <div className="grid items-center gap-2 md:grid-cols-[250px_minmax(0,1fr)]">
                            <ChartContainer
                                config={chartConfig}
                                className="-ml-2 h-[220px] w-[250px]"
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
                                                            Tracked
                                                        </tspan>
                                                    </text>
                                                )
                                            }}
                                        />
                                    </Pie>
                                </PieChart>
                            </ChartContainer>

                            <div className="space-y-2 pr-1">
                                {visibleSubCategories.map((item) => (
                                    <div
                                        key={item.categoryKey}
                                        className="flex items-center gap-2 rounded-lg bg-background/45 px-2.5 py-2 text-xs"
                                    >
                                        <span
                                            className="size-2 shrink-0 rounded-[2px]"
                                            style={{ backgroundColor: item.fill }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-medium text-foreground">
                                                {item.category}
                                            </p>
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {item.group}
                                            </p>
                                        </div>
                                        <span className="font-mono font-semibold text-foreground">
                                            {formatCurrency(item.spend)}
                                        </span>
                                    </div>
                                ))}
                                {hiddenSubCategories.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center justify-center rounded-lg border border-border/60 bg-background/45 px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                                                >
                                                    Show {hiddenSubCategories.length} more
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent
                                                side="left"
                                                align="start"
                                                sideOffset={10}
                                                className="block max-h-80 w-72 max-w-72 overflow-y-auto rounded-lg border border-border/70 bg-popover p-2 text-popover-foreground shadow-xl"
                                            >
                                                <div className="space-y-1.5">
                                                    {subCategoryData.map((item) => (
                                                        <div
                                                            key={`full-${item.categoryKey}`}
                                                            className="flex items-center gap-2 rounded-md bg-background/60 px-2.5 py-2 text-xs"
                                                        >
                                                            <span
                                                                className="size-2 shrink-0 rounded-[2px]"
                                                                style={{ backgroundColor: item.fill }}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-medium text-foreground">
                                                                    {item.category}
                                                                </p>
                                                                <p className="truncate text-[11px] text-muted-foreground">
                                                                    {item.group}
                                                                </p>
                                                            </div>
                                                            <span className="font-mono font-semibold text-foreground">
                                                                {formatCurrency(item.spend)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            {chartData.map((item) => {
                                const percentage = totalSpend > 0
                                    ? Math.round((item.spend / totalSpend) * 100)
                                    : 0

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
                                            {item.subCategories.length > 0 ? item.subCategories.slice(0, 3).map((category) => category.category).join(", ") : "No detailed categories"}
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
