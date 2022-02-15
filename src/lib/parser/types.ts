import { ParserToken } from "./";
import { UcParser } from "./UcParser";

export type Token = ParserToken;

export type ParserFn = (parser: UcParser, token: Token) => void;

export interface ParserError {
    message: string;
    token: Token;
    debug?: string;
}
