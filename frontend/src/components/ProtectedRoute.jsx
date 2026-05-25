import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (roles.length && !roles.includes(user?.role)) return <Navigate to="/home" replace />;

  return children;
};

export default ProtectedRoute;
