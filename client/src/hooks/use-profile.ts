import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@shared/schema";

async function fetchProfile(): Promise<Profile | null> {
  const response = await fetch("/api/profile", {
    credentials: "include",
  });

  if (response.status === 401 || response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useProfile() {
  const { data: profile, isLoading } = useQuery<Profile | null>({
    queryKey: ["/api/profile"],
    queryFn: fetchProfile,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    profile,
    isLoading,
    isAdmin: profile?.role === "admin",
    isAgent: profile?.role === "agent",
    isCustomer: profile?.role === "customer",
  };
}
