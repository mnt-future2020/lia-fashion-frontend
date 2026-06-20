// Shared cart summary calculation for offers, bulk discounts, GST, etc.
// Usage: import { calculateCartSummary } from "@/utils/cartSummary";

export function calculateCartSummary(cartData, offers) {
  if (!cartData?.items?.length) {
    return {
      originalSubtotal: 0,
      subtotal: 0,
      gstDetails: [],
      totalGst: 0,
      total: 0,
      bulkDiscounts: [],
      totalBulkDiscount: 0,
      offerDiscounts: [],
      totalOfferDiscount: 0
    };
  }

  // 1. Group items by subcategory and sum their quantities
  const subcategoryQuantityMap = {};
  cartData.items.forEach(item => {
    const subcategoryId = item.product?.subcategory_id || item.product?.subcategory?.id;
    if (!subcategoryId) return;
    if (!subcategoryQuantityMap[subcategoryId]) {
      subcategoryQuantityMap[subcategoryId] = 0;
    }
    subcategoryQuantityMap[subcategoryId] += item.quantity;
  });

  // 2. Find the BEST offer for each subcategory (highest discount that quantity qualifies for)
  const subcategoryOfferMap = {};
  Object.keys(subcategoryQuantityMap).forEach(subcategoryId => {
    const totalQty = subcategoryQuantityMap[subcategoryId];
    
    // Find all applicable offers for this subcategory
    const applicableOffers = offers.filter(offer => {
      return String(offer.subcategory_id) === subcategoryId && 
             totalQty >= parseInt(offer.items_count);
    });
    
    // If there are applicable offers, choose the one with highest discount
    if (applicableOffers.length > 0) {
      const bestOffer = applicableOffers.reduce((best, current) => {
        const currentDiscount = parseFloat(current.discount_amount);
        const bestDiscount = parseFloat(best.discount_amount);
        return currentDiscount > bestDiscount ? current : best;
      });
      subcategoryOfferMap[subcategoryId] = bestOffer;
    }
  });

  let offerDiscounts = [];
  let totalOfferDiscount = 0;

  const summary = cartData.items.reduce((acc, item) => {
    const originalPrice = parseFloat(item.unit_price);
    let currentPrice = originalPrice;
    const quantity = item.quantity;
    const subcategoryId = item.product?.subcategory_id || item.product?.subcategory?.id;
    const subcategoryIdStr = String(subcategoryId);

    // Calculate original subtotal before any discounts
    const originalSubtotal = originalPrice * quantity;

    // Check if this subcategory has an offer applied
    let offer = subcategoryOfferMap[subcategoryIdStr];

    let offerDiscount = 0;
    if (offer) {
      offerDiscount = parseFloat(offer.discount_amount) * quantity;
      currentPrice = Math.max(0, currentPrice - parseFloat(offer.discount_amount));
      offerDiscounts.push({
        productName: item.product_name,
        savedAmount: offerDiscount,
        quantity: quantity,
        discountPerItem: offer.discount_amount,
        offerId: offer.id
      });
      totalOfferDiscount += offerDiscount;
    }

    const subtotal = currentPrice * quantity;
    const taxPercentage = parseFloat(item.product?.tax_percentage) || 0;
    const gstAmount = (subtotal * taxPercentage) / 100;

    // Calculate bulk discount if applicable
    if (item.has_bulk_discount && quantity >= item.min_quantity_for_discount) {
      const discountPerItem = parseFloat(item.bulk_discount_amount) || 0;
      const totalDiscount = discountPerItem * quantity;
      acc.bulkDiscounts.push({
        productName: item.product_name,
        savedAmount: totalDiscount,
        quantity: quantity,
        discountPerItem: discountPerItem
      });
      acc.totalBulkDiscount += totalDiscount;
    }

    // Add GST details
    if (taxPercentage > 0) {
      acc.gstDetails.push({
        productName: item.product_name,
        taxPercentage: taxPercentage,
        gstAmount: gstAmount
      });
    }

    return {
      originalSubtotal: acc.originalSubtotal + originalSubtotal,
      subtotal: acc.subtotal + subtotal,
      gstDetails: acc.gstDetails,
      bulkDiscounts: acc.bulkDiscounts,
      totalBulkDiscount: acc.totalBulkDiscount,
      totalGst: acc.totalGst + gstAmount,
      total: acc.total + subtotal,
      offerDiscounts: offerDiscounts,
      totalOfferDiscount: totalOfferDiscount
    };
  }, {
    originalSubtotal: 0,
    subtotal: 0,
    gstDetails: [],
    bulkDiscounts: [],
    totalBulkDiscount: 0,
    totalGst: 0,
    total: 0,
    offerDiscounts: [],
    totalOfferDiscount: 0
  });

  return {
    originalSubtotal: Number(summary.originalSubtotal.toFixed(2)),
    subtotal: Number(summary.subtotal.toFixed(2)),
    gstDetails: summary.gstDetails,
    bulkDiscounts: summary.bulkDiscounts,
    totalBulkDiscount: Number(summary.totalBulkDiscount.toFixed(2)),
    totalGst: Number(summary.totalGst.toFixed(2)),
    total: Number((summary.total + summary.totalGst).toFixed(2)),
    offerDiscounts: offerDiscounts,
    totalOfferDiscount: Number(totalOfferDiscount.toFixed(2))
  };
}
