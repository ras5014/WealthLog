import TotalBudget from "./components/TotalBudget"
import CategorySpendChart from "./components/CategorySpendChart"
import { useTransactions } from "./hooks/useTransactions";
import CreditInfo from "./components/CreditInfo";
import { DataTable } from "./components/transaction_table/data-table";
import { columns } from "./components/transaction_table/columns";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";
import { BANK_OPTIONS } from "@/lib/constants";
import type { CreditCardTransaction } from "./types";

export default function Index() {
    // API calls and getting Redux Store Data
    const bank = useSelector((state: RootState) => state.creditCard.bank) || BANK_OPTIONS[0];
    const { data, isPending, isError } = useTransactions();
    const { transactions, totalDayPassed } = data || {};

    // Calculations
    const currentBillingCycle = transactions?.[0];

    const normalizeBankName = (value: string) =>
        value.trim().replaceAll("_", " ").replace(/\s+/g, " ").toUpperCase();

    const filterTransactionsForBank = (transactions: CreditCardTransaction[], bank: string) => {
        if (bank === "ALL BANKS") {
            return transactions;
        }

        const normalizedBank = normalizeBankName(bank);
        return transactions.filter(transaction => normalizeBankName(transaction.bank) === normalizedBank);
    }

    const filteredTransactions = filterTransactionsForBank(transactions || [], bank);

    // For all banks
    const totalSpends = transactions?.reduce((acc, transaction) => {
        const amount = Number(transaction.amount);
        return transaction.type === "Dr" ? acc + amount : acc - amount;
    }, 0) || 0;

    // For selected bank
    const totalSpendsForSelectedBank = filteredTransactions?.reduce((acc, transaction) => {
        const amount = Number(transaction.amount);
        return transaction.type === "Dr" ? acc + amount : acc - amount;
    }, 0) || 0;

    const totalDayPassedInCurrentCycle = totalDayPassed || 0;
    const burnRatePerDay = totalDayPassedInCurrentCycle > 0 ? totalSpends / totalDayPassedInCurrentCycle : 0;
    // TODO: Get last month same time spend from backend/redis cache, Store last 6 months spending data on redis
    const lastMonthSameTimeSpend = 10000;
    const dueDate = currentBillingCycle?.statementEndDate || "";

    return (
        <>
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading data</p>}
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                <TotalBudget totalSpends={totalSpends} />
                <CreditInfo
                    totalSpent={totalSpendsForSelectedBank}
                    burnRatePerDay={burnRatePerDay}
                    lastMonthSameTimeSpend={lastMonthSameTimeSpend}
                    billingCycleStartDate={currentBillingCycle?.statementStartDate}
                    billingCycleEndDate={currentBillingCycle?.statementEndDate}
                    dueDate={dueDate}
                />
                <CategorySpendChart />
            </div>

            <div className="mt-6">
                <DataTable columns={columns} data={filteredTransactions} />
            </div>
        </>
    )
}
