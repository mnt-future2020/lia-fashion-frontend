"use client"

import { CheckCircle, Eye, ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"

export default function ExchangedOrders({ orders, transitionInfo, onUpdateNote, onViewInvoice }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [noteDialog, setNoteDialog] = useState({
    isOpen: false,
    orderId: null,
    note: ""
  })

  // Handle note dialog
  const openNoteDialog = (orderId, currentNote) => {
    setNoteDialog({
      isOpen: true,
      orderId,
      note: currentNote || ""
    })
  }

  const closeNoteDialog = () => {
    setNoteDialog({
      isOpen: false,
      orderId: null,
      note: ""
    })
  }

  const handleSaveNote = () => {
    if (onUpdateNote) {
      onUpdateNote(noteDialog.orderId, noteDialog.note)
    }
    closeNoteDialog()
  }

  // Check if there's an active transition involving this component
  const hasIncomingTransition = transitionInfo && transitionInfo.toStatus === "Exchanged"
  const hasOutgoingTransition = transitionInfo && transitionInfo.fromStatus === "Exchanged"

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(orders.length / itemsPerPage)

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Generate page numbers
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden space-y-4">
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white rounded-lg border p-4 space-y-4 ${
                transitionInfo && transitionInfo.orderId === order.order_number ? "border-blue-500" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">Order #{order.order_number}</p>
                  <p className="text-sm text-gray-500">{order.date}</p>
                </div>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  Exchanged
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="text-sm">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment:</span>
                  <span className="text-sm">{order.payment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivered Date:</span>
                  <span className="text-sm text-orange-600">
                    {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Notes:</span>
                  <div
                    className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900"
                    onClick={() => openNoteDialog(order.id, order.notes)}
                  >
                    <Pencil size={16} />
                    <span className="text-sm">{order.notes || "Add note"}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Delivery Type:</span>
                  <Badge variant="outline" className={order.deliveryType === 'shiprocket' ? 
                    'bg-purple-50 text-purple-700 border-purple-200' : 
                    'bg-blue-50 text-blue-700 border-blue-200'}>
                    {order.deliveryType === 'shiprocket' ? 'Shiprocket' : 'Manual'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                  onClick={() => onViewInvoice(order)}
                >
                  <Eye size={16} className="mr-2" />
                  View
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No exchanged orders found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>              <TableRow className="bg-[#eb1c75]">
                <TableHead className="text-white font-medium">Order Number</TableHead>
                <TableHead className="text-white font-medium">Order Date</TableHead>
                <TableHead className="text-white font-medium">Customer Name</TableHead>
                <TableHead className="text-white font-medium">Payment</TableHead>
                <TableHead className="text-white font-medium">Status</TableHead>
                <TableHead className="text-white font-medium">Delivered On</TableHead>
                <TableHead className="text-white font-medium">Delivery Type</TableHead>
                <TableHead className="text-white font-medium">Notes</TableHead>
                <TableHead className="text-white font-medium text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.length > 0 ? (
                currentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={`${
                      transitionInfo && transitionInfo.orderId === order.order_number ? "bg-blue-50" : ""
                    }`}
                  >                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.payment}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Exchanged
                      </Badge>
                    </TableCell>
                    <TableCell className="text-orange-600">
                      {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        order.deliveryType === 'shiprocket' 
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-purple-50 text-purple-700 border-purple-200"
                      }>
                        {order.deliveryType === 'shiprocket' ? 'Shiprocket' : 'Manual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900"
                        onClick={() => openNoteDialog(order.id, order.notes)}
                      >
                        <Pencil size={16} />
                        <span>{order.notes || "Write a note"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                          onClick={() => onViewInvoice(order)}
                        >
                          <Eye size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No exchanged orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>      </div>

      {/* Note Dialog */}
      <Dialog open={noteDialog.isOpen} onOpenChange={(open) => !open && closeNoteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write your note here..."
              value={noteDialog.note}
              onChange={(e) => setNoteDialog(prev => ({ ...prev, note: e.target.value }))}
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeNoteDialog}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote} className="bg-pink-500 hover:bg-pink-600 text-white">
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transition Indicator */}
      {hasIncomingTransition && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <span className="font-medium">Order {transitionInfo.orderId}</span> has been moved from{" "}
            <span className="font-medium">{transitionInfo.fromStatus}</span> to{" "}
            <span className="font-medium">Exchanged</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Updated Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="text-sm text-gray-500 flex items-center">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, orders.length)} of {orders.length} entries
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
          </Button>

          {pageNumbers.map((number) => (
            <Button
              key={number}
              variant={currentPage === number ? "default" : "outline"}
              size="sm"
              className={`h-8 w-8 ${
                currentPage === number ? "bg-pink-500 hover:bg-pink-600" : ""
              }`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
