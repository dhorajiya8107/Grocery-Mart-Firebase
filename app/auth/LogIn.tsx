'use client';

import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/form-fields/TextInput';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ForgotPasswordPage from './ForgetPassword';
import { LogIn } from 'lucide-react';
 
// Validation schema using Zod
const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface LogInPageProps {
    activeDialog: "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null;
    setActiveDialog: React.Dispatch<React.SetStateAction<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>>;
}

const LogInPage: React.FC<LogInPageProps> = ({ activeDialog, setActiveDialog }) => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [preFilledEmail, setPreFilledEmail] = useState('');

  // Apply validation
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

useEffect(() => {
    if (activeDialog === 'log-in') {
      setTimeout(() => {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
        if (emailInput) {
          emailInput.blur();
        }
      }, 1);
    }
  }, [activeDialog]);
  

  const { control, handleSubmit, getValues, formState: { isSubmitting } } = form;

  // Handle login
  const handleLogin = async (data: any) => {
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("Login Successfully!", userCredential.user);
      setActiveDialog(null);
      router.refresh();
      router.push("/");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError("Invalid email or password");
      } else {
        setError(err.message);
      }
    }
  };

  const handleForgotPassword = () => {
    const email = getValues("email");
    if (!email) {
      setError("Please enter your email before proceeding.");
      return;
    }
    setPreFilledEmail(email);
    setActiveDialog("forget-password");
  };
  

  return (
    <>
      <Dialog open={activeDialog === "log-in"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg border-0">
          <DialogHeader>
            <div className="flex items-center space-x-2 mb-3 text-gray-700">
              <div className="bg-green-50 p-2 rounded-full">
                <LogIn className="h-5 w-5 text-green-700" />
              </div>
              <DialogTitle className="text-xl font-semibold">Welcome Back</DialogTitle>
            </div>
            <p className="text-gray-500 text-sm -mt-1 mb-2">Sign in to your account to continue</p>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleLogin)} className="text-gray-700">
              <div className="mb-4">
                <TextInput control={control} name="email" type="email" label="Email" placeHolder="Enter your email" />
              </div>

              <div className="mb-2">
                <TextInput
                  control={control}
                  name="password"
                  type="password"
                  label="Password"
                  placeHolder="Enter your password"
                />
              </div>

              <div className="text-end text-sm mb-5">
                <button
                  type="button"
                  className="text-green-700 hover:text-green-800 hover:underline cursor-pointer transition-colors"
                  onClick={handleForgotPassword}
                >
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 transition-colors py-5"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <div className="mt-5 text-center text-sm">
                <span className="text-gray-600">Don't have an account? </span>
                <button
                  type="button"
                  className="text-green-700 hover:text-green-800 font-medium hover:underline cursor-pointer transition-colors"
                  onClick={() => setActiveDialog("sign-up")}
                >
                  Create Account
                </button>
              </div>
            </form>
          </FormProvider>
        </DialogContent>
      </Dialog>

      {activeDialog === "forget-password" && (
        <ForgotPasswordPage
          activeDialog={activeDialog}
          setActiveDialog={setActiveDialog}
          preFilledEmail={preFilledEmail}
        />
      )}
    </>
  )
}

export default LogInPage;