export type IniAst = IniSectionAst[];

export type IniSectionAst = {
    name: string;
    keyValue: IniKeyValueAst[];
};

export type IniKeyValueAst = {
    key: string;
    value: string;
};
