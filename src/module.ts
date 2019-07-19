import * as lua from "./ast";
import * as helper from "./helper";

export function canBeTransformedToModule(statements: lua.Statement[], chunk: lua.Chunk): boolean {
    const [firstStatement] = statements;
    if (firstStatement && firstStatement.type === "LocalStatement") {
        const [tag] = helper.getTagsOfKind("module", firstStatement, chunk);
        if (tag) {
            return true;
        }
    }
    return false;
}
