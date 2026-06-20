"use client"

// React and Next.js imports
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// Third-party libraries
import axios from "../../../lib/axios"
import { toast } from "react-toastify"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Mail, KeyRound, ArrowRight, Eye, EyeOff, AlertCircle, Crown, Sparkles } from "lucide-react"

// Local imports
import { setAuthToken } from "@/lib/auth"
import { useAuth } from "@/contexts/AuthContext"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isAuthenticated, isLoading, updateAuth } = useAuth()
  const router = useRouter()

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/admin/dashboard")
    }
  }, [isAuthenticated, router])

  const onSubmit = async (values) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await axios.post("/api/admin/login", {
        email: values.email,
        password: values.password,
      })

      setAuthToken(response.data.token)
      updateAuth({ isAuthenticated: true })

      toast.success("Login successful", {
        position: "top-right",
        autoClose: 1500,
        onClose: () => setTimeout(() => router.replace("/admin/dashboard"), 500),
      })
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid email or password. Please try again.")
      toast.error(err.response?.data?.message || "Login failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 p-8 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-pink-100 border-t-[rgb(219,39,119)] rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-300"></div>
            <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-b-pink-300 rounded-full animate-spin animation-delay-700"></div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-[rgb(219,39,119)] to-purple-500 bg-clip-text text-transparent">
              Loading Admin Portal
            </h3>
            <p className="text-gray-600">Preparing your boutique dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-200/20 to-purple-200/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-[rgb(219,39,119)]/10 to-pink-200/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-100/10 to-purple-100/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-4 h-4 bg-[rgb(219,39,119)]/20 rounded-full animate-bounce"></div>
        <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400/30 rounded-full animate-bounce animation-delay-500"></div>
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-pink-400/40 rounded-full animate-bounce animation-delay-1000"></div>
        <div className="absolute bottom-10 right-10 w-5 h-5 bg-rose-400/25 rounded-full animate-bounce animation-delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-purple-100 rounded-full mb-6 backdrop-blur-sm border border-white/30 hover:shadow-md transition-all duration-300">
              <div className="p-1 bg-[rgb(219,39,119)] rounded-full">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-[rgb(219,39,119)]">Lia Fashins Admin</span>
              <Sparkles className="w-4 h-4 text-[rgb(219,39,119)]" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(219,39,119)] via-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600">Access your boutique management portal</p>
          
          {/* Back to Home Link */}
          <div className="mt-4">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[rgb(219,39,119)] transition-colors duration-300 group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[rgb(219,39,119)] via-pink-500 to-purple-500"></div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgb(219,39,119) 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          <CardHeader className="space-y-1 pb-8 pt-8 relative z-10">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">Admin Portal</CardTitle>
            <CardDescription className="text-center text-gray-600">
              Enter your credentials to manage your boutique
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 pb-8">
            {errorMessage && (
              <Alert
                variant="destructive"
                className="mb-6 border-[rgb(219,39,119)]/30 bg-[rgb(219,39,119)]/5 text-[rgb(219,39,119)] rounded-xl"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-semibold">Authentication Error</AlertTitle>
                <AlertDescription>
                  {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[rgb(219,39,119)]" />
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your admin email"
                            className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-xl transition-all duration-300 text-base px-4 group-hover:border-pink-300 bg-white/80 backdrop-blur-sm"
                            {...field}
                          />
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgb(219,39,119)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[rgb(219,39,119)]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="group">
                      <FormLabel className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[rgb(219,39,119)]" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className="h-12 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-xl transition-all duration-300 text-base px-4 pr-12 group-hover:border-pink-300 bg-white/80 backdrop-blur-sm"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-[rgb(219,39,119)]/10 rounded-lg transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                          </Button>
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgb(219,39,119)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-[rgb(219,39,119)]" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[rgb(219,39,119)] to-purple-500 hover:from-[rgb(199,29,109)] hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-3">
                      Access Dashboard
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t border-gray-100 pt-6 pb-8 relative z-10">
            <div className="text-center">
              <Link
                href="/admin/forgot-password"
                className="text-[rgb(219,39,119)] font-semibold hover:text-purple-600 transition-colors duration-300 text-sm relative group"
              >
                Forgot your password?
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(219,39,119)] to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <Crown className="w-3 h-3" />
              <span>Boutique Management System</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </CardFooter>
        </Card>

        {/* Bottom decorative text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Crafted with elegance for your boutique</p>
        </div>
      </div>
    </div>
  )
}
