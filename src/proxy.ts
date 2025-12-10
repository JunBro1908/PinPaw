import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Proxy (이전 Middleware)
 * 세션 확인 및 보호된 경로 접근 제어
 * Next.js 16에서 middleware가 proxy로 변경됨
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Supabase 클라이언트 생성 (쿠키 관리)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 세션 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 보호된 경로 정의 (/map은 제외 - 로그인 UI를 보여주는 페이지이므로)
  const protectedRoutes = ["/my"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 보호된 경로 접근 시 세션 확인
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/map", request.url));
  }

  return response;
}

/**
 * Proxy가 실행될 경로 설정
 * 정적 파일(이미지, CSS, JS 등)은 제외
 */
export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청 경로에 매칭:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, apple-touch-icon.png (icon files)
     * - 이미지 파일 (.svg, .png, .jpg, .jpeg, .gif, .webp)
     * - 폰트 파일 (.woff, .woff2, .ttf, .eot)
     * - 기타 정적 파일 (.ico, .json, .xml)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|apple-touch-icon.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|ico|json|xml)$).*)",
  ],
};
