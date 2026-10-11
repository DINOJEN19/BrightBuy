import React, {useState} from 'react';
import {Link, useLocation, useNavigate} from 'react-router-dom';
import client from '../../../api/client';
import {useAuth} from '../../../context/AuthContext';
export default function AuthPage({register=false,admin=false}) {
  const {login} = useAuth();
  const location = useLocation(); const navigate = useNavigate();
  const [error,setError] = useState(''); const [busy,setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if(register) await client.post('/auth/register',data);
      const account=await login(data.email,data.password,admin?'ADMIN':'CUSTOMER');
      const from = location.state?.from;
      if(account.role==='ADMIN'){navigate('/admin',{replace:true});return;}
      navigate(typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/products', {replace:true});
    } catch(err) {setError(err.message);} finally {setBusy(false);}
  }
  return <section className="auth-card panel"><p className="eyebrow">YOUR BRIGHTBUY ACCOUNT</p><h1>{register?'Create an account':admin?'Admin sign in':'Customer sign in'}</h1><p>{register?'Save your details and start shopping.':admin?'Manage products, pictures and inventory with your administrator account.':'Sign in to pick up where you left off.'}</p>
    {!register&&<nav className="login-roles" aria-label="Sign-in role"><Link to="/login" aria-current={!admin?'page':undefined} state={location.state}>Customer</Link><Link to="/admin/login" aria-current={admin?'page':undefined} state={location.state}>Admin</Link></nav>}
    {error && <p role="alert" className="error">{error}</p>}
    <form onSubmit={submit}>
      {register && <label>Full name<input name="fullName" required minLength={2} maxLength={100} autoComplete="name"/></label>}
      <label>Email<input name="email" type="email" required maxLength={150} autoComplete="email"/></label>
      <label>Password<input name="password" type="password" required minLength={register?8:1} maxLength={72} autoComplete={register?'new-password':'current-password'}/></label>
      {register && <><label>Phone<input name="phone" type="tel" required maxLength={20} autoComplete="tel"/></label><label>Address<input name="address" required maxLength={255} autoComplete="street-address"/></label><label>City<input name="city" required maxLength={80} autoComplete="address-level2"/></label></>}
      <button disabled={busy} className="primary">{busy?'Please wait…':register?'Create account':'Sign in'}</button>
    </form>{admin?<p>Administrator accounts are assigned by the project owner. Customer registration does not grant admin access.</p>:<p>{register?'Already registered?':'New to BrightBuy?'} <Link to={register?'/login':'/register'} state={location.state}>{register?'Sign in':'Create an account'}</Link></p>}
  </section>;
}

