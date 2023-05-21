import { UcParser, UnrealClass } from "../parser";
import { ucTokenizeLine } from "../tokenizer";
import { splitLines } from "../tokenizer/splitLines";
import { getFileContent } from "./filesystem";


export async function getAstFromFile(path: string): Promise<UnrealClass> {
    const source = await getFileContent(path);
    const parser = new UcParser();

    const lines = splitLines(source);
    for (let lineIndex=0; lineIndex < lines.length; lineIndex++){
        const lineTokens = ucTokenizeLine(lines[lineIndex]);
        for (const token of lineTokens){
            parser.parse(lineIndex, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    const ast = parser.getAst();
    ast.fileName = path;
    ast.textLines = lines;
    return ast;
}
