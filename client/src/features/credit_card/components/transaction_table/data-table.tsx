import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { CREDIT_CARD_TRANSACTIONS_PER_PAGE } from "@/lib/constants"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: CREDIT_CARD_TRANSACTIONS_PER_PAGE,
    })

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        state: {
            pagination,
        },
    })

    const currentPage = table.getState().pagination.pageIndex + 1
    const totalPages = table.getPageCount()
    const startRow =
        data.length === 0
            ? 0
            : table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1
    const endRow =
        data.length === 0
            ? 0
            : Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                      table.getState().pagination.pageSize,
                  data.length,
              )

    return (
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 bg-gradient-to-r from-emerald-500/5 via-transparent to-rose-500/5 px-4 py-3">
                <div>
                    <p className="text-sm font-semibold text-foreground">Recent transactions</p>
                    <p className="text-xs text-muted-foreground">
                        Showing {startRow}-{endRow} of {data.length} {data.length === 1 ? "entry" : "entries"}
                    </p>
                </div>
            </div>

            <Table>
                <TableHeader className="bg-muted/40">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-transparent">
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead
                                        key={header.id}
                                        className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className="border-border/60 odd:bg-background even:bg-muted/20"
                                data-state={row.getIsSelected() && "selected"}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className={cn("px-4 py-3 align-top")}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-32 px-4 text-center">
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">No transactions found</p>
                                    <p className="text-sm text-muted-foreground">
                                        Try a different bank filter or sync the latest statement.
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
                <p className="text-muted-foreground">
                    {CREDIT_CARD_TRANSACTIONS_PER_PAGE} entries per page
                </p>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    <button
                        type="button"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="min-w-24 text-center text-muted-foreground">
                        Page {totalPages === 0 ? 0 : currentPage} of {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="rounded-lg border border-border bg-background px-3 py-1.5 font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}
