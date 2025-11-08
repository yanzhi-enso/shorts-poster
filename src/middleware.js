import { NextResponse } from 'next/server';

const allowedOrigins = new Set([
    'http://localhost:3000',
    'http://localhost:3001',
    'https://studio.v01s.com',
    'https://shorts-staging.v01s.com',
]);

const appendCorsHeaders = (response, origin, request) => {
    response.headers.set('Vary', 'Origin');
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set(
        'Access-Control-Allow-Headers',
        request.headers.get('access-control-request-headers') || 'Authorization,Content-Type,Accept',
    );
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }
    return response;
};

export function middleware(request) {
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin && allowedOrigins.has(origin);

    if (request.method === 'OPTIONS') {
        if (!isAllowedOrigin) {
            return new NextResponse(null, { status: 403 });
        }
        const preflight = new NextResponse(null, { status: 204 });
        return appendCorsHeaders(preflight, origin, request);
    }

    if (!isAllowedOrigin) {
        return NextResponse.next();
    }

    const response = NextResponse.next();
    return appendCorsHeaders(response, origin, request);
}

export const config = {
    matcher: ['/api/:path*'],
};
