import React from 'react';
import {Routes, Route, NavLink, Link, Navigate} from 'react-router-dom';
import {useAuth} from './context/AuthContext';
import RequireRole from './components/RequireRole';
import AuthPage from './features/auth/pages/AuthPage';
import ProfilePage from './features/auth/pages/ProfilePage';
import {catalogueRoutes} from './features/catalogue/routes';
import {cartRoutes} from './features/cart/routes';
import {ordersRoutes} from './features/orders/routes';
import {adminRoutes} from './features/admin/routes';
export default function App() {
  const {user,logout,error} = useAuth();
  return <><div className="announcement">Thoughtful choices. Everyday value.</div><header className="site-header"><Link className="brand" to="/products"><span className="brand-icon">B</span>BrightBuy<span className="brand-dot">.</span></Link><nav aria-label="Main navigation"><NavLink to="/products">Shop</NavLink><NavLink to="/categories">Categories</NavLink>{user && <><NavLink to="/orders">My orders</NavLink><NavLink to="/cart">Cart</NavLink>{['ADMIN','WAREHOUSE_STAFF'].includes(user.role)&&<NavLink to="/inventory/stock-adjustments">Inventory</NavLink>}{user.role==='ADMIN'&&<NavLink to="/admin">Admin</NavLink>}<NavLink to="/profile">Profile</NavLink><button onClick={logout}>Sign out</button></>}{!user&&<NavLink to="/login">Sign in</NavLink>}</nav></header>
  <main>{error && <p className="error" role="alert">{error}</p>}<Routes>
    <Route path="/" element={<Navigate to="/products" replace/>}/>
    <Route path="/admin/login" element={<AuthPage key="admin-login" admin/>}/>
    <Route path="/login" element={<AuthPage key="login"/>}/><Route path="/register" element={<AuthPage key="register" register/>}/>
    <Route path="/profile" element={<RequireRole><ProfilePage/></RequireRole>}/>
    {catalogueRoutes}{cartRoutes}{ordersRoutes}{adminRoutes}
    <Route path="*" element={<section className="panel"><h1>Page not found</h1><Link to="/products">Back to the shop</Link></section>}/>
  </Routes></main><footer><strong>BrightBuy</strong><span>Everyday essentials, all in one place.</span><span>Prototype · Card payments are simulated</span></footer></>;
}
