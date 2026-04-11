"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
  }
}

type ChartContextValue = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, value]) => value.color)

  if (!colorConfig.length) {
    return null
  }

  const cssVars = colorConfig
    .map(([key, value]) => `  --color-${key}: ${value.color};`)
    .join("\n")

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart="${id}"] {\n${cssVars}\n}`,
      }}
    />
  )
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
}) {
  const uniqueId = React.useId().replace(/:/g, "")
  const chartId = `chart-${id ?? uniqueId}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex justify-center text-xs",
          "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-radial-bar-background-sector]:fill-muted/45",
          "[&_.recharts-text]:fill-foreground",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
}

export { ChartContainer, useChart }
