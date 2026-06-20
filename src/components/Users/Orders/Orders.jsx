"use client";

import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, X, Download } from "lucide-react";
import Image from "next/image";
import { optimizeCloudinary } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { orderService } from "@/services/orderService";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "../../../lib/axios";

const Orders = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await orderService.getUserOrders(currentPage, itemsPerPage);
        
        // Check if response has data before setting state
        if (response?.data?.data) {
          setOrders(response.data.data);
          setTotalPages(response.data.last_page);
        } else {
          setOrders([]);
          setTotalPages(1);
        }
      } catch (error) {
        // console.error('Failed to fetch orders:', error);
        if (error.response?.status === 401) {
          toast.error('Please log in to view your orders');
          router.push('/login');
        } else if (error.response?.status === 403) {
          toast.error('You are not authorized to view these orders');
          router.push('/');
        } else {
          setError('Failed to load orders');
          toast.error('Failed to load orders. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, authLoading, currentPage, itemsPerPage, router]);

  const normalizeOrderStatus = (status) => {
    if (!status) return "";
    return status.trim().toLowerCase();
  };

  // Get unique status values from orders
  const getUniqueStatuses = (orders) => {
    if (!orders?.length) return ['all'];
    const statuses = orders.map(order => order.status);
    return ['all', ...new Set(statuses)];
  };

  const statusOptions = getUniqueStatuses(orders);

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === "all" || 
      normalizeOrderStatus(order.status) === normalizeOrderStatus(statusFilter);
    
    const matchesSearch = !searchQuery || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some(item => 
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesStatus && matchesSearch;
  });

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle view invoice
  const handleViewInvoice = async (order) => {
    try {
      const [orderResp, companyResp, transactionResp] = await Promise.all([
        orderService.getOrderDetails(order.id),
        axios.get('/api/admin/company'),
        axios.get(`/api/transactions/orders/${order.order_number}`)
      ]);
      const { status, data: orderDetails } = orderResp;
      if (status === 'success') {
        // Parse shipping address if it's a string
        let shippingAddress = null;
        let transactionData = transactionResp?.data?.data;
        try {
          // Prefer shipping address from transaction notes if available
          if (transactionData?.transaction?.notes) {
            const notes = JSON.parse(transactionData.transaction.notes);
            shippingAddress = notes?.shipping_address || null;
          }
          // Fallback to order's shipping address
          if (!shippingAddress) {
            shippingAddress = typeof orderDetails.shipping_address === 'string'
              ? JSON.parse(orderDetails.shipping_address)
              : orderDetails.shipping_address;
          }
        } catch (_e) {
          shippingAddress = orderDetails.shipping_address || {};
        }

        // Calculate subtotal from items
        const subtotal = orderDetails.items.reduce((sum, item) =>
          sum + (parseFloat(item.price) * item.quantity), 0);

        // Calculate tax: use backend value if present and > 0, else calculate from items
        let tax = parseFloat(orderDetails.tax);
        if (!tax && orderDetails.items.length > 0) {
          tax = orderDetails.items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = item.quantity || 0;
            const taxPerc = item.product?.tax_percentage || 0;
            return sum + (price * qty * taxPerc) / 100;
          }, 0);
        }

        // Calculate total amount
        const total = parseFloat(orderDetails.total_amount || 0);

        // Use shipping_cost from backend
        const shipping = parseFloat(orderDetails.shipping_cost || 0);

        // Calculate coupon discount
        const discount = (shipping + tax + subtotal) - total;

        // Process items
        const processedItems = orderDetails.items.map(item => {
          const price = parseFloat(item.price) || 0;
          const qty = item.quantity || 0;
          const taxPerc = item.product?.tax_percentage || 0;
          const taxAmount = (price * qty * taxPerc) / 100;
          return {
            ...item,
            tax_percentage: taxPerc,
            tax_amount: taxAmount,
            total: price * qty + taxAmount
          };
        });

        // Create invoice object
        const invoice = {
          id: orderDetails.id,
          invoiceId: orderDetails.order_number,
          orderId: orderDetails.order_number,
          date: new Date(orderDetails.created_at).toLocaleDateString(),
          customer: orderDetails.user?.name || shippingAddress?.name || 'Guest',
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          discount: discount,
          total: total,
          items: processedItems,
          payment_method: orderDetails.payment_id ? 'Online' : 'Cash on Delivery',
          payment_status: orderDetails.payment_status,
          type: orderDetails.order_type,
          method: orderDetails.payment_id ? 'Online' : 'Cash on Delivery',
          status: orderDetails.payment_status,
          created_at: orderDetails.created_at,
          user: orderDetails.user,
          company: companyResp?.data || null,
          address: {
            address_line1: shippingAddress?.addressLine1 || shippingAddress?.address || '',
            city: shippingAddress?.city || orderDetails.shipping_city || '',
            state: shippingAddress?.state || orderDetails.shipping_state || '',
            postal_code: shippingAddress?.pincode || shippingAddress?.pin_code || orderDetails.shipping_pincode || '',
            district: shippingAddress?.district || '',
            country: shippingAddress?.country || 'India',
            name: transactionResp?.data?.data?.transaction?.customer_name || shippingAddress?.name || orderDetails.user?.name || '',
            email: shippingAddress?.email || orderDetails.user?.email || '',
            phone: transactionResp?.data?.data?.transaction?.customer_phone || shippingAddress?.phone || orderDetails.user?.phone || ''
          }
        };
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
      } else {
        toast.error('Failed to fetch invoice details');
      }
    } catch (_error) {
      toast.error("Failed to fetch invoice details. Please try again.");
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async (invoice) => {
    try {
      const printWindow = window.open('', '', 'width=800,height=800');
      
      if (!printWindow) {
        toast.error("Please allow popups to download the invoice as PDF.");
        return;
      }

      // Format date and time
      const displayDate = invoice.date;
      const displayTime = new Date(invoice.created_at).toLocaleTimeString();
      
      // Get items from invoice
      const items = invoice.items || [];      
      // Generate HTML content for the invoice
      const invoiceContent = `
        <html>
          <head>
            <title>Lia Fashions Invoice</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0.5in;
                width: 7in;
                font-size: 12px;
              }
              .logo {
                height: 80px;
                width: 80px;
                border-radius: 50%;
                object-fit: cover;
                float: right;
              }
              .header {
                margin-bottom: 15px;
                overflow: hidden;
              }
              .invoice-title {
                font-size: 24px;
                font-weight: bold;
                float: left;
              }
              .invoice-id {
                font-size: 14px;
                clear: left;
                float: left;
              }
              .details {
                clear: both;
                margin: 15px 0;
                border-collapse: collapse;
                width: 100%;
              }
              .details td {
                padding: 4px;
                font-size: 12px;
              }
              .details td:first-child {
                color: #777;
                width: 30%;
              }
              .address-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin: 20px 0;
              }
              .address-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 13px;
                color: #444;
              }
              .address-content {
                font-size: 12px;
                line-height: 1.6;
                color: #666;
              }
              .items-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                margin-top: 15px;
              }
              .items-table th {
                background-color: #eb1c75;
                color: white;
                font-weight: bold;
                padding: 8px 4px;
                text-align: center;
                border: 1px solid #eb1c75;
              }
              .items-table th:first-child {
                text-align: left;
                width: 40%;
              }
              .items-table th:last-child {
                text-align: right;
              }
              .items-table td {
                padding: 6px 4px;
                text-align: center;
                border: 1px solid #ddd;
              }
              .items-table td:first-child {
                text-align: left;
                word-break: break-word;
              }
              .items-table td:last-child {
                text-align: right;
              }
              .summary-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
              }
              .summary-table td {
                padding: 4px;
                font-size: 12px;
              }
              .summary-table td:first-child {
                text-align: right;
                width: 75%;
                padding-right: 10px;
              }
              .summary-table td:last-child {
                text-align: right;
                width: 25%;
              }
              .summary-table tr.total {
                font-weight: bold;
              }
              .payment {
                margin: 15px 0;
                font-size: 14px;
              }
              .payment-label {
                font-weight: bold;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                border-top: 1px solid #ddd;
                padding-top: 15px;
              }
              .footer-thanks {
                font-weight: 500;
                font-size: 14px;
                margin-bottom: 8px;
              }
              .footer-company {
                font-weight: bold;
                font-size: 16px;
                margin-bottom: 8px;
              }
              .footer-contact, .footer-address {
                font-size: 12px;
                color: #777;
              }
              .name-bold {
                font-weight: bold;
                font-size: 13px;
                margin-bottom: 4px;
                color: #333;
              }
            </style>
          </head>
          <body>
            <!-- Header -->
            <div class="header">
              <img 
                src="/assets/images/logo.png"
                alt="Lia Fashions" 
                class="logo"
                onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4=';"
              />
              <div class="invoice-title">Invoice</div>
              <div class="invoice-id">ID: ${invoice.invoiceId}</div>
            </div>
            
            <!-- Customer Details -->
            <table class="details">
              <tr>
                <td>Customer Name:</td>
                <td>${invoice.customer}</td>
              </tr>
              <tr>
                <td>Invoice Date:</td>
                <td>${displayDate} ${displayTime}</td>
              </tr>
              <tr>
                <td>Order ID:</td>
                <td>${invoice.orderId}</td>
              </tr>
            </table>

            <!-- Address Section -->
            <div class="address-section">
              <div>
                <div class="address-title">Billing Address:</div>
                <div class="address-content">
                  <div class="name-bold">Lia Fashions</div>
                  Pondichery<br/>
                  India.<br/>
                  Phone: +91 9384109680
                </div>
              </div>
              <div>
                <div class="address-title">Shipping Address:</div>
                <div class="address-content">
                  <div class="name-bold">${invoice.address.name}</div>
                  ${invoice.address.address_line1}<br/>
                  ${invoice.address.city}, ${invoice.address.district}, ${invoice.address.state}<br/>
                  ${invoice.address.postal_code}, ${invoice.address.country}<br/>
                  Phone: ${invoice.address.phone}<br/>
                  Email: ${invoice.address.email}
                </div>
              </div>
            </div>
            
            <!-- Items Table -->
            <h3 style="margin-bottom: 5px;">Order Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Tax</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => {
                  const itemTax = (parseFloat(item.price) * item.quantity * (item.product.tax_percentage || 0)) / 100;
                  const itemTotal = (parseFloat(item.price) * item.quantity) + itemTax;
                  return `
                    <tr>
                      <td>
                        ${item.product_name || item.product?.name || 'Product'}
                        ${item.product?.sku_code ? `<br/><small style="color: #888; font-size: 10px;">SKU: ${item.product.sku_code}</small>` : ''}
                      </td>
                      <td>${item.size || 'N/A'}</td>
                      <td>${item.quantity}</td>
                      <td>₹${parseFloat(item.price).toFixed(2)}</td>
                      <td>${item.product?.tax_percentage || 0}% (₹${itemTax.toFixed(2)})</td>
                      <td>₹${itemTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <!-- Summary -->
            <table class="summary-table">
              <tr>
                <td>Subtotal:</td>
                <td>₹${Number(invoice.subtotal || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>₹${Number(invoice.tax || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Shipping:</td>
                <td>₹${Number(invoice.shipping || 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discount:</td>
                <td>-₹${Math.abs(Number(invoice.discount || 0)).toFixed(2)}</td>
              </tr>
              <tr class="total">
                <td>Total:</td>
                <td>₹${Number(invoice.total || 0).toFixed(2)}</td>
              </tr>
            </table>
            
            <!-- Payment Method -->
            <div class="payment">
              <span class="payment-label">Payment Method:</span>
              <span>${invoice.method}</span>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="footer-thanks">Thank you, Please Come again</div>
              <div class="footer-company">Lia Fashion</div>
              <div class="footer-contact">www.liafashion.in | +91 9384109680</div>
            </div>
          </body>
        </html>
      `;

      // Write the invoice content to the new window
      printWindow.document.write(invoiceContent);
      printWindow.document.close();

      // Wait for content to load completely
      setTimeout(() => {
        // Convert the HTML to PDF with html2canvas and jsPDF
        html2canvas(printWindow.document.body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          
          // Create PDF with A4 format
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          // Calculate dimensions to fit on A4 page
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth - 20; // 10mm margins on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          
          // Save the PDF
          pdf.save(`LIA_Invoice-${invoice.invoiceId}.pdf`);
          
          // Close the temporary window
          printWindow.close();
        });
      }, 1000);
    } catch (_error) {
      // console.error("Failed to download invoice:", _error);
      toast.error("Failed to download invoice. Please try again.");
      if (printWindow) printWindow.close();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-pink-500 hover:bg-pink-600"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Invoice #{selectedInvoice.invoiceId}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowInvoiceModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-gray-500 text-sm mt-1">Order #{selectedInvoice.orderId}</p>
            </div>
            
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-gray-500 text-sm">Customer</p>
                  <p className="font-medium">{selectedInvoice.customer}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Date</p>
                  <p className="font-medium">{selectedInvoice.date}</p>
                </div>
              </div>

              {/* Billing and Shipping Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Billing Address</h4>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Lia Fashions,</p>
                    <p>Pondicherry,</p>
                    <p>India.</p>
                    <p>Phone: +91 9384109680</p>
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-gray-50">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">Shipping Address</h4>
                  <div className="text-sm text-gray-600">
                    {selectedInvoice.address && (
                      <>
                        <p className="font-medium">{selectedInvoice.address.name}</p>
                        {selectedInvoice.address.address_line1 && (
                          <p>{selectedInvoice.address.address_line1}</p>
                        )}
                        <p>
                          {[
                            selectedInvoice.address.city,
                            selectedInvoice.address.district,
                            selectedInvoice.address.state,
                            selectedInvoice.address.postal_code
                          ].filter(Boolean).join(', ')}
                        </p>
                        <p>{selectedInvoice.address.country}</p>
                        {selectedInvoice.address.phone && (
                          <p>Phone: {selectedInvoice.address.phone}</p>
                        )}
                        {selectedInvoice.address.email && (
                          <p>Email: {selectedInvoice.address.email}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Product Items */}
              <div className="border rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item, index) => {
                          // Fallback to product.name if product_name is missing
                          const name = item.product_name || item.product?.name || 'Product';
                          // Get product image from colors array or direct image
                          const imageUrl = item.product?.colors?.[0]?.cover_image || 
                                          item.product?.image || 
                                          '/assets/images/placeholder.png';
                          return (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-16 h-16 rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                                    <Image
                                      src={optimizeCloudinary(imageUrl)}
                                      alt={name}
                                      fill
                                      className="object-cover"
                                      onError={(e) => {
                                        e.target.src = '/assets/images/placeholder.png';
                                      }}
                                    />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{name}</span>
                                    {item.product?.sku_code && (
                                      <span className="text-xs text-gray-500 mt-1">SKU: {item.product.sku_code}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-center">{item.size || 'N/A'}</td>
                              <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
                              <td className="px-3 py-2 text-sm text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                              <td className="px-3 py-2 text-sm text-right">
                                {item.tax_percentage}% (₹{parseFloat(item.tax_amount).toFixed(2)})
                              </td>
                              <td className="px-3 py-2 text-sm text-right">₹{item.total.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="6" className="px-3 py-2 text-sm text-gray-500 text-center">
                            No items available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Payment Summary */}
              <div className="border rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-2">Payment Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Tax:</span>
                    <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Shipping:</span>
                    <span>₹{selectedInvoice.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Discount:</span>
                    <span>-₹{Math.abs(selectedInvoice.discount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold col-span-2 mt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                  Close
                </Button>
                <Button 
                  onClick={() => handleDownloadInvoice(selectedInvoice)}
                  className="bg-[#eb1c75] hover:bg-[#d1007d] text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Select 
                  value={statusFilter} 
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status === 'all' ? 'All Orders' : status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative w-full sm:w-[300px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input 
                    type="text"
                    placeholder="Search orders..."
                    className="pl-10 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block rounded-md border">
              <Table>
                <TableHeader className="bg-pink-500">
                  <TableRow>
                    <TableHead className="text-white">Order Number</TableHead>
                    <TableHead className="text-white">Order Date</TableHead>
                    <TableHead className="text-white">Items</TableHead>
                    <TableHead className="text-white">Total Amount</TableHead>
                    <TableHead className="text-white">Payment Status</TableHead>
                    <TableHead className="text-white">Order Status</TableHead>
                    <TableHead className="text-white">Notes</TableHead>
                    <TableHead className="text-white text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                      {order.items.map((item, index) => {
                        // Fallback to product.name if product_name is missing
                        const name = item.product_name || item.product?.name || 'Product';
                        return (
                          <div key={index} className="text-sm mb-1">
                            <span className="font-medium">{name}</span>
                            <span className="text-gray-500"> × {item.quantity}</span>
                            {item.color && (
                              <span className="inline-flex items-center gap-1">
                                <div
                                  className={`w-4 h-4 rounded-full inline-block border ${
                                    item.color.toLowerCase() === 'white' ? 'border-gray-300' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: item.color }}
                                  title={item.color}
                                />
                              </span>
                            )}
                            {item.size && <span className="text-gray-500"> - Size: {item.size}</span>}
                          </div>
                        );
                      })}
                        </div>
                      </TableCell>
                      <TableCell>₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.payment_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'Exchanged' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {normalizeOrderStatus(order.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.notes ? (
                          <span className="text-sm text-gray-600">{order.notes}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600 flex items-center gap-2"
                          onClick={() => handleViewInvoice(order)}
                        >
                          <Eye className="h-4 w-4" />
                          Invoice
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden flex flex-col space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="font-medium text-lg">{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600 flex items-center gap-2"
                          onClick={() => handleViewInvoice(order)}
                        >
                          <Eye className="h-4 w-4" />
                          Invoice
                        </Button>
                      </div>

                      {/* Order Details */}
                      <div className="flex flex-col space-y-3">
                        <div className="space-y-2">
                          <p className="text-gray-500 text-sm font-medium">Items</p>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="text-sm">
                                <div className="font-medium">{item.product_name}</div>
                                <div className="text-gray-500">
                                  Quantity: {item.quantity}
                                  {item.color && (
                                    <span className="inline-flex items-center gap-1">
                                      {" • "}
                                      <div
                                        className={`w-4 h-4 rounded-full inline-block border ${
                                          item.color.toLowerCase() === 'white' ? 'border-gray-300' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: item.color }}
                                        title={item.color}
                                      />
                                    </span>
                                  )}
                                  {item.size && <span> • Size: {item.size}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 text-sm">Total Amount</p>
                          <p className="font-medium">
                            ₹{order.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 text-sm">Payment Status</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            order.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.payment_status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-500 text-sm">Order Status</p>                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                            normalizeOrderStatus(order.status) === 'Delivered' ? 'bg-green-100 text-green-800' :
                            normalizeOrderStatus(order.status) === 'Processing' ? 'bg-blue-100 text-blue-800' :
                            normalizeOrderStatus(order.status) === 'Packed' ? 'bg-indigo-100 text-indigo-800' :
                            normalizeOrderStatus(order.status) === 'Shipped' ? 'bg-purple-100 text-purple-800' :
                            normalizeOrderStatus(order.status) === 'Exchanged' ? 'bg-yellow-100 text-yellow-800' :
                            normalizeOrderStatus(order.status) === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {normalizeOrderStatus(order.status)}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="space-y-1">
                            <p className="text-gray-500 text-sm">Notes</p>
                            <p className="text-sm">{order.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
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
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster 
        position="top-right"
        duration={3000}
        expand={true}
        richColors
      />
    </div>
  );
};

export default Orders;