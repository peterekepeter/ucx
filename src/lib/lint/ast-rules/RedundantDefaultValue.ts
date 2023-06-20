import { ParserToken, UnrealClass } from "../../parser";
import { UnrealClassExpression, UnrealClassVariable } from "../../parser/ast";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";

export class RedundantDefaultValue implements AstBasedLinter
{
    lint(uc: UnrealClass): LintResult[] | null 
    {
        const vars = this.getDeclaredVariables(uc);

        let results: LintResult[] | null = null;

        for (const defaultProp of uc.defaultProperties){
            if (!defaultProp.name) {
                continue;
            }
            const value = defaultProp.value;            
            const variable = vars[defaultProp.name.textLower];
            if (!variable || !value){
                continue;
            }
            const type = variable.type?.textLower ?? '';
            
            if (this.isDefaultValueUseless(value, type)){
                if (results == null){
                    results = [];
                }
                const lastPos = this.getLastPosition(defaultProp.value);
                if (lastPos == null) { 
                    continue;
                }
                results.push({ 
                    fixedText: '',
                    line: defaultProp.name.line,
                    position: defaultProp.name.position,
                    length: lastPos, // whole line
                    message: 'Default value is redundant and has no effect',
                });
            }
        }
        return results;
    }

    getLastPosition(value: UnrealClassExpression | ParserToken | null): number | null {
        if (value == null){
            return null;
        }
        if ('text' in value){
            return value.position + value.text.length;
        }
        if (value.argsLastToken)
        {
            return value.argsLastToken.position + value.argsLastToken.text.length;
        }
        return this.getLastPosition(value.args[value.args.length - 1]);
    }

    isDefaultValueUseless(value: ParserToken | UnrealClassExpression, type: string): boolean {
        if (!('text' in value)){
            // does not support check for complex types
            return false; 
        }
        switch (type){
        case 'string': return value.text === '""';
        case 'int': return Number.parseInt(value.text) === 0;
        case 'float': return Number.parseFloat(value.text) === 0;
        case 'bool': return value.textLower === 'false';
        default: return value.textLower === 'none';
        }
    }

    private getDeclaredVariables(uc: UnrealClass): Record<string, UnrealClassVariable> 
    {
        let vars: Record<string, UnrealClassVariable> = {};
        for (const variable of uc.variables)
        {
            if (!variable.name){
                continue;
            }
            vars[variable.name.textLower] = variable;
        }
        return vars;
    }
}