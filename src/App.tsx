import { useAuth } from "./auth/AuthProvider";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import ResetPasswordScreen from "./components/ResetPasswordScreen";

export default function App() {
  const { session, isLoading, isConfigured, recoveryMode, signIn, resetPassword, updatePassword, signOut } = useAuth();

  if (isLoading) {
    return (
      <main className="loading-screen" aria-label="Oturum kontrol ediliyor">
        <span className="loading-mark">m.</span>
        <span className="loading-line" />
      </main>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        isConfigured={isConfigured}
        onSignIn={signIn}
        onResetPassword={resetPassword}
      />
    );
  }

  if (recoveryMode) return <ResetPasswordScreen onUpdatePassword={updatePassword} />;

  const emailName = session.user.email?.split("@")[0]?.split(/[._-]/).filter(Boolean).map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1)).join(" ");
  const displayName = typeof session.user.user_metadata.full_name === "string"
    ? session.user.user_metadata.full_name
    : emailName || "Yönetici";

  return (
    <Dashboard
      email={session.user.email ?? ""}
      displayName={displayName}
      onSignOut={signOut}
    />
  );
}
