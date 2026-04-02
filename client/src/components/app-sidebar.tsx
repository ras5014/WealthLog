import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    BrainCircuit,
    CreditCard,
    Grid2x2,
    Landmark,
    ReceiptText,
    TrendingUp,
} from "lucide-react"
import { NavLink } from "react-router"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import Logo from "./logo"

type NavItem = {
    title: string
    to: string
    icon: LucideIcon
    end?: boolean
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        to: "/",
        icon: Grid2x2,
        end: true,
    },
    {
        title: "Savings Account",
        to: "/savings-account",
        icon: Landmark,
    },
    {
        title: "Credit Cards",
        to: "/credit-card",
        icon: CreditCard,
    },
    {
        title: "EMIs",
        to: "/emis",
        icon: ReceiptText,
    },
    {
        title: "MF & Savings",
        to: "/mf-savings",
        icon: TrendingUp,
    },
    {
        title: "Budget Plan (AI)",
        to: "/budget-plan-ai",
        icon: BrainCircuit,
    },
]

export function AppSidebar() {
    return (
        <Sidebar className="border-r border-sidebar-border">
            <SidebarHeader>
                <Logo />
            </SidebarHeader>
            <SidebarContent className="px-3 py-4">
                <SidebarMenu className="gap-2">
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <NavLink
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    cn(
                                        "flex h-12 w-full items-center gap-3 overflow-hidden rounded-2xl px-4 text-left text-sm font-medium text-sidebar-foreground ring-sidebar-ring outline-hidden transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2",
                                        isActive &&
                                        "bg-sidebar-accent text-sidebar-accent-foreground"
                                    )
                                }
                            >
                                <item.icon className="size-5 shrink-0" />
                                <span className="truncate">{item.title}</span>
                            </NavLink>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}
