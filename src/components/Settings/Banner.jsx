import { Trash2, ChevronLeft, ChevronRight, Upload, GripVertical } from "lucide-react"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useState, useEffect } from "react"
import Image from "next/image"
import axios from '../../lib/axios' 
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import { toast } from "react-hot-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function BannerSettings() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [bannerImage, setBannerImage] = useState(null)
  const [bannerFile, setBannerFile] = useState(null)
  const [banners, setBanners] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null })

  // Fetch banners
  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get('/api/admin/banners')
      setBanners(data)
    } catch (error) {
      // console.error('Failed to fetch banners:', error)
      toast.error('Failed to fetch banners')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerFile(file)
      // For preview
      const url = URL.createObjectURL(file)
      setBannerImage(url)
    }
  }

  const handleSubmit = async () => {
    if (!bannerFile) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('image', bannerFile)

    try {
      const response = await axios.post('/api/admin/banners', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      })
      if (response.data) {
        setBannerImage(null)
        setBannerFile(null)
        fetchBanners()
        toast.success('Banner uploaded successfully')
      }
    } catch (error) {
      // console.error('Upload error:', error.response?.data || error.message)
      toast.error(error.response?.data?.message || 'Failed to upload banner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeleteDialog({ open: false, id: null })
    setIsLoading(true)
    try {
      await axios.delete(`/api/admin/banners/${id}`)
      fetchBanners()
      toast.success('Banner deleted successfully')
    } catch (error) {
      // console.error('Delete error:', error)
      toast.error('Failed to delete banner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    setReordering(true);
    const { source, destination } = result;

    // Don't do anything if dropped in same place
    if (destination.index === source.index) {
      setReordering(false);
      return;
    }

    try {
      // Get the full list of banners, not just the current page
      const items = Array.from(banners);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      // Update UI immediately
      setBanners(items);

      // Prepare orders with new positions
      const orders = items.map((item, index) => ({
        id: item.id,
        position: index + 1
      }));

      // Send to backend
      await axios.post('/api/admin/banners/reorder', { orders });
      toast.success('Banner order updated successfully');
    } catch (error) {
      // console.error('Reorder error:', error);
      toast.error('Failed to update banner order');
      // Revert to original order
      fetchBanners();
    } finally {
      setReordering(false);
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = banners.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(banners.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Banner Settings</h2>

        <div className="grid gap-6">
          {/* Banner Form */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="banner-upload">Banner Image</Label>
              <p className="text-sm text-red-600 font-medium">
                <strong>Recommended size:</strong> 1920 × 800 pixels for best display quality
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-24 h-24 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400">
                  {bannerImage ? (
                    <Image
                      src={bannerImage}
                      alt="Banner image"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Label 
                      htmlFor="banner-upload" 
                      className="cursor-pointer flex items-center justify-center w-full h-full"
                    >
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      <Input
                        id="banner-upload"
                        type="file"
                        className="hidden"
                        onChange={handleImageUpload}
                        accept="image/*"
                      />
                    </Label>
                  )}
                </div>
                {bannerImage && (
                  <Button 
                    variant="outline" 
                    className="text-red-500 hover:text-red-600 w-full sm:w-auto"
                    onClick={() => {
                      setBannerImage(null)
                      setBannerFile(null)
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <Button 
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setBannerImage(null)
                setBannerFile(null)
              }}
            >
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
              onClick={handleSubmit}
              disabled={!bannerFile || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Save'}
            </Button>
          </div>

          {/* Banners Table */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="overflow-x-auto rounded-md border">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-[#eb1c75] text-white text-base sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-center text-white w-10"></TableHead>
                      <TableHead className="text-center text-white">No</TableHead>
                      <TableHead className="text-center text-white">Image</TableHead>
                      <TableHead className="text-center text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <Droppable droppableId="banners">
                    {(provided) => (
                      <TableBody 
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                        className={reordering ? 'cursor-grabbing' : ''}
                      >
                        {banners.map((item, index) => (
                          <Draggable 
                            key={item.id.toString()} 
                            draggableId={item.id.toString()} 
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`
                                  transition-colors duration-200
                                  ${snapshot.isDragging ? 'bg-slate-50 shadow-lg' : ''}
                                  ${reordering ? 'cursor-grabbing' : ''}
                                `}
                              >
                                <TableCell>
                                  <div 
                                    {...provided.dragHandleProps} 
                                    className={`
                                      cursor-grab flex justify-center items-center
                                      ${snapshot.isDragging ? 'cursor-grabbing' : ''}
                                    `}
                                  >
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">{index + 1}</TableCell>
                                <TableCell>
                                  <div className="w-12 h-12 mx-auto rounded-md overflow-hidden">
                                    <Image 
                                      src={item.image}
                                      alt="Banner image"
                                      width={48}
                                      height={48}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex justify-center">
                                    <Button 
                                      variant="outline" 
                                      size="icon" 
                                      className="h-8 w-8 text-red-500"
                                      onClick={() => setDeleteDialog({ open: true, id: item.id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </div>
            </div>
          </DragDropContext>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, banners.length)} of {banners.length} entries
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="hidden sm:flex gap-1">
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    variant={currentPage === number ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 ${currentPage === number ? 'bg-[#eb1c75] text-white hover:bg-[#d1007d]' : ''}`}
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </Button>
                ))}
              </div>
              
              <div className="sm:hidden">
                <span className="mx-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={open => !open && setDeleteDialog({ open: false, id: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Banner</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Are you sure you want to delete this banner?</div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, id: null })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.id)} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}