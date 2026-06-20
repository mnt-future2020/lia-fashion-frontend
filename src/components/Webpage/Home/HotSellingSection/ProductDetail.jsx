"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Star, ShoppingCart, Minus, Plus, Share2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { cn, optimizeCloudinary } from "@/lib/utils"
import axios from '../../../../lib/axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import SimilarProducts from "./SimilarProducts"
import { useUserAuth } from "@/contexts/UserAuthContext"
import { useRouter } from 'next/navigation'
import { useUserCart } from '@/contexts/UserCartContext';
import { useAuth } from "@/contexts/AuthContext";
 
const colorMap = {
  'blue': '#0066FF',
  'red': '#FF0000',
  'green': '#00FF00',
  'black': '#000000',
  'white': '#FFFFFF',
  'pink': '#FF69B4',
  'purple': '#800080',
  'yellow': '#FFD700',
  'orange': '#FFA500',
  'brown': '#8B4513'
};

const ReviewCard = ({ review }) => {
  if (!review) return null

  return (
    <div className="mb-8 pb-8 border-b last:border-b-0">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium">{review.name || 'Anonymous'}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={16}
                className={i < (review.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
              />
            ))}
          </div>
        </div>
        <span className="text-gray-500">{review.date || ''}</span>
      </div>

      <p className="text-gray-700 mb-4">{review.text || ''}</p>
    </div>
  )
}

const formatSize = (sizeText) => {
  if (sizeText.toLowerCase() === 'free-size') {
    return <span style={{ fontSize: '15px', lineHeight: '1.1' }}>Free Size</span>;
  }
  
  // Handle extended size formats
  const sizeMap = {
    'XXL': '2XL',
    'XXXL': '3XL',
    'XXXXL': '4XL'
  };

  // Check if the size matches any of the patterns
  for (const [original, formatted] of Object.entries(sizeMap)) {
    if (sizeText.toUpperCase() === original) {
      return formatted;
    }
  }

  return sizeText;
};

