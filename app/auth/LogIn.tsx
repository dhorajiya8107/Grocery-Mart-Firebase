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
  const [loginEmail, setLoginEmail] = useState("");

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
  

  const { control, handleSubmit, getValues, formState: { errors, isSubmitting } } = form;

  // Handle login
  const handleLogin = async (data: any) => {
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("Login Successfully!", userCredential.user);
      setActiveDialog(null);
      router.refresh();
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPassword = () => {
    const email = getValues("email");
    setLoginEmail(email);
    if (!email) {
      setError("Please enter your email before proceeding.");
      return;
    }
    setPreFilledEmail(loginEmail);
    setActiveDialog("forget-password");
  };
  

  return (
    <>
    <Dialog open={activeDialog === "log-in"} onOpenChange={() => setActiveDialog(null)}>
      {/* <DialogTrigger asChild>
        <a className="text-gray-500 text-sm mr-2 cursor-pointer">LOG IN</a>
      </DialogTrigger> */}
      <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg">
        <DialogHeader>
          <div className='flex items-center space-x-2 mb-1 text-gray-700'>
            <LogIn className='h-5 w-5 text-gray-600'/>
            <DialogTitle className="text-xl font-semibold">Login</DialogTitle>
          </div>
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(handleLogin)} className='text-gray-700'>
            <div className="mb-4">
              <TextInput control={control} name="email" type="email" label='Email' placeHolder="Enter Email" />
            </div>

            <div className="mb-4">
              <TextInput control={control} name="password" type="password" label='Password' placeHolder="Enter Password" />
            </div>
            
            <div className="text-end text-sm mt-4">
              <a className="text-green-700 hover:underline cursor-pointer" onClick={handleForgotPassword}>
                Forgot Password?
              </a>
            </div><br />

            <Button type="submit" className='w-full bg-green-700 hover:bg-green-800' disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'LOGIN'}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>

    {/* {activeDialog === "forget-password" && 
        <ForgotPasswordPage activeDialog={activeDialog} setActiveDialog={setActiveDialog} preFilledEmail={preFilledEmail} />
      } */}
  </>
  );
};

export default LogInPage;
