import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // You can add additional logic here if needed
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
    "/api/interviews/:path*",
    "/api/duck-analysis/:path*",
  ],
};
