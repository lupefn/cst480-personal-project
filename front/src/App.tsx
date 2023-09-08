import {
  BrowserRouter as Router,
} from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthContext } from './Context';
import NavBar from './components/NavBar';
import Routing from './components/Routing';
import './App.css';

function App() {
  const [auth, setAuth] = useState(false);
  const [user, setUser] = useState('');
  // https://stackoverflow.com/questions/41030361/how-to-update-react-context-from-inside-a-child-component

  useEffect(() => {
    const loggedInLocal = localStorage.getItem('isLoggedIn');
    if (loggedInLocal) {
      // https://stackoverflow.com/a/264037
      let authStatus = (loggedInLocal === 'true');
      setAuth(authStatus);
    }

    const usernameLocal = localStorage.getItem('user');
    if (usernameLocal) {
      setUser(usernameLocal);
    }
  }, []);

  const value = { auth, setAuth, user, setUser };

  return (
    <AuthContext.Provider value={value}>
    <Router>
      <NavBar />
      <Routing />
    </Router>
    </AuthContext.Provider>
  );
}

export default App;
