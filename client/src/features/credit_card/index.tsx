import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import TotalSpent from "./components/TotalSpent"
import TotalBudget from "./components/TotalBudget"
import CategorySpendChart from "./components/CategorySpendChart"
import { useTransactions } from "./hooks/useTransactions";

export default function Index() {
    const { data, isPending, isError } = useTransactions();
    const { transactions, totalDayPassed } = data || {};
    const currentBillingCycle = transactions?.[0];

    const totalSpends = transactions?.reduce((acc, transaction) => acc + Number(transaction.amount), 0) || 0;
    const totalDayPassedInCurrentCycle = totalDayPassed || 0;
    const burnRatePerDay = totalDayPassedInCurrentCycle > 0 ? totalSpends / totalDayPassedInCurrentCycle : 0;
    // TODO: Get last month same time spend from backend/redis cache
    const lastMonthSameTimeSpend = 10000;
    return (
        <>
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading data</p>}
            <div className="flex gap-4">
                <TotalSpent
                    totalSpent={totalSpends}
                    burnRatePerDay={burnRatePerDay}
                    lastMonthSameTimeSpend={lastMonthSameTimeSpend}
                    billingCycleStartDate={currentBillingCycle?.statementStartDate}
                    billingCycleEndDate={currentBillingCycle?.statementEndDate}
                />
                <TotalBudget />
                <CategorySpendChart />
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle>Card Title</CardTitle>
                        <CardDescription>Card Description</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>Card Content</p>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
