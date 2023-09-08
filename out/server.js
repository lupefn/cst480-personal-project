import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as url from 'url';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { fromZodError } from 'zod-validation-error';
import path from 'path';
import * as argon2 from 'argon2';
import cookieParser from 'cookie-parser';
import { NIL as NIL_UUID, v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import helmet from 'helmet';
let app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(cookieParser());
app.use(helmet());
// create database 'connection'
// use absolute path to avoid this issue
// https://github.com/TryGhost/node-sqlite3/issues/441
let __dirname = url.fileURLToPath(new URL('..', import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
    filename: dbfile,
    driver: sqlite3.Database,
});
await db.get('PRAGMA foreign_keys = ON'); // PRAGMA command specific to SQLite; sets enforcement of foreign key constraints
await db.get('PRAGMA journal_mode = WAL'); // PRAGMA command to allow reading and writing simultaneously
// Had to use this roundabout way to import json to do authentication how I wanted here: https://stackoverflow.com/a/70602109 because node doesn't support importing JSON files dynamically for some reason; see this Github issue for the debate on this: https://github.com/microsoft/TypeScript/issues/51783
async function readJsonFile(path) {
    const file = await readFile(path, 'utf-8');
    return JSON.parse(file);
}
;
// Authentication helper functions and vars
function makeToken() {
    return crypto.randomBytes(32).toString('hex');
}
;
let tokenStorage = {};
let cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict', // only sent to this domain
};
let validGenresFile = await readJsonFile('../valid_genres.json');
let validTokensFile = await readJsonFile('../valid_tokens.json');
let validGenres = validGenresFile.validGenres;
let validTokens = validTokensFile.validTokens;
// Add test tokens into token storage FOR TESTING
if (process.env.PROD === '0') {
    validTokens.forEach((token) => {
        tokenStorage[token] = { username: 'lupefn' };
    });
}
let uuidCharRegex = new RegExp('\[0-9a-f\]\{8\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{4\}\-\[0-9a-f\]\{12\}');
let currentYear = new Date().getFullYear();
// Create schemas for validation of requests
const authorIdSchema = z.string({
    required_error: 'author_id must be provided'
})
    .length(36, {
    message: 'author_id must be 36 characters long'
})
    .regex(uuidCharRegex, {
    message: 'Must be a valid uuid v4'
});
const titleSchema = z.string({
    required_error: 'title must be provided',
    invalid_type_error: 'A valid string must be provided for the title'
})
    .min(5, {
    message: 'title must be at least 5 characters long'
})
    .max(50, {
    message: 'title must be at most 50 characters long'
});
const pubYearSchema = z.number({
    required_error: 'pub_year must be provided',
    invalid_type_error: 'A valid number must be provided for the pub_year'
})
    .int()
    // TODO: Check on documentation on whether 0 is valid as a nonneg num
    .nonnegative({
    message: 'A valid year must be provided for pub_year'
})
    .lte(currentYear, {
    message: 'A valid year must be provided for pub_year'
});
const userSchema = z.string({
    required_error: 'user must be provided'
})
    .min(5, {
    message: 'user must be at least 5 characters long'
})
    .max(20, {
    message: 'user must be at most 20 characters long'
});
// deal with enumeration error here
const genreSchema = z.enum(validGenres);
// TODO: write tests
const authorSchema = z.object({
    name: z.string({
        required_error: 'name must be provided'
    })
        .min(5, {
        message: 'name must be at least 5 characters long'
    })
        .max(50, {
        message: 'name must be at most 50 characters long'
    }),
    bio: z.string({
        required_error: 'bio must be provided'
    })
        .min(10, {
        message: 'bio must be at least 10 characters long'
    })
        .max(250, {
        message: 'bio must be at most 250 characters long'
    }),
    user: userSchema
}).strict();
const bookSchema = z.object({
    author_id: authorIdSchema,
    title: titleSchema,
    pub_year: pubYearSchema,
    genre: genreSchema,
    user: userSchema,
}).strict();
const idSchema = z.string()
    .regex(uuidCharRegex, {
    message: 'Must be a valid UUID v4'
})
    .length(36, {
    message: 'ID provided must be 32 characters long'
});
// See https://stackoverflow.com/a/73294947 for approach for how to require at least one field here to be defined
const updateSchema = z.object({
    author_id: authorIdSchema.optional(),
    title: titleSchema.optional(),
    pub_year: pubYearSchema.optional(),
    genre: genreSchema.optional(),
})
    .refine(({ author_id, title, pub_year, genre }) => author_id !== undefined || title !== undefined || pub_year !== undefined || genre !== undefined, { message: 'An author ID, title, publication year, or genre field must be defined to update a book.' });
