import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import ICICISyncForm from "@/features/credit_card/components/ICICISyncForm";
import type { RootState } from "@/lib/store";
import { useState } from "react";
import { useSelector } from "react-redux";


export default function SynchronizeCC() {
    const [open, setOpen] = useState(false);
    const billingCycleEndDate = useSelector((state: RootState) => state.creditCard.billingCycleEndDate);
    const today = new Date();
    const isNotToday = billingCycleEndDate
        ? new Date(billingCycleEndDate).toDateString() !== today.toDateString()
        : false;

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    className={`w-56 justify-center ${isNotToday ? "heartbeateffect cursor-pointer" : ""}`}
                >
                    SYNCHRONIZE
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-[calc(100vw-2rem)] !max-w-none sm:w-[min(calc(100vw-2rem),42rem)]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Synchronize Banks</AlertDialogTitle>
                </AlertDialogHeader>

                <ICICISyncForm setOpen={setOpen} />

                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
