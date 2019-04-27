import * as ts from "typescript";
import * as lua from "./ast";

export class Transformer {

    public transformChunk(ast: lua.Chunk): ts.Statement[] {
        return ast.body.map(statement => this.transformStatement(statement));
    }

    private transformStatement(node: lua.Statement): ts.Statement {
        switch (node.type) {
            case "LocalStatement":
                return this.transformLocalStatement(node);
            default:
                throw new Error(`Unknown node kind ${node.type}`);
        }
    }

    // private transformExpression(node: lua.Expression): ts.Expression {
    //     switch (node.type) {
    //         case "NumericLiteral":
    //             return this.transformNumericLiteral(node);
    //         default:
    //             throw new Error(`Unknown expression kind ${node.type}`);
    //     }
    // }

    private transformLocalStatement(node: lua.LocalStatement): ts.VariableStatement {
        const arrayBindingPattern = ts.createArrayBindingPattern(
            node.variables.map((identifier) => {
                return ts.createBindingElement(
                    undefined,
                    undefined,
                    ts.createIdentifier(identifier.name),
                    undefined,
                );
            }),
        );
        return ts.createVariableStatement(
            undefined,
            ts.createVariableDeclarationList(
                [
                    ts.createVariableDeclaration(
                        arrayBindingPattern,
                        undefined,
                        ts.createArrayLiteral([ts.createNumericLiteral("0")], false),
                    ),
                ],
                ts.NodeFlags.Let,
            ),
        );
    }

    // private transformNumericLiteral(node: lua.NumericLiteral): ts.NumericLiteral {
    //     return ts.createNumericLiteral(node.value.toString());
    // }

}
