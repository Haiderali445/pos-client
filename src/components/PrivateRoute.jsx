import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute({ roles }) {
  const location = useLocation();
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  const user = auth?.user || {};
  const userRole = (user.role || (user.userId === "admin" ? "admin" : "cashier")).toLowerCase();
  const isAdmin = userRole === "admin" || user.userId === "admin" || auth?.role === "admin";

  if (!auth?.authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const isAuthorized = roles.some((role) => {
      const r = role.toLowerCase();
      return r === userRole || (r === "admin" && isAdmin);
    });

    if (!isAuthorized) {
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}
