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
import { Input } from "@/components/ui/input"
import { useSynchronizeIcici } from "@/features/credit_card/hooks/useSynchronizeIcici";
import type { RootState } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

const ACCEPTED_TYPES = [".pdf"];
const ACCEPTED_MIME = ["application/pdf"];

const statementSchema = z.object({
    iciStatement: z
        .instanceof(FileList)
        .refine((fl) => fl.length > 0, "ICICI statement is required")
        .refine((fl) => ACCEPTED_MIME.includes(fl[0]?.type), `Accepted formats: ${ACCEPTED_TYPES.join(", ")}`),
});

type StatementFormValues = z.infer<typeof statementSchema>;

export default function SynchronizeCC() {
    const [open, setOpen] = useState(false);
    const billingCycleEndDate = useSelector((state: RootState) => state.creditCard.billingCycleEndDate);
    const today = new Date();
    const isNotToday = billingCycleEndDate
        ? new Date(billingCycleEndDate).toDateString() !== today.toDateString()
        : false;
    const synchronizeIcici = useSynchronizeIcici();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<StatementFormValues>({
        resolver: zodResolver(statementSchema),
    });

    const iciFile = watch("iciStatement")?.[0];

    async function onSubmit(data: StatementFormValues) {
        await synchronizeIcici.mutateAsync(data.iciStatement[0]);
        reset();
        setOpen(false);
    }

    function handleOpenChange(open: boolean) {
        setOpen(open);
        if (!open) reset();
    }

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
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

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 px-1 py-2 sm:px-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="text-sm font-medium sm:w-32 sm:shrink-0">ICICI Statement</label>
                        <div className="min-w-0 flex-1">
                            <Input
                                type="file"
                                accept={ACCEPTED_TYPES.join(",")}
                                {...register("iciStatement")}
                            />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                            <Button type="submit" disabled={synchronizeIcici.isPending}>
                                {synchronizeIcici.isPending ? "Synchronizing..." : "Synchronize"}
                            </Button>
                            <Button type="button">
                                Auto Sync
                            </Button>
                        </div>
                    </div>
                    <div className="min-h-4 sm:ml-32">
                        {iciFile && (
                            <p className="text-xs text-muted-foreground truncate">{iciFile.name}</p>
                        )}
                        {errors.iciStatement && (
                            <p className="text-xs text-destructive">{errors.iciStatement.message}</p>
                        )}
                    </div>
                </form>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" disabled={synchronizeIcici.isPending}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
