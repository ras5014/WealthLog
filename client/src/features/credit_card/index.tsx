import TotalBudget from "./components/TotalBudget"
import CategorySpendChart from "./components/CategorySpendChart"
import { useTransactions } from "./hooks/useTransactions";
import CreditInfo from "./components/CreditInfo";
import { DataTable } from "./components/transaction_table/data-table";
import { columns } from "./components/transaction_table/columns";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import type { RootState } from "@/lib/store";
import { BANK_OPTIONS } from "@/lib/constants";
import type { BankDetailSchema, CreditCardTransaction } from "./types";
import { useEmiInfo } from "@/hooks/useEmi"
import { useBankDetails } from "./hooks/useBankDetails";
import { setBillingCycleEndDate } from "./creditCardSlice";

export default function Index() {
    const dispatch = useDispatch();
    // API calls and getting Redux Store Data
    const bank = useSelector((state: RootState) => state.creditCard.bank) || BANK_OPTIONS[0];
    const { data, isPending, isError } = useTransactions();
    const { transactions, totalDayPassed } = data || {};

    // Calculations
    const currentBillingCycle = transactions?.[0];
    const billingCycleEndDate = currentBillingCycle?.statementEndDate;

    useEffect(() => {
        if (billingCycleEndDate) {
            dispatch(setBillingCycleEndDate(billingCycleEndDate));
        }
    }, [billingCycleEndDate, dispatch]);

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
    const burnRatePerDay = totalDayPassedInCurrentCycle > 0 ? totalSpendsForSelectedBank / totalDayPassedInCurrentCycle : 0;
    // TODO: Get last month same time spend from backend/redis cache, Store last 6 months spending data on redis
    const lastMonthSameTimeSpend = 10000;
    const dueDate = currentBillingCycle?.statementEndDate || "";

    const { data: bankDetails } = useBankDetails();
    // Get the EMIs
    const { data: emis, isPending: isEmiPending, isError: isEmiError } = useEmiInfo();
    // Calculate expected EMI for this billing cycle
    console.log("EMI data:", emis);

    const selectedBank = normalizeBankName(bank);
    const isAllBanks = bank === BANK_OPTIONS[0];

    const selectedBankDetail = bankDetails?.find(
        (detail: BankDetailSchema) => normalizeBankName(detail.bank) === selectedBank
    );
    const cycleStart = isAllBanks ? bankDetails?.[0]?.billingCycleStartDate : selectedBankDetail?.billingCycleStartDate;
    const cycleEnd = isAllBanks ? bankDetails?.[0]?.billingCycleEndDate : selectedBankDetail?.billingCycleEndDate;

    const totalEmiAmountAllBanks = (emis ?? []).reduce((sum, emi) => {
        return emi?.amortizationSchedule?.reduce((acc, installment) => {
            if (cycleStart && cycleEnd && installment.paymentDate >= cycleStart && installment.paymentDate <= cycleEnd) {
                return acc + Number(installment.installmentAmount);
            }
            return acc;
        }, sum);
    }, 0);

    const totalEmiAmount = isAllBanks ? totalEmiAmountAllBanks : (emis ?? []).reduce((sum, emi) => {
        const emiBank = normalizeBankName(emi.bank);
        if (emiBank !== selectedBank) return sum;

        return emi?.amortizationSchedule?.reduce((acc, installment) => {
            if (cycleStart && cycleEnd && installment.paymentDate >= cycleStart && installment.paymentDate <= cycleEnd) {
                return acc + Number(installment.installmentAmount);
            }
            return acc;
        }, sum);
    }, 0);

    return (
        <>
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading data</p>}
            <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
                <TotalBudget totalSpends={totalSpends + totalEmiAmountAllBanks} />
                <CreditInfo
                    totalSpent={totalSpendsForSelectedBank}
                    burnRatePerDay={burnRatePerDay}
                    lastMonthSameTimeSpend={lastMonthSameTimeSpend}
                    billingCycleStartDate={currentBillingCycle?.statementStartDate}
                    billingCycleEndDate={currentBillingCycle?.statementEndDate}
                    dueDate={dueDate}
                    totalEmiAmount={totalEmiAmount}
                />
                <CategorySpendChart />
            </div>

            <div className="mt-6">
                <DataTable columns={columns} data={filteredTransactions} />
            </div>
        </>
    )
}
