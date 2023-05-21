import { splitLines } from "./splitLines";

test('basic case', () => {
    expect(splitLines('a\nb\nc')).toEqual(['a','b','c']);
});

test('lines with crlf', () => {
    expect(splitLines('a\r\nb\r\nc')).toEqual(['a','b','c']);
});