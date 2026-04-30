import { Input } from "@/components/ui/input"
import { useSynchronizeIcici, useAutoSyncIcici } from "@/features/credit_card/hooks/useSynchronizeIcici";
import { ACCEPTED_TYPES, statementSchema, type StatementFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { Bot } from "lucide-react";
import { useState } from "react";

export default function ICICISyncForm({ setOpen }: { readonly setOpen: (open: boolean) => void }) {
    const [autoLogin, setAutoLogin] = useState(false);

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

    const iciciFile = watch("iciciStatement")?.[0];

    async function onSubmit(data: StatementFormValues) {
        await synchronizeIcici.mutateAsync(data.iciciStatement[0]);
        reset();
        setOpen(false);
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
                            {synchronizeIcici.isPending ? "Synchronizing..." : "Synchronize"}
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
