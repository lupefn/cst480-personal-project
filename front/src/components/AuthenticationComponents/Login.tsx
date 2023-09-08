import LoginForm from './LoginForm';
import './Login.css'

export default function Login() {
    return (
        <div className='login-page'>
            <h2>Login</h2>
            <h3>Welcome! Login to change our book/author data in our catalog!</h3>

            <LoginForm />
        </div>
    );
}