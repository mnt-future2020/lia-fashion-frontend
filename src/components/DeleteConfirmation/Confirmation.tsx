"use client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DeleteConfirmationProps {
  onDelete: () => void
  onClose: () => void
  isOpen: boolean
  title?: string
  description?: string
  confirmButtonText?: string
  confirmButtonColor?: string
  hideCancel?: boolean
}

export default function DeleteConfirmation({
  onDelete,
  onClose,
  isOpen = false,
  title = "Are You Sure want to Delete?",
  description = "Once delete it will be permanently delete from the database!",
  confirmButtonText = "Delete",
  confirmButtonColor = "destructive",
  hideCancel = false
}: DeleteConfirmationProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="relative w-[500px] animate-in fade-in zoom-in duration-300">
        {/* The circular icon that sits on top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="h-20 w-20 rounded-full bg-pink-200 flex items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-[#eb1c75] flex items-center justify-center">
              <X className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        {/* The main toast body with the special shape */}
        <div className="bg-white rounded-lg pt-16 pb-8 px-8 shadow-lg relative">
          {/* Custom notch for the icon */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-4 bg-white"
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
            }}
          ></div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#eb1c75] mb-4">{title}</h2>
            <p className="text-gray-600 text-base mb-8">{description}</p>

            <div className="flex justify-center gap-4">
              <Button 
                onClick={onDelete} 
                className="px-8 py-2 h-11 text-base rounded-md bg-[#eb1c75] hover:bg-pink-600 text-white"
              >
                {confirmButtonText}
              </Button>
              {!hideCancel && (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-8 py-2 h-11 text-base rounded-md border-[#eb1c75] text-[#eb1c75] hover:bg-pink-50"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
