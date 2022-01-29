import { UcParser } from "./UcParser";

export type Token = ParserToken;

export type ParserFn = (parser: UcParser, token: Token) => void;

export enum SemanticClass {
    None,
    Keyword,
    Comment,
    ClassDeclaration,
    EnumDeclaration,
    ClassReference,
    ClassVariable,
    LocalVariable,
    EnumMember,
    TypeReference,
    AssignmentOperator,
    ClassConstant,
    LiteralString,
    LiteralName,
    LiteralNumber,
    Identifier
}

export interface ParserToken {
    text: string;
    line: number;
    position: number;
    classification: SemanticClass;
}

export interface ParserError {
    message: string;
    token: Token;
    debug?: string;
}
