import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gray-100 flex justify-center items-center">
      <div className="w-full max-w-[480px] h-[100dvh] bg-white relative overflow-hidden">
        <main className="h-full w-full overflow-hidden pb-16">{children}</main>
      </div>
    </div>
  );
}
