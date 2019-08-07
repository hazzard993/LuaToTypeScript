import * as luaparse from "luaparse";
import * as helper from "./helper";

export function canBeTransformedToModule(statements: luaparse.Statement[], chunk: luaparse.Chunk): boolean {
    const [firstStatement, ...remainingStatements] = statements;
    if (firstStatement && firstStatement.type === "LocalStatement") {
        const [tag] = helper.getTagsOfKind("module", firstStatement, chunk);
        if (tag) {
            // Further function declarations could be nested
            if (
                !remainingStatements.some(statement => {
                    return (
                        statement.type === "FunctionDeclaration" &&
                        statement.identifier.type === "MemberExpression" &&
                        statement.identifier.base.type === "MemberExpression"
                    );
                })
            ) {
                return true;
            }
        }
    }
    return false;
}
