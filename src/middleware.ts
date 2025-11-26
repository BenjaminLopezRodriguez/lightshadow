import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
    async function middleware(req) {
        // console.log("look at me", req.kindeAuth);
    },
    {
        isReturnToCurrentPage: true,
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth (auth routes)
         */
        "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
    ],
};
