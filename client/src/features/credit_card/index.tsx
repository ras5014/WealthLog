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

    const totalSpends = transactions?.reduce((acc, transaction) => acc + Number(transaction.amount), 0) || 0;
    const totalDayPassedInCurrentCycle = totalDayPassed || 0;
    const burnRatePerDay = totalDayPassedInCurrentCycle > 0 ? totalSpends / totalDayPassedInCurrentCycle : 0;
    // TODO: Get last month same time spend from backend/redis cache
    return (
        <div className="flex gap-4">
            <TotalSpent totalSpent={totalSpends} burnRatePerDay={burnRatePerDay} />
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
    )
}
