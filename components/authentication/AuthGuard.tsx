'use client';

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/app/src/firebase';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/app/header/page';
import Footer from '@/app/footer/page';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && ["/log-in", "/sign-up", "/forget-password"].includes(pathname)) {
      router.replace('/');
    }
  }, [pathname, router, loading]);

  if (loading && ["/log-in", "/sign-up", "/forget-password"].includes(pathname)) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header user={user} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
// if (!loading && user && ["/log-in", "/sign-up", "/forget-password"].includes(pathname)) {