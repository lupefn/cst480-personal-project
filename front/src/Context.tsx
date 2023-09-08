import { createContext } from 'react';

export const AuthContext = createContext({
    auth: false,
    user: '',
    setAuth: (auth: boolean) => {},
    setUser: (name: string) => {},
});