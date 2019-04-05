import * as ts from "typescript";
import * as lua from "./ast";

export class Transformer {

    public transformChunk(ast: lua.Chunk): string {
        const lines = [];
        ast.body.map((node) => lines.push(...this.transformStatement(node)));
        return lines.join("\n");
    }

    public * transformStatement(node: lua.Statement): IterableIterator<string> {
        switch (node.type) {
            case "LocalStatement":
                return this.transformLocalStatement(node);
            default:
                throw new Error(`Unknown node kind ${node.type}`);
        }
    }

    public * transformExpression(node: lua.Expression) {
        switch (node.type) {
            case "NumericLiteral":
                return this.transformLocalStatement(node as lua.LocalStatement);
            default:
                throw new Error(`Unknown expression kind ${node.type}`);
        }
    }

    public transformLocalStatement(node: lua.LocalStatement): ts.VariableStatement {
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
                        ts.createArrayLiteral([ts.createNumericLiteral('0')], false)
                    ),
                ],
                ts.NodeFlags.Let,
            ),
        );
        // const variableSet = node.variables.map((identifier) => identifier.name).join(", ");
        // const variableSet = node.init.map((expression) => [...this.transformExpression(expression)].).join(", ");
        // const variableBinding = `[${variableSet}]`;
        // yield `let ${variableBinding} = `;
    }

    public transformNumericLiteral(node: lua.NumericLiteral): ts.NumericLiteral {
        return ts.createNumericLiteral(node.value.toString());
    }

}
