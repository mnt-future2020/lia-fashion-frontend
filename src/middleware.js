import { NextResponse } from 'next/server';

export function middleware(request) {
    const authToken = request.cookies.get('admin-token')?.value;
    const { pathname } = request.nextUrl;
    const isAdminRoute = pathname.startsWith('/admin');
    const isLoginPage = pathname === '/admin/login';
    const isPublicPage = pathname === '/admin/forgot-password' || 
                        pathname === '/admin/reset-password';
    
    // Allow access to public pages without auth
    if (isPublicPage) {
        return NextResponse.next();
    }

    // Redirect authenticated users away from login page
    if (isLoginPage && authToken) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }

    // Protect admin routes except login and forgot password
    if (isAdminRoute && !isLoginPage && !authToken) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*']
};
