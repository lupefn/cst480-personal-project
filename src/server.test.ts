import axios, { AxiosError } from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as url from 'url';
import { v4 as uuidv4, NIL as NIL_UUID } from 'uuid';

let __dirname = url.fileURLToPath(new URL('..', import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
    filename: dbfile,
    driver: sqlite3.Database,
});

// Had to just include it here b/c node hates me with reading in json files
let testToken = '2M6UcAbvfq3AMp9w';

let port = 3000;
let host = 'localhost';
let protocol = 'http';
let baseUrl = `${protocol}://${host}:${port}`;
let example_book = {
    'title':        'What Is To Be Done?',
    'pub_year':     1901,
    'genre':        'history-and-politics'
};
let example_book2 = {
    'title':        'State and Revolution',
    'pub_year':     1917,
    'genre':        'diary'
};
let example_author = {
    'name': 'Vladimir Lenin',
    'bio': 'Leader of the Bolshevik Party'
};
let example_author2 = {
    'name': 'Mitch Albom',
    'bio':  'Journalist and musician'
};
let example_author3 = {
    'name': 'Paulo Coelho',
    'bio':  'Brazilian lyricist and novelist' 
};

beforeEach(async () => {
    expect.hasAssertions();
    await db.all('DELETE FROM authors');
    await db.all('DELETE FROM books');
});

afterEach(async () => {
    await db.all('DELETE FROM authors');
    await db.all('DELETE FROM books');
});


