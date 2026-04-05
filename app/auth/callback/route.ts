import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { sanitizeNextPath } from "@/lib/auth/callback-utils";

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function parseOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  return OTP_TYPES.includes(raw as EmailOtpType) ? (raw as EmailOtpType) : null;
}

/**
 * PKCE + email confirmation: Supabase redirects here with ?code=...
 * Some templates use ?token_hash=...&type=signup|email|recovery
 *
 * Session cookies MUST be set on the same NextResponse we return; using
 * cookies() from next/headers does not attach Set-Cookie to redirects.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const token_hash = url.searchParams.get("token_hash");
  const typeRaw = url.searchParams.get("type");

  const oauthError = url.searchParams.get("error");
  const oauthDesc = url.searchParams.get("error_description");

  const origin = url.origin;
  const safeNext = sanitizeNextPath(url.searchParams.get("next"));
  const otpType = parseOtpType(typeRaw);

  if (oauthError) {
    const msg = oauthDesc || oauthError;
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(msg)}`
    );
  }

  const target = `${origin}${safeNext}`;

  if (code) {
    const response = NextResponse.redirect(target);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
      );
    }

    return response;
  }

  if (token_hash && otpType) {
    const response = NextResponse.redirect(target);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType,
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
      );
    }

    return response;
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent("Missing confirmation parameters. Try the link from your email again, or sign in.")}`
  );
}
