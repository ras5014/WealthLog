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
import { cn, formatCurrency } from "@/lib/utils"
import { CheckCircle2, CircleDollarSign, Clock3 } from "lucide-react"
import { Cell, Label, Pie, PieChart } from "recharts"
import type { TotalLoanProps } from "../type"

export default function TotalLoan({
    totalLoanAmount,
    totalPaidAmount,
    remainingAmount,
}: TotalLoanProps) {
    const paidRatio = totalLoanAmount > 0 ? totalPaidAmount / totalLoanAmount : 0
    const paidPercentage = Math.round(paidRatio * 100)
    const chartData = [
        {
            key: "paid",
            label: "Paid",
            value: totalPaidAmount,
            fill: "var(--color-paid)",
        },
        {
            key: "remaining",
            label: "Remaining",
            value: remainingAmount,
            fill: "var(--color-remaining)",
        },
    ]

    const chartConfig = {
        paid: {
            label: "Paid",
            color: "var(--chart-2)",
        },
        remaining: {
            label: "Remaining",
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    return (
        <Card className="overflow-hidden border-border/60 bg-linear-to-br from-card via-card to-muted/15">
            <CardHeader className="border-b border-border/60 bg-muted/10 py-2">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CircleDollarSign className="size-5 text-muted-foreground" />
                            <CardTitle className="text-base font-semibold">Loan Repayment</CardTitle>
                        </div>
                        <CardDescription>Paid versus outstanding amount across all EMIs</CardDescription>
                    </div>

                    <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-shadow-md font-semibold text-white">
                        {paidPercentage}% cleared
                    </span>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto h-[208px] w-full max-w-[232px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    formatter={(value, name) => (
                                        <div className="flex min-w-35 items-center justify-between gap-4">
                                            <span className="text-muted-foreground">{String(name)}</span>
                                            <span className="font-medium text-foreground">
                                                {formatCurrency(Number(value))}
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Pie
                            data={chartData}
                            dataKey="value"
                            nameKey="label"
                            innerRadius={56}
                            outerRadius={82}
                            strokeWidth={0}
                            paddingAngle={3}
                        >
                            {chartData.map((entry) => (
                                <Cell key={entry.key} fill={entry.fill} />
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
                                                y={viewBox.cy - 6}
                                                className="fill-foreground text-lg font-semibold"
                                            >
                                                {formatCurrency(totalPaidAmount)}
                                            </tspan>
                                            <tspan
                                                x={viewBox.cx}
                                                y={viewBox.cy + 16}
                                                className="fill-muted-foreground text-[11px]"
                                            >
                                                Paid so far
                                            </tspan>
                                        </text>
                                    )
                                }}
                            />
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CheckCircle2 className="size-4 text-primary" />
                            <p className="text-xs font-medium uppercase tracking-[0.18em]">
                                Paid amount
                            </p>
                        </div>
                        <p className="mt-1.5 text-xl font-semibold text-foreground ml-6">
                            {formatCurrency(totalPaidAmount)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock3 className="size-4 text-sky-500" />
                            <p className="text-xs font-medium uppercase tracking-[0.18em]">
                                Remaining
                            </p>
                        </div>
                        <p className="mt-1.5 text-xl font-semibold text-foreground ml-6">
                            {formatCurrency(remainingAmount)}
                        </p>
                    </div>
                </div>

                <div className="rounded-[24px] border border-border/60 bg-linear-to-r from-background/80 via-background/60 to-primary/5 p-3.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-center w-full justify-evenly">
                            <p className="text-md font-medium uppercase tracking-[0.24em] text-muted-foreground">
                                Total financed
                            </p>
                            <p className="mt-1.5 text-[1.7rem] font-semibold tracking-tight text-foreground ml-6">
                                {formatCurrency(totalLoanAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
