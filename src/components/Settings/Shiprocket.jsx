'use client';

import { useState, useEffect } from 'react';
import axios from '../../lib/axios' 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ReloadIcon } from "@radix-ui/react-icons";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "react-toastify";

export default function Shiprocket() {  const [settings, setSettings] = useState({
    email: '',
    password: '',
    is_active: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settingId, setSettingId] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/shiprocket-settings');
      if (response.data.status === 'success') {
        if (response.data.data) {
          setSettings(response.data.data);
          setSettingId(response.data.data.id);
        } else {
          setSettings({
            email: '',
            password: '',
            is_active: false
          });
          setSettingId(null);
        }
      }
    } catch (error) {
      // console.error('Error fetching Shiprocket settings:', error);
      toast.error('Failed to load Shiprocket settings');
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
        ? `/api/admin/shiprocket-settings/${settingId}`
        : '/api/admin/shiprocket-settings';      const response = await axios[method](url, settings);

      if (response.data.status === 'success') {
        toast.success('Shiprocket settings saved successfully');
        if (!settingId) {
          setSettingId(response.data.data.id);
        }
        setSettings(response.data.data);
      }
    } catch (error) {
      // console.error('Error saving Shiprocket settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save Shiprocket settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl sm:text-2xl font-bold">Shiprocket Settings</h2>
          <div className="flex items-center gap-2">
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
              settings.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {settings.is_active ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter Shiprocket email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={settings.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter Shiprocket password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={settings.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Enable Shiprocket Integration</Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={fetchSettings}
            >
              Reset
            </Button>
            <Button
              type="submit"
              className="bg-[#eb1c75] hover:bg-[#d1007d] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
