import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { TotalLoanProps } from "../type"



export default function TotalLoan({
    totalLoanAmount,
    totalPaidAmount,
    remainingAmount,
}: TotalLoanProps) {
    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Total Loan</CardTitle>
                <CardDescription>Overview of your total loan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <p>Total Loan Amount: {formatCurrency(totalLoanAmount)}</p>
                <p>Paid Amount: {formatCurrency(totalPaidAmount)}</p>
                <p>Remaining Amount: {formatCurrency(remainingAmount)}</p>
            </CardContent>
        </Card>
    )
}
