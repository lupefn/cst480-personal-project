interface Author {
    id: string,
    name: string,
    bio: string
}

// Note: had to define it as this for when we're building an update book and we may not have all of these fields filled in
interface Book {
    id?: string,
    author_id?: string,
    title?: string,
    pub_year?: string,
    genre?: string
};

interface BookWithAuthorName extends Book {
    name? : string,
};

type ColumnDefinitionType<T> = {
    key: keyof T;
    header: string;
    width?: number;
};

export type { Author, Book, BookWithAuthorName, ColumnDefinitionType };