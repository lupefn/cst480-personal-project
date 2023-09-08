import './BooksTable.css';
import { FC } from 'react';
import { Author, BookWithAuthorName, ColumnDefinitionType } from './types';
 
// import { useReactTable } from '@tanstack/react-table'
// Used this tutorial to create generic table rendering
// https://www.bekk.christmas/post/2020/22/create-a-generic-table-with-react-and-typescript

type TableProps<T> = {
    data: Array<T>
    columns: Array<ColumnDefinitionType<T>>
};

type TableHeaderProps<T> = {
    columns: Array<ColumnDefinitionType<T>>;
};

type TableRowsProps<T> = {
    data: Array<T>,
    columns: Array<ColumnDefinitionType<T>>;
};

const tableStyle = {
    borderCollapse: 'collapse',
} as const;

const rowsStyle = {
    border: '1px solid black'
}

// Used this function from this tutorial to display primitive types out of the box
//https://fernandoabolafio.medium.com/generic-table-component-with-react-and-typescript-d849ad9f4c48

// function BooksTable<T>({ data, columns }: TableProps<T>) {
let BooksTable: FC<TableProps<BookWithAuthorName>> = ({ data, columns }) => {

    return (
        <table className='booksTable' style={ tableStyle }>
            <TableHeader columns={ columns } />
            <TableRows
                data={ data }
                columns={ columns }
            />
        </table>
    );
};

function TableHeader<T>({ columns }: TableHeaderProps<T>) {
    const headers = columns.map((column, index) => {
        // TODO: Adjust style
        const style = {
            width: column.width ?? 100,
            borderBottom: '2px solid black'
        };

        // Return headers from the map, applying style we declared
        return (
            <th 
            key={`headCell-${index}`}
            style={style}
            >
                { column.header }
            </th>
        );
    });

    return (
        <thead>
            <tr>{ headers }</tr>
        </thead>
    );
}

// function TableRows<T, K extends keyof T>({ data, columns }: TableRowsProps<T, K>) {
let TableRows: FC<TableRowsProps<BookWithAuthorName>> = function({ data, columns }) {
    // Generate rows elements
    const rows = data.map((row, rowIndex) => {
        return (
            // Create row
            <tr key={`row-${rowIndex}`}>
                { 
                    columns.map((column, columnIndex) => {
                        return (
                            <td key={`cell-${columnIndex}`} style={rowsStyle}>
                                { row[column.key] }
                            </td>
                        );
                    })
                }
            </tr>
        );
    });
    // Return what we just made
    return (
        <tbody>
            { rows }
        </tbody>
    );
}

export default BooksTable;