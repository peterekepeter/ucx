import { UnrealClass, UcParser, ucTokenizeLine } from "../../lib";
import { vscode } from "../vscode";

export function getVsCodeDocumentAst(document: vscode.TextDocument): UnrealClass {
    const parser = new UcParser();
    const lines = new Array<string>(document.lineCount);
    for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
        const line = document.lineAt(lineIndex);
        lines[lineIndex] = line.text;
        const lineTokens = ucTokenizeLine(line.text);
        for (const token of lineTokens){
            parser.parse(lineIndex, token.position, token.text);
        }
    }
    parser.endOfFile(document.lineCount, 0);
    const ast = parser.getAst();
    ast.fileName = document.fileName;
    ast.textLines = lines;
    return ast;
}

export function getAst(document: vscode.TextDocument | string, cancellation: vscode.CancellationToken) {
    if (typeof document === 'string') {
        return getAstFromString(document);
    } else {
        return getAstFromDocument(document, cancellation);
    }
}

export function getAstFromDocument(document: vscode.TextDocument, cancellation: vscode.CancellationToken) {
    const parser = new UcParser();
    for (let lineIndex=0; lineIndex < document.lineCount; lineIndex++){
        const line = document.lineAt(lineIndex);
        const lineTokens = ucTokenizeLine(line.text);
        for (const token of lineTokens) {
            parser.parse(lineIndex, token.position, token.text);
        }
        if (cancellation.isCancellationRequested){
            return parser.getAst();
        }
    }
    parser.endOfFile(document.lineCount, 0);
    return parser.getAst();
}

function getAstFromString(input: string) : UnrealClass {
    const parser = new UcParser();
    const lines = input.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
        for (const token of ucTokenizeLine(lines[i])) {
            parser.parse(i, token.position, token.text);
        }
    }
    parser.endOfFile(lines.length, 0);
    return parser.result;
}
