import { ucTokenizeLine } from "../tokenizer";
import { splitLines } from "../tokenizer/splitLines";
import { UcParser } from "./UcParser";
import { UnrealClass } from "./ast";

export function ucParseLines(lines: Iterable<string>): UnrealClass {
    const parser = new UcParser();
    let lineIndex = 0;
    for (const line of lines) {
        for (const token of ucTokenizeLine(line)) {
            parser.parse(lineIndex, token.position, token.text);
        }
        lineIndex+=1;
    }
    parser.endOfFile(lineIndex, 0);
    const ast = parser.getAst();
    return ast;
}

export function ucParseText(text: string): UnrealClass {
    return ucParseLines(splitLines(text));
}
