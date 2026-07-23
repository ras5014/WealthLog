"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

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
import type { EmiRecord } from "../type"

const chartConfig = {
    amount: {
        label: "EMI Amount-",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

type EmiForeCastingProps = Readonly<{
    emiRecords: EmiRecord[];
    emiEndMonth: string | null;
}>;

type AxisTickProps = {
    x?: number | string;
    y?: number | string;
    payload?: {
        value?: number | string;
    };
};

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

const formatMonthLabel = (date: Date) => `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;

const getMonthKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const parseMonthKeyFromRecordLabel = (label: string) => {
    const monthLabel = label.match(/\(([^)]+)\)$/)?.[1];
    if (!monthLabel) {
        return null;
    }

    const [monthName, year] = monthLabel.split(" ");
    const monthIndex = MONTH_NAMES.indexOf(monthName as (typeof MONTH_NAMES)[number]);
    const parsedYear = Number(year);

    if (monthIndex === -1 || Number.isNaN(parsedYear)) {
        return null;
    }

    return `${parsedYear}-${String(monthIndex + 1).padStart(2, "0")}`;
};

const renderLabelTick = ({ x = 0, y = 0, payload }: AxisTickProps) => {
    const label = payload?.value != null ? String(payload.value) : "";

    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0}
                y={0}
                dy={14}
                textAnchor="middle"
                fill="currentColor"
                fontSize={12}
                transform="rotate(0)"
            >
                <tspan x={0}>{label}</tspan>
            </text>
        </g>
    );
};

export function EmiForecasting({ emiRecords, emiEndMonth }: EmiForeCastingProps) {
    const amountByMonth = emiRecords.reduce<Record<string, number>>((accumulator, record) => {
        const monthKey = parseMonthKeyFromRecordLabel(record.label);

        if (!monthKey) {
            return accumulator;
        }

        accumulator[monthKey] =
            (accumulator[monthKey] ?? 0) +
            (record.totalAmount ?? []).reduce((sum, item) => sum + item.amount, 0);

        return accumulator;
    }, {});

    const currentMonth = new Date();
    currentMonth.setDate(1);

    const chartData = Array.from({ length: 9 }, (_, index) => {
        const monthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 3 + index, 1);
        const monthKey = getMonthKey(monthDate);

        return {
            label: formatMonthLabel(monthDate),
            amount: amountByMonth[monthKey] ?? 0,
        };
    });

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>EMI Payment Forecast</CardTitle>
                {emiEndMonth && (
                    <CardDescription>
                        All EMIs will be over by {emiEndMonth}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        margin={{
                            top: 20,
                        }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="label"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            interval={0}
                            height={60}
                            tick={renderLabelTick}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value.toLocaleString("en-IN")}`}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={8}>
                            <LabelList
                                position="top"
                                offset={12}
                                className="fill-foreground"
                                fontSize={12}
                                formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                            />
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
