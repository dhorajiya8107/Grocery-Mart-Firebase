'use client';

import Footer from '@/app/footer/page';
import Header from '@/app/header/page';
import { auth } from '@/app/src/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';

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
      <Suspense>
        <Header user={user} />
        <main className="flex-grow">{children}</main>
        <Footer />
      </Suspense>
    </div>
  );
}
// if (!loading && user && ["/log-in", "/sign-up", "/forget-password"].includes(pathname)) {

// import {
//   ContextProductsProvider,
//   SimpleFallback,
// } from "@/components/ContextProductsProvider";
// ...

// <body className={saira.className} style={{ scrollBehavior: "smooth" }}>
//   <Suspense fallback={<SimpleFallback />}>
//     <ContextProductsProvider>
//       <Header />
//       {children}
//     </ContextProductsProvider>
//   </Suspense>
//   <Footer />
// </body>