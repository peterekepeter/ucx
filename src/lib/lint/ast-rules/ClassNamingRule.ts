import { UnrealClass } from "../../parser";
import { AstBasedLinter } from "../AstBasedLinter";
import { LintResult } from "../LintResult";


export class ClassNamingRule implements AstBasedLinter
{
    lint(ast: UnrealClass): LintResult[] | null {
        if (!ast.fileName)
        {
            return null; // not sourced from file
        }
        if (!ast.name) {
            return [{
                message: 'Missing class declaration',
                line: 0, 
                length: 16, 
                severity: "error",
                position: 0
            }];
        }
        if (!this.isPascalCase(ast.name.text)){
            return [{
                message: `Class names should be in PascalCase`,
                line: ast.name.line,
                position: ast.name.position,
                length: ast.name.text.length,
                severity: 'warning'
            }];
        }
        const expectedClassName = this.getExpectedClassName(ast.fileName);
        if (!this.isValidName(expectedClassName)) {
            const expectedFileName = `${ast.name.text}${this.getExtension(ast.fileName)}`;
            const expectation = `expected file name: ${expectedFileName}`;
            return [{
                message: `File names should match class names, ${expectation}`,
                line: 0,
                position: 0,
                length: 16,
                severity: 'warning'
            }];
        }
        if (ast.name && ast.name.text !== expectedClassName) {
            const expectation = `expected class name: ${expectedClassName}`;
            return [{
                message: `Class names should match file names, ${expectation}`,
                line: ast.name.line,
                position: ast.name.position,
                length: ast.name.text.length,
                severity: 'warning'
            }];
        }
        return null;
    }

    getExpectedClassName(fileName: string) {
        const lastSlash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'));
        const nameWithoutPath = fileName.substring(lastSlash + 1);
        const dotIndex = nameWithoutPath.indexOf('.');
        const name = dotIndex > 0 ? nameWithoutPath.substring(0, dotIndex) : nameWithoutPath;
        return name;
    }

    getExtension(fileName: string) {
        const dotIndex = fileName.indexOf('.');
        return dotIndex > 0 ? fileName.substring(dotIndex) : '.uc';
    }
    
    isValidName(name: string){
        return name.match(/^[a-z_][A-Z0-9_]*$/i);
    }

    isPascalCase(name: string){
        return name.length > 0 
            && name[0].toUpperCase() === name[0];
    }


}