import {
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { useContext } from 'react';
import Home from './Home';
import Catalog from './Catalog'
import CatalogAdd from './AddComponents/CatalogAdd'
import CatalogEdit from './EditComponents/CatalogEdit';
import CatalogSearch from './CatalogSearch';
import Login from './AuthenticationComponents/Login';
import NotFound from './NotFound';
import { AuthContext } from '../Context';

export default function Routing() {
    const authContext = useContext(AuthContext);

    return (
        <Routes>
            <Route path='/catalog' element={<Catalog />}/>
            <Route path='/add' element={<CatalogAdd />}/>
            <Route path='/edit' element={<CatalogEdit />}/>
            <Route path='/search' element={<CatalogSearch />}/>
            <Route path='/login' element={<Login />}/>
            <Route path='/logout' action={ async () => {
              await fetch('/logout', {
                method: 'post'
              }).then(function(response: Response) {
                // FIXME: Fix all the lack of response here
                  console.log('response, logout done!', response);
              });
              authContext.setAuth(false);
            }} element={
              <Navigate to='/' />
            }/>
            <Route path='/' element={<Home />}/>
            <Route path='*' element={<NotFound />} />
        </Routes>
    )
}