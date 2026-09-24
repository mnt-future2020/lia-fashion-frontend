"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "react-toastify"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { ReloadIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import axios from "../../lib/axios"

const EMPTY = {
  provider: "meta",
  phone_number_id: "",
  access_token: "",
  template_name: "",
  template_language: "en_US",
  country_code: "91",
  use_otp_button: true,
  otp_channel: "email",
  is_active: true,
}

export default function WhatsAppOtpSettings() {
  const [settings, setSettings] = useState(EMPTY)
  const [settingId, setSettingId] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [testPhone, setTestPhone] = useState("")

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get("/api/admin/whatsapp-settings")
      if (data.status === "success") {
        const existing = data.data?.find((s) => s.is_active) ?? data.data?.[0]
        if (existing) {
          // `access_token` is never returned by the API — keep it blank so a save without
          // touching it preserves the stored value.
          setSettings({ ...EMPTY, ...existing, access_token: "" })
          setSettingId(existing.id)
        }
      }
    } catch (_error) {
      toast.error("Failed to load WhatsApp settings")
    }
  }

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setTestResult(null)

    try {
      const method = settingId ? "put" : "post"
      const url = settingId
        ? `/api/admin/whatsapp-settings/${settingId}`
        : "/api/admin/whatsapp-settings"

      const payload = { ...settings, is_active: true }
      // Blank token means "keep the existing one" — don't send it at all.
      if (!payload.access_token) delete payload.access_token

      const { data } = await axios[method](url, payload)

      if (data.status === "success") {
        toast.success(data.message || "WhatsApp settings saved")
        if (data.data?.id) setSettingId(data.data.id)
        setSettings((prev) => ({ ...prev, access_token: "" }))
      }
    } catch (error) {
      const res = error.response?.data
      const firstError = res?.errors ? Object.values(res.errors)[0]?.[0] : null
      toast.error(firstError || res?.message || "Failed to save WhatsApp settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    if (!testPhone) {
      toast.error("Enter a phone number to send the test OTP to")
      return
    }
    setIsTesting(true)
    setTestResult(null)

    try {
      // Send the current form values so the test validates what's typed (even before saving).
      // A blank token tells the backend to reuse the stored one.
      const { data } = await axios.post("/api/admin/whatsapp-settings/test", {
        phone_number_id: settings.phone_number_id,
        access_token: settings.access_token,
        template_name: settings.template_name,
        template_language: settings.template_language,
        country_code: settings.country_code,
        use_otp_button: settings.use_otp_button,
        test_phone: testPhone,
      })
      setTestResult(data.data)
      if (data.data?.ok) {
        toast.success("Test OTP sent")
      } else {
        toast.error("Test failed")
      }
    } catch (error) {
      const message = error.response?.data?.message || "Test failed"
      setTestResult({ ok: false, message })
      toast.error(message)
    } finally {
      setIsTesting(false)
    }
  }

  const isWhatsApp = settings.otp_channel === "whatsapp"

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">WhatsApp OTP (Meta Cloud API)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Send registration OTPs over WhatsApp instead of e-mail.
          </p>
        </div>

        {/* Channel toggle — the headline control */}
        <div className="rounded-lg border p-4 space-y-3">
          <Label className="text-base">Send OTP via</Label>
          <div className="inline-flex rounded-md border bg-white p-1">
            <button
              type="button"
              onClick={() => handleChange("otp_channel", "email")}
              className={cn(
                "px-5 py-2 rounded text-sm font-medium transition-all",
                !isWhatsApp ? "bg-[#eb1c75] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => handleChange("otp_channel", "whatsapp")}
              className={cn(
                "px-5 py-2 rounded text-sm font-medium transition-all",
                isWhatsApp ? "bg-[#25D366] text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              WhatsApp
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {isWhatsApp
              ? "OTPs will be sent through WhatsApp using the credentials below. Save & test before relying on it."
              : "OTPs are sent by e-mail (default). Switch to WhatsApp once the credentials below are saved and tested."}
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            Create an approved <strong>Authentication</strong> template in Meta WhatsApp Manager
            (its body holds the code as <code>{"{{1}}"}</code> and it has a copy-code button).
            Enter its name below. Nothing changes for users until you switch the toggle to WhatsApp.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input
                id="phone_number_id"
                value={settings.phone_number_id || ""}
                onChange={(e) => handleChange("phone_number_id", e.target.value)}
                placeholder="From Meta → WhatsApp → API Setup"
                required={isWhatsApp}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <div className="relative">
                <Input
                  id="access_token"
                  type={showToken ? "text" : "password"}
                  value={settings.access_token || ""}
                  onChange={(e) => handleChange("access_token", e.target.value)}
                  placeholder={settingId ? "Leave blank to keep current token" : "Permanent access token"}
                  required={isWhatsApp && !settingId}
                />
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showToken ? "Hide token" : "Show token"}
                >
                  {showToken ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The stored token is never sent back to the browser.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_name">Template name</Label>
              <Input
                id="template_name"
                value={settings.template_name || ""}
                onChange={(e) => handleChange("template_name", e.target.value)}
                placeholder="e.g. otp_verification"
                required={isWhatsApp}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template_language">Template language</Label>
              <Input
                id="template_language"
                value={settings.template_language || ""}
                onChange={(e) => handleChange("template_language", e.target.value)}
                placeholder="en_US"
              />
              <p className="text-xs text-muted-foreground">
                Must match the language of the approved template (e.g. <code>en_US</code>, <code>en</code>).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country_code">Default country code</Label>
              <Input
                id="country_code"
                value={settings.country_code || ""}
                onChange={(e) => handleChange("country_code", e.target.value)}
                placeholder="91"
              />
              <p className="text-xs text-muted-foreground">
                Prepended to plain 10-digit numbers (91 for India).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="block">Template type</Label>
              <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
                <input
                  type="checkbox"
                  checked={!!settings.use_otp_button}
                  onChange={(e) => handleChange("use_otp_button", e.target.checked)}
                  className="h-4 w-4"
                />
                Authentication template (has copy-code button)
              </label>
              <p className="text-xs text-muted-foreground">
                Keep on for OTP templates. Turn off only for a plain body-only template.
              </p>
            </div>
          </div>

          {/* Test row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="test_phone">Send a test OTP to</Label>
              <Input
                id="test_phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 9876543210"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleTest}
              disabled={isTesting || isLoading}
            >
              {isTesting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Send test OTP
            </Button>
          </div>

          {testResult && (
            <Alert variant={testResult.ok ? "default" : "destructive"}>
              <AlertDescription className={testResult.ok ? "text-green-700" : undefined}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isTesting}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {settingId ? "Update settings" : "Save settings"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground border-t pt-4">
          Flow: save the credentials → send a test OTP to your own number → once it arrives,
          switch the toggle to <strong>WhatsApp</strong>. The e-mail OTP stays as the fallback default.
        </p>
      </CardContent>
    </Card>
  )
}
