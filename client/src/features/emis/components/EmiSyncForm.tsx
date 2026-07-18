import { Input } from "@/components/ui/input";
import { useSynchronizeEmi, useAutoSyncEmi } from "../hooks/useSynchronizeEmi";
import { ACCEPTED_TYPES, emiStatementSchema, type EmiStatementFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useWatch } from "react-hook-form";
import { Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EMI_BANK_OPTIONS } from "@/lib/constants";

export default function EmiSyncForm({ setOpen }: { readonly setOpen: (open: boolean) => void }) {
    const [autoLogin, setAutoLogin] = useState(false);
    const [expectedDownloads, setExpectedDownloads] = useState(1);

    const synchronizeEmi = useSynchronizeEmi();
    const autoSyncEmi = useAutoSyncEmi();

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors },
    } = useForm<EmiStatementFormValues>({
        resolver: zodResolver(emiStatementSchema),
        defaultValues: { bank: EMI_BANK_OPTIONS[0] },
    });

    const emiFile = useWatch({ control, name: "emiStatement" })?.[0];
    const bank = useWatch({ control, name: "bank" });

    async function onSubmit(data: EmiStatementFormValues) {
        await synchronizeEmi.mutateAsync({ file: data.emiStatement[0], bank: data.bank });
        reset();
        setOpen(false);
    }

    function handleAutoSync() {
        autoSyncEmi.mutate({ autoLogin, bank, expectedDownloads });
    }

    const isSyncing = synchronizeEmi.isPending || autoSyncEmi.isPending;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 px-1 py-2 sm:px-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <p className="font-medium">EMI Auto Sync v1</p>
                        <p className="text-muted-foreground">
                            Starts a local browser. Navigate to the EMI section and download your
                            EMI amortization schedule PDFs. WealthLog will capture and synchronize them.
                        </p>
                        <label className="flex items-center gap-2 pt-1 text-sm">
                            <Input
                                type="checkbox"
                                className="size-4 rounded border-input accent-primary"
                                checked={autoLogin}
                                onChange={(event) => setAutoLogin(event.target.checked)}
                                disabled={isSyncing}
                            />
                            <span>Auto login with saved ICICI credentials</span>
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
                        {autoSyncEmi.isPending ? "Running..." : "Start Auto Sync"}
                    </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:mt-4">
                    <label htmlFor="emiBank" className="text-sm font-medium sm:w-32 sm:shrink-0">Bank</label>
                    <Controller
                        name="bank"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isSyncing}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMI_BANK_OPTIONS.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:mt-4">
                    <label htmlFor="expectedDownloads" className="text-sm font-medium sm:w-32 sm:shrink-0">
                        No. of PDFs
                    </label>
                    <Input
                        id="expectedDownloads"
                        type="number"
                        min={1}
                        max={20}
                        value={expectedDownloads}
                        onChange={(e) => setExpectedDownloads(Number(e.target.value))}
                        disabled={isSyncing}
                        className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">
                        Number of EMI PDFs to capture during auto sync
                    </span>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:mt-4">
                    <label htmlFor="emiStatement" className="text-sm font-medium sm:w-32 sm:shrink-0">EMI Statement</label>
                    <div className="min-w-0 flex-1">
                        <Input
                            id="emiStatement"
                            type="file"
                            accept={ACCEPTED_TYPES.join(",")}
                            {...register("emiStatement")}
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                        <Button type="submit" disabled={isSyncing}>
                            {synchronizeEmi.isPending ? "Synchronizing..." : "Synchronize"}
                        </Button>
                    </div>
                </div>
                <div className="min-h-4 sm:ml-32">
                    {emiFile && (
                        <p className="text-xs text-muted-foreground truncate">{emiFile.name}</p>
                    )}
                    {errors.emiStatement && (
                        <p className="text-xs text-destructive">{errors.emiStatement.message}</p>
                    )}
                    {errors.bank && (
                        <p className="text-xs text-destructive">{errors.bank.message}</p>
                    )}
                </div>
            </div>
        </form>
    );
}
