'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { QrCode, Printer, Download } from 'lucide-react'

export default function QRGeneratorPage() {
  const [totalTables, setTotalTables] = useState('10')
  const [storeId, setStoreId] = useState('')
  const [generated, setGenerated] = useState(false)

  useEffect(() => {
    const fetchStore = async () => {
      // Get store_id from URL parameter
      const storeParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('store') : null
      
      if (storeParam) {
        setStoreId(storeParam)
        setGenerated(true)
      } else {
        // Fallback: get first store
        const { data } = await supabase.from('stores').select('id').limit(1).single()
        if (data) {
          setStoreId(data.id)
          setGenerated(true)
        }
      }
    }
    fetchStore()
  }, [])

  const getQRValue = (tableNo: number) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : ''
    return `${domain}/${storeId}/menu?table=${tableNo}`
  }

  return (
    <div className="min-h-screen bg-[#f5f5f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] rounded-xl flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">QR Codes</h1>
                <p className="text-[10px] text-gray-400">Generate table QR codes for customers</p>
              </div>
            </div>
            {generated && (
              <button onClick={() => window.print()} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center space-x-2 shadow-md shadow-[#0ea5e9]/20 transition-all">
                <Printer className="w-4 h-4" />
                <span>Print All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 print:hidden">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Store ID</label>
              <Input value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="e.g., BS001" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Number of Tables</label>
              <Input type="number" value={totalTables} onChange={(e) => setTotalTables(e.target.value)} placeholder="10" className="h-11 rounded-xl bg-[#f5f5f4] border-0 focus-visible:ring-[#0ea5e9]" />
            </div>
          </div>
          <button
            onClick={() => setGenerated(true)}
            disabled={!totalTables || !storeId}
            className="w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white rounded-xl h-11 font-semibold text-sm shadow-md shadow-[#0ea5e9]/20 transition-all disabled:opacity-50"
          >
            Generate QR Codes
          </button>
        </div>
      </div>

      {/* QR Grid */}
      {generated && storeId && totalTables && (
        <div className="max-w-5xl mx-auto px-4 md:px-6 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-6">
            {Array.from({ length: parseInt(totalTables) || 0 }, (_, i) => i + 1).map((tableNo) => (
              <div key={tableNo} className="print:break-inside-avoid">
                <div className="bg-white rounded-2xl p-5 shadow-sm text-center hover:shadow-md transition-shadow print:shadow-none print:border print:border-gray-200">
                  <div className="inline-block p-3 bg-[#f5f5f4] rounded-xl mb-3 print:bg-white">
                    <QRCodeSVG value={getQRValue(tableNo)} size={130} className="mx-auto" />
                  </div>
                  <div className="text-3xl font-black text-gray-900">{tableNo}</div>
                  <div className="text-xs text-gray-400 mt-1">Scan to Order</div>
                  <div className="text-[10px] text-[#0ea5e9] font-medium mt-0.5">Bangsaen Smart Order</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .print\\:gap-6 { gap: 1.5rem; }
          .print\\:shadow-none { box-shadow: none; }
          .print\\:break-inside-avoid { break-inside: avoid; }
          .print\\:border { border: 1px solid #e5e7eb; }
          .print\\:border-gray-200 { border-color: #e5e7eb; }
          .print\\:bg-white { background-color: white; }
        }
      `}</style>
    </div>
  )
}
