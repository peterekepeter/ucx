import { Token } from "./UcParser";


export interface ParserError {
    message: string;
    token: Token;
    debug?: string;
}
