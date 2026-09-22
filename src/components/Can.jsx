import React from "react";
import usePermission from "../hooks/usePermission";

export function Can({ perform, role, fallback = null, children }) {
  const { can, isRole } = usePermission();

  if (perform && !can(perform)) {
    return fallback;
  }

  if (role) {
    const rolesArray = Array.isArray(role) ? role : [role];
    if (!isRole(rolesArray)) {
      return fallback;
    }
  }

  return <>{children}</>;
}

export default Can;
