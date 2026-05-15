"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { getDemoUsers } from "@/lib/api";
import {
  DEMO_ROLE_CHANGED_EVENT,
  DEMO_ROLE_STORAGE_KEY,
  FALLBACK_DEMO_USERS,
  isRole,
  pickUserForRole
} from "@/lib/demoRole";
import type { DemoUser, Role } from "@/lib/types";

export function useDemoUser() {
  const [users, setUsers] = useState<DemoUser[]>(FALLBACK_DEMO_USERS);
  const [activeRole, setActiveRoleState] = useState<Role>("inspector");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    if (isRole(storedRole)) {
      setActiveRoleState(storedRole);
    }

    function syncRole() {
      const nextRole = window.localStorage.getItem(DEMO_ROLE_STORAGE_KEY);
      if (isRole(nextRole)) {
        setActiveRoleState(nextRole);
      }
    }

    window.addEventListener("storage", syncRole);
    window.addEventListener(DEMO_ROLE_CHANGED_EVENT, syncRole);
    return () => {
      window.removeEventListener("storage", syncRole);
      window.removeEventListener(DEMO_ROLE_CHANGED_EVENT, syncRole);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const demoUsers = await getDemoUsers();
        if (!cancelled) {
          setUsers(demoUsers.length > 0 ? demoUsers : FALLBACK_DEMO_USERS);
        }
      } catch {
        if (!cancelled) {
          setUsers(FALLBACK_DEMO_USERS);
          setError("Using built-in demo users until the backend is reachable.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveRole = useCallback((role: Role) => {
    setActiveRoleState(role);
    window.localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    window.dispatchEvent(new Event(DEMO_ROLE_CHANGED_EVENT));
  }, []);

  const getUserForRole = useCallback((role: Role) => pickUserForRole(users, role), [users]);

  const activeUser = useMemo(() => pickUserForRole(users, activeRole), [activeRole, users]);

  return {
    users,
    activeRole,
    activeUser,
    loading,
    error,
    setActiveRole,
    getUserForRole
  };
}
