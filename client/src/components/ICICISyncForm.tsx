import { Input } from "@/components/ui/input"
import { useSynchronizeIcici } from "@/features/credit_card/hooks/useSynchronizeIcici";
import { ACCEPTED_TYPES, statementSchema, type StatementFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

export default function ICICISyncForm({ setOpen }: { readonly setOpen: (open: boolean) => void }) {
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

    const iciciFile = watch("iciciStatement")?.[0];

    async function onSubmit(data: StatementFormValues) {
        await synchronizeIcici.mutateAsync(data.iciciStatement[0]);
        reset();
        setOpen(false);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 px-1 py-2 sm:px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                    <Button type="button">
                        Auto Sync
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
        </form>
    )
}
