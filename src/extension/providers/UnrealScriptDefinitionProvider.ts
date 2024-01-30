import { TokenInformation } from '../../lib/typecheck/ClassDatabase';
import { db } from '../state';
import { rangeFromToken } from '../utils';
import { vscode } from '../vscode';

export class UnrealScriptDefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(document: vscode.TextDocument, position: vscode.Position, ctoken: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        console.log('provideDefinition', { url: document.uri, position });
        return db.findDefinition(document.uri, position, ctoken).then((result: TokenInformation) => {
            console.log('db.findDefinition result', result);

            let definition: vscode.DefinitionLink[] | null = null;
            if (result.found && result.token && result.uri) {
                definition = [{
                    targetUri: vscode.Uri.parse(result.uri),
                    targetRange: rangeFromToken(result.token),
                }];
            }
            console.log({ output: definition });
            return definition;
        });
    }

}
