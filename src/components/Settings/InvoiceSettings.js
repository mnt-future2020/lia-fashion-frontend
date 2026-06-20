"use client";

import { useState, useEffect } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import axios from '../../lib/axios' 

export default function InvoiceSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [invoiceFormat, setInvoiceFormat] = useState("KAN");
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState("");
  const [sampleInvoice, setSampleInvoice] = useState("");
  const [nextSequenceNumber, setNextSequenceNumber] = useState(1);
  const [activeSetting, setActiveSetting] = useState(null);

  // Fetch active invoice setting
  const fetchActiveSetting = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/admin/invoice-settings/active');
      
      const setting = response.data.data;
      setActiveSetting(setting);
      
      if (setting) {
        setInvoiceFormat(setting.prefix);
        setLastInvoiceNumber(setting.last_invoice_number || "Not generated yet");
        
        // If there's a last sequence number, use it + 1, otherwise start from 1
        const nextSeq = setting.last_sequence_number ? setting.last_sequence_number + 1 : 1;
        setNextSequenceNumber(nextSeq);
        
        setStartDate(new Date(setting.financial_year_start));
        setEndDate(new Date(setting.financial_year_end));
        
        // Update sample invoice based on financial year and sequence
        updateSampleInvoice(
          setting.prefix,
          new Date(setting.financial_year_start),
          new Date(setting.financial_year_end),
          nextSeq
        );
      } else {
        // Set defaults if no active setting exists
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const aprilOfCurrentYear = new Date(currentYear, 3, 1);
        
        const fyStartYear = currentDate < aprilOfCurrentYear ? currentYear - 1 : currentYear;
        const fyEndYear = fyStartYear + 1;
        
        const fyStart = new Date(fyStartYear, 3, 1);
        const fyEnd = new Date(fyEndYear, 2, 31);
        
        setStartDate(fyStart);
        setEndDate(fyEnd);
        setNextSequenceNumber(1);
        updateSampleInvoice(invoiceFormat, fyStart, fyEnd, 1);
      }
    } catch (error) {
      // console.error("Failed to fetch active invoice setting", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate sample invoice number
  const updateSampleInvoice = (prefix, fyStart, fyEnd, sequence) => {
    if (!prefix || !fyStart || !fyEnd) return;
    
    const startYear = fyStart.getFullYear().toString().slice(-2);
    const endYear = fyEnd.getFullYear().toString().slice(-2);
    setSampleInvoice(prefix + startYear + endYear + String(sequence).padStart(4, '0'));
  };

  // Fetch active invoice setting on component mount
  useEffect(() => {
    fetchActiveSetting();
  }, []);

  // Update sample invoice when format or dates change
  useEffect(() => {
    if (invoiceFormat && startDate && endDate) {
      updateSampleInvoice(invoiceFormat, startDate, endDate, nextSequenceNumber);
    } else if (invoiceFormat) {
      // Default to current financial year if dates not set
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const aprilOfCurrentYear = new Date(currentYear, 3, 1); // April is month 3 (0-indexed)
      
      const fyStartYear = currentDate < aprilOfCurrentYear ? currentYear - 1 : currentYear;
      const fyEndYear = fyStartYear + 1;
      
      const fyStart = new Date(fyStartYear, 3, 1);
      const fyEnd = new Date(fyEndYear, 2, 31); // March 31 is month 2, day 31
      
      updateSampleInvoice(invoiceFormat, fyStart, fyEnd, nextSequenceNumber);
    }
  }, [invoiceFormat, startDate, endDate, nextSequenceNumber]);

  // Save invoice settings
  const handleSaveSettings = async () => {
    try {
      setIsLoading(true);
      
      // For new settings or reset, initialize last_sequence_number to 0
      // Otherwise use nextSequenceNumber - 1 which is the current last used sequence
      const lastSequence = activeSetting ? nextSequenceNumber - 1 : 0;
      
      const settingData = {
        prefix: invoiceFormat,
        financial_year_start: startDate ? format(startDate, 'yyyy-MM-dd') : format(new Date(2024, 3, 1), 'yyyy-MM-dd'),
        financial_year_end: endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(2025, 2, 31), 'yyyy-MM-dd'),
        last_sequence_number: lastSequence,
        is_active: true
      };
      
      if (activeSetting) {
        // Update existing setting
        await axios.put(`/api/admin/invoice-settings/${activeSetting.id}`, settingData);
      } else {
        // Create new setting
        await axios.post('/api/admin/invoice-settings', settingData);
      }
      
      // Fetch updated settings
      fetchActiveSetting();
      
      if (typeof window !== 'undefined' && window.toast) {
        window.toast.success("Invoice settings saved successfully!");
      } else {
        // fallback for environments where toast is not global
        try {
          const { toast } = await import("react-toastify");
          toast.success("Invoice settings saved successfully!");
        } catch {}
      }
    } catch (error) {
      // console.error("Failed to save invoice settings", error);
      alert("Failed to save invoice settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setInvoiceFormat("KAN");
    setNextSequenceNumber(1);
    setLastInvoiceNumber("Not generated yet");
    
    // Set default financial year (Apr 2024 - Mar 2025)
    setStartDate(new Date(2024, 3, 1)); // April 1, 2024
    setEndDate(new Date(2025, 2, 31)); // March 31, 2025
    
    updateSampleInvoice("KAN", new Date(2024, 3, 1), new Date(2025, 2, 31), 1);
  };

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-8 p-6">
        <h2 className="text-xl sm:text-2xl font-bold">Invoice Settings</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <span className="ml-2">Loading settings...</span>
          </div>
        ) : (
          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date Picker */}
              <div className="space-y-2">
                <Label>Financial Year</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM/yyyy") : "Apr/2024"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date Picker */}
              <div className="space-y-2">
                <Label className="invisible">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM/yyyy") : "Mar/2025"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Invoice Number Format */}
            <div className="space-y-2">
              <Label htmlFor="invoiceFormat">Invoice Number Format</Label>
              <Input 
                id="invoiceFormat"
                placeholder="KAN" 
                value={invoiceFormat}
                onChange={(e) => setInvoiceFormat(e.target.value)}
                maxLength={10}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastInvoice">Last Generated Invoice</Label>
                <Input 
                  id="lastInvoice"
                  value={lastInvoiceNumber || "Not generated yet"}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextSequence">Next Sequence Number</Label>
                <Input 
                  id="nextSequence"
                  value={String(nextSequenceNumber).padStart(4, '0')}
                  readOnly
                  className="bg-blue-50"
                />
              </div>
            </div>

            <div className="border border-pink-200 rounded-md p-4 bg-pink-50 relative">
              <Label htmlFor="sampleInvoice" className="mb-2 block">Sample Invoice Number</Label>
              <Input 
                id="sampleInvoice"
                value={sampleInvoice}
                className="bg-white"
                readOnly
              />
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <p className="text-xs">Format: PREFIX + YY + YY + NNNN</p>
                <p className="text-xs">Example: KAN2425 + 0001 (sequence number)</p>
                <p className="text-xs">Maximum Prefix Length: 10 characters</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button 
                className="w-full sm:w-auto bg-[#eb1c75] text-white hover:bg-[#d1007d]"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}