import { EmiForecasting } from "./components/EmiForecasting";
import EMITable from "./components/EMITable";
import TotalLoan from "./components/TotalLoan";
import { useEmiDashboard } from "./hooks/useEmi";


export default function Index() {

    const { data, isPending, isError } = useEmiDashboard();

    // EMI end month: extract from the last emiRecord label (e.g. "17th Jul - 16th Aug (Oct 2026)")
    const emiEndMonth = data?.emiRecords?.at(-1)?.label?.match(/\(([^)]+)\)/)?.[1] ?? null;

    return (
        <div className="grid gap-4 md:grid-cols-1 xl:grid-cols-3">
            {isPending && <p>Loading...</p>}
            {isError && <p>Error loading EMIs</p>}
            {data && (
                <>
                    <TotalLoan
                        totalLoanAmount={data.totalLoanAmount}
                        totalPaidAmount={data.totalPaidAmount}
                        remainingAmount={data.remainingAmount}
                    />
                    <EmiForecasting
                        emiRecords={data.emiRecords}
                        emiEndMonth={emiEndMonth}
                    />
                    <EMITable />
                </>
            )}
        </div>
    )
}
