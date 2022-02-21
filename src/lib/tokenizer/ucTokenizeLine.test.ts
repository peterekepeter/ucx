import { ucTokenizeLine } from './ucTokenizeLine';


test("tokenize class declaration", () => verifyTokens(`
    class Actor extends Object
        abstract
        native
        nativereplication;
`, [
    'class', 'Actor', 'extends', 'Object', 'abstract', 'native', 'nativereplication', ';'
]));

test("tokenize native function declaration", () => verifyTokens(`
    // Float functions.
    native(186) static final function     float Abs   ( float A );
`, [
    '// Float functions.', 
    'native', '(', '186', ')', 'static', 'final', 'function', 'float', 'Abs', '(', 'float', 'A', ')', ';'
]));

test("tokenzie hexadecimal", () => verifyTokens(`
    const RF_Transactional	= 0x00000001; // Supports editor undo/redo.
`, [
    'const', 'RF_Transactional', '=', '0x00000001', ';', '// Supports editor undo/redo.'
]));

test("tokenize float point value", () => verifyTokens(`
    const Pi     = 3.1415926535897932;
`, [ 
    'const', 'Pi', '=', '3.1415926535897932', ';'
]));

test("tokenize multiline comment", () => verifyTokens(`
    /*  
     * Something
     */
	function test(){ 
`,[ 
    '/*', '*','Something','*/', 
    'function', 'test', '(', ')', '{'
]));

test("tokenize just a line comment", () => verifyTokens(`
    // Float functions.
`, [
    '// Float functions.', 
]));

test("tokenize string", () => verifyTokens(`
    pos = InStr(FullName, ".");
`,[ 
    'pos', '=', 'InStr', '(', 'FullName', ',', '"."', ')', ';'
]));


test("tokenize name", () => verifyTokens(`
    Texture=Texture'Engine.S_Actor'
`,[
    'Texture', '=', 'Texture', "'Engine.S_Actor'"
]));

test("tokenize for loop", () => verifyTokens(`
    for( P=Level.PawnList; P!=None; P=P.nextPawn )'
`,[
    'for', '(', 'P', '=', 'Level', '.', 'PawnList', ';', 'P', '!=', 'None', ';', 'P', '=', 'P', '.', 'nextPawn', ')'
]));

test("tokenize var array", () => verifyTokens(`
    var string Items[32];
`, [
    'var', 'string', 'Items', '[', '32', ']', ';'
]));

test("tokenize comment start/end", () => verifyTokens(`
    var string /*Items[32]*/ Item;
`, [
    'var', 'string', '/*', 'Items', '[', '32', ']', '*/', 'Item', ';'
]));

test("tokenzie positions", () => {
    expect(ucTokenizeLine("local int i;")).toEqual([
        { 
            position: 0,
            text: 'local'
        },
        { 
            position: 6,
            text: 'int'
        },
        { 
            position: 10,
            text: 'i'
        },
        { 
            position: 11,
            text: ';'
        }
    ]);
});

function verifyTokens(input: string, output: string[]){
    expect(tokenize(input)).toEqual(output);
}

function tokenize(input: string): string[] {
    return ucTokenizeLine(input).map(t => t.text);
}