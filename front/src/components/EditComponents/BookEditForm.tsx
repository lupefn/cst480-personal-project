import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FC, useEffect, useState } from 'react';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import validGenres from '../../valid_genres.json';
import { Book, Author } from '../types';
import './BookEditForm.css';

type BookEditFormProps = {
    books: Array<Book>,
    authors: Array<Author>
}

let currentYear = new Date().getFullYear();
const updateSchema = z.object({
    author_id: z.string({
                    invalid_type_error: 'A valid string must be provided for the title.'
                })
                .optional(),
    title:     z.string({
                    invalid_type_error: 'A valid string must be provided for the title.'
                }).optional(),
    // See https://github.com/react-hook-form/react-hook-form/discussions/6980 for coerce,,, thank you Claudius10
    pub_year:  z.coerce.number()
                .int()
                .nonnegative({
                    message: 'A valid year must be provided.'
                })
                .lte(currentYear, {
                    message: 'A valid year must be provided.'
                })
                .optional(),
    genre:     z.string().optional(),
    })
    .refine(
        ({ author_id, title, pub_year, genre }) => author_id !== undefined || title !== undefined || pub_year !== undefined || genre !== undefined, 
        { message: 'An author ID, title, publication year, or genre field must be defined to update a book.' }
);
type UpdateSchema = z.infer<typeof updateSchema>;

let BookEditForm: FC<BookEditFormProps> = ({ books, authors }) => {
    const { register, handleSubmit, formState: { errors } } = useForm<UpdateSchema>({
        resolver: zodResolver(updateSchema),
    });
    const [editResponseMessage, setEditResponseMessage] = useState('');
    const [bookSelected, setBookSelected] = useState('');
    const [authorSelected, setAuthorSelected] = useState('');
    const [genreSelected, setGenreSelected] = useState('');

    const onBookEditSubmit: SubmitHandler<UpdateSchema> = async (editInfo: any) => {
        // Start building up update body that we're gonna send!
        let updateBody: {[index: string]: string|number} = {};
        
        for (const field in editInfo) {
            if (editInfo[field]) {
                updateBody[field] = editInfo[field];
            }
        }

        fetch(`/api/books/${bookSelected}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateBody)
        })
        .then(function(response: Response) {
            if (response.status === 200) {
                response.json().then(function({ info }) {
                    setEditResponseMessage("Success! You've edited a book!");
                });
            } else {
                response.json().then(function({ error }) {
                    setEditResponseMessage(`'There was an error when submitting your edit to the server. The message returned is as follows: ${error}`);
                });
            }
        })
        .catch(function(error: any) {
            setEditResponseMessage(`There was an error with the Fetch API. Please try your edit again. Error from Fetch API: ${error}`);
        });
    };

    const handleBookChange = (event: SelectChangeEvent) => {
        setBookSelected(event.target.value);
    };

    const handleAuthorChange = (event: SelectChangeEvent) => {
        setAuthorSelected(event.target.value);
    };
    // Need this handler to regenerate input dropdown with correct and current genre selection
    const handleGenreChange = (event: SelectChangeEvent) => {
        setGenreSelected(event.target.value);
    };

    return (
        <>
        <form onSubmit={handleSubmit(onBookEditSubmit)}>
            <InputLabel id='bookEditForm-bookId'>Select a book to edit by its title:</InputLabel>
            <Select
                labelId='bookEditForm-bookId'
                id='bookEditForm-bookId'
                value={bookSelected}
                onChange={handleBookChange}
                displayEmpty
                required
            >
                <MenuItem disabled value=''>
                    <em>Select a book title</em>
                </MenuItem>
                {books?.map((book) => {
                    return (
                        <MenuItem key={book.id} value={book.id}> { book.title } </MenuItem>
                    )
                })
                }                
            </Select>
            

            <InputLabel htmlFor='bookForm-author'>Edit the author affiliated with the book:</InputLabel>
            <Select {...register('author_id')}
                labelId='bookEditForm-author'
                id='bookEditForm-author'
                value={authorSelected}
                label='Author Name'
                onChange={handleAuthorChange}
                displayEmpty
            >
                <MenuItem disabled value=''>
                    <em>Select an author</em>
                </MenuItem>
                {/* Look at example generator on https://react-hook-form.com/form-builder example site, lifesaver  */}
                {authors.map((author) => {
                    return (
                        <MenuItem key={author.id} value={author.id}> { author.name } </MenuItem>
                    )
                })
                }
            </Select> 
            <p className='error'><>{ errors.author_id ? errors.author_id?.message : null}</></p>

            <InputLabel id='bookEditForm-title'>Edit the book title:</InputLabel>
            <TextField {...register('title')}
                id='bookEditForm-title'
            />
            <p className='error'><>{ errors.title ? errors.title?.message : null} </></p>

            <InputLabel htmlFor='bookEditForm-pubYear'>Edit the publication year with the book:</InputLabel>
            {/* See https://github.com/react-hook-form/react-hook-form/discussions/6980 for headache with using valueAsNumber */}
            <TextField {...register('pub_year')}
                id='bookEditForm-pubYear'
                type='number'
            />
            <p className='error'><>{ errors.pub_year ? errors.pub_year?.message : null}</></p>

            <InputLabel id='bookEditForm-genreLabel'>Edit the genre with the book:</InputLabel>
            {/* See https://mui.com/material-ui/react-select/#labels-and-helper-text for how we got default label to appear */}
            <Select {...register('genre')}
                labelId='bookEditForm-genre'
                id='bookEditForm-genre'
                value={genreSelected}
                label='Genre'
                onChange={handleGenreChange}
                displayEmpty
            >
                <MenuItem disabled value=''>
                    <em>Select a genre</em>
                </MenuItem>
                {/* Look at example generator on https://react-hook-form.com/form-builder example site, lifesaver  */}
                {validGenres.valid_genres.map((genre) => {
                    return (
                        <MenuItem key={genre} value={genre}> { genre } </MenuItem>
                    )
                })
                }
            </Select>
            <p className='error'><>{ errors.genre ? errors.genre?.message : null}</></p>

            <Button id='bookEdit-submit' type='submit' variant='contained'>Edit Book in Catalog</Button>

            <p>{ editResponseMessage }</p>

        </form>
        </>
    );
};

export default BookEditForm;