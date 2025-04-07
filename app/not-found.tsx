// app/not-found.js (or .tsx)
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>Sorry, the page you are looking for does not exist.</p>
      <a href="/">Return to Home</a>
    </div>
  );
} 