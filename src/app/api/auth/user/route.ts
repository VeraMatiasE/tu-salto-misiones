import { getUserProfile } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const userProfile = await getUserProfile();
        
        if (!userProfile) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        
        return NextResponse.json(userProfile);
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}