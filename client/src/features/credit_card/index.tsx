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

export default function index() {
    return (
        <div className="flex gap-4">
            <TotalSpent />
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
