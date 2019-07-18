import * as ts from "typescript";
import * as lua from "./ast";
import * as helper from "./helper";
import * as tags from "./tags";
import { TsBuilder } from "./TsBuilder";

export function canBeTransformedToClass(statements: lua.Statement[], chunk: lua.Chunk): boolean {
    const [firstStatement] = statements;
    if (firstStatement && firstStatement.type === "LocalStatement") {
        const [tag] = helper.getTagsOfKind("classmod", firstStatement, chunk);
        if (tag) {
            return true;
        }
    }
    return false;
}
