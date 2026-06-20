'use client';
import { useState, useEffect } from 'react';
import axios from '../../lib/axios' 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import { toast } from "react-toastify";

export default function Cloudinary() {
    const [formData, setFormData] = useState({
        cloudinary_cloud_name: '',
        cloudinary_api_key: '',
        cloudinary_api_secret: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get('/api/admin/settings');
            const settings = response.data.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
            setFormData(settings);
        } catch (err) {
            setError('Failed to fetch settings');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('/api/admin/settings', formData);
            toast.success("Settings updated successfully!", {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to update settings';
            setError(errorMessage);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        fetchSettings();
    };

    return (
        <Card className="max-w-[95%] mx-auto">
            <CardContent className="space-y-8 p-6">
                <h2 className="text-xl sm:text-2xl font-bold">Cloudinary Settings</h2>

                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert>
                        <AlertDescription className="text-green-600">{success}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="cloudName">Cloud Name</Label>
                            <Input
                                id="cloudName"
                                type="text"
                                placeholder="Cloud Name"
                                value={formData.cloudinary_cloud_name || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, cloudinary_cloud_name: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="text"
                                placeholder="API Key"
                                value={formData.cloudinary_api_key || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, cloudinary_api_key: e.target.value }))}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="apiSecret">API Secret</Label>
                            <Input
                                id="apiSecret"
                                type="password"
                                placeholder="API Secret"
                                value={formData.cloudinary_api_secret || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, cloudinary_api_secret: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
                        <Button 
                            type="button"
                            variant="outline" 
                            className="w-full sm:w-auto"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                        <Button 
                            type="submit" 
                            className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
