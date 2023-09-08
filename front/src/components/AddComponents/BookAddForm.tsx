import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { Author } from '../types';
import './BookAddForm.css';
import validGenres from '../../valid_genres.json';

// TODO: Fix up this entire component,,, it's way too big
let currentYear = new Date().getFullYear();

export default function BookForm() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [responseContent, setResponseContent] = useState('');
    const [genreSelected, setGenreSelected] = useState('');
    const [fetchAuthorsMessage, setFetchAuthorsMessage] = useState('');
    const [authorSelected, setAuthorSelected] = useState('');
    const [currentAuthors, setCurrentAuthors] = useState<Array<Author>>([]);
    
    // Gather names of authors from server for user to select from
    // TODO: Think of dependencies for the useEffect to only run on a successful addition to the database
    useEffect(() => {
        const fetchData = async() => {
            fetch('api/authors')
                .then(function(response: Response) {
                    if (response.status === 200) {
                        response.json().then(function ({ info }) {
                            setCurrentAuthors(info);
                            setFetchAuthorsMessage('');
                        });
                    } else {
                        response.json().then(function ({ error }) {
                            setFetchAuthorsMessage(`There was an error retrieving the authors for the books form. Error message from server: ${error}`);
                        });
                    }
                })
                .catch(function (error: any) {
                    setFetchAuthorsMessage(`There was an error with the Fetch API request. Error message from Fetch: ${error}`);
                });
        };
        fetchData();
    }, [responseContent]);;

    // Once form is submitted, do ur thing with the Fetch API
    // TODO: Prevent any author name from being added twice and fix this `any` tag
    const onBookSubmit = async (data: any) => {
        await fetch('/api/books', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(function(response: Response) {
            if (response.status === 200) {
                response.json().then(function({ info }) {
                    setResponseContent("Success! You've added a book!");
                });
            } else {
                response.json().then(function({ error }) {
                    setResponseContent(`There was an error when submitting your addition from the server. The message returned is as follows: ${ error}`);
                });
            }
        })
        .catch(function(error: any) {
            setResponseContent(`There was an error with the Fetch API. Please try your request again. Error from Fetch API: ${ error }`);
        });
    };

    const handleGenreChange = (event: SelectChangeEvent) => {
        setGenreSelected(event.target.value);
    };

    const handleAuthorChange = (event: SelectChangeEvent) => {
        setAuthorSelected(event.target.value);
    };

    return (
        // Do all the good stuff validation with react-hook-form,,
        <>
        <form onSubmit={ handleSubmit(onBookSubmit) }>
            {/* TODO: Figure out way to pull this out as a common component,, maybe how to  */}
            <InputLabel htmlFor='bookForm-author'>Author Name</InputLabel>
            <Select {...register('author_id', {
                    required: 'An author selection is required.'
                })}
                labelId='bookAddForm-author'
                id='bookAddForm-author'
                value={authorSelected}
                label='Author Name'
                onChange={handleAuthorChange}
                displayEmpty
            >
                <MenuItem disabled value=''>
                    <em>Select an author</em>
                </MenuItem>
                {/* Look at example generator on https://react-hook-form.com/form-builder example site, lifesaver  */}
                {currentAuthors.map((author) => {
                    return (
                        <MenuItem key={author.id} value={author.id}> { author.name } </MenuItem>
                    )
                })
                }
            </Select> 
            <p className='error'><>{errors.authorName?.message || fetchAuthorsMessage}</></p>

            <InputLabel htmlFor='bookAddForm-title'>Book Title</InputLabel>
            <TextField {...register('title', {
                required: 'A book title is required.',
                minLength: {
                    value: 5, 
                    message: 'A book title must be at least 5 characters long.'
                },
                maxLength: {
                    value: 50,
                    message: 'A book title may only be at most 50 characters long.'
                }
            })}
                id='bookAddForm-title'
            />
            <p className='error'><>{errors.title?.message}</></p>

            <InputLabel htmlFor='bookAddForm-pubYear'>Publication Year</InputLabel>
            <TextField {...register('pub_year', {
                required: 'A publication year is required.',
                valueAsNumber: true,
                min: {
                    value: 0,
                    message: 'A publication year must be a valid year.'
                },
                max: {
                    value: currentYear,
                    message: 'A publication year must not be in the future.'
                }
            })}
                id='bookAddForm-pubYear'
                type='number'
            />
            <p className='error'><>{errors.pub_year?.message}</></p>

            <InputLabel id='bookAddForm-genreLabel'>Genre</InputLabel>
            {/* See https://mui.com/material-ui/react-select/#labels-and-helper-text for how we got default label to appear */}
            <Select {...register('genre', {
                    required: 'A genre selection is required.'
                })}
                labelId='bookAddForm-genre'
                id='bookAddForm-genre'
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
            <p className='error'><>{ errors.genre?.message }</></p>

            <Button id='book-submit' type='submit' variant='contained'>Enter Book to Catalog</Button>
        </form>
        <p>{ responseContent }</p> 
        </>
    );
}