import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseClient() {
    const cookiesStore = await cookies()
    return createServerClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookiesStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookiesStore.set(name, value, options);
                        });
                    } catch {

                    }
                }

            },

        }

    );
}

export async function getAuthenticatedUser() {
    const supabase = await createSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
        return null;
    }
    
    return user;
}

export async function getUserProfile() {
    const supabase = await createSupabaseClient();
    const user = await getAuthenticatedUser();
    
    if (!user) return null;
    
    const { data: profile, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("uid_usuario", user.id)
        .single();
    
    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    
    return { user, profile };
}