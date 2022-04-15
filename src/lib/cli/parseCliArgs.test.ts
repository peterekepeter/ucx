import { CliCommand, parseCliArgs as parse } from "./parseCliArgs";

test('empty args return empty object', () => {
    expect(parse([])).toMatchObject({});
});

test('parsed interpreter and script', () => {
    expect(parse(['node', 'ucx.js'])).toMatchObject({
        jsInterpreter: 'node',
        ucxScript: 'ucx.js'
    } as Partial<CliCommand>);
});

test('parsed files', () => {
    expect(parse(['','','','../Project'])).toMatchObject({
        files: ['../Project']
    } as Partial<CliCommand>);
});

test('parsed command', () => {
    expect(parse(['','','build'])).toMatchObject({
        command: 'build',
    } as Partial<CliCommand>);
});

test('parsed ucc directory', () => {
    expect(parse(['','','', '--ucc', '../System/ucc.exe','../Project'])).toMatchObject({
        uccPath:'../System/ucc.exe',
        files: ['../Project']
    } as Partial<CliCommand>);
});

test('unsupported args reported as errors', () => {
    expect(parse(['','','','--unknown'])).toMatchObject({
        errors: ['Uknown argument "--unknown"']
    } as Partial<CliCommand>);
});