"use server";

import { createSupabaseClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const supabase = await createSupabaseClient();
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    repeatPassword: formData.get("repeatPassword") as string,
  };
  if (credentials.password !== credentials.repeatPassword) redirect("/error");

  const { error } = await supabase.auth.signUp(credentials);
  if (error) redirect("/error");
  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function logIn(formData: FormData) {
  const supabase = await createSupabaseClient();
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect("/error");
  revalidatePath("/", "layout");
  redirect("/profile");
}

export async function logOut() {
  const supabase = await createSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/error");
  revalidatePath("/", "layout");
  redirect("/");
}