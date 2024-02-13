import { renderDefinitionMarkdownLines } from "../../lib";
import { db } from "../state";
import { vscode } from "../vscode";

export class SignatureProvider implements vscode.SignatureHelpProvider {

    async provideSignatureHelp(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken, 
        context: vscode.SignatureHelpContext
    ): Promise<vscode.SignatureHelp | null> {
        db.updateDocumentAndGetAst(document, token);
        const definition = await db.findDefinition(document.uri, position, token);
        if (!definition.found || token.isCancellationRequested) return null; 
        const activeParameter = definition.paramDefinition ? definition.fnDefinition?.fnArgs.indexOf(definition.paramDefinition) ?? 0 : 0;
        return {
            signatures: [{
                label: definition.fnDefinition?.name?.text ?? '',
                parameters: (definition.fnDefinition?.fnArgs ?? []).map(a => ({
                    label: a.name?.text ?? '',
                    documentation: 'test',
                })),
                activeParameter,
                documentation: renderDefinitionMarkdownLines(definition).join('\n'),
            }],
            activeSignature: 0,
            activeParameter,
        }
    }
    
}
