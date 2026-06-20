"use client"
import { useState } from "react"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import axios from '../../lib/axios';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateCoupon() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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

      await axios.post('/api/admin/coupons', payload);
      
      toast.success('Coupon created successfully!', {
        position: "top-right",
        autoClose: 2000,
        onClose: () => router.push('/admin/dashboard/coupons')
      });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (key: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Create Coupon</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-medium text-lg">Coupon Information</h3>
            <p className="text-sm text-muted-foreground">Code will be used by users in checkout</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code</Label>
              <Input 
                id="couponCode" 
                placeholder="SAVE20" 
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="couponName">Coupon Name</Label>
              <Input 
                id="couponName" 
                placeholder="20% Off" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
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
                  placeholder="Amount/Percentage" 
                  value={formData.discount_value}
                  onChange={(e) => handleInputChange('discount_value', e.target.value)}
                  required
                />
                <Select 
                  value={formData.discount_type}
                  onValueChange={(value) => handleInputChange('discount_type', value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
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
                placeholder="Coupon description" 
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minOrderValue">Minimum Order Value</Label>
              <Input 
                id="minOrderValue" 
                type="number"
                placeholder="Min order amount" 
                value={formData.min_order_value}
                onChange={(e) => handleInputChange('min_order_value', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPurchaseLimit">Maximum Discount Amount</Label>
              <Input 
                id="minPurchaseLimit" 
                type="number"
                placeholder="Max discount amount" 
                value={formData.min_purchase_limit}
                onChange={(e) => handleInputChange('min_purchase_limit', e.target.value)}
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
                placeholder="Maximum times coupon can be used" 
                value={formData.max_usage}
                onChange={(e) => handleInputChange('max_usage', e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end space-x-2 bg-gray-50 rounded-b-lg">
          <Button 
            variant="outline" 
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-pink-500 hover:bg-pink-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Coupon'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
