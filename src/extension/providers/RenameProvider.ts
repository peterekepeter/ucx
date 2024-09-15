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
        
        if (token.isCancellationRequested || references.length === 0) {
            return;
        }

        // find shortest reference
        let shortestText = '';
        {
            let shortestLen = +Infinity;
            for (const ref of references) {
                if (ref.token && ref.token.text.length < shortestLen) {
                    shortestLen = ref.token.text.length;
                    shortestText = ref.token.text;
                }
            }
        }
        const lowerName = shortestText.toLowerCase();

        const edits = new vscode.WorkspaceEdit();
        
        for (const ref of references) {
            if (ref.token && ref.uri) {
                // this selects matching text inside token to generate
                // edit operation, this is required to fix rename class
                // when class reference is class'MyClass'
                // TODO move this logic to library and cover with test
                const index = ref.token.textLower.indexOf(lowerName);
                if (index < 0) {
                    // something went wrong, this reference has completely
                    // different text than the others...
                    console.error('invalid reference???', ref);
                    continue;
                }
                const start = index + ref.token.position;
                const end = start + lowerName.length;
                const line = ref.token.line;

                edits.replace(
                    vscode.Uri.parse(ref.uri), 
                    new vscode.Range(
                        new vscode.Position(line, start),
                        new vscode.Position(line, end),
                    ), 
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
