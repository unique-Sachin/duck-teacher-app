import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Admin-only routes
    const adminRoutes = ['/admin', '/proctoring-client', '/api/admin'];
    
    // Check if current path is an admin route
    const isAdminRoute = adminRoutes.some(route => path.startsWith(route));
    
    if (isAdminRoute && token?.role !== 'ADMIN') {
      // Redirect non-admin users trying to access admin routes
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

// Protect these routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/interview/:path*",
    "/session/:path*",
    "/result/:path*",
    "/history/:path*",
    "/admin/:path*",
    "/proctoring-client/:path*",
    "/api/interviews/:path*",
    "/api/duck-analysis/:path*",
    "/api/admin/:path*",
  ],
};
