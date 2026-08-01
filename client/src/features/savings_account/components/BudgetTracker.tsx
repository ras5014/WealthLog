import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSavingsTransactions } from "../hooks/useSavingsTransactions";

export default function BudgetTracker() {
  const { data: savingsInfo, isPending, isError } = useSavingsTransactions();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Budget</CardTitle>
        <CardDescription>Card Description</CardDescription>
        <CardAction>Card Action</CardAction>
      </CardHeader>
      <CardContent>
        <p>Total spent: {savingsInfo?.totalWithdrawals}</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  );
}
