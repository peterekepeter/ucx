import { IniTokenType, IniTokenType as T } from "./IniToken";
import { iniTokenize } from "./iniTokenize";


test('tokenize basic keyvalue', () => {
    expect(fn('Protocol=unreal1')).toEqual([
        ['Protocol', T.KeyName], 
        ['=', T.KeyEquals],
        ['unreal1', T.Value],
    ]);
});

test('tokenize key without value', () => {
    expect(fn('Host=')).toEqual([
        ['Host', T.KeyName], 
        ['=', T.KeyEquals],
        ['', T.Value],
    ]);
});

test('tokenize value with whitespace', () => {
    expect(fn('Host=value with whitespace')).toEqual([
        ['Host', T.KeyName], 
        ['=', T.KeyEquals],
        ['value with whitespace', T.Value],
    ]);
});

test('tokenize section', () => {
    expect(fn('[URL]')).toEqual([
        ['[URL]', T.Section], 
    ]);
});

test('tokenize multiple lines', () => {
    const data = [
        "[URL]",
        "Protocol=unreal",
        "ProtocolDescription=Unreal Protocol",
    ].join('\n');
    expect(fn(data)).toEqual([
        ['[URL]', T.Section], 
        ['Protocol', T.KeyName], 
        ['=', T.KeyEquals],
        ['unreal', T.Value],
        ['ProtocolDescription', T.KeyName], 
        ['=', T.KeyEquals],
        ['Unreal Protocol', T.Value],
    ]);
});

function fn(str: string): [string, IniTokenType][] {
    return iniTokenize(str).map(t => [t.text, t.tokenType]);
}
