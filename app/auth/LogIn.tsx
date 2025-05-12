'use client';

import TextInput from '@/components/form-fields/TextInput';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LogIn } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as z from 'zod';
import AppleLogo from '../../images/Applelogo.png';
import { auth, db } from '../src/firebase';
import ForgotPasswordPage from './ForgetPassword';
 
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

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || 'User',
          email: user.email,
          role: 'user',
        });
      } else {
        await setDoc(userRef, {
          name: user.displayName || userSnap.data().name,
          email: user.email,
        }, { merge: true });
      }

      console.log('Sign-in (with Google) successful!');
      setActiveDialog(null);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };  
  

  return (
    <>
      <Dialog open={activeDialog === "log-in"} onOpenChange={() => setActiveDialog(null)}>
        <DialogContent className="bg-white rounded-lg p-6 shadow-lg border-0">
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

          <div className="space-y-2 text-center text-sm">
            {/* <p className='text-start'>Log in with account</p> */}
              <div className='flex justify-between items-center space-x-1'>
                <Button type="button" onClick={handleGoogleSignIn} className="bg-white w-1/2 text-black border-2 hover:bg-gray-200">
                  <img width="20" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
                  Google
                </Button>
                <Button className="bg-white w-1/2 text-black border-2 hover:bg-gray-200">
                  <Image width="50" className='-mr-3' src={AppleLogo} alt="Apple" />
                  Apple
                </Button>
              </div>
          </div>

          <span className='border-b'></span>
        
          <div className='text-sm text-gray-500'>
            <p className="text-start">Or sign in with email</p>
          </div>

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