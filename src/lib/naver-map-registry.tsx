"use client";

import { NavermapsProvider } from "react-naver-maps";

interface NaverMapRegistryProps {
  children: React.ReactNode;
}

export function NaverMapRegistry({ children }: NaverMapRegistryProps) {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;

  if (!clientId) {
    console.warn(
      "NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not set. Naver Maps will not work properly."
    );
  }

  return (
    <NavermapsProvider ncpClientId={clientId || ""}>
      {children}
    </NavermapsProvider>
  );
}

