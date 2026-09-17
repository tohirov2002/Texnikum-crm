import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

// allowedRoles = ["superadmin"] kabi massiv yoki bo'sh (har qanday autentifikatsiyalangan)
export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuth, role } = useAuth();
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}