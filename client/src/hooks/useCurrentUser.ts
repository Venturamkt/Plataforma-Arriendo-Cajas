import { useQuery } from "@tanstack/react-query";

export interface CurrentUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  type: 'admin' | 'driver' | 'customer';
}

export function useCurrentUser() {
  const { data, isLoading, error } = useQuery<{ user: CurrentUser; type: string }>({
    queryKey: ["/api/auth/current"],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  console.log('useCurrentUser Debug:', { data, isLoading, error });

  return {
    user: data?.user,
    userType: data?.type,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
  };
}