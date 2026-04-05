import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/clients",
  "/pipeline",
  "/proposals",
  "/invoices",
  "/assistant",
  "/settings",
  "/onboarding",
];

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function isAuthPage(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/signup";
}

function redirectPreservingSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  modifier: (url: URL) => void
) {
  const url = request.nextUrl.clone();
  modifier(url);
  const res = NextResponse.redirect(url);
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    res.cookies.set(cookie.name, cookie.value);
  });
  return res;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/stripe/webhook")) {
    return supabaseResponse;
  }

  if (!user) {
    if (isProtectedPath(pathname) || pathname === "/upgrade") {
      return redirectPreservingSession(
        request,
        supabaseResponse,
        (url) => {
          url.pathname = "/auth/login";
          url.searchParams.set("next", pathname);
        }
      );
    }
    return supabaseResponse;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "freelancer_type, trial_ends_at, subscription_status"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (isAuthPage(pathname)) {
    return redirectPreservingSession(request, supabaseResponse, (url) => {
      url.pathname = "/dashboard";
      url.search = "";
    });
  }

  if (!profile?.freelancer_type && pathname !== "/onboarding") {
    return redirectPreservingSession(request, supabaseResponse, (url) => {
      url.pathname = "/onboarding";
    });
  }

  if (profile?.freelancer_type && pathname === "/onboarding") {
    return redirectPreservingSession(request, supabaseResponse, (url) => {
      url.pathname = "/dashboard";
    });
  }

  const active =
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "trialing";

  if (active && pathname === "/upgrade") {
    return redirectPreservingSession(request, supabaseResponse, (url) => {
      url.pathname = "/dashboard";
    });
  }

  const trialEnd = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;
  const trialExpired = trialEnd ? trialEnd.getTime() < Date.now() : false;

  const mustUpgrade = !active && trialExpired;

  if (
    mustUpgrade &&
    pathname !== "/upgrade" &&
    !pathname.startsWith("/auth")
  ) {
    return redirectPreservingSession(request, supabaseResponse, (url) => {
      url.pathname = "/upgrade";
    });
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
