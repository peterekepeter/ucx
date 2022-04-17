import { parseCliArgs as parse } from "./parseCliArgs";
import { UcxCommand } from "./UcxCommand";

test('empty args return empty object', () => {
    expect(parse([])).toMatchObject({});
});

test('parsed interpreter and script', () => {
    expect(parse(['node', 'ucx.js'])).toMatchObject({
        jsInterpreter: 'node',
        ucxScript: 'ucx.js'
    } as Partial<UcxCommand>);
});

test('parsed files', () => {
    expect(parse(['','','','../Project'])).toMatchObject({
        files: ['../Project']
    } as Partial<UcxCommand>);
});

test('parsed command', () => {
    expect(parse(['','','build'])).toMatchObject({
        command: 'build',
    } as Partial<UcxCommand>);
});

test('parsed ucc directory', () => {
    expect(parse(['','','', '--ucc', '../System/ucc.exe','../Project'])).toMatchObject({
        uccPath:'../System/ucc.exe',
        files: ['../Project']
    } as Partial<UcxCommand>);
});

test('unsupported args reported as errors', () => {
    expect(parse(['','','','--unknown'])).toMatchObject({
        errors: ['Uknown argument "--unknown"']
    } as Partial<UcxCommand>);
});