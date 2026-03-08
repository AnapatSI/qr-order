'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function QRGeneratorPage() {
  const [totalTables, setTotalTables] = useState('')
  const [storeId, setStoreId] = useState('')
  const [generated, setGenerated] = useState(false)

  const generateQRs = () => {
    if (totalTables && storeId) {
      setGenerated(true)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getQRValue = (tableNo: number) => {
    const domain = typeof window !== 'undefined' ? window.location.origin : ''
    return `${domain}/${storeId}/menu?table=${tableNo}`
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">QR Code Generator</h1>

        <Card className="mb-8 print:hidden">
          <CardHeader>
            <CardTitle>Generate QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Store ID</label>
              <Input
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="Enter store ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Tables</label>
              <Input
                type="number"
                value={totalTables}
                onChange={(e) => setTotalTables(e.target.value)}
                placeholder="Enter number of tables"
              />
            </div>
            <Button
              onClick={generateQRs}
              disabled={!totalTables || !storeId}
              className="w-full"
            >
              Generate QR Codes
            </Button>
          </CardContent>
        </Card>

        {generated && (
          <div>
            <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-2xl font-bold">Generated QR Codes</h2>
              <Button onClick={handlePrint} size="lg">
                Print QR Codes
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-4 print:gap-8">
              {Array.from({ length: parseInt(totalTables) }, (_, i) => i + 1).map((tableNo) => (
                <div key={tableNo} className="text-center print:break-inside-avoid">
                  <div className="bg-white p-4 rounded-lg shadow-md print:shadow-none">
                    <QRCodeSVG
                      value={getQRValue(tableNo)}
                      size={150}
                      className="mx-auto mb-2"
                    />
                    <div className="font-bold text-lg">Table {tableNo}</div>
                    <div className="text-sm text-gray-600 print:text-black">
                      {storeId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <style jsx global>{`
          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
            .print\\:grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr));
            }
            .print\\:gap-8 {
              gap: 2rem;
            }
            .print\\:shadow-none {
              box-shadow: none;
            }
            .print\\:break-inside-avoid {
              break-inside: avoid;
            }
            .print\\:text-black {
              color: black;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
