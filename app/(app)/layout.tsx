import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppShell from "@/components/AppShell";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppShell>{children}</AppShell>
        <PWAInstallPrompt />
      </LanguageProvider>
    </AuthProvider>
  );
}
