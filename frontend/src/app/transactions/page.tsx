'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { Connection, PublicKey } from '@solana/web3.js'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useTheme } from 'next-themes'

// Define the structure of a Solana transaction
type SolanaTransaction = {
  signature: string
  slot: number
  blockTime: number
  fee: number
  status: 'success' | 'failed'
}

// Define the columns for the Solana transactions table
const columns: ColumnDef<SolanaTransaction>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'signature',
    header: 'Signature',
    cell: ({ row }) => (
      <div className="font-mono text-xs">
        {(row.getValue('signature') as any).slice(0, 5) + '...'}
      </div>
    )
  },
  {
    accessorKey: 'blockTime',
    header: 'Time',
    cell: ({ row }) => (
      <div>{new Date((row as any).getValue('blockTime') * 1000).toLocaleString()}</div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div
        className={`capitalize ${row.getValue('status') === 'success' ? 'text-green-600' : 'text-red-600'}`}
      >
        {row.getValue('status')}
      </div>
    )
  },
  {
    accessorKey: 'fee',
    header: () => <div className="text-right">Fee (SOL)</div>,
    cell: ({ row }) => {
      const fee = parseFloat(row.getValue('fee'))
      const formatted = (fee / 1e9).toFixed(9) // Convert lamports to SOL
      return <div className="text-right font-medium">{formatted}</div>
    }
  },
  {
    accessorKey: 'slot',
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Slot
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue('slot')}</div>
  },

  {
    id: 'actions',
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(transaction.signature)
                toast.success('Signature copied to clipboard')
              }}
            >
              Copy signature
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                const url = `https://explorer.solana.com/tx/${transaction.signature}?cluster=devnet`
                window.open(url, '_blank')
              }}
            >
              View on Explorer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  }
]

export default function TransactionsPage() {
  const { walletSolana } = useWallet()
  const [transactions, setTransactions] = useState<SolanaTransaction[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const { theme } = useTheme()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        if (walletSolana && walletSolana.publicKey) {
          const connection = new Connection('https://api.devnet.solana.com')
          const pubKey = new PublicKey(walletSolana.publicKey)
          const signatures = await connection.getSignaturesForAddress(pubKey)
          const transactionData = await Promise.all(
            signatures.map(async (sig) => {
              const tx = await connection.getTransaction(sig.signature, { commitment: 'finalized' })
              console.log(tx)
              return {
                signature: sig.signature,
                slot: sig.slot,
                blockTime: sig.blockTime || 0,
                fee: tx?.meta?.fee || 0,
                status: tx?.meta?.err ? ('failed' as 'failed') : ('success' as 'success')
              }
            })
          )

          setTransactions(transactionData)
        }
      } catch (error) {
        toast.error('Failed to fetch transactions')
        console.error(error)
      }
    }

    fetchTransactions()
  }, [walletSolana])

  const table = useReactTable({
    data: transactions,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection
    }
  })

  return (
    <div
      className={`container mx-auto p-3 
        ${theme === 'dark' ? 'text-white' : 'text-black'}      `}
    >
      <h1 className="text-2xl font-bold mb-4">Transactions</h1>
      <div className="w-full">
        <div className="flex items-center py-4 space-x-2">
          <Input
            placeholder="Filter signatures..."
            value={(table.getColumn('signature')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('signature')?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
