import type { DemoUser, Role } from "@/lib/types";

export const DEMO_ROLE_STORAGE_KEY = "smart-logbook-demo-role";
export const DEMO_ROLE_CHANGED_EVENT = "smart-logbook-demo-role-changed";

export const ROLE_LABELS: Record<Role, string> = {
  inspector: "Inspector",
  supervisor: "Supervisor",
  manager: "Manager",
  admin: "Admin"
};

export const ROLE_PATHS: Record<Role, string> = {
  inspector: "/inspector",
  supervisor: "/supervisor",
  manager: "/manager",
  admin: "/manager"
};

export const FALLBACK_DEMO_USERS: DemoUser[] = [
  {
    id: 1,
    name: "Ramesh Kumar",
    employee_id: "INS-001",
    role: "inspector",
    created_at: new Date(0).toISOString()
  },
  {
    id: 2,
    name: "Suresh Patil",
    employee_id: "SUP-001",
    role: "supervisor",
    created_at: new Date(0).toISOString()
  },
  {
    id: 3,
    name: "Anita Rao",
    employee_id: "MGR-001",
    role: "manager",
    created_at: new Date(0).toISOString()
  }
];

const PREFERRED_NAMES: Partial<Record<Role, string>> = {
  inspector: "Ramesh Kumar",
  supervisor: "Suresh Patil",
  manager: "Anita Rao"
};

export function isRole(value: string | null): value is Role {
  return value === "inspector" || value === "supervisor" || value === "manager" || value === "admin";
}

export function pickUserForRole(users: DemoUser[], role: Role): DemoUser | null {
  const preferredName = PREFERRED_NAMES[role];
  return (
    users.find((user) => user.role === role && user.name === preferredName) ||
    users.find((user) => user.role === role) ||
    FALLBACK_DEMO_USERS.find((user) => user.role === role) ||
    null
  );
}
