import { SemanticClass } from '../../lib/parser';
import { db } from '../state';
import { rangeFromTokens } from '../utils';
import { vscode } from '../vscode';

export class UnrealScriptColorProvider implements vscode.DocumentColorProvider {

    provideDocumentColors(document: vscode.TextDocument, ctoken: vscode.CancellationToken) {
        const colors = new Array<vscode.ColorInformation>();
        const ast = db.updateDocumentAndGetAst(document, ctoken);
        for (const prop of ast.defaultProperties) {
            if (ctoken.isCancellationRequested) return colors;

            const value = prop.value;
            if (!value || 'text' in value) continue;
            if (value.op?.text === '(') {
                let colorFirstToken;
                let colorLastToken;
                let isColor = true;
                let valueIndex = -1;
                let colorValue = [0, 0, 0, 0];
                let components = ['r', 'g', 'b', 'a'];
                for (const token of value.args) {
                    if ('text' in token) {
                        let isColorToken = false;
                        if (token.type === SemanticClass.Identifier) {
                            let component = components.indexOf(token.textLower);
                            if (component !== -1) {
                                isColorToken = true;
                                valueIndex = component;
                            }
                            else {
                                isColor = false;
                                break;
                            }
                        }
                        else if (valueIndex !== -1 && token.type === SemanticClass.LiteralNumber) {
                            const numValue = parseInt(token.text);
                            if (!isNaN(numValue)) {
                                colorValue[valueIndex] = numValue / 255;
                                valueIndex = -1;
                                isColorToken = true;
                            }
                            else {
                                isColor = false;
                                break;
                            }
                        }
                        if (isColorToken) {
                            if (!colorFirstToken) colorFirstToken = token;
                            colorLastToken = token;
                        }
                    }
                    else {
                        isColor = false;
                        break;
                    }
                }
                if (isColor && colorFirstToken && colorLastToken) colors.push({
                    color: {
                        red: colorValue[0],
                        green: colorValue[1],
                        blue: colorValue[2],
                        alpha: 1
                    },
                    range: rangeFromTokens(colorFirstToken, colorLastToken),
                });
            }
        }
        return colors;
    }

    provideColorPresentations(color: { red: number; green: number; blue: number; }, context: any, token: any) {
        const R = Math.round(color.red * 255);
        const G = Math.round(color.green * 255);
        const B = Math.round(color.blue * 255);
        return [{ label: `R=${R},G=${G},B=${B}` }];
    }

}
