import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
    amount: z.number().min(0, "Amount must be a positive number"),
})

export default function SetBudget() {

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: 0,
        },
    })

    function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values)
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-56 justify-center border-blue-500/80 text-blue-500 hover:border-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
                >
                    Set budget For this month
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-semibold">
                            Set Budget For This Month
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                            Enter the total amount you'd like to budget for your credit card spending this month.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label htmlFor="amount" className="mb-2 block text-sm font-medium">
                            Budget Amount
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                ₹
                            </span>
                            <Input
                                {...form.register("amount", { valueAsNumber: true })}
                                id="amount"
                                type="number"
                                aria-invalid={form.formState.errors.amount ? "true" : "false"}
                                placeholder="0.00"
                                autoComplete="off"
                                className="pl-7"
                            />
                        </div>
                        {form.formState.errors.amount && (
                            <p className="mt-1.5 text-xs text-destructive">
                                {form.formState.errors.amount.message}
                            </p>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            type="submit"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Set Budget
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </form>
            </AlertDialogContent>
        </AlertDialog>
    )
}
