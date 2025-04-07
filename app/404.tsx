import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import React from 'react';

// Your existing imports...

function NotFoundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <YourActualNotFoundComponent />
    </Suspense>
  );
}

function YourActualNotFoundComponent(): React.ReactNode {
  const searchParams = useSearchParams();
  // Rest of your component...
  
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      {/* Your existing 404 page content */}
    </div>
  );
}

export default NotFoundPage;