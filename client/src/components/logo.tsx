export default function Logo() {
    return (
        <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">$</span>
                </div>
                <span className="font-semibold text-foreground tracking-tight">WealthLog</span>
            </div>
        </div>
    )
}
