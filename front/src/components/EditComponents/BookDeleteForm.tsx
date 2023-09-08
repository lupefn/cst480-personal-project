import { FC, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { Book } from '../types';
import './BookDeleteForm.css';

type BookDeleteFormProps = {
    books: Array<Book>
}

let BookDeleteFormFC: FC<BookDeleteFormProps> = ({ books }) => {
    const { register, handleSubmit, formState: { errors }} = useForm();
    const [deleteResponseMessage, setDeleteResponseMessage] = useState('');
    const [bookSelected, setBookSelected] = useState('');
    const [showAlert, setShowAlert] = useState(false);

    const handleBookChange = (event: SelectChangeEvent) => {
        setShowAlert(false);
        setBookSelected(event.target.value);
    };

    const onBookInitialDeleteSubmit = () => {
        setShowAlert(!showAlert);
    };

    // TODO: Fix this `any` tag
    const onBookConfirmDeleteSubmit = async () => {
        await fetch(`/api/books/${bookSelected}`, {
            method: 'DELETE'
        })
        .then(function(response: Response) {
            if (response.status === 200) {
                response.json().then(function({ info }) {
                    setDeleteResponseMessage(`The book selected was successfully deleted. Please refresh the page to see your changes reflected.`);
                });
            } else {
                response.json().then(function({error}) {
                    setDeleteResponseMessage(`There was an error deleting the book. Error message from server: ${error}`);    
                }); 
            }
        })
        .catch(function(error: any) {
            setDeleteResponseMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
        }); 
    }
    // TODO: Remove alert once deletion happens
    const alertAndConfirmButton = <>
        <Alert variant='filled' severity='warning' style={{width: '30%', marginTop: '10px'}} >
            <AlertTitle>Warning</AlertTitle>
            You are about to delete this book permanently from the catalog. Are you <strong>sure</strong> that you want to proceed?
        </Alert>

        <Button id='bookDelete-confirm' variant='contained' onClick={onBookConfirmDeleteSubmit} color='error' style={{ marginTop: '10px'}}>Confirm Book Deletion</Button>
        <p>{ deleteResponseMessage }</p>
    </>;

    return (
        <>
        <form onSubmit={ handleSubmit(onBookInitialDeleteSubmit) }>
            <InputLabel htmlFor='bookForm-author'>Select a book to delete:</InputLabel>
            <Select {...register('bookName', {
                    required: 'A book selection is required.'
                })}
                labelId='bookForm-author'
                id='bookForm-author'
                value={bookSelected}
                label='Book Name'
                onChange={handleBookChange}
                displayEmpty
            >
                <MenuItem disabled value=''>
                    <em>Select a book</em>
                </MenuItem>
                {/* Look at example generator on https://react-hook-form.com/form-builder example site, lifesaver  */}
                {books.map((book: Book) => {
                    return (
                        <MenuItem key={book.id} value={book.id}> { book.title } </MenuItem>
                    )
                })
                }
            </Select> 
            <p className='error'><>{errors.bookName?.message }</></p>

            <Button id='bookDelete-initial' type='submit' variant='contained' color='warning' disabled={showAlert}>Delete Book from Catalog</Button>

            { showAlert ?  alertAndConfirmButton : null
            }
        </form>
        </>
    );

};

export default BookDeleteFormFC;