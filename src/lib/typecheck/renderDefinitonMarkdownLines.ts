import { TokenInformation } from "./ClassDatabase";


export function renderDefinitionMarkdownLines(info: TokenInformation): string[] {
    if (!info.found) {
        return [  ];
    }
    if (info.token)
    {
        if (info.functionScope) {
            if (info.paramDefinition) 
            {
                const def = info.paramDefinition;
                const result = ['(parameter)'];
                if (def.type) result.push(def.type.text);
                if (def.name) result.push(def.name.text);
                return [`\t${result.join(' ')}`];
            }
            if (info.localDefinition)
            {
                const def = info.localDefinition;
                const result = ['local'];
                if (def.type) result.push(def.type.text);
                if (def.name) result.push(def.name.text);
                // local var
                return [`\t${result.join(' ')}`];
            }
        }
    }
    return [ '???' ];
}
