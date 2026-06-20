"use client"

import { useState, useEffect, Suspense } from "react"
import { X, Upload, CirclePlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useParams } from 'next/navigation'
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import axios from "../../lib/axios"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ColorPicker } from "@/components/ui/color-picker"
import RichTextEditor from "@/components/ui/rich-text-editor"

const MAX_OTHER_IMAGES = 3;
const IMAGE_REGEX = /\.(jpg|jpeg|png|webp|gif)$/i;

export default function EditProductPage() {
  const router = useRouter()
  const { id } = useParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [product, setProduct] = useState({
    name: "",
    sku_code: "",
    description: "",
    category_id: "",
    subcategory_id: "",
    sizes: [{ size: "", purchase_price: "", mrp: "", selling_price: "", stock: "" }],
    colors: [{ color: "#000000", cover_image: null, other_images: [], image: null }],
    tax_percentage: "",
    weight: "",
    weight_unit: "gram",
    has_tax: false,
    min_quantity_for_discount: "",
    discounted_price: "",
    badge: "",
  })

  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMultipleOptions, setHasMultipleOptions] = useState(false)
  const [hasTax, setHasTax] = useState(false)
  const [otherImages, setOtherImages] = useState([])
  const [showCoverImageDialog, setShowCoverImageDialog] = useState(false)
  const [imagePreview, setImagePreview] = useState({})
  const [validation, setValidation] = useState({
    name: '',
    sku_code: '',
    category_id: '',
    subcategory_id: '',
    description: '',
    weight: '',
    weight_unit: '',
    'colors[0].color': '',
    'colors[0].cover_image': '',
  });
  const [showBulkDiscount, setShowBulkDiscount] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/admin/products/${id}`)
        const productData = response.data

        // Process colors to add image preview URLs
        const processedColors = productData.colors.map((color) => ({
          ...color,
          image: color.cover_image, // Set the image property for preview
        }))

        // Process other images for the first color
        let processedOtherImages = []
        if (productData.colors[0]?.other_images && productData.colors[0].other_images.length > 0) {
          processedOtherImages = productData.colors[0].other_images.map((img) => ({
            url: img,
            file: null, // We don't have the file object for existing images
          }))
        }

        setOtherImages(processedOtherImages)
        setProduct({
          ...productData,
          colors: processedColors,
          has_tax: !!productData.tax_percentage,
        })

        // Set hasMultipleOptions to true if there are any sizes defined
        setHasMultipleOptions(productData.sizes && productData.sizes.length > 0)
        setHasTax(!!productData.tax_percentage)

        // Set bulk discount toggle based on existing value
        setShowBulkDiscount(
          !!(productData.min_quantity_for_discount || productData.discounted_price)
        )

        if (productData.category_id) {
          fetchSubcategories(productData.category_id)
        }
      } catch (err) {
        setError("Failed to fetch product details")
        // console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
    fetchProduct()
  }, [id])

  // Clean up previews on unmount
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      Object.values(imagePreview).forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview)
        }
      })

      // Also clean up URLs in the otherImages array
      otherImages.forEach((img) => {
        if (img.url && img.file) {
          URL.revokeObjectURL(img.url)
        }
      })

      // Clean up URLs in the colors array
      product.colors.forEach((color) => {
        if (color.image && color.cover_image instanceof File) {
          URL.revokeObjectURL(color.image)
        }
      })
    }
  }, [imagePreview, otherImages, product.colors])

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/admin/categories")
      setCategories(response.data)
          } catch (err) {
        toast.error("Failed to fetch categories")
        // console.error(err)
      }
  }

  const fetchSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([])
      return
    }
    try {
      const response = await axios.get(`/api/admin/categories/${categoryId}/subcategories`)
      setSubcategories(response.data)
     
      
          } catch (err) {
        toast.error("Failed to fetch subcategories")
        // console.error(err)
      }
  }

  const handleSizeChange = (index, key, value) => {
    // Validate numeric fields
    if (['purchase_price', 'mrp', 'selling_price', 'stock'].includes(key)) {
      // Allow empty string for clearing the field
      if (value === '') {
        const sizes = [...product.sizes]
        sizes[index][key] = value
        setProduct({ ...product, sizes })
        return
      }
      
      // Check if value is numeric
      if (!/^\d*\.?\d*$/.test(value)) {
        toast.error(`${key.replace('_', ' ')} must be a valid number`)
        return
      }
      
      // Check for negative values
      if (parseFloat(value) < 0) {
        toast.error(`${key.replace('_', ' ')} cannot be negative`)
        return
      }
      
      // For stock, ensure it's a whole number
      if (key === 'stock' && value.includes('.')) {
        toast.error('Stock must be a whole number')
        return
      }
    }
    
    const sizes = [...product.sizes]
    sizes[index][key] = value
    setProduct({ ...product, sizes })
  }

  const handleColorChange = (index, key, value) => {
    const colors = [...product.colors]
    colors[index][key] = value
    setProduct({ ...product, colors })
  }

  const handleImageUpload = (index, e) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];

      // Check file type using regex
      if (!IMAGE_REGEX.test(file.name)) {
        toast.error('Only JPG, PNG, WEBP and GIF images are allowed');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image size should not exceed 10MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      // Update imagePreview state to track the URL
      setImagePreview((prev) => ({
        ...prev,
        [`color_${index}`]: previewUrl,
      }));

      const colors = [...product.colors];
      colors[index] = {
        ...colors[index],
        cover_image: file,
        image: previewUrl,
      };
      setProduct({ ...product, colors });
    }
  };

  function handleOtherImageUpload(e) {
    if (e.target.files) {
      // Check current number of images
      const remainingSlots = MAX_OTHER_IMAGES - otherImages.length;
      if (remainingSlots <= 0) {
        toast.error('Maximum 3 additional images allowed');
        return;
      }

      // Validate and filter files
      const filesToAdd = Array.from(e.target.files)
        .slice(0, remainingSlots)
        .filter(file => {
          // Check file type using regex
          if (!IMAGE_REGEX.test(file.name)) {
            toast.error('Only JPG, PNG, WEBP and GIF images are allowed');
            return false;
          }

          // Check file size (10MB limit)
          if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size should not exceed 10MB');
            return false;
          }

          return true;
        });

      if (filesToAdd.length === 0) return;

      const newImages = filesToAdd.map(file => ({
        url: URL.createObjectURL(file),
        file: file
      }));

      setOtherImages([...otherImages, ...newImages]);

      // Show warning if some images were not added
      if (e.target.files.length > remainingSlots) {
        toast.warning(`Only ${remainingSlots} image${remainingSlots > 1 ? 's' : ''} added. Maximum limit reached.`);
      }
    }
  }

  const handleAddImageCard = () => {
    const colors = [...product.colors]
    colors.push({ color: "", cover_image: null, other_images: [], image: null })
    setProduct({ ...product, colors })
  }

  const handleRemoveCard = (e, index) => {
    e.stopPropagation() // Prevent event bubbling
    if (index === 0) {
      setShowCoverImageDialog(true)
      return
    }
    const colors = [...product.colors]
    colors.splice(index, 1)
    setProduct({ ...product, colors })
  }

  const handleAddSize = () => {
    const newSizes = [...product.sizes]
    newSizes.push({
      size: "",
      purchase_price: "",
      mrp: "",
      selling_price: "",
      stock: "",
    })
    setProduct({ ...product, sizes: newSizes })
  }

  const handleRemoveSize = (index) => {
    if (product.sizes.length <= 1) return; // Prevent removing the last size option
    const sizes = [...product.sizes];
    sizes.splice(index, 1);
    setProduct({ ...product, sizes });
  };

  const handleRemoveOtherImage = (index) => {
    setOtherImages(otherImages.filter((_, i) => i !== index))
  }

  const validateForm = () => {
    const errors = {};
    
    if (!product.name) errors.name = 'Product name is required';
    if (!product.sku_code) errors.sku_code = 'SKU code is required';
    if (!product.category_id) errors.category_id = 'Category is required';
    if (!product.subcategory_id) errors.subcategory_id = 'Subcategory is required';
    if (!product.description) errors.description = 'Description is required';
    if (!product.weight) errors.weight = 'Weight is required';
    if (!product.weight_unit) errors.weight_unit = 'Weight unit is required';
    if (!product.colors[0]?.color) errors['colors[0].color'] = 'Color is required';
    if (!product.colors[0]?.cover_image && !product.colors[0]?.image) {
      errors['colors[0].cover_image'] = 'Cover image is required';
    }

    // Validate size options if multiple options are enabled
    if (hasMultipleOptions && product.sizes.length > 0) {
      product.sizes.forEach((size, index) => {
        // Check if size has any data (not completely empty)
        const hasData = size.size || size.purchase_price || size.mrp || size.selling_price || size.stock;
        
        if (hasData) {
          // If size has some data, validate all required fields
          if (!size.size) errors[`sizes[${index}].size`] = 'Size is required';
          if (!size.mrp) errors[`sizes[${index}].mrp`] = 'MRP is required';
          if (!size.selling_price) errors[`sizes[${index}].selling_price`] = 'Selling price is required';
          if (!size.stock) errors[`sizes[${index}].stock`] = 'Stock is required';
          
          // Validate numeric values
          if (size.purchase_price && (isNaN(size.purchase_price) || parseFloat(size.purchase_price) < 0)) {
            errors[`sizes[${index}].purchase_price`] = 'Purchase price must be a valid positive number';
          }
          if (size.mrp && (isNaN(size.mrp) || parseFloat(size.mrp) < 0)) {
            errors[`sizes[${index}].mrp`] = 'MRP must be a valid positive number';
          }
          if (size.selling_price && (isNaN(size.selling_price) || parseFloat(size.selling_price) < 0)) {
            errors[`sizes[${index}].selling_price`] = 'Selling price must be a valid positive number';
          }
          if (size.stock && (isNaN(size.stock) || parseFloat(size.stock) < 0 || !Number.isInteger(parseFloat(size.stock)))) {
            errors[`sizes[${index}].stock`] = 'Stock must be a valid positive whole number';
          }
          
          // Business logic validation
          if (size.mrp && size.selling_price && parseFloat(size.selling_price) > parseFloat(size.mrp)) {
            errors[`sizes[${index}].selling_price`] = 'Selling price cannot be greater than MRP';
          }
        }
      });
    }

    setValidation(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData()

    // Add tax percentage based on hasTax state
    const updatedProduct = {
      ...product,
      tax_percentage: hasTax ? product.tax_percentage : "",
      // Ensure badge is empty string when not selected
      badge: product.badge || ""
    }

    // Clear bulk discount fields if not enabled
    if (!showBulkDiscount) {
      updatedProduct.min_quantity_for_discount = '';
      updatedProduct.discounted_price = '';
    }

    // Filter out incomplete color entries
    const validColors = updatedProduct.colors.filter((color, index) => {
      if (index === 0) return true; // Always keep the first color (cover image)
      
      const hasValidImage = color.cover_image instanceof File || typeof color.cover_image === "string";
      if (!color.color || !hasValidImage) {
        toast.warning(`Removing incomplete color option ${index + 1}`);
        return false;
      }
      return true;
    });

    // Filter out incomplete size entries
    const validSizes = updatedProduct.sizes.filter((size, index) => {
      if (!size.size || !size.mrp || !size.selling_price || !size.stock) {
        toast.warning(`Removing incomplete size option ${index + 1}`);
        return false;
      }
      return true;
    });

    if (hasMultipleOptions && validSizes.length === 0) {
      toast.error('At least one complete size option is required');
      setIsSubmitting(false);
      return;
    }

    // Update the product state with valid entries
    setProduct(prev => ({ 
      ...prev, 
      colors: validColors,
      sizes: validSizes 
    }));
    updatedProduct.colors = validColors;
    updatedProduct.sizes = validSizes;

    Object.entries(updatedProduct).forEach(([key, value]) => {
      if (key === "colors") {
        value.forEach((color, i) => {
          formData.append(`colors[${i}][color]`, color.color)

          // Handle cover image
          if (color.cover_image instanceof File) {
            formData.append(`colors[${i}][cover_image]`, color.cover_image)
          } else if (typeof color.cover_image === "string") {
            formData.append(`colors[${i}][existing_cover_image]`, color.cover_image)
          }

          // Handle other images (only for the first color)
          if (i === 0 && otherImages?.length > 0) {
            otherImages.forEach((img, j) => {
              if (img.file instanceof File) {
                formData.append(`colors[${i}][other_images][${j}]`, img.file)
              } else if (typeof img.url === "string" && !img.file) {
                formData.append(`colors[${i}][existing_other_images][${j}]`, img.url)
              }
            })
          }
        })
      } else if (key === "sizes") {
        formData.append("sizes", JSON.stringify(validSizes))
      } else if (key === "min_quantity_for_discount") {
        // Only append if bulk discount is enabled and not empty
        if (showBulkDiscount && value !== '' && value !== null && value !== undefined) {
          formData.append('min_quantity_for_discount', value)
        }
      } else if (key === "discounted_price") {
        // Only append if bulk discount is enabled and not empty
        if (showBulkDiscount && value !== '' && value !== null && value !== undefined) {
          formData.append('discounted_price', value)
        }
      } else {
        formData.append(key, String(value))
      }
    })

    formData.append("_method", "PUT")

    try {
      await axios.post(`/api/admin/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      toast.success("Product updated successfully!")
      // Add a small delay before redirect to ensure toast is visible
      setTimeout(() => {
        router.push("/admin/dashboard/products")
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update product")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 bg-white rounded-lg shadow-sm">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
            <span className="ml-2">Loading product details...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors closeButton position="top-right" />
      <Dialog open={showCoverImageDialog} onOpenChange={setShowCoverImageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Cover Image Required</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              The cover image cannot be removed. You can only change it by clicking on the image.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              className="bg-[#eb1c75] hover:bg-pink-600 text-white"
              onClick={() => setShowCoverImageDialog(false)}
            >
              Understood
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto p-4 bg-white rounded-lg shadow-sm max-w-[90%]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Edit Product</h1>
        </div>

        <div className="max-w-[90%] md:max-w-[90%] gap-8 mx-auto">
          <div>
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="category">Select Category</Label>
                  <Select
                    value={product.category_id}
                    onValueChange={(value) => {
                      setProduct({ ...product, category_id: value })
                      fetchSubcategories(value)
                    }}
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validation.category_id && <span className="text-red-500 text-sm">{validation.category_id}</span>}
                </div>

                <div>
                  <Label htmlFor="subcategory">Select Sub Category</Label>
                  <Select
                    value={product.subcategory_id}
                    onValueChange={(value) => setProduct({ ...product, subcategory_id: value })}
                  >
                    <SelectTrigger id="subcategory" className="w-full">
                      <SelectValue placeholder="Enter Sub Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validation.subcategory_id && <span className="text-red-500 text-sm">{validation.subcategory_id}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="Summer T-Shirt"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className={validation.name ? 'border-red-500' : ''}
                  />
                  {validation.name && <span className="text-red-500 text-sm">{validation.name}</span>}
                </div>

                <div>
                  <Label htmlFor="skuCode">Sku Code</Label>
                  <Input
                    id="skuCode"
                    placeholder="Sku code"
                    value={product.sku_code}
                    onChange={(e) => setProduct({ ...product, sku_code: e.target.value })}
                    className={validation.sku_code ? 'border-red-500' : ''}
                  />
                  {validation.sku_code && <span className="text-red-500 text-sm">{validation.sku_code}</span>}
                </div>
              </div>

              <RichTextEditor
                  id="description"
                label="Product Description"
                placeholder="Enter detailed product description..."
                  value={product.description}
                onChange={(content) => setProduct({ ...product, description: content })}
                error={validation.description}
                />
            </div>

            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Images</h2>

              <div className="mb-6">
                <div className="flex gap-4 flex-wrap">
                  {product.colors.map((item, index) => (
                    <Card key={index} className="max-w-[220px] relative">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCard(e, index)}
                        className={`absolute right-2 top-2 p-1 hover:bg-gray-100 rounded-full cursor-pointer z-10 ${
                          index === 0 ? "opacity-100" : "text-gray-500"
                        }`}
                        style={{ pointerEvents: "auto" }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          {index === 0 ? "Cover Image" : `Product Image ${index + 1}`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col gap-4 items-center">
                          <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400">
                            <label
                              htmlFor={`image-upload-${index}`}
                              className="cursor-pointer w-full h-full flex items-center justify-center"
                            >
                              {item.image ? (
                                <div className="relative w-full h-full group">
                                  <Image
                                    src={item.image || "/placeholder.svg"}
                                    alt={`Product image ${index + 1}`}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                                    crossOrigin="anonymous"
                                    priority={index === 0}  // Add priority for first/cover image
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="h-8 w-8 text-gray-400" />
                                  </div>
                                </div>
                              ) : (
                                <Upload className="h-8 w-8 md:h-12 md:w-12 text-gray-400" />
                              )}
                              <input
                                id={`image-upload-${index}`}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleImageUpload(index, e)}
                                accept="image/*"
                              />
                            </label>
                          </div>

                          <div className="flex items-center">
                            <Label htmlFor={`color-${index}`} className="min-w-[50px]">Color</Label>
                            <ColorPicker
                              color={item.color || "#000000"}
                              onChange={(color) => handleColorChange(index, "color", color)}
                              className={validation['colors[0].color'] ? 'border-red-500' : ''}
                            />
                            {validation[`colors[0].color`] && <span className="text-red-500 text-sm">{validation[`colors[0].color`]}</span>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card
                    className="w-[200px] h-[273px] flex items-center justify-center cursor-pointer hover:bg-slate-50"
                    onClick={handleAddImageCard}
                  >
                    <CardContent className="flex items-center justify-center p-0">
                      <CirclePlus className="h-10 w-10 text-gray-400" />
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Other Images (Max 3)</h3>
                <div className="flex gap-4 flex-wrap mb-4">
                  {otherImages.map((image, index) => (
                    <div key={index} className="relative">
                      <div className="w-24 h-24 bg-slate-50 rounded-md flex items-center justify-center overflow-hidden border-2 border-dotted border-gray-400">
                        <Image
                          src={image.url}
                          alt={`Other image ${index + 1}`}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleRemoveOtherImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}

                  {otherImages.length < MAX_OTHER_IMAGES && (
                    <label htmlFor="other-image-upload" className="cursor-pointer">
                      <div className="w-24 h-24 bg-slate-50 rounded-md flex items-center justify-center border-2 border-dotted border-gray-400 hover:bg-slate-100">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                      <input
                        id="other-image-upload"
                        type="file"
                        className="hidden"
                        onChange={handleOtherImageUpload}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                      />
                    </label>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {otherImages.length} of {MAX_OTHER_IMAGES} images used
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-3 sm:p-6 mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Additional Options</h2>

              <div className="flex items-center mb-6">
                <Switch
                  id="multipleOptions"
                  checked={hasMultipleOptions}
                  onCheckedChange={setHasMultipleOptions}
                  className="data-[state=checked]:bg-[#eb1c75]"
                />
                <Label htmlFor="multipleOptions" className="ml-2">
                  This product has multiple options
                </Label>
              </div>

              {hasMultipleOptions && (
                <div>
                  <h3 className="text-sm sm:text-base font-medium mb-2">Size</h3>
                  {product.sizes.map((size, index) => (
                    <Card key={index} className="mb-4 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(index)}
                        className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Size Option {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 items-center">
                          <div className="col-span-2 sm:col-span-1 relative">
                            <Select value={size.size} onValueChange={(value) => handleSizeChange(index, "size", value)}>
                              <SelectTrigger className={`w-full ${validation[`sizes[${index}].size`] ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Size" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="XS">XS</SelectItem>
                                <SelectItem value="S">S</SelectItem>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="L">L</SelectItem>
                                <SelectItem value="XL">XL</SelectItem>
                                <SelectItem value="XXL">XXL</SelectItem>
                                <SelectItem value="XXXL">XXXL</SelectItem>
                                <SelectItem value="XXXXL">XXXXL</SelectItem>
                                <SelectItem value="free-size">Free Size</SelectItem>
                              </SelectContent>
                            </Select>
                            {validation[`sizes[${index}].size`] && (
                              <span className="text-red-500 text-xs mt-1 block">{validation[`sizes[${index}].size`]}</span>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1 relative">
                            <Input
                              value={size.purchase_price}
                              onChange={(e) => handleSizeChange(index, "purchase_price", e.target.value)}
                              placeholder="Purchase Price"
                              className={`w-full ${validation[`sizes[${index}].purchase_price`] ? 'border-red-500' : ''}`}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {validation[`sizes[${index}].purchase_price`] && (
                              <span className="text-red-500 text-xs mt-1 block">{validation[`sizes[${index}].purchase_price`]}</span>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1 relative">
                            <Input
                              value={size.mrp}
                              onChange={(e) => handleSizeChange(index, "mrp", e.target.value)}
                              placeholder="MRP"
                              className={`w-full ${validation[`sizes[${index}].mrp`] ? 'border-red-500' : ''}`}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {validation[`sizes[${index}].mrp`] && (
                              <span className="text-red-500 text-xs mt-1 block">{validation[`sizes[${index}].mrp`]}</span>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1 relative">
                            <Input
                              value={size.selling_price}
                              onChange={(e) => handleSizeChange(index, "selling_price", e.target.value)}
                              placeholder="Selling Price"
                              className={`w-full ${validation[`sizes[${index}].selling_price`] ? 'border-red-500' : ''}`}
                              type="number"
                              min="0"
                              step="0.01"
                            />
                            {validation[`sizes[${index}].selling_price`] && (
                              <span className="text-red-500 text-xs mt-1 block">{validation[`sizes[${index}].selling_price`]}</span>
                            )}
                          </div>
                          <div className="col-span-2 sm:col-span-1 relative">
                            <Input
                              value={size.stock}
                              onChange={(e) => handleSizeChange(index, "stock", e.target.value)}
                              placeholder="Stock"
                              className={`w-full ${validation[`sizes[${index}].stock`] ? 'border-red-500' : ''}`}
                              type="number"
                              min="0"
                              step="1"
                            />
                            {validation[`sizes[${index}].stock`] && (
                              <span className="text-red-500 text-xs mt-1 block">{validation[`sizes[${index}].stock`]}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="text-white bg-[#eb1c75] hover:bg-pink-500 hover:text-white p-2 h-auto border"
                    onClick={handleAddSize}
                  >
                    Add More
                  </Button>
                </div>
              )}
            </div>

            <div className="border rounded-lg p-6 mb-6">
              <div className="flex items-center mb-6">
                <Switch
                  id="tax"
                  checked={hasTax}
                  onCheckedChange={(checked) => {
                    setHasTax(checked)
                    if (!checked) {
                      setProduct({ ...product, tax_percentage: "" })
                    }
                  }}
                  className="data-[state=checked]:bg-[#eb1c75]"
                />
                <Label htmlFor="tax" className="ml-2">
                  Add tax for this product
                </Label>
              </div>

              {hasTax && (
                <div className="w-1/2">
                  <Input
                    type="number"
                    placeholder="Enter tax percentage"
                    value={product.tax_percentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string or valid positive numbers up to 100
                      if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                        setProduct({ ...product, tax_percentage: value });
                      } else {
                        toast.error('Tax percentage must be between 0 and 100');
                      }
                    }}
                    className="w-full"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
              )}
            </div>

            <div className="border rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <Switch
                  id="bulkDiscount"
                  checked={showBulkDiscount}
                  onCheckedChange={setShowBulkDiscount}
                  className="data-[state=checked]:bg-[#eb1c75]"
                />
                <Label htmlFor="bulkDiscount" className="ml-2">
                  Enable Bulk Discount
                </Label>
              </div>
              {showBulkDiscount && (
                <>
                  <h2 className="text-lg font-medium mb-4">Bulk Discount</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minQuantity">Minimum Quantity for Discount</Label>
                      <Input 
                        id="minQuantity" 
                        type="number"
                        min="2"
                        placeholder="Enter minimum quantity (e.g., 5)" 
                        value={product.min_quantity_for_discount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string or valid positive integers >= 2
                          if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 2)) {
                            setProduct({ ...product, min_quantity_for_discount: value });
                          } else if (value !== '') {
                            toast.error('Minimum quantity must be a whole number >= 2');
                          }
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500 mt-1 block">
                        Leave empty if no bulk discount applies
                      </span>
                    </div>
                    <div>
                      <Label htmlFor="discountedPrice">Discounted Price per Item</Label>
                      <Input 
                        id="discountedPrice" 
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter discounted price" 
                        value={product.discounted_price}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string or valid positive numbers
                          if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) >= 0)) {
                            setProduct({ ...product, discounted_price: value });
                          } else {
                            toast.error('Discounted price must be a positive number');
                          }
                        }}
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500 mt-1 block">
                        The price per item when buying at or above minimum quantity
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Product Badge Section */}
            <div className="border rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Product Badge</h2>
              
              <div className="w-full md:w-1/2">
                <Label htmlFor="badge">Select Badge (Optional)</Label>
                <Select
                  value={product.badge || "none"}
                  onValueChange={(value) => setProduct({ ...product, badge: value === "none" ? "" : value })}
                >
                  <SelectTrigger id="badge" className="w-full">
                    <SelectValue placeholder="Select a badge (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="New arrival">New arrival</SelectItem>
                    <SelectItem value="Best Seller">Best Seller</SelectItem>
                    <SelectItem value="Hot Selling">Hot Selling</SelectItem>
                    <SelectItem value="Trending">Trending</SelectItem>
                    <SelectItem value="Limited">Limited</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500 mt-1 block">
                  Add a special badge to highlight this product
                </span>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Shipping</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter Weight"
                    value={product.weight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string or valid positive numbers
                      if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) > 0)) {
                        setProduct({ ...product, weight: value });
                      } else if (value !== '') {
                        toast.error('Weight must be a positive number');
                      }
                    }}
                    className={validation.weight ? 'border-red-500' : ''}
                    min="0.01"
                    step="0.01"
                  />
                  {validation.weight && <span className="text-red-500 text-sm">{validation.weight}</span>}
                </div>

                <div>
                  <Label htmlFor="weightUnit">&nbsp;</Label>
                  <Select
                    value={product.weight_unit}
                    onValueChange={(value) => setProduct({ ...product, weight_unit: value })}
                  >
                    <SelectTrigger id="weightUnit" className="w-full">
                      <SelectValue placeholder="Gram (gr)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gram">Gram (gr)</SelectItem>
                      <SelectItem value="kg">Kilogram (kg)</SelectItem>
                      {/* <SelectItem value="lb">Pound (lb)</SelectItem> */}
                    </SelectContent>
                  </Select>
                  {validation.weight_unit && <span className="text-red-500 text-sm">{validation.weight_unit}</span>}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="sticky top-0 bg-white p-6 mt-6">
              <div className="flex gap-2 justify-end mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/admin/dashboard/products")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-[#eb1c75] hover:bg-pink-600" 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
