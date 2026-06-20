"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "../../lib/axios"
import { useUserAuth } from "@/contexts/UserAuthContext"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { GoogleLogin } from '@react-oauth/google'
import { GoogleOAuthProvider } from '@react-oauth/google'
import {
  Mail,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  UserCircle,
  Phone,
  Heart,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Login form schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

// Registration form schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  })

// OTP verification schema
const otpSchema = z.object({
  otp: z.string().min(4, "OTP must be at least 4 characters"),
})

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export default function UserLogin() {
  const [isLogin, setIsLogin] = useState(true)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [showOtp, setShowOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const router = useRouter()
  const auth = useUserAuth()

  // Initialize the correct form based on the current state
  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  
  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onChange",
  })

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const forgotPasswordForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  // Handle login form submission
  const handleLoginSubmit = async (values) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const { data } = await axios.post("/api/login", {
        email: values.email,
        password: values.password,
      })
      if (data.token) {
        auth.setAuth(data.token, data.user)
        router.push("/")
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invalid email or password")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle registration form submission
  const handleRegisterSubmit = async (values) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")
    setUserEmail(values.email)

    try {
      await axios.post("/api/register", values)
      setShowOtp(true)
    } catch (err) {
      // Handle validation errors from the API
      if (err.response?.data?.errors) {
        setErrorMessage(err.response.data.errors)
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message)
      } else {
        setErrorMessage("Registration failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle OTP verification
  const handleOtpSubmit = async (values) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const { data } = await axios.post("/api/verify-otp", {
        email: userEmail,
        otp: values.otp,
      })

      if (data.token && data.user) {
        // Set both token and user data in auth context
        auth.setAuth(data.token, data.user)
        // Redirect to dashboard
        router.push("/")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "OTP verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle forgot password
  const handleForgotPasswordSubmit = async (values) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      await axios.post("/api/forgot-password", {
        email: values.email,
      })
      alert("Password reset link has been sent to your email")
      setIsForgotPassword(false)
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to send reset link")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Google Sign-In
  const handleGoogleSuccess = async (credentialResponse) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setErrorMessage("")

    try {
      console.log('Google Sign-In successful:', credentialResponse)
      
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google")
      }
      
      const { data } = await axios.post("/api/auth/google/login", {
        access_token: credentialResponse.credential,
      })
      
      if (data.token && data.user) {
        auth.setAuth(data.token, data.user)
        router.push("/")
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err) {
      console.error('Google Sign-In error:', err)
      if (err.response?.data?.error) {
        setErrorMessage(`Google login failed: ${err.response.data.error}`)
      } else if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message)
      } else if (err.message) {
        setErrorMessage(`Google login failed: ${err.message}`)
      } else {
        setErrorMessage("Google login failed. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = (error) => {
    console.error('Google Sign-In error:', error)
    setErrorMessage("Google login failed. Please try again.")
  }

  // Render the forgot password form
  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 relative">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-pink-300/10 to-pink-200/20 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        {/* Logo with Home Link */}
        <div className="mb-8 relative z-10">
          <Link href="/" className="block group">
            <div className="flex items-center justify-center gap-2 transform transition-transform duration-300 group-hover:scale-105">
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
              <h1 className="text-3xl font-bold text-gray-800">Lia Fashions</h1>
            </div>
          </Link>
        </div>

        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-500"></div>

          <CardHeader className="space-y-1 relative z-10">
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 rounded-full hover:bg-pink-100"
                onClick={() => setIsForgotPassword(false)}
              >
                <ChevronLeft className="h-5 w-5 text-pink-500" />
                <span className="sr-only">Back</span>
              </Button>
              <div className="flex-1 text-center">
                <CardTitle className="text-2xl font-bold text-gray-800">Reset Password</CardTitle>
              </div>
              <div className="w-8"></div> {/* Spacer for alignment */}
            </div>
            <CardDescription className="text-center text-gray-600">
              Enter your email and we&apos;ll send you a reset link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4 border-pink-200 bg-pink-50 text-pink-900 border rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-medium">Error</AlertTitle>
                <AlertDescription>
                  {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 flex items-start gap-3">
              <div className="mt-0.5">
                <Mail className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  We&apos;ll send a password reset link to your email address. Please make sure to check your spam folder if
                  you don&apos;t see it in your inbox.
                </p>
              </div>
            </div>

            {/* Add a persistent key to the form to prevent remounting */}
            <Form {...forgotPasswordForm} key="forgot-password-form">
              <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordSubmit)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Enter your email"
                            className="pl-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-pink-500" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending Reset Link...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Send Reset Link
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            {/* Add Back to Home Link */}
            <div className="text-center pb-6">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-pink-600 transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render the OTP verification form
  if (showOtp) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-white to-pink-50 px-4 relative">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-200/20 to-rose-200/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-pink-300/10 to-pink-200/20 rounded-full blur-3xl animate-float-delayed"></div>
        </div>

        {/* Logo with Home Link */}
        <div className="mb-8 relative z-10">
          <Link href="/" className="block group">
            <div className="flex items-center justify-center gap-2 transform transition-transform duration-300 group-hover:scale-105">
              <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
              <h1 className="text-3xl font-bold text-gray-800">Lia Fashions</h1>
            </div>
          </Link>
        </div>

        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden">
          {/* Decorative top border */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-400 to-rose-500"></div>

          <CardHeader className="space-y-1 relative z-10">
            <div className="flex items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 rounded-full hover:bg-pink-100"
                onClick={() => {
                  setShowOtp(false)
                  setIsLogin(true)
                }}
              >
                <ChevronLeft className="h-5 w-5 text-pink-500" />
                <span className="sr-only">Back</span>
              </Button>
              <div className="flex-1 text-center">
                <CardTitle className="text-2xl font-bold text-gray-800">Verify Your Email</CardTitle>
              </div>
              <div className="w-8"></div> {/* Spacer for alignment */}
            </div>
            <CardDescription className="text-center text-gray-600">
              Enter the verification code sent to
              <div className="font-medium text-pink-600 mt-1">{userEmail}</div>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive" className="mb-4 border-pink-200 bg-pink-50 text-pink-900 border rounded-xl">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="font-medium">Error</AlertTitle>
                <AlertDescription>
                  {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100 flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle2 className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  We&apos;ve sent a verification code to your email. Please enter it below to complete your registration.
                </p>
              </div>
            </div>

            <Form {...otpForm}>
              <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-6">
                <FormField
                  control={otpForm.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-gray-700 font-medium">Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter verification code"
                          className="text-center text-xl tracking-widest h-14 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300 font-medium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-pink-500" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Verify & Continue
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </form>
            </Form>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Didn&apos;t receive the code?</p>
              <Button
                variant="link"
                className="text-pink-500 hover:text-pink-700 font-medium p-0 h-auto"
                onClick={() => {
                  // Resend OTP logic would go here
                  alert("Verification code resent. Please check your email.")
                }}
              >
                Resend Code
              </Button>
            </div>

            {/* Add Back to Home Link */}
            <div className="text-center pb-6">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-pink-600 transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render the login or register form
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
        <div className="max-w-7xl w-full h-[800px] bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className={`flex h-full ${!isLogin ? 'flex-row-reverse' : ''}`}>
            {/* Form Section */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
              <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {isLogin ? "Welcome Back!" : "Create Account"}
                  </h1>
                  <p className="text-gray-600">
                    {isLogin ? "New user? Please Register to Create an account." : "If you are an Existing user, Please Login to your account"}
                  </p>
                </div>

                <Tabs 
                  defaultValue={isLogin ? "login" : "register"} 
                  className="w-full"
                  onValueChange={(value) => setIsLogin(value === "login")}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger
                      value="login"
                      className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:shadow-none rounded-lg"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className="data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600 data-[state=active]:shadow-none rounded-lg"
                    >
                      Register
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-6">
                    {errorMessage && (
                      <Alert variant="destructive" className="mb-4 border-pink-200 bg-pink-50 text-pink-900 border rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-medium">Error</AlertTitle>
                        <AlertDescription>
                          {typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage)}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Enter your email"
                                    className="pl-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <div className="flex justify-between items-center">
                                <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                                <Button
                                  variant="link"
                                  onClick={() => setIsForgotPassword(true)}
                                  className="text-pink-500 hover:text-pink-700 font-medium p-0 h-auto"
                                  type="button"
                                >
                                  Forgot Password?
                                </Button>
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-pink-50 rounded-lg"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-medium mt-6"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Signing In...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Sign In
                              <ArrowRight className="h-5 w-5" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>

                    {/* Google Sign-In */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-300" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <div className="google-signin-button">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={handleGoogleError}
                          useOneTap={false}
                          theme="outline"
                          size="large"
                          text="signin_with"
                          shape="rectangular"
                          locale="en"
                          auto_select={false}
                          cancel_on_tap_outside={true}
                        />
                      </div>
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      If you are admin,{" "}
                      <Link href="/admin/login" className="text-pink-500 hover:text-pink-600 font-medium">
                        click here
                      </Link>
                    </div>
                  </TabsContent>

                  <TabsContent value="register" className="space-y-6">
                    {errorMessage && typeof errorMessage === 'string' && (
                      <Alert variant="destructive" className="mb-4 border-pink-200 bg-pink-50 text-pink-900 border rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-medium">Error</AlertTitle>
                        <AlertDescription>{errorMessage}</AlertDescription>
                      </Alert>
                    )}
                    {errorMessage && typeof errorMessage === 'object' && Object.keys(errorMessage).length > 0 && (
                      <Alert variant="destructive" className="mb-4 border-pink-200 bg-pink-50 text-pink-900 border rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle className="font-medium">Registration Failed</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc pl-4 mt-2 space-y-1">
                            {Object.entries(errorMessage).map(([field, errors]) => (
                              <li key={field}>
                                {Array.isArray(errors) ? errors[0] : String(errors)}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <UserCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Enter your full name"
                                    className="pl-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Enter your email"
                                    className="pl-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Phone Number</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="Enter your phone number"
                                    className="pl-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a password"
                                    className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-pink-50 rounded-lg"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="password_confirmation"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                  <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-pink-400 rounded-xl transition-all duration-300"
                                    {...field}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-pink-50 rounded-lg"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? (
                                      <EyeOff className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <Eye className="h-4 w-4 text-gray-500" />
                                    )}
                                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage className="text-pink-500" />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-medium mt-6"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Creating Account...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              Create Account
                              <ArrowRight className="h-5 w-5" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                {/* Add Back to Home Link */}
                <div className="text-center mt-6 border-t border-gray-100 pt-6">
                  <Link 
                    href="/" 
                    className="text-sm text-gray-600 hover:text-pink-600 transition-colors inline-flex items-center gap-1 justify-center"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className="hidden lg:block lg:w-1/2 relative">
              <Image
                src={isLogin ? "/assets/images/image 1196.png" : "/assets/images/image 1197.png"}
                alt={isLogin ? "Login illustration" : "Register illustration"}
                layout="fill"
                objectFit="cover"
                priority
                // className={isLogin ? "rounded-l-3xl" : "rounded-r-3xl"}
              />
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
