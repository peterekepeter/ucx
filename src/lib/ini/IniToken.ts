
export type IniToken = {
    readonly line: number;
    readonly position: number;
    readonly text: string;
    readonly tokenType: IniTokenType;
};

export enum IniTokenType {
    SectionMarkerBegin,
    SectionMarkerEnd,
    SectionName,
    KeyName,
    KeyEquals,
    Value
}
