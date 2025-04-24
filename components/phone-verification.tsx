"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

interface PhoneVerificationProps {
  initialPhoneNumber: string
  onPhoneVerified: (verified: boolean) => void
  onPhoneChanged: (phone: string) => void
}

export function PhoneVerification({ initialPhoneNumber, onPhoneVerified, onPhoneChanged }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || "")
  const [otp, setOtp] = useState("")
  const [sentOtp, setSentOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [countdown])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setPhoneNumber(value)
    onPhoneChanged(value)

    // Reset verification if phone number changes
    if (verified) {
      setVerified(false)
      onPhoneVerified(false)
      setOtpSent(false)
      setOtp("")
    }
  }

  const sendOtp = async () => {
    if (phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }

    setLoading(true)
    try {
      // In a real implementation, you would call an API to send an OTP
      // For demo purposes, we'll generate a random 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
      setSentOtp(generatedOtp)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOtpSent(true)
      setCountdown(60) // 60 seconds countdown

      // For demo purposes, show the OTP in a toast
      toast.info(`Your OTP is: ${generatedOtp}`, {
        description: "In a real app, this would be sent via SMS",
      })
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      // In a real implementation, you would verify the OTP with an API
      // For demo purposes, we'll just compare with the generated OTP
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (otp === sentOtp) {
        setVerified(true)
        onPhoneVerified(true)
        toast.success("Phone number verified successfully")
      } else {
        toast.error("Invalid OTP. Please try again.")
      }
    } catch (error) {
      toast.error("Failed to verify OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={handlePhoneChange}
            disabled={verified}
            className={verified ? "bg-green-50 border-green-200" : ""}
          />
        </div>
        <div>
          <Button
            type="button"
            variant={verified ? "outline" : "default"}
            className={verified ? "border-green-500 text-green-600 w-full" : "w-full"}
            onClick={sendOtp}
            disabled={loading || verified || phoneNumber.length < 10 || countdown > 0}
            // className="w-full"
          >
            {loading && !verified ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : verified ? (
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            ) : null}
            {verified ? "Verified" : countdown > 0 ? `Resend in ${countdown}s` : otpSent ? "Resend OTP" : "Send OTP"}
          </Button>
        </div>
      </div>

      {otpSent && !verified && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <Label htmlFor="otp">Enter OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
            />
          </div>
          <div>
            <Button type="button" onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Verify OTP
            </Button>
          </div>
        </div>
      )}

      {verified && (
        <div className="flex items-center text-green-600 text-sm font-medium">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Phone number verified successfully
        </div>
      )}
    </div>
  )
}
