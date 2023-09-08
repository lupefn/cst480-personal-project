import { useContext, useEffect, useState } from 'react'
import BookEditForm from './BookEditForm';
import BooksTable from '../BooksTable';
import './CatalogEdit.css';
import BookDeleteForm from './BookDeleteForm';
import { Author, Book, BookWithAuthorName, ColumnDefinitionType } from '../types';
import { AuthContext } from '../../Context';

export default function CatalogEdit() {
    const authContext = useContext(AuthContext);

    const [currentBooks, setCurrentBooks] = useState<Array<Book>>([]);
    const [currentAuthors, setCurrentAuthors] = useState<Array<Author>>([]);
    const [fetchResponseMessage, setFetchResponseMessage] = useState('');
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

    useEffect(() => {
        const fetchData = async() => {
            fetch(`/api/userEntries/${authContext.user}`)
                .then(function(response: Response) {
                    console.log('user', authContext.user)
                    if (response.status === 200) {
                        response.json().then(function ({ info }) {
                            setCurrentAuthors(info.authors);
                            setCurrentBooks(info.books);
                            // console.log('current books', currentBooks)
                            // console.log('current authors', currentAuthors);
                            setFetchResponseMessage('');
                        });
                    } else {
                        response.json().then(function ({ error }) {
                            setFetchResponseMessage(`There was an error with retrieving any books and authors. Error message from server: ${error}`);
                        });
                    }
                })
                .catch(function(error: any) {
                    setFetchResponseMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
                });
        }
        fetchData();
    }, [authContext.user]);

    return (
        <div className='catalog-edit-title'>
            <h2>Edit or delete an entry in our catalog!</h2>
            <p>{ fetchResponseMessage }</p>
            <BooksTable data={currentBooks} columns={columns} />

            {/* <Catalog /> */}
            <div className='edit-forms'>
                {/* Edit section */}
                <div className='edit-form'>
                    <h3>Edit Book Entry</h3>
                    <p>
                        Edit entries in our catalog. Select a book you'd like to edit and adjust the fields you'd like to update:
                    </p>
                    {/* TODO: Come back and allow any author to be changed here */}
                    <BookEditForm books={currentBooks} authors={currentAuthors} />
                </div>
                <div className='delete-form'>
                    {/* Delete section */}
                    <h3>Delete Book Entry</h3>
                    <p>
                        Delete entries in our catalog. Select a book you'd like to delete:
                    </p>
                    <BookDeleteForm books={currentBooks} />
                </div>
            </div>
        </div>
    );
}