// TODO: Write tests
const loginSchema = z.object({
    username: z.string().min(5, {
        message: 'A username must be at least 5 characters long.'
    }).max(20, {
        message: 'A username can only be at most 20 characters long.'
    }),
    password: z.string().min(8, {
        message: 'A password must be at least 8 characters long.'
    })
});
async function authorDelete(req, res) {
    // Validate that the ID passed to you is a valid alphanumeric string
    let authorId = req.params.id;
    let parseResult = idSchema.safeParse(authorId);
    if (!parseResult.success) {
        return res.status(400).json({ error: `${fromZodError(parseResult.error)}` });
    }
    // Check for authorization of all authors being able to be deleted if the special null id was provided
    if (authorId === NIL_UUID) {
        // Continue with wiping authors table
        try {
            await db.all('DELETE FROM authors');
            return res.json({ info: {} });
        }
        catch (error) {
            if ((error === null || error === void 0 ? void 0 : error.errno) === 19) {
                return res.status(403).json({ error: 'Error with deleting all entries from authors table, likely due to a foreign key constraint. Ensure that all books attributed to the author ID provided are deleted before attempting to delete this author from the authors database.' });
            }
            return res.status(400).json({ error: 'Error with deleting all rows from authors table.' });
        }
    }
    // If ID isn't special, then we're only deleting a specific author from the table
    try {
        // from using the provided author, check that the current user is even the creators of it to even delete
        let initSelect = await db.prepare('SELECT * FROM authors WHERE id = ?');
        await initSelect.bind([authorId]);
        let initResult = await initSelect.all(function (err, rows) {
            return rows;
        });
        // compare user to what we have in token storage
        let currentUser = tokenStorage[req.cookies.token].username;
        if (initResult[0]['user'] !== currentUser) {
            return res.status(401).json({ error: `You cannot delete an author created by another user.` });
        }
        // if successful, go ahead and delete!
        let deleteStatement = await db.prepare('DELETE FROM authors WHERE id = ?');
        await deleteStatement.bind([req.params.id]);
        await deleteStatement.run();
        return res.json({ info: {} });
    }
    catch (error) {
        // If this condition is fulfulled, it's because we're violating the foreign key constraint we set; books are in the books table that are attriubted to an author, leading to this error
        if ((error === null || error === void 0 ? void 0 : error.errno) === 19) {
            return res.status(403).json({ error: `Error with deleting ${authorId} from authors table, likely due to a foreign key constraint. Ensure that all books attributed to the author ID provided are deleted before attempting to delete this author from the authors database.` });
        }
        console.log(error);
        return res.status(400).json({ error: `Error with deleting ${req.params.id} from authors table.` });
    }
}
async function bookDelete(req, res) {
    // Validate that the book ID provided is valid before anything
    let bookID = req.params.id;
    let parseResult = idSchema.safeParse(bookID);
    if (!parseResult.success) {
        return res.status(400).json({ error: `${fromZodError(parseResult.error)}` });
    }
    // Check for authorization of all books being able to be deleted if the special null id was provided
    if (bookID === NIL_UUID) {
        // Continue wiping books table
        try {
            await db.all('DELETE FROM books');
            return res.json({ info: {} });
        }
        catch (error) {
            return res.status(400).json({ error: 'Error with deleting all rows from books table.' });
        }
    }
    // If ID isn't special, then we're only deleting a specific book from the table
    try {
        // from using provided book id, check that the current user is even the creators of it to even delete
        let initSelect = await db.prepare('SELECT * FROM books WHERE id = ?');
        await initSelect.bind(bookID);
        let initResult = await initSelect.all(function (err, rows) {
            return rows;
        });
        // compare user w/ what we have in token storage from current user
        let currentUser = tokenStorage[req.cookies.token].username;
        if (initResult[0]['user'] !== currentUser) {
            return res.status(401).json({ error: `You cannot delete a book created by another user.` });
        }
        // go ahead and delete!
        let deleteStatement = await db.prepare('DELETE FROM books WHERE id = ?');
        await deleteStatement.bind(bookID);
        await deleteStatement.run();
        return res.json({ info: {} });
    }
    catch (error) {
        console.log('error', error);
        return res.status(400).json({ error: `Error with deleting ${bookID} from books table.` });
    }
}
async function authorGet(req, res) {
    // Check if we have any query parameters; if so, check which ones
    if (!(Object.keys(req.query).length === 0)) {
        // If we aren't given an ID from the jump, this is an invalid query
        if (!req.query.hasOwnProperty('id')) {
            return res.status(400).json({ error: 'No ID value provided to retrieve author. Please provide ID to query authors' });
        }
        // Check ID for alphanumeric validity
        let authorID = req.query.id;
        let parseResult = idSchema.safeParse(authorID);
        if (!parseResult.success) {
            return res.status(400).json({ error: `Invalid ID provided: ${authorID}. Valid author IDs must be 8 alphanumeric characters.` });
        }
        // Once we've validated that we have a good valid ID, we can query the database for this author
        try {
            let select = await db.prepare('SELECT * FROM authors WHERE id = ?');
            await select.bind([authorID]);
            let result = await select.all(function (err, rows) {
                return rows;
            });
            // If we didn't get anything back, then we didn't retrieve an author with the ID provided; give error to user
            if (result.length === 0) {
                return res.status(400).json({ error: `No author retrieved with the ID ${authorID}. Ensure the author ID provided is valid.` });
            }
            // If we did get something back, since we searched by ID, this is unique to one person, so we know only the first element of the result is necessary to access here to return to the client
            return res.status(200).json({ info: result[0] });
        }
        catch (error) {
            return res.status(400).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
        }
    }
    // if we don't have any params, then return entire table
    try {
        let authors = await db.all('SELECT * FROM authors');
        res.status(200).json({ info: authors });
    }
    catch (error) {
        return res.status(200).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
    }
}
async function bookGet(req, res) {
    // Check if we have any query parameters, must go through extra validation if so;
    // Otherwise, we'll just return all the books
    if (!(Object.keys(req.query).length === 0)) {
        // If we're provided an ID, immediately query based on that solely
        // validate and query with it; else, return error
        if (req.query.hasOwnProperty('id')) {
            let bookID = req.query.id;
            let parseResult = idSchema.safeParse(bookID);
            // Return an error if we aren't given a valid alphanumeric string
            if (!parseResult.success) {
                return res.status(400).json({ error: `Invalid ID provided: ${bookID}. Valid book IDs must be 8 alphanumeric characters.` });
            }
            // Try to run a query based on this author ID
            try {
                let select = await db.prepare('SELECT authors.name, books.title, books.pub_year, books.genre FROM books INNER JOIN authors ON books.author_id = authors.id WHERE id = ?');
                await select.bind([req.query.id]);
                let result = await select.all(function (err, rows) {
                    return rows;
                });
                // If we didn't get anything back, then we didn't retrieve an author with the id provided; give error to user
                if (result.length === 0) {
                    return res.status(400).json({ error: `No book retrieved with the ID ${bookID}. Ensure the book ID provided is valid.` });
                }
                // If we did get something back, since we searched by ID, this is unique to one person, so we know only the first element of the result is necessary to access here to return to the client
                return res.status(200).json({ info: result[0] });
            }
            catch (error) {
                return res.status(400).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
            }
        }
        // Then check if we have a genre query parameter; otherwise, return error since we're only allowing filtering on genres
        if (!req.query.hasOwnProperty('genre')) {
            return res.status(400).json({ error: 'Queries on the books database are only on genre. Please ensure to provide a genre.' });
        }
        // Check the genre for validity, ensuring we have it in our valid_genres.json file
        let genre = req.query.genre;
        let genreParse = genreSchema.safeParse(genre);
        if (!genreParse.success) {
            return res.status(400).json({ error: 'Please ensure to provide a valid genre. See https://www.goodreads.com/genres/list?utf8=%E2%9C%93&filter=top-level for a list of valid genres to provide.' });
        }
        // Build query to return the rows that fit the given genre
        try {
            let select = await db.prepare('SELECT authors.name, books.title, books.pub_year, books.genre FROM books INNER JOIN authors ON books.author_id = authors.id WHERE genre = ?');
            await select.bind([genre]);
            let result = await select.all(function (err, rows) {
                return rows;
            });
            return res.status(200).json({ info: result });
        }
        catch (error) {
            return res.status(400).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
        }
    }
    // If there are no query properties to analyze, then we must query the entire table
    try {
        let books = await db.all('SELECT authors.name, books.title, books.pub_year, books.genre FROM books INNER JOIN authors ON books.author_id = authors.id');
        res.status(200).json({ info: books });
    }
    catch (error) {
        return res.status(400).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
    }
}
async function userEntriesGet(req, res) {
    let username = req.params.user;
    let parseResult = userSchema.safeParse(username);
    if (!parseResult.success) {
        return res.status(400).json({ error: `Invalid username provided: ${username}. Valid usernames must be at least 5 characters and at most 20 characters.` });
    }
    try {
        // grab all books AND authors from a user
        let selectBooks = await db.prepare('SELECT books.author_id, books.title, books.genre, books.id, books.pub_year, authors.name FROM books INNER JOIN authors ON books.author_id = authors.id WHERE books.user = ?');
        await selectBooks.bind([username]);
        let bookResult = await selectBooks.all(function (err, rows) {
            return rows;
        });
        let selectAuthors = await db.prepare('SELECT * FROM authors WHERE user = ?');
        await selectAuthors.bind([username]);
        let authorResult = await selectAuthors.all(function (err, rows) {
            return rows;
        });
        console.log('book result', bookResult);
        console.log('author result', authorResult);
        return res.status(200).json({ info: { authors: authorResult, books: bookResult } });
    }
    catch (error) {
        return res.status(400).json({ error: `Error with retrieving; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
    }
}
async function authorPost(req, res) {
    // Check body for validity
    let parseResult = authorSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: `${fromZodError(parseResult.error)}` });
    }
    // If valid, generate ID to insert author to database
    let newID = uuidv4();
    try {
        let currentUser = tokenStorage[req.cookies.token].username;
        let insertStatement = await db.prepare('INSERT INTO authors(id, name, bio, user) VALUES (?, ?, ?, ?)');
        await insertStatement.bind([newID, req.body.name, req.body.bio, currentUser]);
        await insertStatement.run();
        // Return author info plus ID here
        return res.json({ info: Object.assign({ id: newID }, req.body) });
    }
    catch (err) {
        return res.status(400).json({ error: `Error with inserting; code returned by SQLite: ${err.code}` });
    }
}
async function bookPost(req, res) {
    // Check body for validity
    // TODO: Figure out how to shorten error message when wrong genre is given
    let parseResult = bookSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: `${fromZodError(parseResult.error)}` });
    }
    // Generate new ID to insert book to database
    let newID = uuidv4();
    try {
        let currentUser = tokenStorage[req.cookies.token].username;
        let insertStatement = await db.prepare('INSERT INTO books(id, author_id, title, pub_year, genre, user) VALUES (?, ?, ?, ?, ?, ?)');
        await insertStatement.bind([newID, req.body.author_id, req.body.title, req.body.pub_year, req.body.genre, currentUser]);
        await insertStatement.run();
        // Return book info plus ID here
        return res.json({ info: Object.assign({ id: newID }, req.body) });
    }
    catch (error) {
        // If this condition is fulfulled, it's because we're violating the foreign key constraint we set; a book needs an author to be added
        if ((error === null || error === void 0 ? void 0 : error.errno) === 19) {
            return res.status(403).json({ error: `Error with adding book, likely due to a foreign key constraint. Ensure that the author ID provided is associated with an existing author before attempting to add this book to the books database.` });
        }
        return res.status(400).json({ error: `Error with inserting; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
    }
}
async function bookPut(req, res) {
    // Check ID for validity
    let bookID = req.params.id;
    if (!idSchema.safeParse(bookID).success) {
        return res.status(400).json({ error: `Invalid ID provided: ${bookID}. Valid book IDs must be 8 alphanumeric characters.` });
    }
    // Check the body for validity too
    let parseResult = updateSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: `${fromZodError(parseResult.error)}` });
    }
    try {
        // from using provided book id, check that the current user is even the creators of it to even delete
        let initSelect = await db.prepare('SELECT * FROM books WHERE id = ?');
        await initSelect.bind(bookID);
        let initResult = await initSelect.all(function (err, rows) {
            return rows;
        });
        // compare user w/ what we have in token storage from current user
        let currentUser = tokenStorage[req.cookies.token].username;
        if (initResult[0]['user'] !== currentUser) {
            return res.status(401).json({ error: `You cannot delete a book created by another user.` });
        }
        // Build query dynamically
        let queryString = 'UPDATE books SET ';
        for (const key in req.body) {
            queryString += key + " = '" + req.body[key] + "', ";
        }
        // Remove trailing comma and space and add rest of query string
        queryString = queryString.slice(0, -2) + ` WHERE id = '${bookID}';`;
        await db.all(queryString);
        return res.status(200).json({ info: {} });
    }
    catch (error) {
        if ((error === null || error === void 0 ? void 0 : error.errno) === 19) {
            return res.status(403).json({ error: 'Error with updating likely due to a foreign key constraint. Ensure that the author ID provided exists before updating a book to that author ID.' });
        }
        return res.status(400).json({ error: `Error with updating; code returned by SQLite: ${error === null || error === void 0 ? void 0 : error.code}` });
    }
}
// Taken from CST480 activity 5 on authentication
async function login(req, res) {
    let parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({ error: 'Username or password invalid.' });
    }
    let { username, password } = parseResult.data;
    // Use argon2 to hash the hw password
    try {
        let select = await db.prepare('SELECT * FROM users WHERE username = ?');
        await select.bind([username]);
        let result = await select.all(function (err, rows) {
            return rows;
        });
        if (result.length === 0) {
            return res.status(401).json({ error: 'Username not recognized.' });
        }
        // Verify password given!
        if (await argon2.verify(result[0].password, password)) {
            // Generate cookie
            let token = makeToken();
            // Store token in cookie response
            res.cookie('token', token, cookieOptions);
            // Store cookie in local storage
            tokenStorage[token] = { username: username };
            // Send response back!
            res.status(200).json({ info: { message: 'Login successful!', username: username } });
        }
        else {
            res.status(401).json({ error: 'Password not recognized.' });
        }
    }
    catch (_a) {
        return res.status(500).json({ error: 'Failed to perform login. Try again later.' });
    }
}
async function logout(req, res) {
    let { token } = req.cookies;
    if (token === undefined) {
        // already logged out
        return res.send();
    }
    if (!tokenStorage.hasOwnProperty(token)) {
        // token is invalid
        return res.send();
    }
    delete tokenStorage[token];
    return res.clearCookie("token", cookieOptions).send();
}
let authorize = (req, res, next) => {
    // check for cookie!
    if (tokenStorage.hasOwnProperty(req.cookies.token)) {
        next();
    }
    else {
        return res.status(401).json({ error: 'You are unauthorized to perform this action. Please login with valid credentials.' });
    }
};
app.delete('/api/authors/:id', authorize, authorDelete);
app.delete('/api/books/:id', authorize, bookDelete);
app.get('/api/authors', authorGet);
app.get('/api/books', bookGet);
app.get('/api/userEntries/:user', userEntriesGet);
app.post('/api/authors', authorize, authorPost);
app.post('/api/books', authorize, bookPost);
app.put('/api/books/:id', authorize, bookPut);
app.post('/login', login);
app.post('/logout', logout);
// add serving for static files
app.use(express.static(path.join(__dirname, 'out', 'public')));
app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'out', 'public', 'index.html'));
});
// run server
let port = 3000;
let host = 'localhost';
let protocol = 'http';
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
