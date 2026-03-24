"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

function safeCallbackUrl(raw: FormDataEntryValue | null): string {
  if (!raw || typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function redirectToLoginWithError(
  code: "credentials" | "invalid",
  callbackUrl: string
): never {
  const q = new URLSearchParams();
  q.set("error", code);
  q.set("callbackUrl", callbackUrl);
  redirect(`/login?${q.toString()}`);
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const callbackUrl = safeCallbackUrl(formData.get("callbackUrl"));

  if (typeof email !== "string" || typeof password !== "string") {
    redirectToLoginWithError("invalid", callbackUrl);
  }

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: callbackUrl,
    });

    if (typeof result === "string") {
      let hasError = result.includes("error=");
      if (!hasError) {
        try {
          hasError = new URL(result, "http://n.local").searchParams.has("error");
        } catch {
          /* ignore */
        }
      }
      if (hasError) {
        redirectToLoginWithError("credentials", callbackUrl);
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      redirectToLoginWithError("credentials", callbackUrl);
    }
    throw error;
  }

  redirect(callbackUrl);
}
