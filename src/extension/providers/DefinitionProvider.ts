import { TokenInformation } from '../../lib/typecheck/ClassDatabase';
import { db } from '../state';
import { rangeFromToken } from '../utils';
import { vscode } from '../vscode';

export class DefinitionProvider implements vscode.DefinitionProvider {

    provideDefinition(document: vscode.TextDocument, position: vscode.Position, ctoken: vscode.CancellationToken): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        return db.findDefinition(document.uri, position, ctoken).then((result: TokenInformation) => {

            let definition: vscode.DefinitionLink[] | null = null;
            if (result.found && result.token && result.uri) {
                definition = [{
                    targetUri: vscode.Uri.parse(result.uri),
                    targetRange: rangeFromToken(result.token),
                }];
            }
            
            return definition;
        });
    }

}
