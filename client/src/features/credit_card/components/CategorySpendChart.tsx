import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function CategorySpendChart() {
    return (
        <Card className="flex-1">
            <CardHeader>
                <CardTitle>Category Spending</CardTitle>
                <CardDescription>Spending by category for the current month</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card Content</p>
            </CardContent>
        </Card>
    )
}
