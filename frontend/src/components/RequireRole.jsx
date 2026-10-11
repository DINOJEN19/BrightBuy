import React from 'react';
import {Navigate, useLocation, Link} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';
export default function RequireRole({roles, children}) {
  const {user, loading} = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Restoring your session…</p>;
  if (!user) return <Navigate to={roles?.includes('ADMIN')?'/admin/login':'/login'} replace state={{from: location.pathname + location.search}}/>;
  if (roles && !roles.includes(user.role)) return <section className="panel"><h1>Access restricted</h1><p>Your account does not have access to this page.</p><Link to="/products">Browse products</Link></section>;
  return children;
}
