import TotalBudget from "./components/TotalBudget"
import CategorySpendChart from "./components/CategorySpendChart"
import { useTransactions } from "./hooks/useTransactions";
import CreditInfo from "./components/CreditInfo";

export default function Index() {
    const { data, isPending, isError } = useTransactions();
    const { transactions, totalDayPassed } = data || {};
    const currentBillingCycle = transactions?.[0];

    const totalSpends = transactions?.reduce((acc, transaction) => acc + Number(transaction.amount), 0) || 0;
    const totalDayPassedInCurrentCycle = totalDayPassed || 0;
    const burnRatePerDay = totalDayPassedInCurrentCycle > 0 ? totalSpends / totalDayPassedInCurrentCycle : 0;
    // TODO: Get last month same time spend from backend/redis cache
    const lastMonthSameTimeSpend = 10000;
    const dueDate = currentBillingCycle?.statementEndDate || "";
    return (
        <>
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading data</p>}
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                <TotalBudget totalSpends={totalSpends} />
                <CreditInfo
                    totalSpent={totalSpends}
                    burnRatePerDay={burnRatePerDay}
                    lastMonthSameTimeSpend={lastMonthSameTimeSpend}
                    billingCycleStartDate={currentBillingCycle?.statementStartDate}
                    billingCycleEndDate={currentBillingCycle?.statementEndDate}
                    dueDate={dueDate}
                />
                <CategorySpendChart />
            </div>
        </>
    )
}
