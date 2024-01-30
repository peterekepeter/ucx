import { db } from '../state';
import { vscode } from '../vscode';
import { getSymbolsFromAst } from '../utils';

export class UnrealScriptDocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    provideDocumentSymbols(document: vscode.TextDocument, ctoken: vscode.CancellationToken) {
        const ast = db.updateDocumentAndGetAst(document, ctoken);
        return getSymbolsFromAst(ast, document.uri);
    }

}
