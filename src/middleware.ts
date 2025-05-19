import { NextRequest, NextResponse } from "next/server";
import { getUser, updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest, response: NextResponse) {
    const protectedRoutesList = ["/profile"],
        authRoutesList = ["/", "/log-in", "/sing-up"];
    const currentPath = new URL(request.url).pathname;
    const {
        data: { user },
    } = await getUser(request, response);
    if (protectedRoutesList.includes(currentPath) && !user) {
        return NextResponse.redirect(new URL("/log-in", request.url));
    }
    if (authRoutesList.includes(currentPath) && user) {
        return NextResponse.redirect(new URL("/profile", request.url));
    }
    await updateSession(request);
}
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};