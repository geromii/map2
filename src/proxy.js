import { NextResponse } from 'next/server';

export function proxy(request) {
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/diplomacy';
    return NextResponse.redirect(url, 301);
  }
}

export const config = {
  matcher: '/',
};
