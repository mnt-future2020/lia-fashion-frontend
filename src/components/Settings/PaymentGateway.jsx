"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "react-toastify"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import axios from '../../lib/axios' 

export default function PaymentGatewaySettings() {
  const [settings, setSettings] = useState({
    gateway_name: "razorpay",
    key_id: "",
    key_secret: "",
    additional_settings: {}
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [settingId, setSettingId] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/payment-gateway-settings');
      if (response.data.status === 'success' && response.data.data.length > 0) {
        const razorpaySettings = response.data.data.find(s => s.gateway_name === 'razorpay');
        if (razorpaySettings) {
          setSettings(razorpaySettings);
          setSettingId(razorpaySettings.id);
        }
      }
    } catch (_error) {
      toast.error('Failed to load payment gateway settings');
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = settingId ? 'put' : 'post';
      const url = settingId
        ? `/api/admin/payment-gateway-settings/${settingId}`
        : '/api/admin/payment-gateway-settings';

      // Always send is_active as true and sandbox as true for test keys
      const dataToSend = {
        ...settings,
        is_active: true,
        is_sandbox: settings.key_id.startsWith('rzp_test_'),
        additional_settings: JSON.stringify(settings.additional_settings || {})
      };

      const response = await axios[method](url, dataToSend);

      if (response.data.status === 'success') {
        toast.success('Payment gateway settings saved successfully');
        if (!settingId) {
          setSettingId(response.data.data.id);
        }
      }
    } catch (error) {
      // console.error('Error saving payment gateway settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save payment gateway settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Razorpay Settings</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key_id">API Key ID</Label>
              <Input
                id="key_id"
                type="text"
                value={settings.key_id}
                onChange={(e) => handleChange('key_id', e.target.value)}
                placeholder="Enter Razorpay Key ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key_secret">API Key Secret</Label>
              <div className="relative">
                <Input
                  id="key_secret"
                  type={showSecret ? "text" : "password"}
                  value={settings.key_secret}
                  onChange={(e) => handleChange('key_secret', e.target.value)}
                  placeholder="Enter Razorpay Key Secret"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_secret">Webhook Secret</Label>
              <div className="relative">
                <Input
                  id="webhook_secret"
                  type={showSecret ? "text" : "password"}
                  value={settings.webhook_secret || ''}
                  onChange={(e) => handleChange('webhook_secret', e.target.value)}
                  placeholder="Enter Razorpay Webhook Secret"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showSecret ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
              <p className="text-sm text-gray-500">Required for webhook functionality. Get this from your Razorpay Dashboard.</p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              className="bg-[#eb1c75] hover:bg-pink-700"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : (settingId ? "Update Settings" : "Save Settings")}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Keep your API keys secure and never share them publicly</li>
            <li>Use test mode keys (starting with rzp_test_) for testing</li>
            <li>Use live mode keys (starting with rzp_live_) for production</li>
            <li>To set up webhooks:
              <ol className="list-decimal list-inside ml-4 mt-1 space-y-1">
                <li>Go to Razorpay Dashboard → Settings → Webhooks</li>
                <li>Add webhook URL: <code className="bg-gray-100 px-2 py-0.5 rounded">{`${window.location.origin}/api/razorpay/webhook`}</code></li>
                <li>Enable at least the &quot;payment.captured&quot; event</li>
                <li>Copy the webhook secret and paste it in the field above</li>
              </ol>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}