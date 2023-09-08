import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import validGenres from '../valid_genres.json';
import BooksTable from './BooksTable';
import { BookWithAuthorName, ColumnDefinitionType } from './types';
import './CatalogSearch.css';


export default function CatalogSearch() {
    // FIXME: Avoid querying all authors here for specific queried books
    let [queriedBooks, setQueriedBooks] = useState<Array<BookWithAuthorName>>([]);
    let [failureMessage, setFailureMessage] = useState('');
    // Declare columns that we'll use to generate table
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
    let location = useLocation();
    // Call use effect to watch location parameter here
    // FIXME: Deal with flash of old table when clicking on new genre to search for
    useEffect(() => {
        let searchParams = new URLSearchParams(location.search);
        // if we have no param, just return b/c we don't wanna make a query with no param
        if (!searchParams.has('genre')) { 
            return;
        }
        let genreToQuery = searchParams.get('genre');
        const fetchData = async () => {
            // Make fetch API request based on genre to query from query parameter
            fetch(`/api/books?genre=${genreToQuery}`)
                .then(function(response: Response) {
                    if (response.status === 200) {
                        response.json().then(function({ info }){
                            setQueriedBooks(info);
                            setFailureMessage('');
                        })
                    } else {
                        response.json().then(function({ error }) {
                            setQueriedBooks([]);
                            setFailureMessage(`There was an error with retrieving any books. Error message from server: ${error}`)    
                        })
                    }
                })
                .catch(function (error: any) {
                    setQueriedBooks([]);
                    setFailureMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
                });
        };
        fetchData();
    }, [location]); // Make get request based on location params changing
    // Generate content on whether there are query parameters or not
    // If there are query params, then we must check if we got anything back
    // If we did, then generate table! otherwise, tell client that we got nothing back
    let content;
    let message;
    let genreToQuery = location.search.slice(location.search.lastIndexOf('=')+1, location.search.length);
    if (location.search !== '') {
        if (queriedBooks.length === 0) {
            content = <>
                <p>
                    No books were returned with the {genreToQuery} genre.
                </p>
            </>;
        } else {
            content = <BooksTable data={queriedBooks} columns={columns} />
        }
    } else {
        content = <><ul>
            { validGenres.valid_genres.map((genre) => {
                return (
                    <li key={genre}>
                        <Link to={`${location.pathname}?genre=${genre}`}>{ genre }</Link>
                    </li>
                    )
                }
            )
        }
        </ul>
        </>
        
    }
    message = failureMessage;
    // Return what we want in terms of content (table or message that we never got anything) and message with error (if any)
    return (
        <>
            <h2>Book Search</h2>
            <p>Browse our catalog by genres! To generate a new query for a different genre, please click the 'Search' button again.</p>
            { content }
            <p>{ message }</p>
        </>
    );
}