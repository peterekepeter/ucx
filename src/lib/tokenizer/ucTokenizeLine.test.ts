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

test("tokenize string", () => verifyTokens(`
    const HTML = "abcd"
`, [
    'const', 'HTML', '=', '"abcd"'
]));


test("tokenize string with escape", () => verifyTokens(`
    const HTML = "<font color=\\"FFFF00\\">"
`, [
    'const', 'HTML', '=', '"<font color=\\"FFFF00\\">"'
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

test("tokenize assign negative value", () => verifyTokens(`
    id=-1;
`, [
    'id', '=', '-1', ';'
]));

test("tokenize exec", () => verifyTokens(`
    #exec obj load file=..\\Sounds\\Announcer.uax
`, [
    '#exec obj load file=..\\Sounds\\Announcer.uax'
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

test("tokenize labels", () => verifyTokens(`
    LOOP_BEGIN: i=0;
`, [
    'LOOP_BEGIN', ':', 'i', '=', '0', ';'
]));

test("tokenize operators", () => verifyTokens(`
    ~=
`, [
    '~='
]));

test("does suffer from catastropic backtracking on certain inputs", () => {
    //  may produce catastrophic backtracking with the tokenizer
    const input = `Resultset = HereWeHaveALongString$"\\changelevels\\"$SomeMoreStuffThatGoesHere;`;
    expect(tokenize(input)).toBeTruthy();
})

test("correctly parses string with escaped backslash in front of string constant", () => verifyTokens(`
    s = "\\\\test\\\\";
`, [
    's', '=', '"\\\\test\\\\"', ';'
]));

test("correctly parses string with escapte quotes inside preceeded by escaped backslash", () => verifyTokens(`
    s = "some\\\\\\"thing";
`, [
    's', '=', '"some\\\\\\"thing"', ';'
]));

test("tokenize infix math", () => verifyTokens(`
    x=a+1;
`, [
    'x', '=', 'a', '+', '1', ';',
]));

function verifyTokens(input: string, output: string[]){
    expect(tokenize(input)).toEqual(output);
}

function tokenize(input: string): string[] {
    return ucTokenizeLine(input).map(t => t.text);
}