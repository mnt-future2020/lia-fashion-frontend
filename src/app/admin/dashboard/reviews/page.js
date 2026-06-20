"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,         
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Search, Calendar, Filter, Trash2, TrendingUp, TrendingDown, Star } from "lucide-react"
import axios from '../../../../lib/axios' 
import { toast } from 'react-toastify'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const ReviewManagement = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [timeFilter, setTimeFilter] = useState("This Week")
  const [statsFilter, setStatsFilter] = useState("7days")
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [filteredReviews, setFilteredReviews] = useState([])
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    positiveReviews: 0,
    negativeReviews: 0
  })

  const [overallRatingStats, setOverallRatingStats] = useState({
    averageRating: 0,
    totalReviews: 0
  });

  const [reviewStatsData, setReviewStatsData] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [chartsLoading, setChartsLoading] = useState(true);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`w-4 h-4 ${index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  const MetricCard = ({ metric, loading }) => (
    <Card className="bg-white">
      <CardContent className="p-6">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded mb-4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
              <div className={`flex items-center text-sm ${metric.trend === "up" ? "text-orange-500" : "text-red-500"}`}>
                {metric.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {metric.change}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
            <div className="text-xs text-gray-500 mb-4">{metric.period}</div>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metric.chartData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={metric.trend === "up" ? "#f97316" : "#ef4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )

  useEffect(() => {
    fetchReviewsData();
  }, []); 

  useEffect(() => {
    fetchChartData();
  }, [statsFilter]); // Re-fetch when statsFilter changes

  const fetchReviewsData = async () => {
    try {
      setLoading(true);
      const [reviewsResponse, statsResponse] = await Promise.all([
        axios.get('/api/admin/reviews'),
        axios.get('/api/admin/reviews/stats')
      ]);

      // Handle reviews data
      if (reviewsResponse.data && reviewsResponse.data.reviews) {
        const reviewsData = Array.isArray(reviewsResponse.data.reviews.data) 
          ? reviewsResponse.data.reviews.data 
          : [];
        setReviews(reviewsData);
        setFilteredReviews(reviewsData);
      } else {
        setReviews([]);
        setFilteredReviews([]);
      }

      // Handle stats data
      if (statsResponse.data) {
        const averageRating = parseFloat(statsResponse.data.averageRating || 0).toFixed(1);
        
        setStats({
          totalReviews: statsResponse.data.totalReviews || 0,
          averageRating: averageRating,
          positiveReviews: statsResponse.data.positiveReviews || 0,
          negativeReviews: statsResponse.data.negativeReviews || 0
        });
      }
    } catch (error) {
      // console.error('Failed to fetch review data:', error);
      toast.error('Failed to load review data');
      setReviews([]);
      setFilteredReviews([]);
    } finally {
      setLoading(false);
    }
  }

  const fetchChartData = async () => {
    try {
      setChartsLoading(true);
      const [overallResponse, timelineResponse] = await Promise.all([
        axios.get('/api/admin/reviews/overall-stats'),
        axios.get(`/api/admin/reviews/timeline-stats?filter=${statsFilter}`)
      ]);

      if (overallResponse.data) {
        setOverallRatingStats({
          averageRating: parseFloat(overallResponse.data.averageRating || 0).toFixed(1),
          totalReviews: overallResponse.data.totalReviews || 0
        });
      }

      if (timelineResponse.data && Array.isArray(timelineResponse.data)) {
        const formattedData = timelineResponse.data.map(item => ({
          date: new Date(item.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
          positive: item.positiveCount || 0,
          negative: -(item.negativeCount || 0)
        }));
        setReviewStatsData(formattedData);
      } else {
        setReviewStatsData([]);
      }
    } catch (error) {
      // console.error('Failed to fetch chart data:', error);
      toast.error('Failed to load chart data');
      setOverallRatingStats({
        averageRating: '0.0',
        totalReviews: 0
      });
      setReviewStatsData([]);
    } finally {
      setChartsLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      await axios.delete(`/api/admin/reviews/${reviewToDelete}`);
      toast.success('Review deleted successfully');
      fetchReviewsData(); // Refresh the data
    } catch (error) {
      // console.error('Failed to delete review:', error);
      toast.error('Failed to delete review');
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  }

  const openDeleteDialog = (reviewId) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  }

  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)
    
    // Ensure reviews is an array before filtering
    if (Array.isArray(reviews)) {
      const filtered = reviews.filter(review => 
        review.user?.name?.toLowerCase().includes(searchValue) ||
        review.user?.email?.toLowerCase().includes(searchValue) ||
        review.product?.name?.toLowerCase().includes(searchValue) ||
        review.comment?.toLowerCase().includes(searchValue)
      )
      setFilteredReviews(filtered)
    }
  }

  // Create metrics based on current stats
  const metrics = [
    {
      title: "Total Reviews",
      value: stats.totalReviews.toString(),
      change: "+0%",
      trend: "up",
      period: "All time",
      chartData: [
        { name: "1", value: Math.floor(stats.totalReviews * 0.1) },
        { name: "2", value: Math.floor(stats.totalReviews * 0.3) },
        { name: "3", value: Math.floor(stats.totalReviews * 0.6) },
        { name: "4", value: Math.floor(stats.totalReviews * 0.8) },
        { name: "5", value: stats.totalReviews },
      ],
    },
    {
      title: "Average Rating",
      value: stats.averageRating,
      change: "+0%",
      trend: "up",
      period: "Overall",
      chartData: [
        { name: "1", value: 3.5 },
        { name: "2", value: 3.8 },
        { name: "3", value: 4.0 },
        { name: "4", value: parseFloat(stats.averageRating) },
        { name: "5", value: parseFloat(stats.averageRating) },
      ],
    },
    {
      title: "Positive Reviews",
      value: stats.positiveReviews.toString(),
      change: "+0%",
      trend: "up",
      period: "4+ star ratings",
      chartData: [
        { name: "1", value: Math.floor(stats.positiveReviews * 0.2) },
        { name: "2", value: Math.floor(stats.positiveReviews * 0.5) },
        { name: "3", value: Math.floor(stats.positiveReviews * 0.8) },
        { name: "4", value: stats.positiveReviews },
        { name: "5", value: stats.positiveReviews },
      ],
    },
    {
      title: "Negative Reviews",
      value: stats.negativeReviews.toString(),
      change: "0%",
      trend: "down",
      period: "1-2 star ratings",
      chartData: [
        { name: "1", value: stats.negativeReviews },
        { name: "2", value: Math.floor(stats.negativeReviews * 0.8) },
        { name: "3", value: Math.floor(stats.negativeReviews * 0.5) },
        { name: "4", value: Math.floor(stats.negativeReviews * 0.2) },
        { name: "5", value: 0 },
      ],
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
        <p className="text-gray-600">Manage and monitor customer reviews</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} loading={loading} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Overall Rating */}
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Overall Rating</CardTitle>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="This Week">This Week</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="This Year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {chartsLoading ? (
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="relative w-32 h-32 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { value: parseFloat(overallRatingStats.averageRating) },
                          { value: 5 - parseFloat(overallRatingStats.averageRating) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={450}
                        dataKey="value"
                      >
                        <Cell fill="#e91e63" />
                        <Cell fill="#f3f4f6" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-xs text-gray-500">Rating</div>
                    <div className="text-2xl font-bold">
                      {overallRatingStats.averageRating}<span className="text-sm text-gray-400">/5</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                  {parseFloat(overallRatingStats.averageRating) >= 4 ? 'Impressive' : 
                   parseFloat(overallRatingStats.averageRating) >= 3 ? 'Good' : 'Needs Improvement'}
                </Badge>
                <div className="text-xs text-gray-500 mt-2">
                  from {overallRatingStats.totalReviews} reviews
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Review Statistics */}
        <Card className="bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Review Statistics</CardTitle>
            <Select value={statsFilter} onValueChange={setStatsFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="animate-pulse">
                <div className="flex gap-6 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#e91e63] rounded"></div>
                    <span className="text-sm text-gray-600">Positive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded"></div>
                    <span className="text-sm text-gray-600">Negative</span>
                  </div>
                </div>
                <div className="h-64">
                  {reviewStatsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reviewStatsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Bar dataKey="positive" fill="#e91e63" />
                        <Bar dataKey="negative" fill="#9ca3af" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No data available for the selected period
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {/* Search and Filter Bar */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
              {/* <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  Date
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div> */}
            </div>
          </div>

          {/* Table Header */}
          <div className="bg-[#e91e63] text-white">
            <div className="grid grid-cols-7 gap-4 p-4 text-sm font-medium">
              <div>Date</div>
              <div>Customer Name</div>
              <div>Email</div>
              <div>Product</div>
              <div>Rating</div>
              <div>Review</div>
              <div>Action</div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e91e63]" />
                <span className="ml-2 text-gray-600">Loading reviews...</span>
              </div>
            ) : filteredReviews && filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <div key={review.id} className="grid grid-cols-7 gap-4 p-4 items-center text-sm hover:bg-gray-50">
                  <div className="text-gray-900">
                    {new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-gray-900 font-medium">{review.user?.name || 'Anonymous'}</div>
                  <div className="text-gray-600">{review.user?.email || 'N/A'}</div>
                  <div className="text-gray-900">{review.product?.name || 'N/A'}</div>
                  <div className="flex">{renderStars(review.rating || 0)}</div>
                  <div className="text-gray-900 truncate max-w-xs" title={review.comment}>
                    {review.comment || 'No comment'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => openDeleteDialog(review.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-12">
                <div className="text-gray-400 mb-4">
                  <Star className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Reviews will appear here when customers start reviewing products'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone and will permanently remove the review from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteReview}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ReviewManagement;