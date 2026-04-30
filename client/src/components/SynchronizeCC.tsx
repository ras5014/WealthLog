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
import { useAutoSyncIcici, useSynchronizeIcici } from "@/features/credit_card/hooks/useSynchronizeIcici";
import type { RootState } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

const ACCEPTED_TYPES = [".pdf"];
const ACCEPTED_MIME = ["application/pdf"];

const statementSchema = z.object({
    iciStatement: z
        .instanceof(FileList)
        .refine((fl) => fl.length > 0, "At least one ICICI statement is required")
        .refine(
            (fl) => Array.from(fl).every((file) => ACCEPTED_MIME.includes(file.type)),
            `Accepted formats: ${ACCEPTED_TYPES.join(", ")}`
        ),
});

type StatementFormValues = z.infer<typeof statementSchema>;

export default function SynchronizeCC() {
    const [open, setOpen] = useState(false);
    const [autoLogin, setAutoLogin] = useState(false);
    const billingCycleEndDate = useSelector((state: RootState) => state.creditCard.billingCycleEndDate);
    const today = new Date();
    const isNotToday = billingCycleEndDate
        ? new Date(billingCycleEndDate).toDateString() !== today.toDateString()
        : false;
    const synchronizeIcici = useSynchronizeIcici();
    const autoSyncIcici = useAutoSyncIcici();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors },
    } = useForm<StatementFormValues>({
        resolver: zodResolver(statementSchema),
    });

    const selectedFiles = Array.from(watch("iciStatement") ?? []);

    async function onSubmit(data: StatementFormValues) {
        for (const file of Array.from(data.iciStatement)) {
            await synchronizeIcici.mutateAsync(file);
        }
        reset();
        setOpen(false);
    }

    function handleAutoSync() {
        autoSyncIcici.mutate({ autoLogin });
    }

    const isSyncing = synchronizeIcici.isPending || autoSyncIcici.isPending;

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
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-1.5">
                                <p className="font-medium">Auto Sync v1</p>
                                <p className="text-muted-foreground">
                                    Starts a local browser. Download the Coral and Amazon Pay PDF statements,
                                    and WealthLog will capture those downloads and synchronize them.
                                </p>
                                <label className="flex items-center gap-2 pt-1 text-sm">
                                    <input
                                        type="checkbox"
                                        className="size-4 rounded border-input accent-primary"
                                        checked={autoLogin}
                                        onChange={(event) => setAutoLogin(event.target.checked)}
                                        disabled={isSyncing}
                                    />
                                    Auto login with saved ICICI credentials
                                </label>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="sm:shrink-0"
                                onClick={handleAutoSync}
                                disabled={isSyncing}
                            >
                                <Bot className="size-4" />
                                {autoSyncIcici.isPending ? "Running..." : "Start Auto Sync"}
                            </Button>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4">
                            <label className="text-sm font-medium sm:w-32 sm:shrink-0">ICICI Statements</label>
                            <div className="min-w-0 flex-1">
                                <Input
                                    type="file"
                                    accept={ACCEPTED_TYPES.join(",")}
                                    multiple
                                    {...register("iciStatement")}
                                />
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                                <Button type="submit" disabled={isSyncing}>
                                    {synchronizeIcici.isPending ? "Synchronizing..." : "Synchronize"}
                                </Button>
                            </div>
                        </div>
                        <div className="min-h-4 sm:ml-32">
                            {selectedFiles.length > 0 && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {selectedFiles.map((file) => file.name).join(", ")}
                                </p>
                            )}
                            {errors.iciStatement && (
                                <p className="text-xs text-destructive">{errors.iciStatement.message}</p>
                            )}
                        </div>
                    </div>

                </form>
                <AlertDialogFooter>
                    <AlertDialogCancel type="button" disabled={isSyncing}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
