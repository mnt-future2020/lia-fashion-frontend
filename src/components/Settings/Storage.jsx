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
import axios from "../../lib/axios"

const EMPTY = {
  provider: "r2",
  key: "",
  secret: "",
  region: "auto",
  bucket: "",
  endpoint: "",
  url: "",
  folder: "",
  is_active: true,
}

export default function StorageSettings() {
  const [settings, setSettings] = useState(EMPTY)
  const [settingId, setSettingId] = useState(null)
  const [activeSource, setActiveSource] = useState("env")
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await axios.get("/api/admin/storage-settings")
      if (data.status === "success") {
        setActiveSource(data.meta?.active_source ?? "env")

        const existing = data.data?.find((s) => s.is_active) ?? data.data?.[0]
        if (existing) {
          // `secret` is never returned by the API — keep it blank so a save without
          // touching it preserves the stored value.
          setSettings({ ...EMPTY, ...existing, secret: "" })
          setSettingId(existing.id)
        }
      }
    } catch (_error) {
      toast.error("Failed to load storage settings")
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
        ? `/api/admin/storage-settings/${settingId}`
        : "/api/admin/storage-settings"

      const payload = { ...settings, is_active: true }

      // Blank secret means "keep the existing one" — don't send it at all.
      if (!payload.secret) delete payload.secret

      const { data } = await axios[method](url, payload)

      if (data.status === "success") {
        toast.success(data.message || "Storage settings saved")
        if (data.data?.id) setSettingId(data.data.id)
        setSettings((prev) => ({ ...prev, secret: "" }))
        setActiveSource("database")
      }
    } catch (error) {
      const res = error.response?.data
      const firstError = res?.errors ? Object.values(res.errors)[0]?.[0] : null
      toast.error(firstError || res?.message || "Failed to save storage settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      // Send the current form values so the test validates what's typed (even before saving).
      // A blank secret tells the backend to reuse the stored one.
      const { data } = await axios.post("/api/admin/storage-settings/test", {
        provider: settings.provider || "r2",
        key: settings.key,
        secret: settings.secret,
        region: settings.region,
        bucket: settings.bucket,
        endpoint: settings.endpoint,
        url: settings.url,
        folder: settings.folder,
      })
      setTestResult(data.data)
      if (data.data?.ok) {
        toast.success("Connection successful")
      } else {
        toast.error("Connection failed")
      }
    } catch (error) {
      const message = error.response?.data?.message || "Connection test failed"
      setTestResult({ ok: false, message })
      toast.error(message)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="max-w-[95%] mx-auto">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Storage (Cloudflare R2)</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Where all new product images, banners, logos and documents are stored.
          </p>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            {activeSource === "database" ? (
              <>Uploads are using <strong>these saved credentials</strong>.</>
            ) : (
              <>
                No credentials saved yet — uploads are currently using the{" "}
                <strong>server&apos;s .env configuration</strong>. Saving here will take over.
              </>
            )}{" "}
            Images already hosted on Cloudinary keep working as-is; nothing is moved or deleted.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Access Key ID</Label>
              <Input
                id="key"
                value={settings.key || ""}
                onChange={(e) => handleChange("key", e.target.value)}
                placeholder="R2 access key id"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secret">Secret Access Key</Label>
              <div className="relative">
                <Input
                  id="secret"
                  type={showSecret ? "text" : "password"}
                  value={settings.secret || ""}
                  onChange={(e) => handleChange("secret", e.target.value)}
                  placeholder={settingId ? "Leave blank to keep current secret" : "R2 secret access key"}
                  required={!settingId}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  aria-label={showSecret ? "Hide secret" : "Show secret"}
                >
                  {showSecret ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                The stored secret is never sent back to the browser.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket</Label>
              <Input
                id="bucket"
                value={settings.bucket || ""}
                onChange={(e) => handleChange("bucket", e.target.value)}
                placeholder="lia-fashion"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={settings.region || ""}
                onChange={(e) => handleChange("region", e.target.value)}
                placeholder="auto"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="endpoint">S3 API Endpoint</Label>
              <Input
                id="endpoint"
                type="url"
                value={settings.endpoint || ""}
                onChange={(e) => handleChange("endpoint", e.target.value)}
                placeholder="https://<account-id>.r2.cloudflarestorage.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                From R2 → bucket → Settings. Do <strong>not</strong> include the bucket name at the end.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="url">Public URL</Label>
              <Input
                id="url"
                type="url"
                value={settings.url || ""}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://pub-xxxx.r2.dev  (later: https://cdn.liafashion.in)"
                required
              />
              <p className="text-xs text-muted-foreground">
                Required for R2. Enable the bucket&apos;s <strong>Public Development URL</strong> (r2.dev)
                to get this now; switch to a custom domain later without any code change.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="folder">Folder prefix</Label>
              <Input
                id="folder"
                value={settings.folder || ""}
                onChange={(e) => handleChange("folder", e.target.value)}
                placeholder="uploads (optional)"
              />
              <p className="text-xs text-muted-foreground">
                Optional. All files are stored under this path inside the bucket.
              </p>
            </div>
          </div>

          {testResult && (
            <Alert variant={testResult.ok ? "default" : "destructive"}>
              <AlertDescription className={testResult.ok ? "text-green-700" : undefined}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleTest}
              disabled={isTesting || isLoading}
            >
              {isTesting && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Test connection
            </Button>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isTesting}>
              {isLoading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              {settingId ? "Update settings" : "Save settings"}
            </Button>
          </div>
        </form>

        <p className="text-xs text-muted-foreground border-t pt-4">
          After saving, use <strong>Test connection</strong> to confirm the credentials work
          before uploading a product image. The test writes and deletes a tiny file in the bucket.
        </p>
      </CardContent>
    </Card>
  )
}
