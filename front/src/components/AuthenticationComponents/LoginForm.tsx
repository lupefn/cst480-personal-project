import { useForm } from 'react-hook-form';
import { useContext, useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css'
import { AuthContext } from '../../Context';

export default function LoginForm() {
    const { register, handleSubmit, formState: { errors}} = useForm();
    const [responseContent, setResponseContent] = useState('');
    const navigate = useNavigate();
    const authContext = useContext(AuthContext);

    const login = (data: any) => {
        fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(function (response: Response) {
            if (response.status === 200) {
                response.json().then(function({ info }) {
                    setResponseContent(info.message);
                    authContext.setAuth(true);
                    authContext.setUser(info.username);
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('user', info.username);
                    return navigate('/');
                });
            } else {
                response.json().then(function({ error }) {
                    setResponseContent(error);
                    authContext.setAuth(false);
                    authContext.setUser('');
                    localStorage.setItem('isLoggedIn', 'false');
                    localStorage.setItem('user', '');
                });
            }
        })
        .catch(function(error: any) {
            setResponseContent(`There was an error with the Fetch API. Please try your request again. Error from Fetch API: ${error}`);
            authContext.setAuth(false);
            authContext.setUser('');
            localStorage.setItem('isLoggedIn', 'false');
            localStorage.setItem('user', '');
        });
    };

    return(
        <>
        <form onSubmit={ handleSubmit(login) }>
            <InputLabel htmlFor='login-username'>Enter your username: </InputLabel>
            <TextField {...register('username', {
                required: 'A username is required.',
                minLength: {
                    value: 5,
                    message: 'A username must be at least 5 characters long.'
                },
                maxLength: {
                    value: 20,
                    message: 'A username can only be at most 20 characters long.'
                }
            })}
                id='login-username'
            />
            <p className='error'><>{ errors.username?.message }</></p>

            <InputLabel htmlFor='login-password'>Enter your password: </InputLabel>
            <TextField {...register('password', {
                required: 'A password is required.',
                minLength: {
                    value: 8,
                    message: 'A password must be at least 8 characters long.'
                }
            })}
                id='login-password'
                type='password'
            />
            <p className='error'><>{ errors.password?.message }</></p>

            <Button id='login-submit' type='submit' variant='contained'>Login</Button>
        </form>
        <p>{ responseContent }</p>
    </>
    );
    
}