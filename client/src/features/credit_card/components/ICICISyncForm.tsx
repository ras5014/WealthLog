import { Input } from "@/components/ui/input"
import { useSynchronizeIcici, useAutoSyncIcici } from "@/features/credit_card/hooks/useSynchronizeIcici";
import { ACCEPTED_TYPES, statementSchema, type StatementFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Bot } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";

const CREDIT_CARD_BANK_OPTIONS = ["ICICI_CORAL", "ICICI_AMZNPAY"] as const;

export default function ICICISyncForm({ setOpen }: { readonly setOpen: (open: boolean) => void }) {
    const [autoLogin, setAutoLogin] = useState(false);
    const [requiresBank, setRequiresBank] = useState(false);

    const synchronizeIcici = useSynchronizeIcici();
    const autoSyncIcici = useAutoSyncIcici();
    const {
        register,
        handleSubmit,
        reset,
        watch,
        control,
        formState: { errors },
    } = useForm<StatementFormValues>({
        resolver: zodResolver(statementSchema),
        defaultValues: { bank: CREDIT_CARD_BANK_OPTIONS[0] },
    });

    const iciciFile = watch("iciciStatement")?.[0];
    const selectedBank = watch("bank");

    async function onSubmit(data: StatementFormValues) {
        try {
            await synchronizeIcici.mutateAsync({
                file: data.iciciStatement[0],
                bank: requiresBank ? data.bank : undefined,
            });
            setRequiresBank(false);
            reset();
            setOpen(false);
        } catch (error) {
            if (
                axios.isAxiosError<{ error?: string }>(error) &&
                error.response?.data.error === "BANK_SELECTION_REQUIRED"
            ) {
                setRequiresBank(true);
            }
        }
    }

    function handleAutoSync() {
        autoSyncIcici.mutate({ autoLogin });
    }

    const isSyncing = synchronizeIcici.isPending || autoSyncIcici.isPending;

    return (
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
                        {autoSyncIcici.isPending ? "Running..." : "Start Auto Sync"}
                    </Button>
                </div>
                {requiresBank && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:mt-4">
                        <label htmlFor="creditCardBank" className="text-sm font-medium sm:w-32 sm:shrink-0">Bank</label>
                        <Controller
                            name="bank"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isSyncing}
                                >
                                    <SelectTrigger id="creditCardBank" className="w-full">
                                        <SelectValue placeholder="Select bank" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {CREDIT_CARD_BANK_OPTIONS.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                )}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:mt-4">
                    <label htmlFor="iciciStatement" className="text-sm font-medium sm:w-32 sm:shrink-0">ICICI Statement</label>
                    <div className="min-w-0 flex-1">
                        <Input
                            id="iciciStatement"
                            type="file"
                            accept={ACCEPTED_TYPES.join(",")}
                            {...register("iciciStatement")}
                        />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                        <Button type="submit" disabled={synchronizeIcici.isPending}>
                            {synchronizeIcici.isPending ? "Synchronizing..." : requiresBank ? `Synchronize ${selectedBank}` : "Synchronize"}
                        </Button>
                    </div>
                </div>
                <div className="min-h-4 sm:ml-32">
                    {iciciFile && (
                        <p className="text-xs text-muted-foreground truncate">{iciciFile.name}</p>
                    )}
                    {errors.iciciStatement && (
                        <p className="text-xs text-destructive">{errors.iciciStatement.message}</p>
                    )}
                </div>
            </div>
        </form>
    )
}
