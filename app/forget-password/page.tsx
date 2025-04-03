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
import { useSearchParams } from 'next/navigation';
 
// Validation schema using Zod
const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

interface ForgotPasswordPageProps {
    activeDialog: "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null;
    setActiveDialog: React.Dispatch<React.SetStateAction<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>>;
    preFilledEmail?: string;
  }

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ activeDialog, setActiveDialog, preFilledEmail }) => {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false); // Popover state
  const searchParams = useSearchParams();

  // Apply validation
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: preFilledEmail || "" },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = form;

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
      setActiveDialog(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={activeDialog === "forget-password"} onOpenChange={() => setActiveDialog(null)}>
      {/* Trigger Button */}
      <DialogTrigger asChild>
        <a className="text-gray-500 text-sm cursor-pointer hover:underline">Forgot Password?</a>
      </DialogTrigger>

      {/* Popover Content */}
      <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Reset Password</DialogTitle>
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success ? (
          <p className="text-green-500 text-sm">Email sent! Check your inbox.</p>
        ) : (
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleForgotPassword)} className="w-full">
              <div className="mb-4">
                <TextInput control={control} name="email" type="email" label="Email" placeHolder="Enter Email" />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordPage;
