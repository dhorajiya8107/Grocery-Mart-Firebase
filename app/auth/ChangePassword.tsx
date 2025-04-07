"use client";

import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { auth } from "@/app/src/firebase";
import { signInWithEmailAndPassword, signOut, updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import TextInput from "@/components/form-fields/TextInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import successAnimation from '@/animation/Animation - 1742460011298.json';
import dynamic from 'next/dynamic';
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });
 
// 494 577
// Validation schema using Zod
const schema = z
  .object({
    // email: z.string().email("Enter a valid email"),
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[a-z]/, "Must contain at least 1 lowercase letter")
      .regex(/[A-Z]/, "Must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Must contain at least 1 number")
      .regex(/[@$!%*?&]/, "Must contain at least 1 special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

interface ForgotPasswordPageProps {
  activeDialog: "sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null;
  setActiveDialog: React.Dispatch<React.SetStateAction<"sign-up" | "log-in" | "forget-password" | "change-password" | "address" | null>>;
}

const ChangePasswordPage: React.FC<ForgotPasswordPageProps> = ({ activeDialog, setActiveDialog }) => {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Apply validation
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      // email: prefilledEmail,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Pre-fill email field from query parameters
  // useEffect(() => {
  //   if (prefilledEmail) {
  //     form.setValue("email", prefilledEmail, { shouldValidate: true });
  //   }
  // }, [prefilledEmail, form.setValue]);

  const { control, handleSubmit, formState: { isSubmitting } } = form;

  // Handle change password
  const handleChangePassword = async (data: any) => {
    setError("");
    setSuccess(false);
  
    if (!auth.currentUser) {
      setError("You need to be logged in to change your password.");
      return;
    }
  
    try {
      const user = auth.currentUser;
  
      // Re-authenticate the user with current password
      const credential = signInWithEmailAndPassword(auth, user.email!, data.currentPassword);
      await credential;
  
      // Update the password
      await updatePassword(user, data.newPassword);
  
      setSuccess(true);
      await signOut(auth);
  
      setTimeout(() => {
        setActiveDialog(null);
        router.push("/");
      }, 2000);
  
      console.log("Password has been changed successfully!");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <Dialog open={activeDialog === "change-password"} onOpenChange={() => setActiveDialog(null)}>
      <DialogContent className="max-w-md bg-white rounded-lg p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Change Password</DialogTitle>
        </DialogHeader>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {success ? (
          <div className="text-center">
            <p className="text-md mb-5 text-gray-500">Please wait... You are being redirected.</p>
            {/* <img width={"100"} className="object-center mx-auto mb-7 mt-2" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuvL3T42GwFfKMOq7IbYltCKRFrklMbdU0yA&s" alt="Success" /> */}
            <Lottie 
              animationData={successAnimation}
              loop={false}
              // style={{ width: 50, height: 50}}
              className="w-30 h-30 mx-auto -mt-10 -mb-5"
            />
            <p className="text-2xl mb-5">Password Updated!</p>
            <p className="text-md">Your password has been changed successfully.</p>
            <p className="text-sm">Use your new password to log in.</p>
          </div>
        ) : (
          <FormProvider {...form}>
            <form onSubmit={handleSubmit(handleChangePassword)}>
              {/* <div className="mb-4">
                <TextInput control={control} name="email" type="email" label="Email" placeHolder="Enter Email" />
              </div> */}
              <div className="mb-4">
                <TextInput control={control} name="currentPassword" type="password" label="Current Password" placeHolder="Enter Current Password" />
              </div>
              <div className="mb-4">
                <TextInput control={control} name="newPassword" type="password" label="New Password" placeHolder="Enter New Password" />
              </div>
              <div className="mb-4">
                <TextInput control={control} name="confirmPassword" type="password" label="Confirm Password" placeHolder="Confirm New Password" />
              </div><br />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordPage;
