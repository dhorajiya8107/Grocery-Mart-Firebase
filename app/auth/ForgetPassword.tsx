'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../src/firebase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TextInput from '@/components/form-fields/TextInput';
import { ArrowLeft, KeyRound } from 'lucide-react';
 
// Validation schema using Zod
const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

interface ForgotPasswordPageProps {
    activeDialog: "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null;
    setActiveDialog: React.Dispatch<React.SetStateAction<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>>;
    preFilledEmail?: string;
  }

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ activeDialog, setActiveDialog, preFilledEmail = "", }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  // Apply validation
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: preFilledEmail },
  });

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = form;

  // Set the prefilled email when the component mounts or when preFilledEmail changes
  useEffect(() => {
    if (preFilledEmail) {
      setValue("email", preFilledEmail)
    }
  }, [preFilledEmail, setValue])

  useEffect(() => {
      if (activeDialog === 'forget-password') {
        setTimeout(() => {
          const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
          if (emailInput) {
            emailInput.blur();
          }
        }, 1);
      }
    }, [activeDialog]);

  // Handle forget password with send reset link
  const handleForgotPassword = async (data: any) => {
    setError("");
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, data.email);
      console.log("Reset link sent to:", data.email);
      setSuccess(true);
      // setTimeout(() => setOpen(false), 1500);
      // setActiveDialog(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={activeDialog === "forget-password"} onOpenChange={() => setActiveDialog(null)}>
      <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg border-0">
        <DialogHeader>
          <div className="flex items-center space-x-2 mb-3 text-gray-700">
            <div className="bg-green-50 p-2 rounded-full">
              <KeyRound className="h-5 w-5 text-green-700" />
            </div>
            <DialogTitle className="text-xl font-semibold">Reset Password</DialogTitle>
          </div>
          <p className="text-gray-500 text-sm -mt-1 mb-2">Enter your email to receive a password reset link</p>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-5">
              <p className="text-green-700 font-medium">Email sent successfully!</p>
              <p className="text-green-600 text-sm mt-1">Check your inbox for instructions to reset your password.</p>
            </div>
            <Button
              onClick={() => setActiveDialog("log-in")}
              className="bg-green-700 hover:bg-green-800 transition-colors"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleForgotPassword)} className="text-gray-700">
              <div className="mb-5">
                <TextInput
                  control={control}
                  name="email"
                  type="email"
                  label="Email Address"
                  placeHolder="Enter your email address"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 transition-colors py-5 mb-3"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </Button>

              <button
                type="button"
                onClick={() => setActiveDialog("log-in")}
                className="flex items-center justify-center w-full text-gray-600 hover:text-gray-800 text-sm mt-3 transition-colors"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back to login
              </button>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default ForgotPasswordPage;