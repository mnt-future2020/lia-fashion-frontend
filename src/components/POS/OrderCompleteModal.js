"use client"

import { X, Printer, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState, useEffect } from "react"
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import axios from '../../lib/axios'

export default function OrderCompleteModal({ 
  orderNumber, 
  invoiceNumber, 
  cart = [], 
  subtotal = 0, 
  tax = 0, 
  total = 0, 
  paymentMethod = "Cash", 
  onClose,
  customerInfo = {} 
}) {
  const printRef = useRef(null);
  const [companyLogo, setCompanyLogo] = useState("/assets/images/logo.png"); // Default fallback

  // Fetch company logo from backend
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await axios.get('/api/company');
        if (response.data && response.data.logo) {
          setCompanyLogo(response.data.logo);
        }
      } catch (error) {
        console.error('Failed to fetch company logo:', error);
        // Keep default logo on error
      }
    };

    fetchCompanyData();
  }, []);
  
  // Get current date and time
  const now = new Date()
  const date = now.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, '/') // Format as DD/MM/YYYY
  
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  // Calculate totals if not provided
  const calculatedSubtotal = subtotal || cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const calculatedTax = tax || cart.reduce((sum, item) => {
    const itemTax = (item.product.price * item.product.taxPercentage/100) * item.quantity;
    return sum + itemTax;
  }, 0);
  const calculatedTotal = total || (calculatedSubtotal + calculatedTax);

  // Use calculated values if provided values are 0
  const finalSubtotal = subtotal || calculatedSubtotal;
  const finalTax = tax || calculatedTax;
  const finalTotal = total || calculatedTotal;

  // Handle print button click
  const handlePrint = () => {
    const WinPrint = window.open('', '', 'width=650,height=900');
    
    WinPrint.document.write(`
      <html>
        <head>
          <title>Lia Fashions Invoice</title>
          <style>
            @page {
              size: 4in 6in;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0.1in;
              width: 3.8in;
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
              margin-bottom: 8px;
              overflow: hidden;
            }
            .invoice-title {
              font-size: 18px;
              font-weight: bold;
              float: left;
            }
            .invoice-id {
              font-size: 11px;
              clear: left;
              float: left;
            }
            .details {
              clear: both;
              margin: 8px 0;
              border-collapse: collapse;
              width: 100%;
            }
            .details td {
              padding: 2px;
              font-size: 10px;
            }
            .details td:first-child {
              color: #777;
              width: 30%;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              margin-top: 8px;
            }
            .items-table th {
              background-color: #eb1c75;
              color: white;
              font-weight: normal;
              padding: 4px 2px;
              text-align: center;
            }
            .items-table th:first-child {
              text-align: left;
              width: 40%;
            }
            .items-table th:last-child {
              text-align: right;
            }
            .items-table td {
              padding: 3px 2px;
              text-align: center;
              border-bottom: 1px dotted #ddd;
            }
            .items-table td:first-child {
              text-align: left;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 120px;
            }
            .items-table td:last-child {
              text-align: right;
            }
            .items-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .tax-percent {
              font-size: 8px;
              color: #777;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            .summary-table td {
              padding: 2px;
              font-size: 10px;
            }
            .summary-table td:first-child {
              text-align: right;
              width: 75%;
            }
            .summary-table td:last-child {
              text-align: right;
              width: 25%;
            }
            .summary-table tr.total {
              font-weight: bold;
            }
            .payment {
              margin: 8px 0;
              font-size: 11px;
            }
            .payment-label {
              font-weight: bold;
            }
            .footer {
              margin-top: 16px;
              text-align: center;
              border-top: 1px solid #ddd;
              padding-top: 8px;
            }
            .footer-thanks {
              font-weight: 500;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .footer-company {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .footer-contact, .footer-address {
              font-size: 9px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <img 
              src="${companyLogo}" 
              alt="Lia Fashions" 
              class="logo"
              onerror="this.onerror=null; this.src='https://placehold.co/100x100/eb1c75/white?text=Lia';"
            />
            <div class="invoice-title">Invoice</div>
            <div class="invoice-id">ID: ${invoiceNumber}</div>
          </div>
          
          <!-- Details -->
          <table class="details">
            <tr>
              <td>Invoice No:</td>
              <td>${invoiceNumber}</td>
              <td>Order Id:</td>
              <td>${orderNumber}</td>
            </tr>
            <tr>
              <td>Date:</td>
              <td>${date}</td>
              <td>Time:</td>
              <td>${time}</td>
            </tr>
            <tr>
              <td>Customer:</td>
              <td colspan="3">${customerInfo?.name || 'Walk-in Customer'}</td>
            </tr>
            <tr>
              <td>Phone:</td>
              <td>${customerInfo?.phone || customerInfo?.mobile_no || customerInfo?.mobile || customerInfo?.phoneNumber || '-'}</td>
            </tr>
          </table>
          
          <!-- Items Table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST</th>
                <th>Amt</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map((item, index) => {
                const itemTax = (item.product.price * item.product.taxPercentage/100) * item.quantity;
                const itemTotal = (item.product.price * item.quantity) + itemTax;
                
                return `
                  <tr>
                    <td title="${item.product.name}">${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.product.price.toFixed(0)}<span class="tax-percent">(${item.product.taxPercentage}%)</span></td>
                    <td>₹${itemTax.toFixed(0)}</td>
                    <td>₹${itemTotal.toFixed(0)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <!-- Summary -->
          <table class="summary-table">
            <tr>
              <td>Sub Total</td>
              <td>₹${finalSubtotal.toFixed(0)}</td>
            </tr>
            <tr>
              <td>Total Tax</td>
              <td>₹${finalTax.toFixed(0)}</td>
            </tr>
            <tr class="total">
              <td>Total(₹)</td>
              <td>₹${finalTotal.toFixed(0)}</td>
            </tr>
          </table>
          
          <!-- Payment Method -->
          <div class="payment">
            <span class="payment-label">Payment Method:</span>
            <span>${paymentMethod}</span>
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
    
    WinPrint.document.close();
    WinPrint.focus();
    setTimeout(() => {
      WinPrint.print();
      setTimeout(() => {
        WinPrint.close();
      }, 1000);
    }, 500);
  }

  // Handle download receipt
  const handleDownload = () => {
    try {
      // Create a new window for generating the PDF-optimized invoice
      const printWindow = window.open('', '', 'width=800,height=800');
      
      if (!printWindow) {
        alert("Please allow popups to download the invoice as PDF.");
        return;
      }
      
      // Create a PDF-optimized version of the invoice with improved table structure
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
                height: 60px;
                width: 60px;
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
              .tax-percent {
                font-size: 10px;
                color: #777;
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
            </style>
          </head>
          <body>
            <!-- Header -->
            <div class="header">
              <img 
                src="${companyLogo}" 
                alt="Lia Fashions" 
                class="logo"
                onerror="this.onerror=null; this.src='https://placehold.co/100x100/eb1c75/white?text=Lia';"
              />
              <div class="invoice-title">Invoice</div>
              <div class="invoice-id">ID: ${invoiceNumber}</div>
            </div>
            
            <!-- Details -->
            <table class="details">
              <tr>
                <td>Invoice No:</td>
                <td>${invoiceNumber}</td>
                <td>Order Id:</td>
                <td>${orderNumber}</td>
              </tr>
              <tr>
                <td>Date:</td>
                <td>${date}</td>
                <td>Time:</td>
                <td>${time}</td>
              </tr>
              <tr>
                <td>Customer:</td>
                <td colspan="3">${customerInfo?.name || 'Walk-in Customer'}</td>
              </tr>
              <tr>
                <td>Phone:</td>
                <td>${customerInfo?.phone || customerInfo?.mobile_no || customerInfo?.mobile || customerInfo?.phoneNumber || '-'}</td>
                <td>Address:</td>
                <td>Pondicherry</td>
              </tr>
            </table>
            
            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>GST</th>
                  <th>Amt</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map((item, index) => {
                  const itemTax = (item.product.price * item.product.taxPercentage/100) * item.quantity;
                  const itemTotal = (item.product.price * item.quantity) + itemTax;
                  
                  return `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.product.price.toFixed(0)}<span class="tax-percent">(${item.product.taxPercentage}%)</span></td>
                      <td>₹${itemTax.toFixed(0)}</td>
                      <td>₹${itemTotal.toFixed(0)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            
            <!-- Summary -->
            <table class="summary-table">
              <tr>
                <td>Sub Total</td>
                <td>₹${finalSubtotal.toFixed(0)}</td>
              </tr>
              <tr>
                <td>Total Tax</td>
                <td>₹${finalTax.toFixed(0)}</td>
              </tr>
              <tr class="total">
                <td>Total(₹)</td>
                <td>₹${finalTotal.toFixed(0)}</td>
              </tr>
            </table>
            
            <!-- Payment Method -->
            <div class="payment">
              <span class="payment-label">Payment Method:</span>
              <span>${paymentMethod}</span>
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
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          // Calculate image dimensions to fit on page
          const imgWidth = pageWidth - 20; // 10mm margins on each side
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          // Add the image to the PDF
          pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
          
          // Save the PDF
          pdf.save(`LIA_Invoice-${invoiceNumber}.pdf`);
          
          // Close the window
          printWindow.close();
        }).catch(err => {
          // console.error("Error generating PDF:", err);
          alert("Failed to download invoice as PDF. Please try again.");
          printWindow.close();
        });
      }, 1000); // Wait 1 second for content to load
      
    } catch (error) {
      // console.error("Error creating PDF download:", error);
      alert("Failed to download invoice as PDF. Please try again.");
    }
  }

  // Handle share receipt
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `LIA Invoice ${invoiceNumber}`,
        text: `Your invoice ${invoiceNumber} from Lia Fashions`,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      alert("Sharing functionality is not available on your device.");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xl relative max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>

        {/* The Invoice UI based on the provided design - Now 4x6 inches */}
        <div className="p-6">
          <div 
            ref={printRef} 
            className="border rounded-lg overflow-hidden shadow-md mx-auto"
            style={{ width: "4in", maxWidth: "100%", minHeight: "6in" }}
          >
            {/* Header with Logo and Invoice Title */}
            <div className="flex justify-between items-center p-2 border-b">
              <div className="flex flex-col">
                <div className="text-2xl font-bold text-gray-700">Invoice</div>
                <div className="text-sm">
                  <span className="text-gray-500">Invoice ID: </span>
                  <span className="text-[#eb1c75] font-medium">{invoiceNumber}</span>
                </div>
              </div>
              <div className="flex items-center">
                <img 
                  src={companyLogo} 
                  alt="Lia Fashions" 
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#eb1c75]/20"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/100x100/eb1c75/white?text=Lia";
                  }}
                />
              </div>
            </div>

            {/* Invoice Details and Customer Info - Now more compact */}
            <div className="p-2 bg-white text-xs">
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                <div className="text-gray-500">Invoice No:</div>
                <div className="font-normal">{invoiceNumber}</div>
                
                <div className="text-gray-500">Order Id:</div>
                <div className="font-normal">{orderNumber}</div>
                
                <div className="text-gray-500">Date:</div>
                <div className="font-normal">{date}</div>
                
                <div className="text-gray-500">Time:</div>
                <div className="font-normal">{time}</div>
                
                <div className="text-gray-500">Customer:</div>
                <div className="font-normal">{customerInfo?.name || 'Walk-in Customer'}</div>
                
                <div className="text-gray-500">Phone:</div>
                <div className="font-normal">{customerInfo?.phone || customerInfo?.mobile_no || customerInfo?.mobile || customerInfo?.phoneNumber || '-'}</div>
                
            
              </div>
            </div>

            {/* Product Table - Now more compact */}
            <div className="px-2 py-1">
              <div className="rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-1 bg-[#eb1c75] text-white text-xs p-1 rounded-t-lg">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center px-1">Rate</div>
                  <div className="col-span-1 text-center px-4">GST</div>
                  <div className="col-span-3 text-right pl-1">Amt</div>
                </div>

                {/* Table Body */}
                <div className="bg-white border-x border-b rounded-b-lg text-xs">
                  {cart.map((item, index) => {
                    const itemTax = (item.product.price * item.product.taxPercentage/100) * item.quantity;
                    const itemTotal = (item.product.price * item.quantity) + itemTax;
                    
                    return (
                      <div key={index} className={`grid grid-cols-12 gap-1 p-1 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="col-span-4 truncate">{item.product.name}</div>
                        <div className="col-span-2 text-center">{item.quantity}</div>
                        <div className="col-span-2 text-center">
                          ₹{item.product.price.toFixed(0)}
                          <span className="text-[9px] text-gray-500 ml-0.5">({item.product.taxPercentage}%)</span>
                        </div>
                        <div className="col-span-1 text-center px-3">₹{itemTax.toFixed(0)}</div>
                        <div className="col-span-3 text-right">₹{itemTotal.toFixed(0)}</div>
                      </div>
                    );
                  })}

                  {/* Summary Rows */}
                  <div className="grid grid-cols-12 gap-1 p-1 border-t text-[11px]">
                    <div className="col-span-9 text-right font-medium">Sub Total</div>
                    <div className="col-span-3 text-right">₹{finalSubtotal.toFixed(0)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1 p-1 text-[11px]">
                    <div className="col-span-9 text-right font-medium">Total Tax</div>
                    <div className="col-span-3 text-right">₹{finalTax.toFixed(0)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-1 p-1 font-bold text-[11px]">
                    <div className="col-span-9 text-right">Total(₹)</div>
                    <div className="col-span-3 text-right">₹{finalTotal.toFixed(0)}</div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-2 text-xs">
                <div className="font-medium">Payment Method: {paymentMethod}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-2 text-center border-t mt-auto">
              <div className="font-medium text-gray-700 text-xs mb-1">Thank you, Please Come again</div>
              <div className="font-bold text-sm text-gray-800">Lia Fashions</div>
              <div className="text-[10px] text-gray-600 mt-1">
                www.liafashion.in | +91 9384109680
              </div>
              <div className="text-[10px] text-gray-600">
                56, Kurinji st, Bharathi Nagar, Ariankuppan
              </div>
              <div className="text-[10px] text-gray-600">
                Pondicherry 605007
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Button 
              onClick={handlePrint} 
              className="bg-[#eb1c75] hover:bg-[#d1007d] text-white"
            >
              <Printer size={16} className="mr-2" />
              Print Invoice
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
            {/* <Button variant="outline" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              Share
            </Button> */}
          </div>
        </div>
      </div>
    </div>
  )
}