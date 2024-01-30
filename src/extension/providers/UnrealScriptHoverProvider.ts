import { renderDefinitionMarkdownLines } from "../../lib";
import { db } from "../state";
import { vscode } from "../vscode";


export class UnrealScriptHoverProvider implements vscode.HoverProvider {

    async provideHover(document: vscode.TextDocument, position: vscode.Position, ctoken: vscode.CancellationToken) {
        db.updateDocumentAndGetAst(document, ctoken);
        const result = await db.findDefinition(document.uri, position, ctoken);
        return { contents: renderDefinitionMarkdownLines(result) };
    }

}
