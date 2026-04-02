import { useEffect, useMemo, useState } from "react"
import { ThemeProviderContext, type Theme, type ThemeProviderState } from "@/lib/theme-context"

type ThemeProviderProps = Readonly<{
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}>

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "wealthlog-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    useEffect(() => {
        const root = globalThis.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = globalThis.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"
            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    const value = useMemo<ThemeProviderState>(
        () => ({
            theme,
            setTheme: (t: Theme) => {
                localStorage.setItem(storageKey, t)
                setTheme(t)
            },
        }),
        [theme, storageKey]
    )

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}
