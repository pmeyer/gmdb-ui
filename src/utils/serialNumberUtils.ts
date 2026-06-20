import * as ISBN from "isbn3";
import { parseISSN, type ISSN } from "./issn/issn";

export function parseSerial(s?: string | null): ISBN | ISSN | null {
    if (!s) {
        return null
    }
    return ISBN.parse(s) ?? parseISSN(s);
}

export type KnownSerialNumberFormat = 'ISBN-10' | 'ISBN-13' | 'ISSN';

export interface FormattedSerialNumber {
    format?: KnownSerialNumberFormat;
    formattedValue: string;
}

export function isFormattedSerial(v?: string | FormattedSerialNumber): v is FormattedSerialNumber {
  return v !== undefined && typeof v === 'object' && 'formattedValue' in v && typeof v.formattedValue === 'string';
}

export function isISBN10(isbn: ISBN | ISSN | null): isbn is ISBN13WithISBN10 {
  return isbn !== null && typeof isbn === 'object' && 'isIsbn10' in isbn && isbn.isIsbn10;
}

export function isISBN13(isbn: ISBN | ISSN | null): isbn is ISBN13Only {
  return isbn !== null && typeof isbn === 'object' && 'isIsbn13' in isbn && isbn.isIsbn13;
}

export function getFormattedSerialNumber(value?: string | null): FormattedSerialNumber {
    const serial = parseSerial(value);
    if (serial == null) {
        return { formattedValue: value ?? '' };
    }
    if (isISBN10(serial)) {
        return { format: 'ISBN-10', formattedValue: serial.isbn10h };
    }
    if (isISBN13(serial)) {
        return { format: 'ISBN-13', formattedValue: serial.isbn13h };
    }
    return { format: 'ISSN', formattedValue: serial.issn };
};