const ProductDetail = ({ productId }) => {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [rating, setRating] = useState(0)
  const [reviewForm, setReviewForm] = useState({
    message: '',
  })
  const [activeTab, setActiveTab] = useState("description")
  const [similarProducts, setSimilarProducts] = useState([])
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  const { isAuthenticated } = useUserAuth()
  const { isAuthenticated: isAdminAuthenticated } = useAuth() // Admin auth context
  const router = useRouter()
  const [addingToCart, setAddingToCart] = useState(false);
  const { updateCartData } = useUserCart();
  const [isSizeChartOpen, setSizeChartOpen] = useState(true)

  // Check if current user is admin
  const isAdmin = isAdminAuthenticated

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/products/${productId}`, {
          signal: controller.signal
        });
        
        if (isMounted) {
          // Initialize first available size with stock > 0 and first color
          const initialSize = data.size_prices?.find(size => parseInt(size.stock) > 0) || null;
          const initialColor = data.colors?.[0] || null;
          
          setProduct(data);
          setSelectedSize(initialSize);
          setSelectedColor(initialColor);
          
          if (initialColor?.main_image) {
            setSelectedImage(0);
          }
        }
      } catch (error) {
        if (error.name === 'CanceledError' || !isMounted) return;

        if (!error.response || error.response.status !== 404) {
          // console.error('Failed to fetch product:', error);
          toast.error('Failed to load product details');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (productId) {
      setLoading(true); // Set loading to true before fetch
      setProduct(null); // Reset product state
      fetchProduct();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [productId]);

  // Fetch reviews for this product
  useEffect(() => {
    const fetchReviews = async () => {
      if (!productId) return;
      
      try {
        const { data } = await axios.get(`/api/products/${productId}/reviews`);
        // console.log('Reviews data:', data); // Debug log
        setReviews(data.reviews || []);
        setReviewStats({
          average: data.stats?.average || 0,
          total: data.stats?.total || 0,
          distribution: data.stats?.distribution || {
            1: 0, 2: 0, 3: 0, 4: 0, 5: 0
          }
        });
      } catch (error) {
        // console.error('Failed to fetch reviews:', error);
      }
    };

    fetchReviews();
  }, [productId]);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!product?.category?.id || !product?.subcategory?.id) return;
      try {
        // Fetch products with matching category and subcategory
        const { data } = await axios.get('/api/products', {
          params: {
            category_id: product.category.id,
            subcategory_id: product.subcategory.id,
            exclude: productId,
            limit: 4
          }
        });
        setSimilarProducts(data);
      } catch (error) {
        // console.error('Failed to fetch similar products:', error);
      }
    };

    if (product) {
      fetchSimilarProducts();
    }
  }, [product, productId]);

  // Get all product images
  const getAllProductImages = () => {
    if (!product || !product.colors) return []
    
    const allImages = product.colors.flatMap(color => {
      const images = [color.main_image]
      if (color.gallery) {
        images.push(...color.gallery)
      }
      return images
    })
    
    return [...new Set(allImages)].filter(Boolean)
  }

  const calculateSinglePrice = () => {
    if (!selectedSize) return 0;
    return selectedSize.price || selectedSize.selling_price || 0;
  }

  const calculateTotalPrice = () => {
    return calculateSinglePrice() * quantity;
  }

  const getMrpPrice = () => {
    if (!selectedSize) return 0
    return selectedSize.mrp || selectedSize.price || 0
  }

  // Calculate discount percentage
  const calculateDiscount = () => {
    if (!selectedSize) return 0
    const mrp = selectedSize.mrp || 0
    const price = selectedSize.price || mrp
    if (mrp && price < mrp) {
      return Math.round(((mrp - price) / mrp) * 100)
    }
    return 0
  }

  // Add handleShare function
  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        // Use native share if available
        await navigator.share({
          title: product?.name,
          text: `Check out ${product?.name} on our store!`,
          url: url
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      // console.error('Error sharing:', error);
      toast.error('Failed to share product');
    }
  };

  // Loading state
  if (loading && !product) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl p-4 shadow-sm">
          {/* Left Column - Image Section */}
          <div className="space-y-4">
            {/* Main Image Skeleton */}
            <div className="relative aspect-square max-w-xs mx-auto overflow-hidden rounded-lg bg-gray-200 animate-pulse" />
            
            {/* Thumbnail Images Skeleton */}
            <div className="flex justify-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i}
                  className="w-12 h-12 bg-gray-200 rounded-md animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Right Column - Details Section */}
          <div className="space-y-6">
            {/* Title Skeleton */}
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 w-3/4 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 w-1/4 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 w-1/2 rounded animate-pulse" />
            </div>

            {/* Price Section Skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-7 bg-gray-200 w-24 rounded animate-pulse" />
              <div className="h-5 bg-gray-200 w-16 rounded animate-pulse" />
            </div>

            {/* Color Selection Skeleton */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 w-16 rounded animate-pulse" />
              <div className="flex space-x-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </div>

            {/* Size Selection Skeleton */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 w-16 rounded animate-pulse" />
              <div className="flex space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-9 h-9 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </div>

            {/* Quantity and Buttons Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-6 bg-gray-200 w-24 rounded animate-pulse" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Product Metadata Skeleton */}
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-md animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="max-w-6xl mx-auto p-4">Product not found</div>;
  }

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    // Reset quantity to 1 when size changes
    setQuantity(1);
  }

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    // Only update the main image to the selected color's main image
    setSelectedImage(getAllProductImages().findIndex(img => img === color.main_image));
  };

  const handleImageSelect = (index) => {
    setSelectedImage(index)
  }

  const handleRatingClick = (selectedRating) => {
    setRating(selectedRating)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.warning('Please Register/login to submit a review');
      router.push('/login');
      return;
    }

    if (!rating) {
      toast.error('Please select a rating');
      return;
    }

    try {
      const reviewData = {
        rating: rating,
        comment: reviewForm.message
      };

      await axios.post(`/api/products/${productId}/reviews`, reviewData);

      // Reset form
      setRating(0);
      setReviewForm({
        message: '',
      });

      // Refresh reviews
      const { data } = await axios.get(`/api/products/${productId}/reviews`);
      setReviews(data.reviews || []);
      setReviewStats({
        average: data.stats?.average || 0,
        total: data.stats?.total || 0,
        distribution: data.stats?.distribution || {
          1: 0, 2: 0, 3: 0, 4: 0, 5: 0
        }
      });

      toast.success('Review submitted successfully');
    } catch (error) {
      // console.error('Failed to submit review:', error);
      if (error.response?.status === 422) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit review');
      }
    }
  }

  // Update handleAddToCart function
  const handleAddToCart = async () => {
    if (isAdmin) {
      toast.warning('Admin users cannot add items to cart');
      return;
    }

    if (!isAuthenticated) {
      toast.warning('Please Register/login to add items to cart');
      router.push('/login');
      return;
    }

    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color');
      return;
    }

    // Check if price is valid (greater than 0)
    const currentPrice = calculateSinglePrice();
    if (currentPrice <= 0) {
      toast.error('Product price is not available. Please select a valid size.');
      return;
    }

    if (addingToCart) return;

    setAddingToCart(true);

    try {
      // Step 1: Check if item already exists in cart
      let itemExists = false;
      try {
        const { data } = await axios.get('/api/cart');
        itemExists = data.items?.some(item => 
          item.product_id === productId && 
          item.size === selectedSize?.size && 
          item.color === selectedColor?.name
        );
      } catch (checkError) {
        // console.warn('Could not check existing cart items, proceeding with add:', checkError.message);
        itemExists = false;
      }

      if (itemExists) {
        toast.info('This item is already in your cart');
        setAddingToCart(false);
        return;
      }

      // Step 2: Add item to cart
      const cartData = {
        product_id: productId,
        quantity: quantity,
        size: selectedSize.size,
        color: selectedColor.name,
        price: selectedSize.selling_price || selectedSize.price
      };

      await axios.post('/api/cart/add', cartData);
      
      // Step 3: Show success message immediately
      toast.success('Added to cart successfully');
      
      // Step 4: Update cart count (don't let this fail the whole operation)
      try {
        await updateCartData();
      } catch (updateError) {
        // console.warn('Failed to update cart count, but item was added successfully:', updateError.message);
      }
      
    } catch (error) {
      // console.error('Add to cart error:', error);
      
      // Only show error toast for actual failures
      if (error.response?.status) {
        toast.error(error.response?.data?.message || 'Failed to add to cart');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setAddingToCart(false);
    }
  }

  const handleBuyNow = async () => {
    if (isAdmin) {
      toast.warning('Admin users cannot purchase items');
      return;
    }

    if (!isAuthenticated) {
      toast.warning('Please Register/login to continue')
      router.push('/login')
      return
    }

    if (!selectedSize || !selectedColor) {
      toast.error('Please select size and color')
      return
    }

    // Check if price is valid (greater than 0)
    const currentPrice = calculateSinglePrice();
    if (currentPrice <= 0) {
      toast.error('Product price is not available. Please select a valid size.');
      return;
    }

    try {
      await handleAddToCart();
      // Navigate directly to checkout page after successful addition
      if (!addingToCart) {
        router.push('/user/cart');
      }
    } catch (error) {
      // console.error('Buy now error:', error);
      // Error is already handled in handleAddToCart
    }
  }

  // Update the renderReviews function
  const renderReviews = () => {
    return (
      <>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Customer Reviews</h3>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Overall Rating */}
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">
                {Number(reviewStats?.average || 0).toFixed(1)}
              </div>
              <div>
                <div className="flex mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(Number(reviewStats?.average || 0))
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  Based on {reviewStats?.total || 0} reviews
                </p>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <div className="w-12 text-sm">{rating} stars</div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${
                          reviewStats?.total
                            ? ((reviewStats?.distribution?.[rating] || 0) / reviewStats.total) * 100
                            : 0
                        }%`
                      }}
                    ></div>
                  </div>
                  <div className="w-12 text-sm text-gray-600">
                    {reviewStats?.distribution?.[rating] || 0}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleReviewSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="focus:outline-none"
                >
                  <Star
                    size={24}
                    className={star <= rating 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-300"}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            name="message"
            value={reviewForm.message}
            onChange={(e) => setReviewForm(prev => ({...prev, message: e.target.value}))}
            placeholder="Write your review here..."
            className="mb-4"
            required
          />
          <Button type="submit" className="bg-pink-500 hover:bg-pink-600">
            Submit Review
          </Button>
        </form>

        {/* Reviews List */}
        <div className="space-y-6">
          {(!reviews || reviews.length === 0) ? (
            <p className="text-gray-500 italic">No reviews yet. Be the first to review this product!</p>
          ) : (
            reviews.map((review) => (
              <ReviewCard 
                key={review.id} 
                review={{
                  name: review.user?.name || 'Anonymous',
                  rating: review.rating,
                  text: review.comment,
                  date: new Date(review.created_at).toLocaleDateString(),
                }} 
              />
            ))
          )}
        </div>
      </>
    );
  };

  // Add this helper function to get available stock for selected size
  const getAvailableStock = () => {
    if (!selectedSize) return 0;
    try {
      return parseInt(selectedSize.stock) || 0;
    } catch (error) {
  
      return 0;
    }
  };

  // Modify the quantity controls section
  const handleQuantityChange = (newQuantity) => {
    const availableStock = getAvailableStock();
    if (newQuantity < 1) return;
    if (newQuantity > availableStock) {
      toast.warning(`Only ${availableStock} items available in stock`);
      return;
    }
    setQuantity(newQuantity);
  };

  return (
    <>
      <ToastContainer />
      <div className="max-w-6xl mx-auto p-4">
        {/* Product Images and Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-xl p-4 shadow-sm">
          {/* Product Images */}
          <div className="space-y-3">
            <div className="relative aspect-[3/4] max-w-xs mx-auto overflow-hidden rounded-lg group">
              <Image
                src={optimizeCloudinary(getAllProductImages()[selectedImage]) || '/placeholder.jpg'}
                alt={`${product?.name} in ${selectedColor?.name || ''}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                priority
              />
              {product?.badge && (
                <Badge className="absolute top-3 right-3 bg-pink-500 hover:bg-pink-600">
                  {product.badge}
                </Badge>
              )}
            </div>
           <div className="flex justify-center gap-2 overflow-x-auto pb-1">
  {getAllProductImages()
    .slice(0, 4) // Limit to first 4 images
    .map((image, index) => (
      <button
        key={index}
        className={cn(
          "relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border transition-all duration-200 hover:opacity-80",
          selectedImage === index && "ring-2 ring-pink-500"
        )}
        onClick={() => handleImageSelect(index)}
      >
        <Image
          src={optimizeCloudinary(image) || "/placeholder.jpg"}
          alt={`${product?.name} view ${index + 1}`}
          fill
          className="object-cover"
        />
      </button>
    ))}
</div>

          </div>

          {/* Product Details */}
          <div className="space-y-4">
            {/* Name and Price section */}
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                {product?.name?.toUpperCase()}
              </h1>
              
              {/* Modified Rating Section */}
              <div className="flex items-center gap-2 mt-2 mb-4">
                <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded">
                  <span>{Number(reviewStats?.average || 0).toFixed(1)}</span>
                  <Star size={14} fill="white" />
                </div>
                <span className="text-sm text-gray-500">
                  {reviewStats?.total || 0} Ratings
                </span>
              </div>

              {/* Price display section */}
              <div className="flex items-center gap-3">
                {selectedSize && calculateSinglePrice() > 0 ? (
                  <>
                    <div className="text-xl font-semibold">₹{calculateSinglePrice()}</div>
                    {selectedSize && selectedSize.mrp > selectedSize.price && (
                      <>
                        <span className="text-sm text-gray-500 line-through">₹{getMrpPrice()}</span>
                        <span className="text-sm text-green-600">({calculateDiscount()}% OFF)</span>
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-xl font-semibold text-gray-500">
                    {selectedSize ? 'Price not available' : 'Select size to see price'}
                  </div>
                )}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <div className="text-gray-700 font-medium">Colors:</div>
              <div className="flex gap-2">
                {product?.colors?.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color);
                      // Optionally update the main image to the selected color's main image
                      if (color.main_image) {
                        const imgIndex = getAllProductImages().findIndex(img => img === color.main_image);
                        setSelectedImage(imgIndex !== -1 ? imgIndex : 0);
                      }
                    }}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all duration-200 focus:outline-none",
                      selectedColor?.name === color.name
                        ? "ring-2 ring-pink-500 border-pink-500 scale-110"
                        : "border-gray-200"
                    )}
                    style={{
                      backgroundColor: colorMap[color.name.toLowerCase()] || color.name,
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium mb-2">Size</h3>
              <div className="flex space-x-2">
                {product?.size_prices
                  ?.filter(sizeData => parseInt(sizeData.stock) > 0 && (Number(sizeData.price) > 0))
                  .map((sizeData) => (
                    <button
                      key={sizeData.size}
                      className={cn(
                        "w-9 h-9 flex items-center justify-center text-sm border rounded-full transition-all duration-200",
                        selectedSize === sizeData
                          ? "bg-pink-500 text-white border-pink-500 shadow-md"
                          : "border-gray-300 text-gray-700 hover:border-pink-300 hover:bg-pink-50"
                      )}
                      onClick={() => handleSizeSelect(sizeData)}
                    >
                      {formatSize(sizeData.size)}
                    </button>
                  ))}
              </div>
            </div>

            {/* Quantity and Action Buttons */}
            <div className="space-y-4 sm:space-y-6">
              {/* Quantity Controls and Total */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center border rounded-full overflow-hidden shadow-sm w-fit">
                  <button
                    className="p-3 sm:p-2 border-r bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4 sm:h-3 sm:w-3" />
                  </button>
                  <span className="px-6 sm:px-4 text-base sm:text-sm font-medium">{quantity}</span>
                  <button
                    className="p-3 sm:p-2 border-l bg-gray-50 hover:bg-gray-100 transition-colors"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= getAvailableStock()}
                  >
                    <Plus className="h-4 w-4 sm:h-3 sm:w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="font-semibold">
                    Total: {calculateSinglePrice() > 0 ? `₹${calculateTotalPrice().toLocaleString()}` : '₹0'}
                  </div>
                  <div className="text-sm text-gray-500">
                    ({getAvailableStock()} available)
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-3">
                <Button
                  className="w-full lg:flex-1 bg-pink-500 hover:bg-pink-600 shadow-md transition-all duration-200 hover:shadow-lg text-base py-6 sm:py-4"
                  onClick={handleAddToCart}
                  disabled={!selectedSize || !selectedColor || addingToCart || calculateSinglePrice() <= 0 || isAdmin}
                >
                  <ShoppingCart className="mr-2 h-5 w-5 sm:h-4 sm:w-4" /> 
                  {isAdmin ? 'Admin Access Only' : (addingToCart ? 'Adding...' : 'Add to cart')}
                </Button>
                <Button
                  variant="outline"
                  className="w-full lg:flex-1 border-pink-200 text-pink-700 hover:bg-pink-50 transition-all duration-200 text-base py-6 sm:py-4"
                  onClick={handleBuyNow}
                  disabled={!selectedSize || !selectedColor || calculateSinglePrice() <= 0 || isAdmin}
                >
                  {isAdmin ? 'Admin Access Only' : 'Buy Now'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full lg:w-12 border-pink-200 text-pink-700 hover:bg-pink-50 transition-all duration-200 flex items-center justify-center gap-2"
                  onClick={handleShare}
                  title="Share Product"
                >
                  <Share2 className="h-5 w-5" />
                  <span className="lg:hidden">Share</span>
                </Button>
              </div>
            </div>

            {/* Product Metadata */}
            <div className="border-t border-pink-100 pt-3 mt-6">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-pink-50 p-2 rounded-md">
                  <span className="text-pink-600 font-medium">Weight:</span>{" "}
                  {product?.weight?.value} {product?.weight?.unit}
                </div>
                <div className="bg-pink-50 p-2 rounded-md">
                  <span className="text-pink-600 font-medium">SKU:</span>{" "}
                  {product?.sku_code || 'N/A'}
                </div>
                <div className="bg-pink-50 p-2 rounded-md">
                  <span className="text-pink-600 font-medium">Category:</span>{" "}
                  {product?.category?.name}
                </div>
                <div className="bg-pink-50 p-2 rounded-md">
                  <span className="text-pink-600 font-medium">Subcategory:</span>{" "}
                  {product?.subcategory?.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Reviews Tabs */}    
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mt-8 pt-6">
            {/* Tabs */}
            <div className="flex flex-col sm:flex-row justify-center w-full border-b border-gray-200 gap-1">
              <Button
                variant="ghost"
                className={`px-4 sm:px-12 py-2 font-medium rounded-none relative ${
                  activeTab === "description"
                    ? "text-white bg-pink-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-pink-600" 
                    : "text-pink-600 hover:bg hover:text-black"
                }`}
                onClick={() => setActiveTab("description")}
              >
                DESCRIPTION
              </Button>
              <Button
                variant="ghost"
                className={`px-4 sm:px-12 py-2 font-medium rounded-none relative ${
                  activeTab === "reviews"
                    ? "text-white bg-pink-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-pink-600"
                    : "text-pink-600 hover:text-black"
                }`}
                onClick={() => setActiveTab("reviews")}
              >
                REVIEWS ({reviewStats?.total || 0})
              </Button>
            </div>

            {/* Content */}
            <div className="py-6 sm:py-8 lg:py-10">
              {activeTab === "description" ? (
                <div className="animate-fade-in space-y-6 sm:space-y-8">
                  {/* Description Section */}
                  {product?.description ? (
                    <div 
                      className="text-base sm:text-lg text-gray-700 leading-relaxed max-w-none rich-text-content"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  ) : (
                    <p className="text-base text-gray-500 italic">No description available</p>
                  )}

                  {/* Product specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 text-base sm:text-lg">
                    <div className="text-gray-700 font-medium">Colors:</div>
                    <div className="flex gap-2">
                      {product?.colors?.map((color) => (
                        <div
                          key={color.name}
                          className={cn(
                            "w-6 h-6 rounded-full",
                            color.name.toLowerCase() === 'white' && "border border-gray-200"
                          )}
                          style={{ 
                            backgroundColor: colorMap[color.name.toLowerCase()] || color.name,
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>

                    <div className="text-gray-700 font-medium">Sizes:</div>
                    <div>{product?.size_prices?.filter(s => parseInt(s.stock) > 0).map(s => s.size).join(", ") || "No sizes available"}</div>

                    <div className="text-gray-700 font-medium">Weight:</div>
                    <div>
                      {product?.weight?.value ? 
                        `${product.weight.value} ${product.weight.unit}` : 
                        "Not specified"}
                    </div>
                  </div>

                  {/* Size Chart */}
                  <div className="mt-8">
                    <button 
                      onClick={() => setSizeChartOpen(!isSizeChartOpen)}
                      className="w-full flex items-center justify-between bg-pink-50 hover:bg-pink-100 transition-colors duration-200 px-4 py-3 rounded-lg"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        Size Chart
                      </h3>
                      <ChevronDown 
                        className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                          isSizeChartOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isSizeChartOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="bg-pink-100 text-pink-800 px-4 py-3 text-left font-semibold border border-pink-200">Size</th>
                              <th className="bg-pink-100 text-pink-800 px-4 py-3 text-left font-semibold border border-pink-200">Bust (inches)</th>
                              <th className="bg-pink-100 text-pink-800 px-4 py-3 text-left font-semibold border border-pink-200">Waist (inches)</th>
                              <th className="bg-pink-100 text-pink-800 px-4 py-3 text-left font-semibold border border-pink-200">Hip (inches)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="px-4 py-3 border border-pink-100 bg-white">S</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">36</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">32</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">39</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 border border-pink-100 bg-white">M</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">38</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">34</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">41</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 border border-pink-100 bg-white">L</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">40</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">36</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">43</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 border border-pink-100 bg-white">XL</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">42</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">38</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">45</td>
                            </tr>
                            <tr>
                              <td className="px-4 py-3 border border-pink-100 bg-white">XXL</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">44</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">40</td>
                              <td className="px-4 py-3 border border-pink-100 bg-white">47</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        Note: All measurements are in inches. For the best fit, please measure yourself and compare with the size chart above.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {renderReviews()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Products Section */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <SimilarProducts products={similarProducts} />
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .rich-text-content p {
          margin-bottom: 1rem;
          line-height: 1.6;
        }
        
        .rich-text-content strong {
          font-weight: 600;
          color: #374151;
        }
        
        .rich-text-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .rich-text-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .rich-text-content li {
          margin-bottom: 0.5rem;
        }
        
        .rich-text-content h1, .rich-text-content h2, .rich-text-content h3 {
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.75rem;
          margin-top: 1.5rem;
        }
        
        .rich-text-content h1 {
          font-size: 1.5rem;
        }
        
        .rich-text-content h2 {
          font-size: 1.25rem;
        }
        
        .rich-text-content h3 {
          font-size: 1.125rem;
        }
        
        .rich-text-content a {
          color: #ec1c75;
          text-decoration: underline;
        }
        
        .rich-text-content a:hover {
          color: #be185d;
        }
        
        .rich-text-content blockquote {
          border-left: 4px solid #ec1c75;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .rich-text-content code {
          background-color: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .rich-text-content pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .rich-text-content pre code {
          background: none;
          padding: 0;
          color: inherit;
        }
        
        .rich-text-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        .rich-text-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        
        .rich-text-content th,
        .rich-text-content td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        
        .rich-text-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
    </>
  )
}

export default ProductDetail
