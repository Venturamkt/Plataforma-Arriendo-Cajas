import { QueryClient } from "@tanstack/react-query";

// Simple query function that always works
const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = queryKey.join("");
  const response = await fetch(url, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      return null; // Return null for unauthorized instead of throwing
    }
    throw new Error(`${response.status}: ${response.statusText}`);
  }
  
  return response.json();
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

// API request helper for mutations
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}