export const ROLE_PERMISSIONS = {
  cashier: [
    "pos:checkout",
    "bills:read",
    "catalog:read",
  ],
  manager: [
    "pos:checkout",
    "bills:read",
    "bills:edit",
    "bills:void",
    "catalog:read",
    "catalog:manage",
    "expenses:manage",
    "dealers:manage",
    "analytics:read",
  ],
  admin: [
    "pos:checkout",
    "bills:read",
    "bills:edit",
    "bills:void",
    "bills:delete",
    "catalog:read",
    "catalog:manage",
    "catalog:delete",
    "expenses:manage",
    "dealers:manage",
    "analytics:read",
    "users:manage",
    "tenant:config",
  ],
};

export function getEffectiveUser() {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    return auth?.user || null;
  } catch {
    return null;
  }
}

export function hasPermission(user, requiredCapability) {
  if (!user) return false;
  const role = (user.role || "cashier").toLowerCase();

  // Admin has full system capabilities
  if (role === "admin") return true;

  // Check explicit user permissions array
  if (Array.isArray(user.permissions) && user.permissions.includes(requiredCapability)) {
    return true;
  }

  // Check role-based capabilities
  const capabilities = ROLE_PERMISSIONS[role] || [];
  return capabilities.includes(requiredCapability);
}

export function hasAnyPermission(user, capabilities = []) {
  if (!user) return false;
  if (!capabilities || capabilities.length === 0) return true;
  return capabilities.some((cap) => hasPermission(user, cap));
}

export function hasRole(user, allowedRoles = []) {
  if (!user) return false;
  const role = (user.role || "cashier").toLowerCase();
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.map((r) => r.toLowerCase()).includes(role);
}
