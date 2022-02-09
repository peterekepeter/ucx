import { LintResult } from "../LintResult";
import { TokenBasedLinter } from "../TokenBasedLinter";


export class KeywordFormatRule implements TokenBasedLinter 
{
    nextToken(line: number, position: number, tokenText: string): LintResult[] | null {
        const lowercase = tokenText.toLowerCase();
        if (!UC_KEYWORDS.has(lowercase)){
            return null;
        }
        if (lowercase === tokenText){
            return null;
        }
        return [{
            line, position,
            length: tokenText.length,
            message: 'Keywords should be lowercase.',
            fixedText: lowercase,
            originalText: tokenText
        }];
    }
    
}

// mostly from https://wiki.beyondunreal.com/Legacy:UnrealScript_Keywords
// but edited a bit
const UC_KEYWORDS = new Set([
    'abstract',
    'always',
    'array',
    'arraycount',
    'assert',
    'auto',
    'automated',
    'bool',
    'break',
    'button',
    'byte',
    'case',
    'class',
    'coerce',
    'collapsecategories',
    'config', // (classes / variables)
    'const',
    'continue',
    'default',
    'defaultproperties',
    'delegate',
    'dependson',
    'deprecated',
    'do',
    'dontcollapsecategories',
    'edfindable',
    'editconst',
    'editconstarray',
    'editinline', // (variables)
    'editinlinenew', // (classes)
    'editinlinenotify', // (variables)
    'editinlineuse', // (variables)
    'else',
    'enum',
    'enumcount',
    'event',
    'exec',
    'expands',
    'export', // (variables / structs)
    'exportstructs',
    'extends',
    'final',
    'float',
    'for',
    'foreach',
    'function',
    'global',
    'globalconfig',
    'goto',
    'guid',
    'hidecategories',
    'if',
    'ignores',
    'import',
    'init',
    'input',
    'insert',
    'instanced',
    'int',
    'intrinsic',
    'invariant', // (UnStack.h: Return value is purely dependent on parameters; no state dependencies or internal state changes. Function flag.)
    'iterator',
    'latent',
    'length',
    'local',
    'localized', // (variables)
    'name',
    'native', // (classes / variables / structs)
    'nativereplication',
    'new',
    'noexport',
    'noteditinlinenew', // (classes)
    'notplaceable',
    'nousercreate',
    'operator',
    'optional',
    'out',
    'perobjectconfig',
    'placeable',
    'pointer',
    'postoperator',
    'preoperator',
    'private', // (variables / functions)
    'protected', // (variables / functions)
    'reliable',
    'remove',
    'replication',
    'return',
    'rng', // (is this used to specify constant range structs in code?)
    'rot',
    'safereplace',
    'self',
    'showcategories',
    'simulated', // (functions / states)
    'singular',
    'skip',
    'state',
    'static', // (Function Syntax / Static Function)
    'stop',
    'string',
    'struct',
    'super',
    'switch',
    'transient',
    'travel',
    'unreliable',
    'until',
    'var',
    'vect',
    'while',
    'within' // (classes)
]);

