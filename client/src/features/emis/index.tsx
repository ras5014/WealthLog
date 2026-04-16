import { EmiForecasting } from "./components/EmiForecasting";
import TotalLoan from "./components/TotalLoan";
import { useEmi } from "../../hooks/useEmi";
import type { EmiItem } from "./type";


export default function Index() {

    // Getting EMI Data
    const { data: emis, isPending, isError } = useEmi();
    const emiList = (emis ?? []) as EmiItem[];

    // Calculations and sending as props to child components

    const totalLoanAmount = emiList.reduce(
        (total, emi) => total + Number(emi.totalAmount ?? 0),
        0
    );

    const totalPaidAmount = emiList.reduce(
        (total, emi) =>
            total +
            (emi.amortizationSchedule ?? []).reduce(
                (scheduleTotal, installment) =>
                    installment.paymentStatus === "paid"
                        ? scheduleTotal + Number(installment.installmentAmount ?? 0)
                        : scheduleTotal,
                0
            ),
        0
    );

    const remainingAmount = totalLoanAmount - totalPaidAmount;

    return (
        <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading EMIs</p>}
            {emis && (
                <>
                    <TotalLoan
                        totalLoanAmount={totalLoanAmount}
                        totalPaidAmount={totalPaidAmount}
                        remainingAmount={remainingAmount}
                    />
                    <EmiForecasting />
                </>
            )}
        </div>
    )
}
