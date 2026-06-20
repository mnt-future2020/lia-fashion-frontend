"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "../../../lib/axios"
import { toast } from "react-toastify"
import { Mail, ArrowLeft, Send, Sparkles, Crown, CheckCircle } from "lucide-react"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const response = await axios.post("/api/admin/forgot-password", { email })
      setIsSuccess(true)
      toast.success(response.data.message, {
        position: "top-right",
        autoClose: 3000,
      })
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
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
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-purple-100 rounded-full mb-6 backdrop-blur-sm border border-white/30">
            <div className="p-1 bg-[rgb(219,39,119)] rounded-full">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[rgb(219,39,119)]">Password Recovery</span>
            <Sparkles className="w-4 h-4 text-[rgb(219,39,119)]" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[rgb(219,39,119)] via-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
                      No worries! Enter your email address below and well send you a secure link to reset your password
          <p className="text-gray-600">We&#39;ll help you get back to your boutique dashboard</p>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative">
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

          <div className="relative z-10 p-8">
            {!isSuccess ? (
              <>
                {/* Form Section */}
                <div className="space-y-6 mb-8">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-[rgb(219,39,119)]/10 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-[rgb(219,39,119)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Forgot Your Password?</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      No worries! Enter your email address below and we&#39;ll send you a secure link to reset your password
                      and get you back to managing your boutique.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-3 group">
                      <label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[rgb(219,39,119)]" />
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full h-12 px-4 border-2 border-gray-200 focus:border-[rgb(219,39,119)] rounded-xl transition-all duration-300 text-base bg-white/80 backdrop-blur-sm group-hover:border-pink-300 focus:outline-none focus:ring-0"
                          placeholder="Enter your admin email address"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[rgb(219,39,119)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !email}
                      className="w-full h-12 bg-gradient-to-r from-[rgb(219,39,119)] to-purple-500 hover:from-[rgb(199,29,109)] hover:to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Sending Reset Link...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          <Send className="w-5 h-5" />
                          Send Reset Link
                        </span>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                {/* Success Section */}
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-800">Check Your Email!</h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      We&#39;ve sent a password reset link to{" "}
                      <span className="font-semibold text-[rgb(219,39,119)]">{email}</span>. Please check your inbox and
                      follow the instructions to reset your password.
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-[rgb(219,39,119)]/5 to-purple-100/50 rounded-xl p-4 border border-[rgb(219,39,119)]/10">
                    <p className="text-sm text-gray-700">
                      <strong>Didn&#39;t receive the email?</strong> Check your spam folder or try again in a few minutes.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Back to Login */}
            <div className="text-center pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push("/admin/login")}
                className="inline-flex items-center gap-2 text-[rgb(219,39,119)] hover:text-purple-600 transition-colors duration-300 text-sm font-semibold group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[rgb(219,39,119)] to-purple-500 group-hover:w-full transition-all duration-300"></span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
              <Crown className="w-3 h-3" />
              <span>Secure Password Recovery</span>
              <Sparkles className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Bottom decorative text */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Your boutique security is our priority</p>
        </div>
      </div>
    </div>
  )
}
