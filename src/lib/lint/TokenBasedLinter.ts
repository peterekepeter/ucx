import { ParserToken } from "../parser";
import { LintResult } from "./LintResult";

export interface TokenBasedLinter
{
    /**
     * Submits next token to the rule
     * @param line line on which the tokenText starts
     * @param position position on which tokenText starts
     * @param tokenText the actual text content of the token
     * @returns the linter may produce some results
     */
    nextToken(line: number, position: number, tokenText: string, lineText:string): LintResult[] | null;
}

export interface TokenBasedLinterV2
{
    nextToken(token: ParserToken): LintResult[] | null;
}