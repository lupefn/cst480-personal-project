import AuthorForm from './AuthorAddForm';
import BookForm from './BookAddForm';
import './CatalogAdd.css';

export default function CatalogAdd() {
    // https://react-hook-form.com/api/useform
    return (
        <>
        <div className='catalog-add-title'>
            <h2>Add an entry to our catalog!</h2>
            <p>
                Please note that you <strong>must</strong> add an author before attempting to enter a book with an author.
            </p>
            <p>Upon entering an author, you will receive an author ID that is generated for you, which will be requested when adding a book entry to our catalog.</p>
        </div>
        <div className='add-forms'>
            <div className='add-author-form'>
            <h3>Add Author Form</h3>
            <p>
                Please provide the following for an author to be added to the catalog:
                <ul>
                    <li>
                        <strong>A name</strong>
                    </li>
                    <ul>
                        <li>
                            Must be at least 5 characters long
                        </li>
                        <li>
                            Must not be longer than 50 characters long
                        </li>
                    </ul>
                    <li>
                        <strong>A biography</strong>
                    </li>
                    <ul>
                        <li>
                            Must be at least 10 characters long
                        </li>
                        <li>
                            Must not be longer than 250 characters long
                        </li>
                    </ul>
                </ul>
            </p>
            <AuthorForm />
            </div>

            <div className='add-book-form'>
                <h3>Add Book Form</h3>
                <p>
                    Please provide the following for a book to be added to the catalog:
                    <ul>
                        <li>
                            <strong>
                                An author
                            </strong>
                        </li>
                        <ul>
                            <li>
                                Must choose from existing authors in catalog
                            </li>
                        </ul>
                        <li>
                            <strong>
                                A book title
                            </strong>
                        </li>
                        <ul>
                            <li>
                                Must be at least 5 characters long
                            </li>
                            <li>
                                Must not be longer than 50 characters long
                            </li>
                        </ul>
                        <li>
                            <strong>
                                A publication year
                            </strong>
                        </li>
                        <ul>
                            <li>
                                Must be a valid year (at least the year 0 and not in the future)
                            </li>
                            <li>
                                Must be an integer (no decimals)
                            </li>
                        </ul>
                        <li>
                            <strong>
                                Genre
                            </strong>
                        </li>
                        <ul>
                            Must choose from provided, valid genres
                        </ul>
                    </ul>
                </p>
                <BookForm />
            </div>
        </div>
        </>
    );
}