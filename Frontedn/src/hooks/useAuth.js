// ─── hooks/useAuth.js ─────────────────────────────────────────────────────────
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectAuth, selectIsAuth, selectRole, selectFullName,
  selectTexnikumId, selectRoleMeta,
  loginThunk, logoutThunk,
} from "../store/slices/auth.slice";
import { ROLE_META, ROLES } from "../utils/constants";

export function useAuth() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const auth      = useSelector(selectAuth);
  const isAuth    = useSelector(selectIsAuth);
  const role      = useSelector(selectRole);
  const fullName  = useSelector(selectFullName);
  const texnikumId = useSelector(selectTexnikumId);
  const roleMeta  = useSelector(selectRoleMeta);

  const login = async (credentials) => {
    const result = await dispatch(loginThunk(credentials));
    if (loginThunk.fulfilled.match(result)) {
      const meta = ROLE_META[result.payload.role];
      navigate(meta?.redirectTo || "/");
      return { success: true };
    }
    return { success: false, error: result.payload };
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate("/login");
  };

  const isSuperAdmin  = role === ROLES.SUPERADMIN;
  const isFounder     = role === ROLES.FOUNDER;
  const isDirector    = role === ROLES.DIRECTOR;
  const isCenterAdmin = role === ROLES.CENTER_ADMIN;
  const isTeacher     = role === ROLES.TEACHER;
  const isStudent     = role === ROLES.STUDENT;

  return {
    ...auth,
    isAuth,
    role,
    fullName,
    texnikumId,
    roleMeta,
    login,
    logout,
    isSuperAdmin,
    isFounder,
    isDirector,
    isCenterAdmin,
    isTeacher,
    isStudent,
  };
}