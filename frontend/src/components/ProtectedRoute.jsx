import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/*
  ProtectedRoute - agar user logged in nahi hai, seedha login page
  pe bhej do. Dashboard aur uske andar ke saare routes isse wrap honge.
*/
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
