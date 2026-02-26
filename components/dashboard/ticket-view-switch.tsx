import { cn } from "@/lib/utils"

interface TicketViewSwitchProps {
    view: "active" | "historical"
    onChange: (view: "active" | "historical") => void
}

export function TicketViewSwitch({ view, onChange }: TicketViewSwitchProps) {
    const isHistorical = view === "historical"

    return (
        <div className="flex flex-col items-end gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">
                Historie
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={isHistorical}
                onClick={() => onChange(isHistorical ? "active" : "historical")}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isHistorical ? "bg-foreground" : "bg-border/60 hover:bg-border"
                )}
            >
                <span className="sr-only">Přepnout zobrazení</span>
                <span
                    className={cn(
                        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform",
                        isHistorical ? "translate-x-6" : "translate-x-1",
                        "mt-[0px]"
                    )}
                />
            </button>
        </div>
    )
}
