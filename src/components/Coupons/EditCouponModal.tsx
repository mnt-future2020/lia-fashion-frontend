'use client';
import { useState, useEffect } from 'react';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import axios from '../../lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type DiscountType = 'amount' | 'percentage';

interface Coupon {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discount_value: number;
  discount_type: 'amount' | 'percentage';
  min_order_value: number;
  min_purchase_limit: number;
  usage_count: number;
  max_usage: number;
  is_active: boolean;
}

interface FormData {
  code: string;
  name: string;
  description: string;
  discount_value: string;
  discount_type: 'amount' | 'percentage';
  min_order_value: string;
  min_purchase_limit: string;
  max_usage: string;
  is_active: boolean;
}

interface EditCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupon: Coupon | null;
  onUpdate: (coupon: Coupon) => void;
}

export default function EditCouponModal({ isOpen, onClose, coupon, onUpdate }: EditCouponModalProps) {
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    discount_value: '',
    discount_type: 'amount',
    min_order_value: '',
    min_purchase_limit: '',
    max_usage: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coupon) {
      const description = coupon.description !== null ? coupon.description : '';
      
      setFormData({
        ...coupon,
        description,
        discount_value: coupon.discount_value.toString(),
        min_order_value: coupon.min_order_value.toString(),
        min_purchase_limit: coupon.min_purchase_limit.toString(),
        max_usage: (coupon.max_usage ?? 1).toString(),
      });
    }
  }, [coupon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value),
        min_purchase_limit: Number(formData.min_purchase_limit),
        max_usage: Number(formData.max_usage)
      };

      const response = await axios.put<Coupon>(`/api/admin/coupons/${coupon?.id}`, payload);
      
      onUpdate(response.data);
      toast.success('Coupon updated successfully');
      onClose();
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to update coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-3xl"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
          <p 
            id="dialog-description" 
            className="text-sm text-muted-foreground"
          >
            Make changes to your coupon here. Click save when you&#39;re done.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-medium text-lg">Coupon Information</h3>
            <p className="text-sm text-muted-foreground">Update coupon details below</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input 
                id="couponCode" 
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponName">Coupon Name</Label>
              <Input 
                id="couponName" 
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="discountValue">Discount Value</Label>
              <div className="flex space-x-2">
                <Input 
                  id="discountValue" 
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                  required
                />
                <Select 
                  value={formData.discount_type}
                  onValueChange={(value: DiscountType) => setFormData(prev => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Enter coupon description"
                value={formData.description || ''}  // Handle null/undefined
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  description: e.target.value 
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Minimum Order Value</Label>
              <Input 
                id="minOrderValue" 
                type="number"
                value={formData.min_order_value}
                onChange={(e) => setFormData(prev => ({ ...prev, min_order_value: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPurchaseLimit">Maximum Discount Amount</Label>
              <Input 
                id="minPurchaseLimit" 
                type="number"
                value={formData.min_purchase_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, min_purchase_limit: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxUsage">Maximum Usage Limit</Label>
              <Input 
                id="maxUsage" 
                type="number"
                value={formData.max_usage}
                onChange={(e) => setFormData(prev => ({ ...prev, max_usage: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-pink-500 hover:bg-pink-600" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Coupon'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
