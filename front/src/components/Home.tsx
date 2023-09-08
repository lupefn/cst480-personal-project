import './Home.css'
import { AuthContext } from '../Context';
import { useContext } from 'react';


export default function Home() {
    const authContext = useContext(AuthContext);
    
    return (
        <div>
            { authContext.auth ? <h2><strong>Welcome { authContext.user }!</strong></h2> : null }

            <p>Please use the links above to navigate the library catalog.</p>
            <p>The <strong>Home</strong> link will bring you back to this page.</p>
            <p>The <strong>Catalog</strong> link will display all of the books we have.</p>
            <p>The <strong>Search</strong> link will allow you to search the books in the catalog by genre.</p>
            { authContext.auth ? <> <p>The <strong>Add</strong> link will allow you to add an author and/or book to the catalog.</p>
            
            <p>The <strong>Edit</strong> link will allow you to edit or delete a book entry in the catalog.</p>
            </> 
            : <p>If you would like to add/edit/delete a book/author to our catalog, you must be logged in.</p> 
            }

            

            
        </div>
    );
}