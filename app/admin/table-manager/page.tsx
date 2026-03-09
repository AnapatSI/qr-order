'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Trash2, QrCode, Printer, Table2 } from 'lucide-react'

interface TableItem {
  id: string
  store_id: string
  table_number: string
  created_at: string
}

export default function TableManager() {
  const [tables, setTables] = useState<TableItem[]>([])
  const [storeId, setStoreId] = useState('')
  const [loading, setLoading] = useState(true)
  const [newTableNumber, setNewTableNumber] = useState('')
  const [adding, setAdding] = useState(false)
  const [qrDialog, setQrDialog] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.from('stores').select('id').limit(1).single()
      if (data) {
        setStoreId(data.id)
        await fetchTables(data.id)
      }
      setLoading(false)
    }
    init()
  }, [])

  const fetchTables = async (sid: string) => {
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('store_id', sid)
      .order('table_number')
    if (data) setTables(data)
  }

  const handleAddTable = async () => {
    if (!newTableNumber.trim() || !storeId) return
    setAdding(true)
    await supabase.from('tables').insert({ store_id: storeId, table_number: newTableNumber.trim() })
    setNewTableNumber('')
    await fetchTables(storeId)
    setAdding(false)
  }

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Delete this table?')) return
    await supabase.from('tables').delete().eq('id', id)
    await fetchTables(storeId)
  }

  const openQR = (table: TableItem) => {
    setSelectedTable(table)
    setQrDialog(true)
  }

  const getQRValue = (tableNo: string) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : ''
    return `${domain}/${storeId}/menu?table=${tableNo}`
  }

  const handlePrintAll = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f4] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0ea5e9]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-xl flex items-center justify-center">
                <Table2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Table Manager</h1>
                <p className="text-[10px] text-gray-400">{tables.length} tables</p>
              </div>
            </div>
            {tables.length > 0 && (
              <button onClick={handlePrintAll} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center space-x-2 shadow-md shadow-[#0ea5e9]/20 transition-all">
                <Printer className="w-4 h-4" />
                <span>Print All QR</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Table */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 print:hidden">
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Add New Table</h2>
          <div className="flex space-x-3">
            <Input
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              placeholder="e.g., 1, 2, VIP-1"
              className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9] flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
            />
            <button
              onClick={handleAddTable}
              disabled={adding || !newTableNumber.trim()}
              className="bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-xl px-5 h-11 font-semibold text-sm flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-8">
        {tables.length === 0 ? (
          <div className="text-center py-16 print:hidden">
            <Table2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No tables yet. Add your first table above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-2xl p-5 shadow-sm text-center print:shadow-none print:border print:border-gray-200 print:break-inside-avoid">
                <div className="inline-block p-3 bg-[#f5f5f4] rounded-xl mb-3 print:bg-white">
                  <QRCodeSVG value={getQRValue(table.table_number)} size={110} className="mx-auto" />
                </div>
                <div className="text-2xl font-black text-gray-900">{table.table_number}</div>
                <div className="text-xs text-gray-400 mt-1">Scan to Order</div>
                <div className="text-[10px] text-[#0ea5e9] font-medium mt-0.5 mb-3">Bangsaen Smart Order</div>
                <div className="flex justify-center space-x-2 print:hidden">
                  <button
                    onClick={() => openQR(table)}
                    className="w-8 h-8 rounded-lg bg-[#e0f2fe] flex items-center justify-center text-[#0ea5e9] hover:bg-[#0ea5e9] hover:text-white transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Dialog */}
      <Dialog open={qrDialog} onOpenChange={setQrDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Table {selectedTable?.table_number}</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="py-4">
              <div className="inline-block p-4 bg-[#f5f5f4] rounded-2xl mb-4">
                <QRCodeSVG value={getQRValue(selectedTable.table_number)} size={200} />
              </div>
              <p className="text-sm text-gray-500 mb-1">Scan to Order</p>
              <p className="text-xs text-gray-400 break-all">{getQRValue(selectedTable.table_number)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .print\\:gap-6 { gap: 1.5rem; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:border { border: 1px solid #e5e7eb; }
          .print\\:border-gray-200 { border-color: #e5e7eb; }
          .print\\:bg-white { background-color: white; }
          .print\\:break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  )
}
