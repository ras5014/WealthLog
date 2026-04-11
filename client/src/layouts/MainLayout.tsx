import { Outlet, useLocation } from 'react-router'
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, CircleUser } from "lucide-react"
import { Button } from "@/components/ui/button"
import TopBarActionsForCreditCard from '@/features/credit_card/components/TopBarActionsForCreditCard'

export default function MainLayout() {
    const location = useLocation()
    const isCreditCardPage = location.pathname === "/credit-card"

    return (
        <ThemeProvider defaultTheme="system" storageKey="wealthlog-ui-theme">
            <SidebarProvider>
                <AppSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <header className="flex min-h-14 items-center gap-2 border-b px-4 py-2">
                        <SidebarTrigger />
                        {isCreditCardPage && <TopBarActionsForCreditCard />}
                        <div className="ml-auto flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                                <Bell className="h-5 w-5" />
                                <span className="sr-only">Notifications</span>
                            </Button>
                            <ModeToggle />
                            <Button variant="ghost" size="icon">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">User</span>
                            </Button>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto p-4">
                        <Outlet />
                    </main>
                </div>
            </SidebarProvider>
        </ThemeProvider>
    )
}
