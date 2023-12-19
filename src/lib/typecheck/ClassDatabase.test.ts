import { ucParseLines } from "../parser/ucParse";
import { ClassDatabase, TokenInformation } from "./ClassDatabase";
import { renderDefinitionMarkdownLines } from "./renderDefinitonMarkdownLines";

let db: ClassDatabase;

beforeEach(() => db = new ClassDatabase());

describe("ast versioning", () => {

    const uri = "MyClass.uc";

    test('getVersion returns -Infinity when uri not found', () => {
        expectVersion(uri, -Infinity);
    });
    
    test('getVersion returns version number when ast added first', () => {
        addVersion(1);
        expectVersion(uri, 1);
    });
    
    test('getVersion returns latest version', () => {
        addVersion(1);
        addVersion(2);
        expectVersion(uri,  2);
    });
    
    test('getVersion returns highest', () => {
        addVersion(1);
        addVersion(0);
        expectVersion(uri,  1);
    });

    const addVersion = (v: number) => ast(uri, v, ["class MyClass;"]);

});

describe("find token", () => {

    const uri = "SomeClass.uc";

    beforeEach(() => {
        ast(uri, 1, [
            'class SomeClass extends Info;', // line 0
            '',
            '',
            '', // line 3
            'function PostBeginPlay(string name) {', // line 4
            '    local int i;',
            '    for (i=0; i<10; i+=1) Log("S"$name);', // line 6
            '}',
        ]);
    });

    test('searching in another file resutls in missing ast', () => {
        expect(db.findToken('asdasdas', 0, 0).missingAst).toBe(true);
    });
    
    test.each([
        [0, 1, { found: true }],
        [0, 100, { found: false }],
        [0, 1, { token: { text: 'class' } }],
        [0, 6, { token: { text: 'SomeClass' } }],
        [4, 32, { 
            token: {text: 'name'}, 
            functionScope: { name: { text: 'PostBeginPlay' }},
        }],
        [6, 9, { 
            token: { text: 'i' }, 
            functionScope: { name: { text: 'PostBeginPlay' }},
        }] as [number, number, TokenInformation],
    ])("findToken at (%p:%p) results %p", (line, column, expected) => {
        expect(db.findToken(uri, line, column)).toMatchObject(expected);
    });

    test.each([
        [6, 9, { 
            token: { text: 'i', line: 5 }, 
            typeToken: { text: 'int' },
        }] as [number, number, TokenInformation],
    ])("findLocalDefinition at (%p:%p) results %p", (line, column, expected) => {
        const token = db.findToken(uri, line, column);
        const definition = db.findLocalFileDefinition(token);
        expect(definition).toMatchObject(expected);
    });

    test.each([
        [6, 9, ['\tlocal int i']],
        [6, 35, ['\t(parameter) string name']],
    ] as [number, number, string[]][]
    )("markdown definition at (%p:%p) is %p", (line, column, expected) => {
        const info = db.findLocalFileDefinition(db.findToken(uri, line, column));
        expect(renderDefinitionMarkdownLines(info)).toEqual(expected);
    });

});

function ast(uri: string, version: number, lines: string[]) {
    db.updateAst(uri, ucParseLines(lines), version);
}

function expectVersion(uri: string, expected: number) {
    expect(db.getVersion(uri)).toBe(expected);
}