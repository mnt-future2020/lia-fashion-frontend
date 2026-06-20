"use client"

import { X, ArrowRight, CheckCircle, Eye, Trash2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"


export default function PendingOrders({ orders, onConfirm, onCancel, onUpdateNote, onViewInvoice, transitionInfo }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [noteDialog, setNoteDialog] = useState({
    isOpen: false,
    orderId: null,
    note: ""
  })
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    orderId: null,
    orderNumber: ""
  })

  // Check if there's an active transition involving this component
  const hasIncomingTransition = transitionInfo && transitionInfo.toStatus === "Pending"
  const hasOutgoingTransition = transitionInfo && transitionInfo.fromStatus === "Pending"

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

  // Handle delete dialog
  const openDeleteDialog = (orderId, orderNumber) => {
    setDeleteDialog({
      isOpen: true,
      orderId,
      orderNumber
    })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      orderId: null,
      orderNumber: ""
    })
  }

  const handleConfirmDelete = () => {
    if (onCancel && deleteDialog.orderId) {
      onCancel(deleteDialog.orderId)
    }
    closeDeleteDialog()
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
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                  Pending
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer:</span>
                  <span className="text-sm">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items:</span>
                  <span className="text-sm text-right flex-1 ml-4" title={order.items}>{order.items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-sm font-semibold">Rs. {order.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment:</span>
                  <span className="text-sm">{order.payment}</span>
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

              <div>
                <div
                  className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-gray-900 mb-4"
                  onClick={() => openNoteDialog(order.id, order.notes)}
                >
                  <Pencil size={16} />
                  <span className="text-sm">{order.notes || "Add note"}</span>
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
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onConfirm(order.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openDeleteDialog(order.id, order.order_number)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No pending orders found.</p>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#eb1c75]">
                <TableHead className="text-white font-medium">Order Number</TableHead>
                <TableHead className="text-white font-medium">Order Date</TableHead>
                <TableHead className="text-white font-medium">Customer Name</TableHead>
                <TableHead className="text-white font-medium">Items Ordered</TableHead>
                <TableHead className="text-white font-medium">Total</TableHead>
                <TableHead className="text-white font-medium">Payment</TableHead>
                <TableHead className="text-white font-medium text-center">Status</TableHead>
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
                  >
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="max-w-xs truncate" title={order.items}>{order.items}</TableCell>
                    <TableCell className="font-semibold">Rs. {order.total}</TableCell>
                    <TableCell>{order.payment}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pending
                        </Badge>
                      </div>
                    </TableCell>                    <TableCell>
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
                      <div className="flex items-center justify-center gap-2">                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-pink-500 hover:bg-pink-600 text-white border-pink-500"
                          onClick={() => onViewInvoice(order)}
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-sm transition-colors duration-200 flex items-center justify-center min-w-[90px] shadow-sm hover:shadow-md"
                          onClick={() => onConfirm(order.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 border-red-200"
                          onClick={() => openDeleteDialog(order.id, order.order_number)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No pending orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.isOpen} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Are you sure you want to cancel order #{deleteDialog.orderNumber}?</p>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDeleteDialog}>
                No, Keep Order
              </Button>
              <Button onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white">
                Yes, Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transition Indicators */}
      {hasOutgoingTransition && (
        <Alert className="mt-4 border-blue-200 bg-blue-50">
          <ArrowRight className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <span className="font-medium">Order {transitionInfo.orderId}</span> is being moved to{" "}
            <span className="font-medium">{transitionInfo.toStatus}</span>
          </AlertDescription>
        </Alert>
      )}

      {hasIncomingTransition && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <span className="font-medium">Order {transitionInfo.orderId}</span> has been moved from{" "}
            <span className="font-medium">{transitionInfo.fromStatus}</span> to{" "}
            <span className="font-medium">Pending</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Pagination */}
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
