import { useMemo } from "react";
import { getEffectiveUser, hasPermission, hasAnyPermission, hasRole } from "../utils/permissions";

export function usePermission() {
  const user = getEffectiveUser();
  const role = (user?.role || "cashier").toLowerCase();
  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isCashier = role === "cashier";

  return useMemo(
    () => ({
      user,
      role,
      isAdmin,
      isManager,
      isCashier,
      can: (capability) => hasPermission(user, capability),
      canAny: (capabilities) => hasAnyPermission(user, capabilities),
      isRole: (roles) => hasRole(user, roles),
    }),
    [user, role, isAdmin, isManager, isCashier]
  );
}

export default usePermission;
