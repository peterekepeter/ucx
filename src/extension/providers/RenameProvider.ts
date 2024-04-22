import { db } from "../state";
import { rangeFromToken } from "../utils";
import { vscode } from "../vscode";


export class RenameProvider implements vscode.RenameProvider {

    async provideRenameEdits(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        newName: string, 
        token: vscode.CancellationToken
    )
    : Promise<vscode.WorkspaceEdit|undefined> 
    {
        db.updateDocumentAndGetAst(document, token);
        const references = await db.findReferences(document, position, token);
        
        if (token.isCancellationRequested) {
            return;
        }

        const edits = new vscode.WorkspaceEdit();
        
        for (const ref of references) {
            if (ref.token && ref.uri) {
                edits.replace(
                    vscode.Uri.parse(ref.uri), 
                    rangeFromToken(ref.token), 
                    newName
                );
            }
        }

        return edits;
    }

    async prepareRename(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    )
    : Promise<vscode.Range | { range: vscode.Range; placeholder: string; } | undefined> 
    {
        db.updateDocumentAndGetAst(document, token);
        const references = await db.findReferences(document, position, token);
        
        if (references.length === 0) {
            throw new Error("cannot rename");
        }

        return undefined;
    }
    
}
