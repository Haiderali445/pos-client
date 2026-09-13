import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { hasPermission, hasRole } from "../utils/permissions";

export default function PrivateRoute({ roles, permissions }) {
  const location = useLocation();
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  const user = auth?.user || null;

  if (!auth?.authenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role verification
  if (roles && roles.length > 0) {
    if (!hasRole(user, roles)) {
      return <Navigate to="/" replace />;
    }
  }

  // Granular capability verification
  if (permissions && permissions.length > 0) {
    const isAuthorized = permissions.some((cap) => hasPermission(user, cap));
    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
