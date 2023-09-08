import { useState } from 'react';
import { useForm } from 'react-hook-form';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import './AuthorAddForm.css';


export default function AuthorForm() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [responseContent, setResponseContent] = useState('');

    // Send request to server to add any entry from forms filled out
    const onAuthorSubmit = async (data: object) => {
        await fetch('/api/authors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(function(response: Response) {
            if (response.status === 200) {
                response.json().then(function({ info }) {
                    setResponseContent("Success! You've added an author!");
                });
            } else {
                response.json().then(function({ error }) {
                    setResponseContent(`There was an error when submitting your addition from the server. The message returned is as follows: ${error}`);
                });
            }
        })
        .catch(function(error: any) {
            setResponseContent(`There was an error with the Fetch API. Please try your response again. Error from Fetch API: ${error}`);
        });
    };

    return (
        <>
        <form onSubmit={ handleSubmit(onAuthorSubmit) }>
            <InputLabel htmlFor='authorForm-name'>Author Name</InputLabel>
            <TextField {...register('name', {
                required: 'An author name is required.',
                minLength: {
                    value: 5,
                    message: "An author's name must be at least 5 characters long."
                },
                maxLength: {
                    value: 50,
                    message: "An author's name may only be at most 50 characters long."
                }
            })}
                id='authorForm-name'
            />
            <p className='error'><>{errors.name?.message}</></p>

            <InputLabel htmlFor='authorForm-bio'>Author Biography</InputLabel>
            <TextField {...register('bio', {
                required: 'An author biography is required.',
                minLength: {
                    value: 10,
                    message: "An author's biography must be at least 10 characters long."
                },
                maxLength: {
                    value: 250,
                    message: "An author's biography may only be at most 250 characters long."
                }
            })}
            id='authorForm-bio'
            rows={4}
            multiline
            />

            <p className='error'><>{errors.bio?.message}</></p>

            <Button id='author-submit' type='submit' variant='contained'>Enter Author to Catalog</Button>
        </form>
        <p>{ responseContent }</p>
        </>
    );
}