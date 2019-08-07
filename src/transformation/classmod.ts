import * as luaparse from "luaparse";
import * as helper from "./helper";

export function canBeTransformedToClass(statements: luaparse.Statement[], chunk: luaparse.Chunk): boolean {
    const [firstStatement] = statements;
    if (firstStatement && firstStatement.type === "LocalStatement") {
        const [tag] = helper.getTagsOfKind("classmod", firstStatement, chunk);
        if (tag) {
            return true;
        }
    }
    return false;
}
