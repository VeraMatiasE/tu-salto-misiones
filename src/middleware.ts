import { NextRequest, NextResponse } from "next/server";
import { getUser, updateSession } from "./utils/supabase/middleware";

export async function middleware(request: NextRequest, response: NextResponse) {
    const protectedRoutesList = ["/profile"],
        authRoutesList = ["/", "/log-in", "/sing-up"];
    const currentPath = new URL(request.url).pathname;
    const adminRoutesList = ["/dashboard"];
    const {
        user, supabase
    } = await getUser(request, response);
    if (protectedRoutesList.includes(currentPath) && !user) {
        return NextResponse.redirect(new URL("/log-in", request.url));
    }
    if (authRoutesList.includes(currentPath) && user) {
        return NextResponse.redirect(new URL("/profile", request.url));
    }
    if (adminRoutesList.some(route => currentPath.startsWith(route))) {
        if (!user) {
            return NextResponse.redirect(new URL("/log-in", request.url));
        }
        const { data: userProfile, error } = await supabase
            .from("usuarios")
            .select("rol")
            .eq("uid_usuario", user.id)
            .single();

        if (error || !userProfile || !(userProfile.rol) ) {
            return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
    }
    await updateSession(request);
}
export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};