import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { api, type User } from "./api";

interface AuthState {
  user: User | null;
  ready: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ user: null, ready: false, setUser: () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const { data, isFetched } = useQuery({ queryKey: ["me"], queryFn: () => api.me().then((r) => r.user), staleTime: 60_000, retry: 1 });

  const setUser = useCallback(
    (user: User | null) => {
      client.setQueryData(["me"], user);
      // Anything personalised (favourites, my trips) must be refetched for the new identity.
      void client.invalidateQueries({ predicate: (q) => q.queryKey[0] !== "me" });
    },
    [client],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined);
    setUser(null);
  }, [setUser]);

  const value = useMemo(() => ({ user: data ?? null, ready: isFetched, setUser, logout }), [data, isFetched, setUser, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function usePublicConfig() {
  return useQuery({ queryKey: ["config"], queryFn: api.config, staleTime: Infinity, retry: 1 });
}
