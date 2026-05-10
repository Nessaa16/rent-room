/**
 * Utility function untuk checking authentication status
 */
export async function checkAuth(): Promise<{
  isAuthenticated: boolean;
  user?: { id: number; email: string; nama?: string; role: string };
}> {
  try {
    const response = await fetch("/api/auth/verify", {
      method: "GET",
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      return { isAuthenticated: false };
    }

    const data = await response.json();
    return {
      isAuthenticated: data.success,
      user: data.data?.user,
    };
  } catch (error) {
    console.error("Error checking auth:", error);
    return { isAuthenticated: false };
  }
}

/**
 * Redirect to login if not authenticated (client-side)
 */
export function redirectToLoginIfNotAuth(
  isAuthenticated: boolean,
  router: any
) {
  if (!isAuthenticated) {
    router.push("/login");
  }
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(): Promise<boolean> {
  const auth = await checkAuth();
  return auth.isAuthenticated && auth.user?.role === "admin";
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const auth = await checkAuth();
  return auth.user;
}
