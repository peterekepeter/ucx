import { IndentLevelStrings } from "./IndentLevelStrings";

const tabIndent = new IndentLevelStrings('\t');

export function toIndentString(count: number): string {
    return tabIndent.getIndentString(count);
}
