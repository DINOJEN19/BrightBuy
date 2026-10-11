import React, {createContext, useContext, useEffect, useState} from 'react';
import client from '../api/client';
const AuthContext = createContext(null);
export function AuthProvider({children}) {
  const [user,setUser] = useState(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState('');
  useEffect(() => {
    let active = true;
    const signout = () => setUser(null);
    window.addEventListener('brightbuy:signout', signout);
    if (sessionStorage.getItem('brightbuy.token')) {
      client.get('/customers/me').then(res => {if(active) setUser(res.data.data);})
        .catch(err => {if(active) setError(err.message);})
        .finally(() => {if(active) setLoading(false);});
    } else setLoading(false);
    return () => {active=false; window.removeEventListener('brightbuy:signout', signout);};
  }, []);
  async function login(email,password,portal) {
    const {data} = await client.post('/auth/login',{email,password,...(portal?{portal}:{})});
    sessionStorage.setItem('brightbuy.token',data.data.token);
    setUser(data.data.customer); setError('');
    return data.data.customer;
  }
  function logout() {sessionStorage.removeItem('brightbuy.token'); setUser(null); setError('');}
  return <AuthContext.Provider value={{user,loading,isLoading:loading,isAuthenticated:!!user,error,login,logout,setUser}}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
