import { IniTokenType, IniTokenType as T } from "./IniToken";
import { iniTokenize } from "./iniTokenize";


const data = `
[URL]
Protocol=unreal
ProtocolDescription=Unreal Protocol
Name=Player
Map=Index.unr
LocalMap=CityIntro.unr
Host=
Portal=
MapExt=unr
SaveExt=usa
Port=7777
Class=Botpack.TMale1
`;

test.skip('tokenize basic keyvalue', () => {
    expect(fn('Protocol=unreal')).toEqual([
        ['Protocol', T.KeyName], 
        ['=', T.KeyEquals],
        ['unreal', T.Value],
    ]);
});


function fn(str: string): [string, IniTokenType][] {
    return iniTokenize(str).map(t => [t.text, t.tokenType]);
}
