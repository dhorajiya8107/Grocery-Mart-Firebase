import { Suspense } from 'react';

export default function CustomNotFound() {  // Changed function name to avoid conflict
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <a href="/">Return to Home</a>
      <Suspense fallback={<div>Loading...</div>}>
        {/* Place any components that need useSearchParams here */}
      </Suspense>
    </div>
  );
}