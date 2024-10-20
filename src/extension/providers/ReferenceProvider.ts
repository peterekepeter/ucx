import { db } from "../state";
import { rangeFromToken } from "../utils";
import { vscode } from "../vscode";



export class ReferenceProvider implements vscode.ReferenceProvider {
    
    async provideReferences(
        document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext, token: vscode.CancellationToken
    ): Promise<vscode.Location[]> {
        db.updateDocumentAndGetAst(document, token);
        const output: vscode.Location[] = [];
        let references = await db.findReferences(document, position, token);
        
        if (context.includeDeclaration === false) {
            // assuming first reference is always the delcaration
            references = references.slice(1);
        }
        
        if (token.isCancellationRequested) {
            return output;
        }

        for (const reference of references) {
            if (reference.token && reference.uri) {
                output.push({
                    range: rangeFromToken(reference.token),
                    uri: vscode.Uri.parse(reference.uri),
                });
            }
        }
        return output;
    }
    
}