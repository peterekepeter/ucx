import { ParserToken } from "../../lib/parser";
import { vscode } from "../vscode";

export function rangeFromToken(a: ParserToken): vscode.Range {
    return rangeFromTokens(a,a);
}

export function rangeFromTokens(a: ParserToken,b: ParserToken): vscode.Range{
    return new vscode.Range(
        firstPositionFromToken(a),
        lastPositionFromToken(b)
    );
}

function firstPositionFromToken(a: ParserToken): vscode.Position {
    return new vscode.Position(a.line, a.position);
}

function lastPositionFromToken(a: ParserToken): vscode.Position {
    return new vscode.Position(a.line, a.position + a.text.length);
}

