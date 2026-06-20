"use client"

import { useState, useEffect, useCallback } from "react"
import { orderService } from "@/services/orderService.ts"
import { toast } from "react-toastify"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, X, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import axios from '../../lib/axios'
import PendingOrders from "./OrdersPending"
import PackedOrders from "./OrdersPacked"
import ShippedOrders from "./OrdersShipped"
import DeliveredOrders from "./OrdersDelivered"
import CancelledOrders from "./OrdersCancelled"
import ExchangedOrders from "./OrdersExchanged"

export default function OrderManagement() {
  // State
  const [activeTab, setActiveTab] = useState("pending")
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [transitionInfo, setTransitionInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)

  // Search functionality
  useEffect(() => {
    if (!orders.length) return;

    const filtered = orders.filter(order => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;

      return (
        order.order_number.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.items.toLowerCase().includes(searchLower)
      );
    });

    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  // Get order counts for badges
  const getOrderCount = useCallback((status) => {
    const ordersToCount = filteredOrders.length > 0 ? filteredOrders : orders;
    if (status.toLowerCase() === "pending") {
      return ordersToCount.filter((order) => 
        order.status.toLowerCase() === "pending" || 
        order.status.toLowerCase() === "processing"
      ).length;
    }
    return ordersToCount.filter((order) => 
      order.status.toLowerCase() === status.toLowerCase()
    ).length;
  }, [orders, filteredOrders]);

  const getExpectedAction = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Confirm within 24 hrs"
      case "packed":
        return "Hand over to courier"
      case "shipped":
        return "Track delivery"
      default:
        return "N/A"
    }
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch more orders by default - 100 instead of 10
      const response = await orderService.getOrders({ per_page: 100 })
      setOrders(
        response.data.data.map((order) => ({          id: order.id,
          order_number: order.order_number,
          date: new Date(order.created_at).toLocaleDateString(),
          customerName: order.user?.name || "Guest",
          items: Array.isArray(order.items)
            ? order.items.length === 1 
              ? order.items[0].product.name.length > 30 
                ? order.items[0].product.name.substring(0, 30) + "..."
                : order.items[0].product.name
              : order.items.length === 2
              ? `${order.items[0].product.name.substring(0, 20)}... & 1 more`
              : `${order.items[0].product.name.substring(0, 20)}... & ${order.items.length - 1} more`
            : "Multiple items",
          total: order.total_amount,
          payment: order.payment_status || "N/A",
          status: order.status || "Pending",
          notes: order.notes,
          deliveryType: order.order_type || "manual",
          expectedAction: getExpectedAction(order.status),expectedDelivery: order.status === "Shipped" ? 
            new Date(new Date(order.updated_at).getTime() + (3 * 24 * 60 * 60 * 1000)).toLocaleDateString() : 
            "N/A",
          delivered_at: order.delivered_at,
          deliveredOn: order.status === "Delivered" && order.delivered_at ? 
            new Date(order.delivered_at).toLocaleDateString() + " " + new Date(order.delivered_at).toLocaleTimeString() : 
            order.status === "Delivered" ? 
            new Date(order.updated_at).toLocaleDateString() + " " + new Date(order.updated_at).toLocaleTimeString() : 
            "N/A",
        }))
      )
    } catch (error) {
      // console.error("Failed to fetch orders:", error)
      toast.error("Failed to fetch orders. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [getExpectedAction])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Function to handle order status changes
  const handleStatusChange = async (orderId, newStatus) => {
    try {      // Set transition info for animation
      const order = orders.find((o) => o.id === orderId)
      const now = new Date().toISOString()
      setTransitionInfo({
        orderId: order.order_number,
        fromStatus: order.status,
        toStatus: newStatus,
        timestamp: now,
      })

      // Include delivered_at timestamp when changing to Delivered status
      const updateData = {
        status: newStatus,
        ...(newStatus === "Delivered" ? { delivered_at: now } : {})
      }
      await orderService.updateOrderStatus(orderId, updateData)

      setOrders(
        orders.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
      )

      // Change active tab to show the destination tab
      setActiveTab(newStatus.toLowerCase())

      toast.success("Order status updated successfully")

      setTimeout(() => {
        setTransitionInfo(null)
      }, 3000)
    } catch (error) {
      // console.error("Failed to update order status:", error)
      toast.error("Failed to update order status. Please try again.")
    }
  }

  // Function to handle note updates
  const handleNoteUpdate = async (orderId, note) => {
    try {
      await orderService.updateNote(orderId, note)
      setOrders(
        orders.map((order) => (order.id === orderId ? { ...order, notes: note } : order))
      )
      toast.success("Note updated successfully")
    } catch (error) {
      // console.error("Failed to update note:", error)
      toast.error("Failed to update note. Please try again.")
    }
  }

  // Function to convert image to base64
  const getBase64Image = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      };
      img.onerror = () => {
        // console.error('Failed to load image:', url);
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4=');
      };
      img.src = url;
    });
  };

  // Update handleViewInvoice to use base64 images
  const handleViewInvoice = async (order) => {
    try {
      const [orderResponse, companyResponse, transactionResponse] = await Promise.all([
        orderService.getOrderDetails(order.id),
        axios.get('/api/admin/company'),
        axios.get(`/api/admin/transactions/orders/${order.order_number}`)
      ]);

      if (orderResponse.status === 'success') {
        const orderDetails = orderResponse.data;
        const companyData = companyResponse.data;
        const transactionData = transactionResponse.data.data;
        // console.log('Order details:', orderDetails); // Debug log
        
        // Parse shipping address and notes
        let shippingAddress = null;
        let notesData = null;
        
        try {
          // Get shipping address from transaction data first
          if (transactionData.transaction?.notes) {
            notesData = JSON.parse(transactionData.transaction.notes);
            shippingAddress = notesData.shipping_address;
          }
          
          // Fallback to order shipping address if transaction data not available
          if (!shippingAddress) {
            shippingAddress = typeof orderDetails.shipping_address === 'string' 
              ? JSON.parse(orderDetails.shipping_address)
              : orderDetails.shipping_address;
          }
        } catch (e) {
          console.warn('Failed to parse address:', e);
        }
        
        // Calculate subtotal from items
        const subtotal = orderDetails.items.reduce((sum, item) => 
          sum + (parseFloat(item.price) * item.quantity), 0);

        // Calculate tax: use backend value if present and > 0, else calculate from items
        let tax = parseFloat(orderDetails.tax);
        if (!tax && orderDetails.items.length > 0) {
          // Sum up tax for each item
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
        
        // Process items and convert images to base64
        const processedItems = await Promise.all(orderDetails.items.map(async (item) => {
          // Get the image URL from either colors or direct product image
          const imageUrl = item.product?.colors?.[0]?.cover_image || 
                         item.product?.image || 
                         '/assets/images/placeholder.png';
          
          // Convert image to base64
          const base64Image = await getBase64Image(imageUrl);
          
          return {
            ...item,
            product: {
              ...item.product,
              image: base64Image
            }
          };
        }));
        
        // Create invoice object with calculated values
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
          company: companyData,
          address: {
            address_line1: shippingAddress?.addressLine1 || shippingAddress?.address || '',
            city: shippingAddress?.city || orderDetails.shipping_city || '',
            state: shippingAddress?.state || orderDetails.shipping_state || '',
            postal_code: shippingAddress?.pincode || shippingAddress?.pin_code || orderDetails.shipping_pincode || '',
            district: shippingAddress?.district || '',
            country: shippingAddress?.country || 'India',
            name: transactionData.transaction?.customer_name || shippingAddress?.name || orderDetails.user?.name || '',
            email: shippingAddress?.email || orderDetails.user?.email || '',
            phone: transactionData.transaction?.customer_phone || shippingAddress?.phone || orderDetails.user?.phone || ''
          }
        };
        
        // console.log('Prepared invoice:', invoice); // Debug log
        setSelectedInvoice(invoice);
        setShowInvoiceModal(true);
      } else {
        toast.error('Failed to fetch order details');
      }
    } catch (error) {
      // console.error("Failed to fetch invoice details:", error);
      toast.error("Failed to fetch invoice details. Please try again.");
    }
  };

  // Function to preload images
  const preloadImages = async (images) => {
    const loadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      await Promise.all(images.map(src => loadImage(src)));
      // console.log('All images preloaded successfully');
    } catch (error) {
      // console.error('Error preloading images:', error);
    }
  };

  // Compact receipt HTML for print/PDF (max-w-md, 420px)
  const getCompactReceiptHTML = (invoice, logoBase64) => {
    const displayDate = invoice.date;
    const displayTime = new Date(invoice.created_at).toLocaleTimeString();
    const items = invoice.items || [];
    // Billing address (company)
    const billing = invoice.company || {};
    // Shipping address (customer)
    const shipping = invoice.address || {};
    return `
      <html>
        <head>
          <title>Invoice Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
            .receipt-container { width: 420px; max-width: 100vw; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px #0001; padding: 24px 16px; }
            .receipt-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
            .receipt-logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
            .receipt-title { font-size: 1.3rem; font-weight: bold; color: #eb1c75; }
            .receipt-id { font-size: 0.95rem; color: #888; }
            .receipt-section { margin-bottom: 10px; }
            .receipt-label { color: #888; font-size: 0.95rem; }
            .receipt-value { font-weight: 500; }
            .receipt-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 0.98rem; }
            .receipt-table th, .receipt-table td { padding: 4px 6px; text-align: left; }
            .receipt-table th { background: #f7e6ef; color: #eb1c75; font-weight: 600; }
            .receipt-table td { border-bottom: 1px solid #f3f3f3; }
            .summary-row { display: flex; justify-content: space-between; margin: 2px 0; }
            .summary-label { color: #888; }
            .summary-value { font-weight: 500; }
            .summary-total { font-weight: bold; color: #eb1c75; font-size: 1.1rem; }
            .footer { text-align: center; margin-top: 18px; font-size: 0.98rem; color: #888; }
            .footer .footer-company { color: #eb1c75; font-weight: bold; font-size: 1.1rem; }
            .address-section { display: flex; gap: 16px; margin-bottom: 10px; }
            .address-block { flex: 1; background: #f8f8fa; border-radius: 6px; padding: 8px 10px; font-size: 0.97rem; }
            .address-title { font-weight: bold; color: #eb1c75; font-size: 1.01rem; margin-bottom: 2px; }
            .address-line { color: #444; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <img src="${logoBase64}" alt="Logo" class="receipt-logo" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4=';" />
              <div>
                <div class="receipt-title">Invoice</div>
                <div class="receipt-id">#${invoice.invoiceId}</div>
              </div>
            </div>
            <div class="receipt-section" style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div class="receipt-label">Customer:</div>
                <div class="receipt-value">${invoice.customer}</div>
              </div>
              <div style="text-align: right;">
                <div class="receipt-label">Date:</div>
                <div class="receipt-value">${displayDate} ${displayTime}</div>
              </div>
            </div>

            <div class="address-section">
              <div class="address-block">
                <div class="address-title">Billing Address</div>
                <div class="address-line">${billing.store_name || 'Lia Fashions'}</div>
                <div class="address-line">${billing.door_no || ''} ${billing.street_name || ''}</div>
                <div class="address-line">${billing.district || ''} ${billing.state || ''}</div>
                <div class="address-line">${billing.country || 'India'} - ${billing.pin_code || ''}</div>
                <div class="address-line">Phone: ${billing.mobile_no || ''}</div>
              </div>
              <div class="address-block">
                <div class="address-title">Shipping Address</div>
                <div class="address-line">${shipping.name || ''}</div>
                <div class="address-line">${shipping.address_line1 || ''}</div>
                <div class="address-line">${shipping.city || ''}, ${shipping.district || ''}, ${shipping.state || ''}</div>
                <div class="address-line">${shipping.country || 'India'} - ${shipping.postal_code || ''}</div>
                <div class="address-line">Phone: ${shipping.phone || ''}</div>
                <div class="address-line">Email: ${shipping.email || ''}</div>
              </div>
            </div>
            <div class="receipt-section">
              <table class="receipt-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Tax</th>
                    <th>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => {
                    const itemTax = (parseFloat(item.price) * item.quantity * (item.product.tax_percentage || 0)) / 100;
                    const itemTotal = (parseFloat(item.price) * item.quantity) + itemTax;
                    return `<tr>
                      <td>
                        ${item.product.name}
                        ${item.product.sku_code ? `<br/><small style="color: #888; font-size: 10px;">SKU: ${item.product.sku_code}</small>` : ''}
                      </td>
                      <td>${item.quantity}</td>
                      <td>₹${parseFloat(item.price).toFixed(2)}</td>
                      <td>${item.product.tax_percentage || 0}%<br/>₹${itemTax.toFixed(2)}</td>
                      <td>₹${itemTotal.toFixed(2)}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
            <div class="receipt-section">
              <div class="summary-row"><span class="summary-label">Subtotal:</span><span class="summary-value">₹${Number(invoice.subtotal || 0).toFixed(2)}</span></div>
              <div class="summary-row"><span class="summary-label">Tax:</span><span class="summary-value">₹${Number(invoice.tax || 0).toFixed(2)}</span></div>
              <div class="summary-row"><span class="summary-label">Shipping:</span><span class="summary-value">₹${Number(invoice.shipping || 0).toFixed(2)}</span></div>
              <div class="summary-row"><span class="summary-label">Coupon Discount:</span><span class="summary-value">-₹${Math.abs(Number(invoice.discount || 0)).toFixed(2)}</span></div>
              <div class="summary-row summary-total"><span>Total:</span><span>₹${Number(invoice.total || 0).toFixed(2)}</span></div>
            </div>
         
            <div class="footer">
              <div>Thank you, Please Come again</div>
              <div class="footer-company">Lia Fashion</div>
              <div>www.liafashion.in | +91 9384109680</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  // Print Invoice (compact receipt)
  const handlePrintInvoice = async (invoice) => {
    try {
      console.log('Print Invoice Data:', invoice);
      console.log('Address Data:', invoice.address);
      const logoBase64 = await getBase64Image(invoice.company?.logo || '/assets/images/logo.png');
      const printWindow = window.open('', '', 'width=440,height=500');
      if (!printWindow) {
        toast.error("Please allow popups to print the invoice.");
        return;
      }
      // Print Billing and Shipping Address above the table
      // Format date as dd/mm/yyyy
      const dateObj = new Date(invoice.created_at || invoice.date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice Receipt</title>
            <style>
              body { font-family: 'Poppins', sans-serif; margin: 0; padding: 8px; background: #fff; font-size: 12px; line-height: 1.2; }
              .thermal-container { max-width: 280px; margin: 0 auto; background: #fff; }
              .thermal-header { margin-bottom: 12px; padding-bottom: 8px; }
              .header-row { display: flex; justify-content: space-between; align-items: center; }
              .header-left { text-align: left; }
              .header-right { text-align: right; }
              .thermal-logo { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
              .thermal-title { font-size: 16px; font-weight: bold; margin: 4px 0; }
              .thermal-title-i { font-size: 14px; font-weight: bold; margin: 6px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
              .info-left { text-align: left; flex: 1; }
              .info-right { text-align: right; margin-left: 20px; }
              .billing-title { font-weight: bold; font-size: 12px; margin-bottom: 4px; }
              .thermal-date { font-size: 12px; margin: 2px 0; }
              .thermal-section { margin-bottom: 12px; }
              .thermal-section-title { font-weight: bold; font-size: 14px; margin-bottom: 4px; text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; }
              .thermal-address { margin-bottom: 8px; }
              .thermal-address-title { font-weight: bold; font-size: 12px; margin-bottom: 2px; }
              .thermal-address-line { font-size: 11px; line-height: 1.1; margin-bottom: 1px; }
              .billing-address-line { font-size: 11px; line-height: 1.1; margin-bottom: 1px; }
              .shipping-address-line { font-size: 13px; line-height: 1.2; margin-bottom: 2px; }
              .thermal-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
              .thermal-table th, .thermal-table td { padding: 4px 2px; font-size: 11px; border-bottom: 1px solid #000; text-align: left; }
              .thermal-table th { font-weight: bold; background: #f0f0f0; }
              .thermal-table td:last-child { text-align: right; font-weight: bold; }
              .thermal-footer { text-align: center; margin-top: 16px; border-top: 1px dashed #000; padding-top: 8px; }
              .thermal-footer-line { font-size: 11px; margin: 2px 0; }
              .thermal-footer-company { font-weight: bold; font-size: 12px; margin: 4px 0; }
              .thermal-divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            </style>
          </head>
          <body>
            <div class="thermal-container">
              <!-- Header Section -->
              <div class="thermal-header">
                <div class="header-row">
                  <div class="header-left">
                    <div class="thermal-title">LIA FASHION</div>
                    <div class="thermal-title-i">INVOICE</div>
                  </div>
                  <div class="header-right">
                    <img src="${logoBase64}" alt="Logo" class="thermal-logo" onerror="this.onerror=null;this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4=';" />
                  </div>
                </div>
              </div>
              
              <!-- Address and Info Row -->
              <div class="info-row">
                                <div class="info-left">
                    <div class="thermal-address">
                      <div class="billing-address-line">${invoice.company?.door_no || ''} ${invoice.company?.street_name || ''}</div>
                      <div class="billing-address-line">${invoice.company?.district || ''}, ${invoice.company?.state || ''}</div>
                      <div class="billing-address-line">${invoice.company?.country || 'India'} - ${invoice.company?.pin_code || ''}</div>
                      <div class="billing-address-line">Ph: ${invoice.company?.mobile_no || ''}</div>
                      <div class="billing-address-line">${invoice.company?.email || ''}</div>
                    </div>
                  </div>
                <div class="info-right">
                  <div class="thermal-date">Date: ${formattedDate}</div>
                </div>
              </div>
              
              <div class="thermal-divider"></div>
              
              <!-- Shipping Address -->
              <div class="thermal-section">
                <div class="thermal-section-title">SHIPPING ADDRESS</div>
                <div class="thermal-address">
                  <div class="shipping-address-line" style="font-weight:bold;">${invoice.address?.name || ''}</div>
                  <div class="shipping-address-line">${invoice.address?.address_line1 || ''}</div>
                  <div class="shipping-address-line">${invoice.address?.city || ''}, ${invoice.address?.district || ''}, ${invoice.address?.state || ''}</div>
                  <div class="shipping-address-line">${invoice.address?.country || 'India'} - ${invoice.address?.postal_code || ''}</div>
                  <div class="shipping-address-line">Ph: ${invoice.address?.phone || ''}</div>
                  <div class="shipping-address-line">${invoice.address?.email || ''}</div>
                </div>
              </div>
              
              <div class="thermal-divider"></div>
              
              <!-- Order Details -->
              <table class="thermal-table">
                <thead>
                  <tr>
                    <th>ORDER ID</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${invoice.orderId}</td>
                    <td>₹${Number(invoice.total || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
              
              <!-- Footer -->
              <div class="thermal-footer">
                <div class="thermal-footer-line">Thank you, Please Purchase again</div>
                <div class="thermal-footer-company">LIA FASHION</div>
                <div class="thermal-footer-line">www.liafashion.in</div>
                <div class="thermal-footer-line">+91 9384109680</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } catch (error) {
      toast.error("Failed to print invoice. Please try again.");
    }
  };

  // Function to download invoice as PDF (old wide format)
  const handleDownloadInvoice = async (invoice) => {
    try {
      console.log('Download Invoice Data:', invoice);
      console.log('Download Address Data:', invoice.address);
      await preloadImages(invoice.items.map(item => item.product.image));
      const logoBase64 = await getBase64Image(invoice.company?.logo || '/assets/images/logo.png');
      const printWindow = window.open('', '', 'width=800,height=800');
      if (!printWindow) {
        toast.error("Please allow popups to download the invoice as PDF.");
        return;
      }
      // Format date and time
      const displayDate = invoice.date;
      const displayTime = new Date(invoice.created_at).toLocaleTimeString();
      const items = invoice.items || [];
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
                src="${logoBase64}"
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
                  <div class="name-bold">${invoice.company?.store_name || 'Lia Fashions'}</div>
                  ${invoice.company?.door_no || ''}, ${invoice.company?.street_name || ''}<br/>
                  ${invoice.company?.district || ''}, ${invoice.company?.state || ''}<br/>
                  ${invoice.company?.country || 'India'} - ${invoice.company?.pin_code || ''}<br/>
                  Phone: ${invoice.company?.mobile_no || ''}
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
                        ${item.product.name}
                        ${item.product.sku_code ? `<br/><small style="color: #888; font-size: 10px;">SKU: ${item.product.sku_code}</small>` : ''}
                      </td>
                      <td>${item.size || 'N/A'}</td>
                  
                      <td>${item.quantity}</td>
                      <td>₹${parseFloat(item.price).toFixed(2)}</td>
                      <td>${item.product.tax_percentage || 0}% (₹${itemTax.toFixed(2)})</td>
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
              <div class="footer-thanks">Thank you, Please Co again</div>
              <div class="footer-company">Lia Fashion</div>
              <div class="footer-contact">www.liafashion.in | +91 9384109680</div>
          
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        html2canvas(printWindow.document.body, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          imageTimeout: 15000,
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth - 20;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          pdf.save(`LIA_Invoice-${invoice.invoiceId}.pdf`);
          printWindow.close();
        }).catch(_err => {
          toast.error("Failed to download invoice as PDF. Please try again.");
          printWindow.close();
        });
      }, 1000);
    } catch (_error) {
      toast.error("An error occurred while generating the PDF. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eb1c75]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Invoice Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="pb-4 border-b border-gray-200">              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">#{selectedInvoice.orderId}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowInvoiceModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
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
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
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
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-32 h-32 rounded-md border border-gray-200 overflow-hidden"
                                  style={{ 
                                    backgroundImage: `url(${item.product.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                  }}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.product.name}</span>
                                  {item.product.sku_code && (
                                    <span className="text-xs text-gray-500 mt-1">SKU: {item.product.sku_code}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm text-center">{item.size || 'N/A'}</td>
                            <td className="px-3 py-2 text-sm text-center">
                              {item.color ? (
                                <div className="flex justify-center">
                                  <div
                                    className={`w-6 h-6 rounded-full border ${
                                      item.color.toLowerCase() === 'white' ? 'border-gray-300' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: item.color }}
                                    title={item.color}
                                  />
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className="px-3 py-2 text-sm text-center">{item.quantity}</td>
                            <td className="px-3 py-2 text-sm text-right">₹{parseFloat(item.price).toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-right">
                              {`${item.product.tax_percentage || 0}% (₹${((parseFloat(item.price) * item.quantity * (item.product.tax_percentage || 0)) / 100).toFixed(2)})`}
                            </td>
                            <td className="px-3 py-2 text-sm text-right">₹{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-3 py-2 text-sm text-gray-500 text-center">
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
                    <span>₹{Number(selectedInvoice.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Tax:</span>
                    <span>₹{Number(selectedInvoice.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Shipping:</span>
                    <span>₹{Number(selectedInvoice.shipping || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span>Discount:</span>
                    <span>-₹{Math.abs(Number(selectedInvoice.discount || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold col-span-2 mt-2">
                    <span>Total:</span>
                    <span>₹{Number(selectedInvoice.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => handlePrintInvoice(selectedInvoice)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  🖨️ Print Invoice
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

      <div className="">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Order Management</h1>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b bg-white rounded-t-lg">
                <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-transparent">
                  <TabsTrigger
                    value="pending"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Pending</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Pending")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="packed"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Packed</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Packed")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shipped"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Shipped</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Shipped")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivered"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Delivered</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Delivered")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Cancelled</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Cancelled")}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="exchanged"
                    className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 md:px-4 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  >
                    <span className="text-xs md:text-sm font-medium">Exchanged</span>
                    <Badge variant="secondary" className="text-xs">
                      {getOrderCount("Exchanged")}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>              <TabsContent value="pending" className="mt-0">
                <PendingOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status.toLowerCase() === "pending" || order.status.toLowerCase() === "processing"
                  )}
                  onConfirm={(orderId) => handleStatusChange(orderId, "Packed")}
                  onCancel={(orderId) => handleStatusChange(orderId, "Cancelled")}
                  onUpdateNote={handleNoteUpdate}
                  onViewInvoice={handleViewInvoice}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>

              <TabsContent value="packed" className="mt-0">
                <PackedOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status === "Packed"
                  )}
                  onShip={(orderId) => handleStatusChange(orderId, "Shipped")}
                  onUpdateNote={handleNoteUpdate}
                  onViewInvoice={handleViewInvoice}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>

              <TabsContent value="shipped" className="mt-0">
                <ShippedOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status === "Shipped"
                  )}
                  onDeliver={(orderId) => handleStatusChange(orderId, "Delivered")}
                  onUpdateNote={handleNoteUpdate}
                  onViewInvoice={handleViewInvoice}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>

              <TabsContent value="delivered" className="mt-0">
                <DeliveredOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status === "Delivered"
                  )}
                  onExchange={(orderId) => handleStatusChange(orderId, "Exchanged")}
                  onViewInvoice={handleViewInvoice}
                  onUpdateNote={handleNoteUpdate}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>

              <TabsContent value="cancelled" className="mt-0">
                <CancelledOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status === "Cancelled"
                  )}
                  onViewInvoice={handleViewInvoice}
                  onUpdateNote={handleNoteUpdate}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>

              <TabsContent value="exchanged" className="mt-0">
                <ExchangedOrders
                  orders={(filteredOrders.length > 0 ? filteredOrders : orders).filter((order) => 
                    order.status === "Exchanged"
                  )}
                  onViewInvoice={handleViewInvoice}
                  onUpdateNote={handleNoteUpdate}
                  transitionInfo={transitionInfo}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
