"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Calendar, TrendingUp, TrendingDown, HandCoins, ShoppingCart, Users, UserCheck } from "lucide-react"
import {
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import axios from '../../../lib/axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export default function Dashboard() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("6")
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    kpiData: { 
      currentMonth: {
        revenue: 0,
        revenueGrowth: 0,
        orders: 0,
        orderGrowth: 0,
        customers: 0,
        customerGrowth: 0,
        avgOrderValue: 0,
        avgOrderGrowth: 0
      }
    },
    revenueData: [],
    topProducts: [],
    topCategories: [],
    recentTransactions: []
  });

  const fetchDashboardStats = async (selectedRange = timeRange) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/dashboard/stats', {
        params: { timeRange: selectedRange }
      });
      
      if (response.data.success) {
        setDashboardStats(response.data.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      // console.error('Error fetching dashboard stats:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (value) => {
    setTimeRange(value);
    fetchDashboardStats(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch low stock products
        const productsResponse = await axios.get('/api/admin/products');
        const lowStock = productsResponse.data
          .filter(product => product.stock <= 20)
          .slice(0, 5);
        setLowStockProducts(lowStock);

        // Fetch dashboard stats
        await fetchDashboardStats();
      } catch (error) {
        // console.error('Error fetching initial data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => fetchDashboardStats()} className="bg-pink-500 hover:bg-pink-600">
          Try Again
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  const { 
    kpiData, 
    revenueData, 
    topProducts, 
    topCategories, 
    recentTransactions 
  } = dashboardStats;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6 border-2 border-pink-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">₹{kpiData.currentMonth.revenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span className={`text-xs font-medium ${kpiData.currentMonth.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.currentMonth.revenueGrowth >= 0 ? '+' : ''}{kpiData.currentMonth.revenueGrowth}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
              <HandCoins className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 border-2 border-pink-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">{kpiData.currentMonth.orders}</span>
                  <span className={`text-xs font-medium ${kpiData.currentMonth.orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.currentMonth.orderGrowth >= 0 ? '+' : ''}{kpiData.currentMonth.orderGrowth}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 border-2 border-pink-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Customers</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">{kpiData.currentMonth.customers}</span>
                  <span className={`text-xs font-medium ${kpiData.currentMonth.customerGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.currentMonth.customerGrowth >= 0 ? '+' : ''}{kpiData.currentMonth.customerGrowth}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 border-2 border-pink-600 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-bold">₹{kpiData.currentMonth.avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  <span className={`text-xs font-medium ${kpiData.currentMonth.avgOrderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {kpiData.currentMonth.avgOrderGrowth >= 0 ? '+' : ''}{kpiData.currentMonth.avgOrderGrowth}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This Month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range and Charts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Revenue Overview</CardTitle>
          </div>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last {timeRange} Months</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 Months</SelectItem>
              <SelectItem value="6">Last 6 Months</SelectItem>
              <SelectItem value="12">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#e11d48" 
                  name="Revenue (₹)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights Section */}
      <div className="grid gap-6 md:grid-cols-2">        {/* Top Products */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Top 5 Products</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#eb1c75]">
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-center text-white">Price</TableHead>
                  <TableHead className="text-right text-white">Units Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((product) => (
                  <TableRow key={product.id}>                    <TableCell className="flex items-center gap-2">
                      {product.image ? (
                        <Image 
                          src={product.image} 
                          alt={product.name} 
                          width={32} 
                          height={32} 
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100"></div>
                      )}
                      <span>{product.name}</span>
                    </TableCell>
                    <TableCell className="text-center">Rs {product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{product.unitsSold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Top 5 Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#eb1c75]">
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-center text-white">Price</TableHead>
                  <TableHead className="text-right text-white">Units Sold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCategories.map((category, i) => (
                  <TableRow key={i}>                    <TableCell className="flex items-center gap-2">
                      {category.image ? (
                        <Image 
                          src={category.image} 
                          alt={category.name} 
                          width={32} 
                          height={32} 
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded bg-gray-100"></div>
                      )}
                      <span>{category.name}</span>
                    </TableCell>
                    <TableCell className="text-center">Rs {category.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{category.unitsSold}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock and Recent Transactions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Low Stocks</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push('/admin/dashboard/products')}
            >
              <span>More</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#EB1C75]">
                <TableRow>
                  <TableHead className="text-white">Product</TableHead>
                  <TableHead className="text-white">Category</TableHead>
                  <TableHead className="text-center text-white">Qty</TableHead>
                  <TableHead className="text-right text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">Loading...</TableCell>
                  </TableRow>
                ) : lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-gray-100">
                          {product.image && (
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={32}
                              height={32}
                              className="h-full w-full object-cover rounded"
                            />
                          )}
                        </div>
                        <span>{product.name}</span>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={product.stock === 0 ? 'text-red-500' : 'text-yellow-500'}
                        >
                          {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">No low stock products found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-[#EB1C75]">
                <TableRow>
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-right text-white">Amount</TableHead>
                  <TableHead className="text-right text-white">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.customerName || transaction.customer}</TableCell>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell className="text-right">Rs {transaction.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={`bg-${transaction.status === 'Paid' ? 'green' : 'red'}-100 text-${transaction.status === 'Paid' ? 'green' : 'red'}-800 hover:bg-${transaction.status === 'Paid' ? 'green' : 'red'}-100`}>
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
