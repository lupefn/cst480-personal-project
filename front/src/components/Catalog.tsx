import { useEffect, useState } from 'react';
import BooksTable from './BooksTable';
import { Author, BookWithAuthorName, ColumnDefinitionType } from './types';
import './Catalog.css';


export default function Catalog() {
    const [currentBooks, setCurrentBooks] = useState<Array<BookWithAuthorName>>([]);
    const [currentAuthors, setCurrentAuthors] = useState<Array<Author>>([]);
    const [failureMessage, setFailureMessage] = useState('');
    const columns:ColumnDefinitionType<BookWithAuthorName>[] = [
        {
            key: 'name',
            header: 'Author Name',
            width: 125
        },
        {
            key: 'title',
            header: 'Book Title',
            width: 200
        },
        {
            key: 'pub_year',
            header: 'Publication Year',
            width: 200
        },
        {
            key: 'genre',
            header: 'Book Genre',
            width: 200
        }
    ];

    // Tutorial with useEffect()
    // https://beta.reactjs.org/learn/synchronizing-with-effects
    // How to fetch data async
    // https://www.robinwieruch.de/react-hooks-fetch-data/
    useEffect(() => {
        const fetchData = async() => {
            await fetch('/api/authors')
                .then(function(response: Response) {
                    if (response.status === 200) {
                        response.json().then(function ({ info}) {
                            setCurrentAuthors(info);
                            setFailureMessage('');
                        });
                    } else {
                        response.json().then(function({error}) {
                            setFailureMessage(`There was an error with retrieving any books. Error message from server: ${error}`);    
                        });
                    }
                })
                .catch(function (error: any) {
                    setFailureMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
                });
            // Get all books
            await fetch('/api/books')
                .then(function(response: Response) {
                    if (response.status === 200) {
                        response.json().then(function ({ info }) {
                            setCurrentBooks(info);
                            setFailureMessage('');
                        });
                    } else {
                        response.json().then(function({error}) {
                            setFailureMessage(`There was an error with retrieving any books. Error message from server: ${error}`);    
                        setFailureMessage(`There was an error with retrieving any books. Error message from server: ${error}`);    
                            setFailureMessage(`There was an error with retrieving any books. Error message from server: ${error}`);    
                        }); 
                    }
                })
                .catch(function(error: any) {
                    setFailureMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
                });
        };
        fetchData();
    }, []); // empty array prevents effect function from running infinitely

    let errorMessage = failureMessage; // need to assign to different variable b/c react doesn't like us referencing state down in rendering

    return (
        <div className='catalog-content'>
            <h2 >Current Books in Library Catalog</h2>
            <p className='error'>{errorMessage}</p>
            <BooksTable data={currentBooks} columns={columns} />
        </div>
    );
}