// Tests for /author resource
describe('/api/authors resource', () => {
    // DELETE endpoint
    describe('DELETE /api/authors/:id', () => {
        test('Returns an error if no authorization token provided', async() => {
            try {
                await axios.delete(`${baseUrl}/api/authors/${NIL_UUID}`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }        
                let { response } = errorObj;
                expect(response.status).toEqual(401);
                expect(response.data).toEqual({ error: 'You are unauthorized to perform this action. Please login with valid credentials.'});
            }
        });
        
        test('Returns an error if invalid authorization token provided when deleting all authors', async() => {
            try {
                await axios.delete(`${baseUrl}/api/authors/${NIL_UUID}`, { headers: { 'token': 'invalidToken' } });
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(401);
                expect(response.data).toEqual({ error: 'You are unauthorized to perform this action. Please login with valid credentials.'});
            }
        });
        
        test('Returns an error if ID provided is non-uuid', async() => {
            try {
                await axios.delete(`${baseUrl}/api/authors/sd!h3-10`, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Error: Validation error: Must be a valid UUID v4; ID provided must be 32 characters long` });
            }
        });
        
        test('Returns an error if books database still has entries with existing author to be deleted', async() => {
            let author = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorId = author.data.info.id;
            let exampleBook = JSON.parse(JSON.stringify(example_book));
            exampleBook.author_id = authorId;
            let exampleBook2 = JSON.parse(JSON.stringify(example_book2));
            exampleBook2.author_id = authorId;
        
            await axios.post(`${baseUrl}/api/books`, exampleBook, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, exampleBook2, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            try {
                await axios.delete(`${baseUrl}/api/authors/${authorId}`, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(403);
                expect(response.data).toEqual({ error: `Error with deleting ${authorId} from authors table, likely due to a foreign key constraint. Ensure that all books attributed to the author ID provided are deleted before attempting to delete this author from the authors database.` });
            }
        });
        
        test('Returns an error if request made to clear books table and books database still has entries with existing authors', async() => {
            let author = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorId = author.data.info.id;
            let exampleBook = JSON.parse(JSON.stringify(example_book));
            exampleBook.author_id = authorId;
            let exampleBook2 = JSON.parse(JSON.stringify(example_book2));
            exampleBook2.author_id = authorId;
        
            await axios.post(`${baseUrl}/api/books`, exampleBook, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, exampleBook2, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            try {
                await axios.delete(`${baseUrl}/api/authors/${NIL_UUID}`, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(403);
                expect(response.data).toEqual({ error: `Error with deleting all entries from authors table, likely due to a foreign key constraint. Ensure that all books attributed to the author ID provided are deleted before attempting to delete this author from the authors database.` });
            }
        });
        
        test('Deletes all authors from table with valid authorization token', async() => {
            await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/authors`, example_author3, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            let deleteResponse = await axios.delete(`${baseUrl}/api/authors/${NIL_UUID}`, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(deleteResponse.status).toEqual(200);
            expect(deleteResponse.data).toEqual({ info: {} });
        });
        
        test('Deletes an author from table with no books attributed to it in the books table', async() => {
            let example = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorId = example.data.info.id;
        
            let deleteResponse = await axios.delete(`${baseUrl}/api/authors/${authorId}`, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(deleteResponse.status).toEqual(200);
            expect(deleteResponse.data).toEqual({ info: {} });
        });
    });

    describe('GET /api/authors', () => {
        test('Returns an error if ID provided has non-alphanumeric characters', async() => {
            try {
                await axios.get(`${baseUrl}/api/authors?id=sd!h3-10`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Invalid ID provided: sd!h3-10. Valid author IDs must be 8 alphanumeric characters.' });
            }
        });
        
        test('Returns an error if ID provided is not in authors table', async() => {
            let randomId = uuidv4();
            try {
                await axios.get(`${baseUrl}/api/authors?id=${randomId}`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `No author retrieved with the ID ${randomId}. Ensure the author ID provided is valid.` });
            }
        });
        
        test('Returns an error if no ID property provided', async() => {
            try {
                await axios.get(`${baseUrl}/api/authors?name=Vladimir Lenin`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `No ID value provided to retrieve author. Please provide ID to query authors`});
            }
        });
        
        test('Successfully retrieves the author when provided a valid ID', async() => {
            let postResponse = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = postResponse.data.info.id;
        
            let result = await axios.get(`${baseUrl}/api/authors?id=${authorID}`);
            let example = JSON.parse(JSON.stringify(example_author));
            example.id = authorID;
            expect(result.status).toEqual(200);
            expect(result.data.info).toEqual(example);
        });
        
        test('Successfully retrieves all authors when no parameters provided', async() => {
            // Append example authors and get the returned identifying ID
            let author1 = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author2 = await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author3 = await axios.post(`${baseUrl}/api/authors`, example_author3, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            // Generate author entries that we'd get back from the GET request
            let example = JSON.parse(JSON.stringify(example_author));
            let example2 = JSON.parse(JSON.stringify(example_author2));
            let example3 = JSON.parse(JSON.stringify(example_author3));
            example.id = author1.data.info.id;
            example2.id = author2.data.info.id;
            example3.id = author3.data.info.id;
            let expected = [example, example2, example3];
        
            let result = await axios.get(`${baseUrl}/api/authors`);
            expect(result.status).toEqual(200);
            expect(result.data.info).toMatchObject(expected);
        });
    });
    
    // TODO: Add test for authors POST endpoint if body given with extra params, error should be thrown
    describe('POST /api/authors', () => {
        test('Returns an error if the body is empty', async() => {
            try {
                await axios.post(`${baseUrl}/api/authors`, {}, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: name must be provided at "name"; bio must be provided at "bio"'});
            }
        });
        
        test('Returns an error if a name is shorter than 5 characters', async() => {
            let shortName = {
                name: 'name',
                bio: 'Random Bio'
            };
        
            try {
                await axios.post(`${baseUrl}/api/authors`, shortName, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: name must be at least 5 characters long at "name"'});
            }
        });
        
        test('Returns an error if a name is longer than 50 characters', async() => {
            let longName = {
                name: 'Super Long Name That Most Definitely Goes Over 50 Characters',
                bio: 'Random Bio'
            };
            try {
                await axios.post(`${baseUrl}/api/authors`, longName, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: name must be at most 50 characters long at "name"'});
            }
        });
        
        test('Returns an error if a bio is shorter than 10 characters', async() => {
            let longBio = {
                name: 'Regular Name',
                bio: 'Lame bio'
            };
            try {
                await axios.post(`${baseUrl}/api/authors`, longBio, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: bio must be at least 10 characters long at "bio"'});
            }
        });
        
        test('Returns an error if a bio is longer than 250 characters', async() => {
            let longBio = {
                name: 'Regular Name',
                bio: 'Fidel Alejandro Castro Ruz was a Cuban revolutionary and politician who was the leader of Cuba from 1959 to 2008, serving as the prime minister of Cuba from 1959 to 1976 and president from 1976 to 2008. Ideologically a Marxist–Leninist and Cuban nationalist, he also served as the first secretary of the Communist Party of Cuba from 1961 until 2011.'
            };
            try {
                await axios.post(`${baseUrl}/api/authors`, longBio, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: bio must be at most 250 characters long at "bio"'});
            }
        });
        
        test('Returns an error if bio is missing', async() => {
            let noBio = {
                name: 'Regular Name'
            };
            try {
                await axios.post(`${baseUrl}/api/authors`, noBio, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: bio must be provided at "bio"'});
            }
        });
        
        test('Returns an error if name is missing', async() => {
            let noName = {
                bio: 'Regular Bio'
            };
            try {
                await axios.post(`${baseUrl}/api/authors`, noName, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                // Casting needed b/c TS gives errors 'unknown' type
                let errorObj = error as AxiosError;
                // If server never responds, error.response will be undefined
                // throw the error so TS can perform type narrowing
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                // Now, after the if-statement, TS knows that error object can't be undefined
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: name must be provided at "name"'});
            }
        });
        
        test('Successfully enters new author entry into table and returns ID', async() => {
            let result = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = result.data.info.id;
            let record = JSON.parse(JSON.stringify(example_author));
            record.id = authorID;
        
            expect(result.status).toEqual(200);
            expect(result.data).toEqual({ info: record });
        
            let query = await axios.get(`${baseUrl}/api/authors?id=${authorID}`);
            expect(query.data.info).toEqual(record);
        });    
    });
});


// Tests for /books resource
describe('/api/books resource', () => {
    describe('DELETE /api/books/:id', () => {
        test('Returns an error if no authorization token provided', async() => {
            try {
                await axios.delete(`${baseUrl}/api/books/${NIL_UUID}`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(401);
                expect(response.data).toEqual({ error: 'You are unauthorized to perform this action. Please login with valid credentials.'});
            }
        });
        
        test('Returns an error if invalid authorization token provided when deleting all books', async() => {
            try {
                await axios.delete(`${baseUrl}/api/books/${NIL_UUID}`, { headers: {
                    Cookie: `token=randomToken`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(401);
                expect(response.data).toEqual({ error: 'You are unauthorized to perform this action. Please login with valid credentials.'});
            }
        });
        
        test('Returns an error if ID provided is non-uuid', async() => {
            let invalidId = 'sd!h3-130232';
            try {
                await axios.delete(`${baseUrl}/api/books/${invalidId}`, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Error: Validation error: Must be a valid UUID v4; ID provided must be 32 characters long` });
            }
        });
        
        test('Deletes all books from table with valid authorization token', async() => {
            let author = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let example1 = JSON.parse(JSON.stringify(example_book));
            example1.author_id = author.data.info.id;
            let example2 = JSON.parse(JSON.stringify(example_book2));
            example2.author_id = author.data.info.id;
        
            await axios.post(`${baseUrl}/api/books`, example1, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, example2, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            let deleteResponse = await axios.delete(`${baseUrl}/api/books/${NIL_UUID}`, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(deleteResponse.status).toEqual(200);
            expect(deleteResponse.data).toEqual({ info: {} });
        });
        
        test('Deletes a book from table', async() => {
            let author = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let example = JSON.parse(JSON.stringify(example_book));
            example.author_id = author.data.info.id;
        
            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            let bookID = book.data.info.id;
        
            let deleteResponse = await axios.delete(`${baseUrl}/api/books/${bookID}`, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(deleteResponse.status).toEqual(200);
            expect(deleteResponse.data).toEqual({ info: {} });
        });
    });

    describe('GET /api/books', () => {
        test('Returns an error if ID provided has non-alphanumeric characters', async() => {
            try {
                await axios.get(`${baseUrl}/api/books?id=sd!h3-10`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Invalid ID provided: sd!h3-10. Valid book IDs must be 8 alphanumeric characters.' });
            }
        });
        
        test('Returns an error if ID provided is not in books table', async() => {
            let randomId = uuidv4();
            try {
                await axios.get(`${baseUrl}/api/books?id=${randomId}`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `No book retrieved with the ID ${randomId}. Ensure the book ID provided is valid.`});
            }
        });

        test('Returns an error if query provided is not valid', async() => {
            try {
                await axios.get(`${baseUrl}/api/books?genre=political-theory`);
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Please ensure to provide a valid genre. See https://www.goodreads.com/genres/list?utf8=%E2%9C%93&filter=top-level for a list of valid genres to provide.`});
            }
        });
        
        test('Successfully returns books for query on author_id with books from another author in table', async() => {
            let targetAuthor = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let targetAuthorID = targetAuthor.data.info.id;
        
            let otherAuthor = await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let otherAuthorID = otherAuthor.data.info.id;
        
            let example = JSON.parse(JSON.stringify(example_book));
            let example2 = JSON.parse(JSON.stringify(example_book2));
            example.author_id = targetAuthorID;
            example2.author_id = otherAuthorID;
            
            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, example2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let entireBookEntry = JSON.parse(JSON.stringify(example));
            let bookID = book.data.info.id;
            entireBookEntry.id = bookID;
            // to make comparison happy down in expects, sloppy but i have no time to make prettier :/
            entireBookEntry.pub_year = entireBookEntry.pub_year.toString();
        
            let result = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            expect(result.status).toEqual(200);
            expect(result.data.info).toEqual(entireBookEntry);
        });
        
        test('Successfully returns books for query on author_id with books when none from other author in table', async() => {
            let targetAuthor = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let targetAuthorID = targetAuthor.data.info.id;
        
            let example = JSON.parse(JSON.stringify(example_book));
            let example2 = JSON.parse(JSON.stringify(example_book2));
            example.author_id = targetAuthorID;
            example2.author_id = targetAuthorID;
            
            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, example2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let entireBookEntry = JSON.parse(JSON.stringify(example));
            let bookID = book.data.info.id;
            entireBookEntry.id = bookID;
            entireBookEntry.pub_year = entireBookEntry.pub_year.toString();
        
            let result = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            expect(result.status).toEqual(200);
            expect(result.data.info).toEqual(entireBookEntry);
        });
        
        
        test('Successfully returns books based on genre', async() => {
            let author1 = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author1ID = author1.data.info.id;
        
            let author2 = await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author2ID = author2.data.info.id;
        
            let example = JSON.parse(JSON.stringify(example_book));
            let example2 = JSON.parse(JSON.stringify(example_book2));
            example.author_id = author1ID;
            example2.author_id = author2ID;
            
            await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            let book = await axios.post(`${baseUrl}/api/books`, example2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let entireBookEntry = JSON.parse(JSON.stringify(example2));
            let bookID = book.data.info.id;
            entireBookEntry.id = bookID;
            // to make comparison happy down in expects, sloppy but i have no time to make prettier :/
            entireBookEntry.pub_year = entireBookEntry.pub_year.toString();
        
            let result = await axios.get(`${baseUrl}/api/books?genre=diary`);
            expect(result.status).toEqual(200);
            expect(result.data.info).toEqual([entireBookEntry]);
        });
        
        test('Successfully retrieves all books when no parameters provided', async() => {
            // Append example authors and get the returned identifying ID
            let author1 = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author1ID = author1.data.info.id;
        
            let author2 = await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author2ID = author2.data.info.id;
        
            // Populate books table for retrieval
            let example = JSON.parse(JSON.stringify(example_book));
            let example2 = JSON.parse(JSON.stringify(example_book2));
            example.author_id = author1ID;
            example2.author_id = author2ID;
            await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            await axios.post(`${baseUrl}/api/books`, example2, { headers: {
                Cookie: `token=${testToken}`
            }});
            
            // make comparison happy by converting number to string since we get it back like that
            example.pub_year = example.pub_year.toString();
            example2.pub_year = example2.pub_year.toString();
            let expected = [example, example2];
        
            let result = await axios.get(`${baseUrl}/api/books`);
            
            expect(result.status).toEqual(200);
            expect(result.data.info).toMatchObject(expected);
        });
    });

    // TODO: Add test for books POST endpoint if body given with extra params, error should be thrown
    describe('POST /api/books', () => {
        test('Returns an error if the body is empty', async() => {
            try {
                await axios.post(`${baseUrl}/api/books`, {}, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Error: Validation error: author_id must be provided at "author_id"; title must be provided at "title"; pub_year must be provided at "pub_year"; Required at "genre"`});
            }
        });
        
        test('Returns an error if inserting to the database is not successful due to foreign key constraint', async() => {
            try {
                let example = JSON.parse(JSON.stringify(example_book));
                example.author_id = uuidv4();
                await axios.post(`${baseUrl}/api/books`, example, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch(error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(403);
                expect(response.data).toEqual({ error: `Error with adding book, likely due to a foreign key constraint. Ensure that the author ID provided is associated with an existing author before attempting to add this book to the books database.`});
            }
        });
        
        test('Returns an error if a title is shorter than 5 characters', async() => {
            let shortTitle = {
                title:       'lame',
                pub_year:   1901,
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, shortTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: title must be at least 5 characters long at "title"'});
            }
        });
        
        test('Returns an error if a title is longer than 50 characters', async() => {
            let longTitle = {
                title:       'Super Long Title That Most Definitely Goes Over 50 Characters',
                pub_year:   1901,
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, longTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: title must be at most 50 characters long at "title"'});
            }
        });
        
        test('Returns an error if year is invalid type', async() => {
            let longTitle = {
                title:       'Random title',
                pub_year:   '1901',
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, longTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: A valid number must be provided for the pub_year at "pub_year"'});
            }
        });
        
        test('Returns an error if year is negative number', async() => {
            let longTitle = {
                title:       'Random title',
                pub_year:   -19,
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, longTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: A valid year must be provided for pub_year at "pub_year"'});
            }
        });
        
        test('Returns an error if year is extremely large number', async() => {
            let longTitle = {
                title:       'Random title',
                pub_year:   20124,
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, longTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: A valid year must be provided for pub_year at "pub_year"'});
            }
        });
        
        test('Returns an error if year is in the future', async() => {
            let longTitle = {
                title:       'Random title',
                pub_year:   2024,
                genre: 'history-and-politics',
                author_id: uuidv4()
            };
            try {
                await axios.post(`${baseUrl}/api/books`, longTitle, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: A valid year must be provided for pub_year at "pub_year"'});
            }
        });
        
        test('Returns an error if genre is not in valid list of genres', async() => {
            let result = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = result.data.info.id;
            let invalidGenre = {
                title:       'Socialist Reconstruction',
                pub_year:   2023,
                genre: 'political-theory',
                author_id: authorID
            };
            try {
                await axios.post(`${baseUrl}/api/books`, invalidGenre, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Error: Validation error: Invalid enum value. Expected '40k' | 'adolescence' | 'adult' | 'aeroplanes' | 'amish' | 'animals' | 'anthologies' | 'art-and-photography' | 'artificial-intelligence' | 'aviation' | 'biblical' | 'biography-memoir' | 'bird-watching' | 'canon' | 'christian' | 'colouring-books' | 'comics-manga' | 'conservation' | 'dark' | 'death' | 'diary' | 'disability' | 'dyscalculia' | 'emergency-services' | 'feminism' | 'femme-femme' | 'fiction' | 'football' | 'freight' | 'futurism' | 'futuristic' | 'gender' | 'gender-and-sexuality' | 'gettysburg-campaign' | 'graphic-novels-comics' | 'graphic-novels-comics-manga' | 'graphic-novels-manga' | 'history-and-politics' | 'holiday' | 'hugo-awards' | 'infant-mortality' | 'inspirational' | 'jewellery' | 'lapidary' | 'lgbt' | 'live-action-roleplaying' | 'love' | 'mary-shelley' | 'medical' | 'moroccan' | 'museology' | 'native-americans' | 'new-york' | 'non-fiction' | 'novella' | 'occult' | 'paranormal-urban-fantasy' | 'pediatrics' | 'percy-bysshe-shelley' | 'planetary-science' | 'poetry' | 'polyamory' | 'pornography' | 'prayer' | 'preservation' | 'productivity' | 'race' | 'relationships' | 'roman' | 'romantic' | 'satanism' | 'science-fiction-fantasy' | 'science-nature' | 'sequential-art' | 'sex-and-erotica' | 'sexuality' | 'singularity' | 'soccer' | 'social' | 'space' | 'spirituality' | 'surreal' | 'teaching' | 'textbooks' | 'the-americas' | 'the-united-states-of-america' | 'transport' | 'tsars' | 'unfinished' | 'united-states' | 'urban' | 'war' | 'wildlife' | 'witchcraft' | 'women-and-gender-studies' | 'womens', received 'political-theory' at "genre"`});
            }
        });
        
        test('Inserts book to database if author exists', async() => {
            // Insert author first (assuming this functionality works)
            let result = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = result.data.info.id;
            let example = JSON.parse(JSON.stringify(example_book));
            example.author_id = authorID;
        
            let booksPostResponse = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
        
            let bookID = booksPostResponse.data.info.id;
            example.id = bookID;
            // again, not most elegant solution, but alas
            example.pub_year = example.pub_year.toString();
            let record = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            expect(record.data.info).toEqual(example);
        });
    });

    describe('PUT /api/books', () => {

        test('Returns an error if ID provided includes non-alphanumeric characters', async() => {
            let invalidId = '123!!@1';
            try {
                await axios.put(`${baseUrl}/api/books/${invalidId}`, {}, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: `Invalid ID provided: ${invalidId}. Valid book IDs must be 8 alphanumeric characters.`});
            }
        });
        
        test('Returns an error if the body is empty', async() => {
            let randomId = uuidv4();
            try {
                await axios.put(`${baseUrl}/api/books/${randomId}`, {}, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(400);
                expect(response.data).toEqual({ error: 'Error: Validation error: An author ID, title, publication year, or genre field must be defined to update a book.'});
            }
        });

        test('Returns an error if an author ID provided does not exist', async() => {
            try {
                let author = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                    Cookie: `token=${testToken}`
                }});
                let example = JSON.parse(JSON.stringify(example_book));
                example.author_id = author.data.info.id;
                let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                    Cookie: `token=${testToken}`
                }});
                let bookID = book.data.info.id;
                let invalidAuthor = {
                    author_id: uuidv4(),
                }
                await axios.put(`${baseUrl}/api/books/${bookID}`, invalidAuthor, { headers: {
                    Cookie: `token=${testToken}`
                }});
            } catch (error: any) {
                let errorObj = error as AxiosError;
                if (errorObj.response === undefined) {
                    throw errorObj;
                }
                let { response } = errorObj;
                expect(response.status).toEqual(403);
                expect(response.data).toEqual({ error: 'Error with updating likely due to a foreign key constraint. Ensure that the author ID provided exists before updating a book to that author ID.'});
            }
        });

        test('Does not return an error if no valid book ID provided', async() => {
            let invalidUpdate = {
                title:  'Random Title',
            };
            let randomId = uuidv4();
            let result = await axios.put(`${baseUrl}/api/books/${randomId}`, invalidUpdate, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(result.status).toEqual(200);
            expect(result.data.info).toEqual({});
        });

        test("Updates a book's title when provided a valid book ID", async() => {
            // Insert author to then insert book
            let result = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = result.data.info.id;
            let example = JSON.parse(JSON.stringify(example_book));
            example.author_id = authorID;

            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            let bookID = book.data.info.id;
            let updateBody = {
                title:     'The Communist Manifesto'
            };

            // Check status
            let update = await axios.put(`${baseUrl}/api/books/${bookID}`, updateBody, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(update.status).toEqual(200);
            // Check that update actually happened with GET request
            let recordUpdate = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            let expectedUpdate = {
                ...book.data.info,
                pub_year:   book.data.info.pub_year.toString(),
                title:      updateBody.title
            };
            expect(recordUpdate.data.info).toEqual(expectedUpdate);
        });

        test('Updates multiple book fields when provided a valid book ID', async() => {
            // Insert author to then insert book
            let result = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let authorID = result.data.info.id;
            let example = JSON.parse(JSON.stringify(example_book));
            example.author_id = authorID;

            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            let bookID = book.data.info.id;
            let updateBody = {
                title:     'The Communist Manifesto',
                pub_year:  1848
            };

            // Check status
            let update = await axios.put(`${baseUrl}/api/books/${bookID}`, updateBody, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(update.status).toEqual(200);
            // Check that update actually happened with GET request
            let recordUpdate = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            let expectedUpdate = {
                ...book.data.info,
                pub_year:   updateBody.pub_year.toString(),
                title:      updateBody.title
            };
            expect(recordUpdate.data.info).toEqual(expectedUpdate);
        });

        test('Updates multiple book fields when provided a valid book ID and author ID', async() => {
            // Create two different authors
            let author1 = await axios.post(`${baseUrl}/api/authors`, example_author, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author1ID = author1.data.info.id;
        
            let author2 = await axios.post(`${baseUrl}/api/authors`, example_author2, { headers: {
                Cookie: `token=${testToken}`
            }});
            let author2ID = author2.data.info.id;
        
            let example = JSON.parse(JSON.stringify(example_book));
            example.author_id = author1ID;
            
            // Insert one book with one of the authors
            let book = await axios.post(`${baseUrl}/api/books`, example, { headers: {
                Cookie: `token=${testToken}`
            }});
            let bookID = book.data.info.id;
            // Create entirely new update
            let updateBody = {
                title:      'The Communist Manifesto',
                pub_year:   1848,
                author_id:  author2ID,
                genre:      'diary'
            };

            // Check status code for success
            let update = await axios.put(`${baseUrl}/api/books/${bookID}`, updateBody, { headers: {
                Cookie: `token=${testToken}`
            }});
            expect(update.status).toEqual(200);
            // Check that update actually happened with GET request
            let recordUpdate = await axios.get(`${baseUrl}/api/books?id=${bookID}`);
            let updatedBook = {
                ...updateBody,
                id: bookID,
                pub_year:   updateBody.pub_year.toString()
            };
            expect(recordUpdate.data.info).toEqual(updatedBook);
        });

    });

});