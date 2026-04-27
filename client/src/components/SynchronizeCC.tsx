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
import type { RootState } from "@/lib/store";
import { useSelector } from "react-redux";

export default function SynchronizeCC() {
    const billingCycleEndDate = useSelector((state: RootState) => state.creditCard.billingCycleEndDate);
    const today = new Date();
    const isNotToday = new Date(billingCycleEndDate).toDateString() !== today.toDateString();
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    className={`w-56 justify-center ${isNotToday ? "heartbeateffect cusrsor-pointer" : ""}`}
                >
                    SYNCHRONIZE
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle></AlertDialogTitle>
                    <AlertDialogDescription>
                        {/* Form Logic here */}

                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
