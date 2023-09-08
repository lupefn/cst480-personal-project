import {
    Link, useNavigate
} from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Context';
import './NavBar.css'


export default function NavBar() {
    const authContext = useContext(AuthContext);
    const navigate = useNavigate();
    const onLogout = () => {
        fetch('/logout', {
            method: 'POST'
        })
        .then(function (response: Response) {
            if (response.status === 200) {
                authContext.setAuth(false);
                authContext.setUser('');
                localStorage.setItem('isLoggedIn', 'false');
                localStorage.setItem('user', '');
                return navigate('/');
            }
        });
    };

    const privateElements = <>
            <li>
                <Link to='/add'>Add</Link>
            </li>
            <li>
                <Link to='/edit'>Edit</Link>
            </li>
            <li>
                <div className='div-link' onClick={onLogout}>Logout</div>
            </li>
    </>;
    const loginLink = <>
            <li>
                <Link to='/login'>Login</Link>
            </li>
    </>;
    return (
        <nav className='nav-bar'>
            <div className='header'>Brexel's Library Catalog</div>
            <ul className='nav-links'>
                <div className='menu'>
                <li>
                    <Link to='/'>Home</Link>    
                </li>
                <li>
                    <Link to='/catalog'>Catalog</Link>
                </li>
                <li>
                    <Link to='/search'>Search</Link>
                </li>
                    
                { authContext.auth ? privateElements : loginLink }
                </div>
            </ul>
        </nav>
  );
}