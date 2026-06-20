"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, ChevronLeft, ChevronRight, Download, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import axios from '../../lib/axios'

export default function PaymentHistory() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [dateRangeFilter, setDateRangeFilter] = useState("All time")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Function to convert hex color codes to readable color names
  const getColorName = (color) => {
    if (!color) return '';
    
    // If it's already a color name, return as is
    if (!color.startsWith('#')) {
      return color.charAt(0).toUpperCase() + color.slice(1);
    }
    
    // Common color mappings for hex codes
    const colorMap = {
      '#000000': 'Black',
      '#ffffff': 'White',
      '#ff0000': 'Red',
      '#00ff00': 'Green',
      '#0000ff': 'Blue',
      '#ffff00': 'Yellow',
      '#ff00ff': 'Magenta',
      '#00ffff': 'Cyan',
      '#800000': 'Maroon',
      '#008000': 'Dark Green',
      '#000080': 'Navy',
      '#808000': 'Olive',
      '#800080': 'Purple',
      '#008080': 'Teal',
      '#c0c0c0': 'Silver',
      '#808080': 'Gray',
      '#ffa500': 'Orange',
      '#ffc0cb': 'Pink',
      '#40e0d0': 'Turquoise',
      '#ee82ee': 'Violet',
      '#90ee90': 'Light Green',
      '#f0e68c': 'Khaki',
      '#dda0dd': 'Plum',
      '#98fb98': 'Pale Green',
      '#f5deb3': 'Wheat',
      '#f4a460': 'Sandy Brown',
      '#2e8b57': 'Sea Green',
      '#4682b4': 'Steel Blue',
      '#d2691e': 'Chocolate',
      '#ff6347': 'Tomato',
      '#32cd32': 'Lime Green',
      '#8a2be2': 'Blue Violet',
      '#ff1493': 'Deep Pink',
      '#00ced1': 'Dark Turquoise',
      '#9400d3': 'Dark Violet',
      '#b22222': 'Fire Brick',
      '#228b22': 'Forest Green',
      '#ff69b4': 'Hot Pink',
      '#cd5c5c': 'Indian Red',
      '#4b0082': 'Indigo',
      '#f0ffff': 'Azure',
      '#e6e6fa': 'Lavender',
      '#fff0f5': 'Lavender Blush',
      '#7cfc00': 'Lawn Green',
      '#fffacd': 'Lemon Chiffon',
      '#add8e6': 'Light Blue',
      '#f08080': 'Light Coral',
      '#e0ffff': 'Light Cyan',
      '#fafad2': 'Light Goldenrod',
      '#d3d3d3': 'Light Gray',
      '#ffb6c1': 'Light Pink',
      '#20b2aa': 'Light Sea Green',
      '#87cefa': 'Light Sky Blue',
      '#778899': 'Light Slate Gray',
      '#b0c4de': 'Light Steel Blue',
      '#ffffe0': 'Light Yellow',
      '#f5076b': 'Bright Pink',
      '#eb1c75': 'Hot Pink'
    };
    
    // Check for exact match first
    const lowerColor = color.toLowerCase();
    if (colorMap[lowerColor]) {
      return colorMap[lowerColor];
    }
    
    // If no exact match, try to determine color by analyzing RGB values
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Simple color detection based on dominant RGB values
    if (r > 200 && g < 100 && b < 100) return 'Red';
    if (r < 100 && g > 200 && b < 100) return 'Green';
    if (r < 100 && g < 100 && b > 200) return 'Blue';
    if (r > 200 && g > 200 && b < 100) return 'Yellow';
    if (r > 200 && g < 100 && b > 200) return 'Magenta';
    if (r < 100 && g > 200 && b > 200) return 'Cyan';
    if (r > 200 && g > 200 && b > 200) return 'White';
    if (r < 100 && g < 100 && b < 100) return 'Black';
    if (r > 150 && g > 100 && b < 150) return 'Orange';
    if (r > 150 && g < 150 && b > 150) return 'Purple';
    if (r > 200 && g > 150 && b > 150) return 'Pink';
    if (r < 150 && g < 150 && b < 150) return 'Gray';
    
    // If all else fails, return the original color code
    return color;
  }

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Fetch transactions from your API endpoint with pagination parameters
  
        
        // Include pagination parameters in the API request
        const response = await axios.get('/api/admin/transactions', {
          params: {
            page: currentPage,
            per_page: itemsPerPage,
            transaction_type: typeFilter !== 'All' ? typeFilter : null,
            payment_status: statusFilter !== 'All' ? statusFilter : null,
            search: searchQuery || null
          }
        });
        // console.log('API Response:', response);
        
        if (response.data && response.data.data) {
          // console.log('Transactions data:', response.data.data);
          
          // Handle Laravel paginated response structure
          const paginationData = response.data.data;
          
          // Set total items and current page from the API response
          const apiCurrentPage = paginationData.current_page || 1;
          const apiTotalItems = paginationData.total || 0;
          const apiLastPage = paginationData.last_page || 1;
          
          // console.log('Pagination info from API:', {
          //   currentPage: apiCurrentPage,
          //   totalItems: apiTotalItems,
          //   lastPage: apiLastPage
          // });
          
          // Extract the actual records from the paginated response
          const apiData = paginationData.data || [];
          
                     // Map and transform API data to component's expected format
           const transformedTransactions = apiData.map(transaction => {
             // Store the original date object for better filtering
             const transactionDate = new Date(transaction.transaction_date);
             
             return {
               id: transaction.id,
               invoiceId: transaction.invoice_number,
               orderId: transaction.order_number,
               date: `${transactionDate.getDate().toString().padStart(2, '0')}/${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}/${transactionDate.getFullYear()}`, // Formatted date string for display
               rawDate: transactionDate, // Original Date object for filtering
               customer: transaction.customer_name || 'Walk-in Customer',
               type: transaction.transaction_type,
               method: transaction.payment_method,
               status: transaction.payment_status === 'completed' ? 'Paid' : transaction.payment_status === 'pending' ? 'Pending' : transaction.payment_status,
               subtotal: parseFloat(transaction.subtotal_amount),
               tax: parseFloat(transaction.tax_amount),
               total: parseFloat(transaction.total_amount),
               pos_customer_id: transaction.pos_customer_id
             };
           });
          
          // console.log('Transformed transactions:', transformedTransactions);
          
          // Update state with transformed data and pagination info
          setTransactions(transformedTransactions);
          setFilteredTransactions(transformedTransactions);
          
          // Update totalItems state based on API response
          setTotalItems(apiTotalItems);
          setTotalPages(apiLastPage);
          
          // If API returns different page than requested (like when filtering reduces results),
          // update our current page to match
          if (apiCurrentPage !== currentPage) {
            setCurrentPage(apiCurrentPage);
          }
        } else {
          // console.log("API returned error or invalid data format");
          // Fallback to empty array
          setTransactions([]);
          setFilteredTransactions([]);
          setTotalItems(0);
          setTotalPages(1);
        }
      } catch (error) {
        // console.error("Failed to fetch transactions:", error);
        // console.error("Error details:", error.response || error.message);
        // Fallback to empty array
        setTransactions([]);
        setFilteredTransactions([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, typeFilter, dateRangeFilter]); // Include pagination and filter parameters

  // Update the fetchTransactionDetails function
  const fetchTransactionDetails = async (transactionId) => {
    try {
        // console.log('Fetching details for transaction:', transactionId);
        const response = await axios.get(`/api/admin/transactions/${transactionId}`);
        // console.log('Transaction details response:', response.data);
        
        if (response.data && response.data.status === 'success') {
            const { transaction } = response.data.data;
            
            // Get order items based on payment method
            let items = [];
            if (transaction.payment_method === 'Razorpay') {
                // Fetch Razorpay order items for Razorpay transactions
                const itemsResponse = await axios.get(`/api/razorpay/transactions/${transactionId}/items`);
                if (itemsResponse.data && itemsResponse.data.status === 'success') {
                    items = itemsResponse.data.data.items;
                }
            } else {
                // For POS and other payment methods, use the regular items
                items = response.data.data.items || [];
                
                // If no items found in regular response, try to fetch from POS orders
                if (items.length === 0 && transaction.payment_method === 'POS') {
                    try {
                        const posResponse = await axios.get(`/api/admin/pos-orders/${transactionId}/items`);
                        if (posResponse.data && posResponse.data.status === 'success') {
                            items = posResponse.data.data.items || [];
                        }
                    } catch (posError) {
                        // console.log('No POS-specific items endpoint found, using regular items');
                    }
                }
            }
            
            return {
                transaction,
                items: items.map(item => {
                    const price = parseFloat(item.unit_price || item.price || 0);
                    const quantity = parseInt(item.quantity || 0);
                    const taxAmount = parseFloat(item.tax_amount || item.metadata?.tax_amount || 0);
                    const taxPercentage = parseFloat(item.tax_percentage || item.metadata?.tax_percentage || 0);
                    
                    return {
                        product_id: item.product_id,
                        product_name: item.name || item.product_name, // Handle both 'name' (Razorpay) and 'product_name' (POS)
                        quantity: quantity,
                        price: price,
                        tax_percentage: taxPercentage,
                        tax_amount: taxAmount,
                        subtotal: price * quantity,
                        total: price * quantity + taxAmount,
                        color: item.color,
                        size: item.size,
                        sku_code: item.sku_code || item.sku || null // Handle both sku_code and sku fields
                    };
                })
            };
        }
        
        return null;
    } catch (error) {
        // console.error("Failed to fetch transaction details:", error);
        return null;
    }
  };

  // Apply filters to transactions - only used for local filtering, not when using server-side pagination
  useEffect(() => {
    // Skip this entirely if we're using server-side pagination
    if (transactions.length === 0) return; 
    
    // Client-side filtering is only for display purposes with the server-side pagination
    // console.log('Applying client-side filters for display - transactions:', transactions.length);
    
    let result = [...transactions]; // Create a new array to avoid reference issues

    // Apply search filter - only affects display, actual filtering happens on the server
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (transaction) =>
          (transaction.invoiceId && transaction.invoiceId.toLowerCase().includes(query)) ||
          (transaction.orderId && transaction.orderId.toLowerCase().includes(query)) ||
          (transaction.customer && transaction.customer.toLowerCase().includes(query)),
      );
    }

    // Apply status filter
    if (statusFilter !== "All") {
      result = result.filter((transaction) => transaction.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== "All") {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }

    // Apply date range filter (simplified implementation)
    if (dateRangeFilter !== "All time") {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      if (dateRangeFilter === "This year") {
        result = result.filter(transaction => {
          if (!transaction.rawDate) return false;
          return transaction.rawDate.getFullYear() === currentYear;
        });
      } else if (dateRangeFilter === "Last year") {
        result = result.filter(transaction => {
          if (!transaction.rawDate) return false;
          return transaction.rawDate.getFullYear() === currentYear - 1;
        });
      } else if (dateRangeFilter === "This month") {
        result = result.filter(transaction => {
          if (!transaction.rawDate) return false;
          return transaction.rawDate.getMonth() === currentMonth && 
                 transaction.rawDate.getFullYear() === currentYear;
        });
      } else if (dateRangeFilter === "Last month") {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
        result = result.filter(transaction => {
          if (!transaction.rawDate) return false;
          return transaction.rawDate.getMonth() === lastMonth && 
                 transaction.rawDate.getFullYear() === yearOfLastMonth;
        });
      }
    }

    // console.log('After client-side filtering:', result.length);
    setFilteredTransactions(result);
  }, [searchQuery, statusFilter, typeFilter, dateRangeFilter, transactions]);

  // Pagination controls component
  const PaginationControls = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-500">
        Showing {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} {totalItems === 1 ? 'item' : 'items'}
      </div>
  
      <div className="flex items-center space-x-2">
        {totalPages > 0 && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
  
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                // If 5 or fewer pages, show all page numbers
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                // If near the start, show first 5 pages
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If near the end, show last 5 pages
                pageNum = totalPages - 4 + i;
              } else {
                // Show current page and 2 pages before and after
                pageNum = currentPage - 2 + i;
              }
  
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => goToPage(pageNum)}
                  className={`h-8 w-8 ${
                    currentPage === pageNum ? "bg-pink-500 text-white" : ""
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
  
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
  
  // Update the page change handler
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      // console.log(`Moving to page ${page} of ${totalPages}`);
      setCurrentPage(page);
      window.scrollTo(0, 0); // Scroll to top when page changes
    } else {
      // console.log(`Invalid page ${page}, totalPages: ${totalPages}`);
    }
  };

  // Handle invoice download
  const handleDownloadInvoice = async (invoice) => {
    try {
      // Fetch transaction details to get product items
      const transactionDetails = await fetchTransactionDetails(invoice.id);
      if (!transactionDetails) {
        alert("Could not fetch transaction details. Please try again.");
        return;
      }

      // Fetch company details for billing address
      const companyResponse = await axios.get('/api/admin/company');
      const companyData = companyResponse.data;

      // Create a new window for generating the PDF-optimized invoice
      const printWindow = window.open('', '', 'width=800,height=800');
      
      if (!printWindow) {
        alert("Please allow popups to download the invoice as PDF.");
        return;
      }

      // Format date for display
      const displayDate = invoice.date;
      const displayTime = new Date(transactionDetails.transaction.transaction_date).toLocaleTimeString() || "14:30:00";
      
      // Get items from transaction details
      const items = transactionDetails.items || [];

      // Create a PDF-optimized version of the invoice matching Orders.jsx format
      printWindow.document.write(`
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
                onerror="this.onerror=null; this.src='https://placehold.co/100x100/eb1c75/white?text=Lia';"
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

                         <!-- Address Section - Only show for Online transactions -->
             ${invoice.type !== 'POS' ? `
             <div class="address-section">
               <div>
                 <div class="address-title">Billing Address:</div>
                 <div class="address-content">
                   <div class="name-bold">${companyData?.store_name || 'Lia Fashions'}</div>
                   ${companyData?.door_no || ''}, ${companyData?.street_name || ''}<br/>
                   ${companyData?.district || ''}, ${companyData?.state || ''}<br/>
                   ${companyData?.country || 'India'} - ${companyData?.pin_code || ''}<br/>
                   Phone: ${companyData?.mobile_no || ''}
                 </div>
               </div>
               <div>
                 <div class="address-title">Shipping Address:</div>
                 <div class="address-content">
                   <div class="name-bold">${invoice.customer}</div>
                   ${(() => {
                     try {
                       const notes = transactionDetails.transaction?.notes;
                       if (notes) {
                         const notesData = typeof notes === 'string' ? JSON.parse(notes) : notes;
                         const shippingAddress = notesData?.shipping_address;
                         if (shippingAddress) {
                           return `
                             ${shippingAddress.addressLine1 || shippingAddress.address || 'N/A'}<br/>
                             ${shippingAddress.city || 'N/A'}, ${shippingAddress.state || 'N/A'}<br/>
                             ${shippingAddress.pincode || 'N/A'}, ${shippingAddress.country || 'India'}<br/>
                             Phone: ${transactionDetails.transaction?.customer_phone || 'N/A'}<br/>
                
                           `;
                         }
                       }
                       return 'N/A';
                     } catch (e) {
                       return 'N/A';
                     }
                   })()}
                 </div>
               </div>
             </div>
             ` : ''}
            
            <!-- Items Table -->
            <h3 style="margin-bottom: 5px;">Order Items</h3>
            <table class="items-table">
                             <thead>
                 <tr>
                   <th>Product</th>
                   <th>Color</th>
                   <th>Size</th>
                   <th>Qty</th>
                   <th>Price</th>
                   <th>Tax</th>
                   <th>Amount</th>
                 </tr>
               </thead>
              <tbody>
                                 ${items.map(item => {
                   const itemTax = (parseFloat(item.price) * item.quantity * (item.tax_percentage || 0)) / 100;
                   const itemTotal = (parseFloat(item.price) * item.quantity) + itemTax;
                   return `
                     <tr>
                                               <td>
                          ${item.product_name || 'Product Item'}
                          ${item.sku_code ? `<br/><small style="color: #888; font-size: 10px;">SKU: ${item.sku_code}</small>` : ''}
                        </td>
                       <td>
                         ${item.color ? `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${item.color}; border: 1px solid #ddd; margin: 0 auto;"></div>` : 'N/A'}
                       </td>
                       <td>${item.size || 'N/A'}</td>
                       <td>${item.quantity}</td>
                       <td>₹${parseFloat(item.price).toFixed(2)}</td>
                       <td>${item.tax_percentage || 0}% (₹${itemTax.toFixed(2)})</td>
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
                <td>₹${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Tax:</td>
                <td>₹${invoice.tax.toFixed(2)}</td>
              </tr>
              <tr class="total">
                <td>Total:</td>
                <td>₹${invoice.total.toFixed(2)}</td>
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
              <div class="footer-company">Lia Fashions</div>
              <div class="footer-contact">www.liafashion.in | +91 9384109680</div>
              <div class="footer-address">56, Kurinji st, Bharathi Nagar, Ariankuppan, Pondicherry 605007</div>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      
      // Wait for content to load completely
      setTimeout(() => {
        // Convert the optimized HTML to PDF with html2canvas and jsPDF
        html2canvas(printWindow.document.body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
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
          
          // Calculate image dimensions to fit on page
          const imgWidth = pageWidth - 20; // 10mm margins on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          
          // Save the PDF
          pdf.save(`LIA_Invoice-${invoice.invoiceId}.pdf`);
          
          // Close the window
          printWindow.close();
        }).catch(err => {
          // console.error("Error generating PDF:", err);
          alert("Failed to download invoice as PDF. Please try again.");
          printWindow.close();
        });
      }, 1000); // Wait 1 second for content to load
    } catch (error) {
      // console.error("Error in handleDownloadInvoice:", error);
      alert("An error occurred while generating the PDF. Please try again.");
    }
  };

  // Handle view invoice details
  const handleViewInvoice = async (invoice) => {
    try {
      // console.log('Viewing invoice:', invoice); // Debug log
      
      // Fetch transaction details to get product items
      const transactionDetails = await fetchTransactionDetails(invoice.id);
      // console.log('Fetched transaction details:', transactionDetails); // Debug log
      
      if (!transactionDetails) {
        alert("Could not fetch transaction details. Please try again.");
        return;
      }
      
      // Add items to the invoice object
      const invoiceWithItems = {
        ...invoice,
        items: transactionDetails.items || [],
        transaction: transactionDetails.transaction || {}
      };
      
      // console.log('Invoice with items:', invoiceWithItems); // Debug log
      setSelectedInvoice(invoiceWithItems);
      setShowInvoiceModal(true);
    } catch (error) {
      // console.error("Error in handleViewInvoice:", error);
      alert("An error occurred while fetching transaction details. Please try again.");
    }
  };

  // Close modal
  const closeInvoiceModal = () => {
    setShowInvoiceModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className="w-full max-w-9xl mx-auto p-4">
      <div className="flex flex-col gap-4">
        {/* Search and filters */}
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="relative">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[200px]"
            />
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* <Button
              variant="outline"
              className="bg-gray-100"
              onClick={() => {
                console.log('Debug info:');
                console.log('- Transactions:', transactions);
                console.log('- Filtered transactions:', filteredTransactions);
                console.log('- Current items:', currentItems);
                // Force refresh
                setTransactions([...transactions]);
              }}
            >
              Debug
            </Button> */}
            
            <Button
              variant="default"
              className="bg-pink-500 hover:bg-pink-600 text-white"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await axios.get('/api/admin/transactions');
                  if (response.data && response.data.data) {
                    const apiData = response.data.data.data || response.data.data;
                    
                                         const transformedTransactions = apiData.map(transaction => {
                       const transactionDate = new Date(transaction.transaction_date);
                       const formattedDate = `${transactionDate.getDate().toString().padStart(2, '0')}/${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}/${transactionDate.getFullYear()}`;
                       
                       return {
                         id: transaction.id,
                         invoiceId: transaction.invoice_number,
                         orderId: transaction.order_number,
                         date: formattedDate,
                         rawDate: transactionDate,
                         customer: transaction.customer_name || 'Walk-in Customer',
                         type: transaction.transaction_type,
                         method: transaction.payment_method,
                         status: transaction.payment_status,
                         subtotal: parseFloat(transaction.subtotal_amount),
                         tax: parseFloat(transaction.tax_amount),
                         total: parseFloat(transaction.total_amount),
                         pos_customer_id: transaction.pos_customer_id
                       };
                     });
                    
                    setTransactions(transformedTransactions);
                    setFilteredTransactions(transformedTransactions);
                    alert("Data refreshed successfully!");
                  }
                } catch (error) {
                  console.error("Failed to refresh data:", error);
                  alert("Failed to refresh data. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              Refresh Data
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 items-center">
                  Status: {statusFilter} <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("All")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Paid")}>Paid</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>Pending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("Failed")}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="POS">POS</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All time">All time</SelectItem>
                <SelectItem value="This year">This year</SelectItem>
                <SelectItem value="Last year">Last year</SelectItem>
                <SelectItem value="This month">This month</SelectItem>
                <SelectItem value="Last month">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-gray-500 mb-2">No transactions found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <Table>
                             <TableHeader className="bg-pink-600">
                 <TableRow>
                   <TableHead className="text-white text-center">Invoice ID</TableHead>
                   <TableHead className="text-white text-center">Order ID</TableHead>
                   <TableHead className="text-white text-center">Customer</TableHead>
                   <TableHead className="text-white text-center">Date</TableHead>
                   <TableHead className="text-white text-center">Total</TableHead>
                   <TableHead className="text-white text-center">Type</TableHead>
                   <TableHead className="text-white text-center">Method</TableHead>
                   <TableHead className="text-white text-center">Status</TableHead>
                   <TableHead className="text-white text-center">Actions</TableHead>
                 </TableRow>
               </TableHeader>
              <TableBody>
                                 {filteredTransactions.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan="9" className="text-center">
                       <p className="text-gray-500">No items match your current filters</p>
                       <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search query</p>
                     </TableCell>
                   </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium text-center">{transaction.invoiceId}</TableCell>
                      <TableCell className="text-center">{transaction.orderId}</TableCell>
                      <TableCell className="text-center">{transaction.customer}</TableCell>
                      <TableCell className="text-center">{transaction.date}</TableCell>
                      <TableCell className="text-center">₹{transaction.total}</TableCell>
                      <TableCell className="text-center">{transaction.type}</TableCell>
                      <TableCell className="text-center">{transaction.method}</TableCell>
                      <TableCell className="text-center">
                        <div
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full justify-center ${
                            transaction.status === "Paid"
                              ? "bg-green-100 text-green-600"
                              : transaction.status === "Pending"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.status}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <div className="flex space-x-2 justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 text-pink-500"
                            onClick={() => handleViewInvoice(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 text-pink-500"
                            onClick={() => handleDownloadInvoice(transaction)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        <PaginationControls />
      </div>

      {/* Invoice Detail Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="pb-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Invoice #{selectedInvoice.invoiceId}</h2>
                <Button variant="ghost" size="sm" onClick={closeInvoiceModal}>
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

                             {/* Address Section - Only show for Online transactions */}
               {selectedInvoice.type !== 'POS' && (
                 <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="border rounded-md p-3 bg-gray-50">
                     <h4 className="font-semibold text-sm mb-2 text-gray-700">Billing Address</h4>
                     <div className="text-sm text-gray-600">
                       <p className="font-medium">Lia Fashions</p>
                       <p>56, Kurinji st, Bharathi Nagar</p>
                       <p>Ariankuppan, Pondicherry 605007</p>
                       <p>Phone: +91 9384109680</p>
                     </div>
                   </div>
                   <div className="border rounded-md p-3 bg-gray-50">
                     <h4 className="font-semibold text-sm mb-2 text-gray-700">Shipping Address</h4>
                     <div className="text-sm text-gray-600">
                       <p className="font-medium">{selectedInvoice.customer}</p>
                       {(() => {
                         try {
                           const notes = selectedInvoice.transaction?.notes;
                           if (notes) {
                             const notesData = typeof notes === 'string' ? JSON.parse(notes) : notes;
                             const shippingAddress = notesData?.shipping_address;
                             if (shippingAddress) {
                               return (
                                 <>
                                   <p>{shippingAddress.addressLine1 || shippingAddress.address || 'N/A'}</p>
                                   <p>{shippingAddress.city || 'N/A'}, {shippingAddress.state || 'N/A'}</p>
                                   <p>{shippingAddress.pincode || 'N/A'}, {shippingAddress.country || 'India'}</p>
                                   <p>Phone: {selectedInvoice.transaction?.customer_phone || 'N/A'}</p>
                          
                                 </>
                               );
                             }
                           }
                           return <p>N/A</p>;
                         } catch (e) {
                           return <p>N/A</p>;
                         }
                       })()}
                     </div>
                   </div>
                 </div>
               )}
              
              {/* Product Items */}
              <div className="border rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tax</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                                             {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                         selectedInvoice.items.map((item, index) => (
                           <tr key={index}>
                             <td className="px-3 py-2 text-sm">
                               {item.product_name}
                             </td>
                             <td className="px-3 py-2 text-sm text-center">
                               {item.sku_code || 'N/A'}
                             </td>
                             <td className="px-3 py-2 text-sm text-center">
                               {item.color ? (
                                 <div className="flex items-center justify-center">
                                   <div
                                     className="w-4 h-4 rounded-full border border-gray-300"
                                     style={{ backgroundColor: item.color }}
                                     title={item.color}
                                   />
                                 </div>
                               ) : (
                                 'N/A'
                               )}
                             </td>
                             <td className="px-3 py-2 text-sm text-center">{item.size || 'N/A'}</td>
                             <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
                             <td className="px-3 py-2 text-sm text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                             <td className="px-3 py-2 text-sm text-right">
                                 {item.tax_percentage}% (₹{parseFloat(item.tax_amount).toFixed(2)})
                             </td>
                             <td className="px-3 py-2 text-sm text-right">₹{item.total.toFixed(2)}</td>
                           </tr>
                         ))
                       ) : (
                         <tr>
                           <td colSpan="8" className="px-3 py-2 text-sm text-gray-500 text-center">
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
                  <div className="flex justify-between font-bold col-span-2 mt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              

              
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={closeInvoiceModal}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    handleDownloadInvoice(selectedInvoice);
                    closeInvoiceModal();
                  }}
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
    </div>
  )
}
