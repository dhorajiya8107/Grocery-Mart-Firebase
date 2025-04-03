'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, db } from '../src/firebase';
import { Button } from '@/components/ui/button';
import TextInput from '@/components/form-fields/TextInput';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 
// Validation schema using Zod
const schema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least 1 number')
      .regex(/[@$!%*?&]/, 'Password must contain at least 1 special character'),
    confirmPassword: z.string(),
    role: z.enum(['admin', 'user']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

interface SignUpPageProps {
  activeDialog: 'sign-up' | 'log-in' | 'forget-password' | 'change-password' | "address" | null;
  setActiveDialog: React.Dispatch<
    React.SetStateAction<'sign-up' | 'log-in' | 'forget-password' | 'change-password' | "address" | null>
  >;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ activeDialog, setActiveDialog }) => {
  const router = useRouter();
  const [error, setError] = useState('');

  // Apply validation
  const form = useForm<{
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: 'admin' | 'user';
  }>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    },
  });

  const { control, handleSubmit, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (activeDialog === 'sign-up') {
      setTimeout(() => {
        const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
        if (emailInput) {
          emailInput.blur();
        }
      }, 1);
    }
  }, [activeDialog]);

  // Handle SignUp
  const onSubmit = async (data: any) => {
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: data.name,
        email: user.email,
        role: data.role,
      });

      console.log('SignUp Successfully!');
      setActiveDialog(null);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName || 'User',
        email: user.email,
        role: 'user',
      });

      console.log('SignUp (with Google) Successfully!');
      setActiveDialog(null);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={activeDialog === 'sign-up'} onOpenChange={() => setActiveDialog(null)}>
      <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Sign Up</DialogTitle>
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Name Field */}
            <div className="mb-4">
              <TextInput control={control} name="name" label="Name" placeHolder="Enter your name" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <TextInput control={control} name="email" type="email" label="Email" placeHolder="Enter email" />
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <TextInput control={control} name="password" type="password" label="Password" placeHolder="Enter password" />
            </div>

            {/* Confirm Password Field */}
            <div className="mb-4">
              <TextInput control={control} name="confirmPassword" type="password" label="Confirm Password" placeHolder="Confirm password" />
            </div>

            {/* Role Field */}
            {/* <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                {...form.register('role')}
                className="mt-1 w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-indigo-200 focus:outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div> */}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Sign Up'}
            </Button>
          </form>
        </FormProvider>

        <div className="mt-4 text-center text-sm">
          <p>Or sign up with:</p>
          <Button type="button" onClick={handleGoogleSignIn} className="w-full mt-2 bg-white text-black border-2 hover:bg-gray-200">
            <img width="20" src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" />
            Sign up with Google
          </Button>
        </div>

        <div className="text-center text-sm mt-4">
          <a className="text-gray-500 hover:underline cursor-pointer" onClick={() => setActiveDialog('log-in')}>
            Already have an account? Log In
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpPage;
