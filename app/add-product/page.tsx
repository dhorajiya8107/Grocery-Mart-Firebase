'use client';

import AddProductForm from "@/app/src/addProduct";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth, db } from "../src/firebase";

const AddProduct = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
   
  // Checking login user role
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setLoading(true);
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
  
          if (userSnap.exists()) {
            const userRole = userSnap.data()?.role;
            setRole(userRole);
  
            if (userRole !== 'admin' && userRole !== 'superadmin') {
              router.push('/');
            }
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          router.push('/');
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/');
      }
    });
  
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 border-4 border-gray-300 border-t-green-700 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (role !== 'admin' && role !== 'superadmin') {
      return null;
    }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-10">
        <AddProductForm />
      </div>
    </div>
  );
};
 
export default AddProduct;