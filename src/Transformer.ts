import * as ts from "typescript";
import * as lua from "./ast";
import * as helper from "./helper";
import * as tags from "./tags";

export class Transformer {

    private chunk!: lua.Chunk;
    private checker: ts.TypeChecker;

    constructor(program: ts.Program) {
        this.checker = program.getTypeChecker();
    }

    public transformChunk(ast: lua.Chunk): ts.Statement[] {
        this.chunk = ast;
        return this.transformBlock(ast.body);
    }

    private transformBlock(node: lua.Block): ts.Statement[] {
        const statements = node.map(statement => this.transformStatement(statement));
        return statements;
    }

    private transformStatement(node: lua.Statement): ts.Statement {
        switch (node.type) {
            case "LocalStatement":
                return this.transformLocalStatement(node);
            case "FunctionDeclaration":
                return this.transformFunctionDeclaration(node);
            case "AssignmentStatement":
                return this.transformAssignmentStatement(node);
            case "CallStatement":
                return this.transformCallStatement(node);
            case "IfStatement":
                return this.transformIfStatement(node);
            case "ForGenericStatement":
                return this.transformForGenericStatement(node);
            case "ForNumericStatement":
                return this.transformForNumericStatement(node);
        }
    }

    private transformExpression(node: lua.Expression): ts.Expression {
        switch (node.type) {
            case "NumericLiteral":
                return this.transformNumericLiteral(node);
            case "StringLiteral":
                return this.transformStringLiteral(node);
            case "Identifier":
                return this.transformIdentifier(node);
            case "TableConstructorExpression":
                return this.transformTableConstructorExpression(node);
            case "FunctionDeclaration":
                return this.transformFunctionExpression(node);
            case "UnaryExpression":
                return this.transformUnaryExpression(node);
            case "LogicalExpression":
                return this.transformLogicalExpression(node);
            case "BinaryExpression":
                return this.transformBinaryExpression(node);
            case "MemberExpression":
                return this.transformMemberExpression(node);
            case "CallExpression":
                return this.transformCallExpression(node);
        }
    }

    private transformBinaryExpression(node: lua.BinaryExpression): ts.BinaryExpression {
        const operator = node.operator === "%" ? ts.SyntaxKind.PercentToken
            : node.operator === "*" ? ts.SyntaxKind.AsteriskToken
                : node.operator === "+" ? ts.SyntaxKind.PlusToken
                    : node.operator === "-" ? ts.SyntaxKind.MinusToken
                        : node.operator === ".." ? ts.SyntaxKind.PlusToken
                            : node.operator === "/" ? ts.SyntaxKind.SlashToken
                                : node.operator === "<" ? ts.SyntaxKind.LessThanToken
                                    : node.operator === "<=" ? ts.SyntaxKind.LessThanEqualsToken
                                        : node.operator === "==" ? ts.SyntaxKind.EqualsEqualsEqualsToken
                                            : node.operator === ">" ? ts.SyntaxKind.GreaterThanToken
                                                : node.operator === ">=" ? ts.SyntaxKind.GreaterThanEqualsToken
                                                    : node.operator === "^" ? ts.SyntaxKind.CaretToken
                                                        : node.operator === "~=" ? ts.SyntaxKind.ExclamationEqualsEqualsToken : undefined;
        if (!operator) {
            throw new Error("Unknown operator");
        }

        return ts.createBinary(
            this.transformExpression(node.left),
            operator,
            this.transformExpression(node.right),
        );
    }

    private transformLogicalExpression(node: lua.LogicalExpression): ts.BinaryExpression {
        const operator = node.operator === "and" ? ts.SyntaxKind.AsteriskAsteriskToken
            : node.operator === "or" ? ts.SyntaxKind.BarBarToken : undefined;
        if (!operator) {
            throw new Error("Unknown operator");
        }

        return ts.createBinary(
            this.transformExpression(node.left),
            operator,
            this.transformExpression(node.right),
        );
    }

    private transformUnaryExpression(node: lua.UnaryExpression): ts.UnaryExpression {
        let operator: ts.SyntaxKind;
        switch (node.operator) {
            case "#":
                return ts.createPropertyAccess(
                    this.transformExpression(node.argument),
                    ts.createIdentifier("length"),
                );
            case "~":
                operator = ts.SyntaxKind.ExclamationToken;
                break;
            case "-":
                operator = ts.SyntaxKind.MinusToken;
                break;
            case "not":
                operator = ts.SyntaxKind.ExclamationToken;
                break;
            default:
                throw new Error("Unknown operator");
        }

        return ts.createPrefix(operator, this.transformExpression(node.argument));
    }

    private transformMemberExpression(node: lua.MemberExpression): ts.PropertyAccessExpression {
        return ts.createPropertyAccess(
            this.transformExpression(node.base),
            this.transformIdentifier(node.identifier),
        );
    }

    private transformIdentifier(node: lua.Identifier): ts.Identifier {
        return ts.createIdentifier(node.name);
    }

    private transformIfStatement(node: lua.IfStatement): ts.IfStatement {
        const ifClause: lua.IfClause = node.clauses[0];
        const rootIfStatement = ts.createIf(
            this.transformExpression(ifClause.condition),
            ts.createBlock(
                ifClause.body.map(statement => this.transformStatement(statement)),
            ),
        );
        let lastIfStatement = rootIfStatement;

        node.clauses.forEach(clause => {
            switch (clause.type) {
                case "ElseifClause":
                    lastIfStatement.elseStatement = ts.createIf(
                        this.transformExpression(ifClause.condition),
                        ts.createBlock(
                            ifClause.body.map(statement => this.transformStatement(statement)),
                        ),
                    );
                    lastIfStatement = lastIfStatement.elseStatement as ts.IfStatement;
                    break;
                case "ElseClause":
                    lastIfStatement.elseStatement = ts.createBlock(
                        clause.body.map(statement => this.transformStatement(statement)),
                    );
                    break;
            }
        });

        return rootIfStatement;
    }

    private transformForNumericStatement(node: lua.ForNumericStatement): ts.ForStatement {
        const identifier = this.transformIdentifier(node.variable);
        const incrementor = node.step === null
            ? ts.createPostfix(identifier, ts.SyntaxKind.PlusPlusToken)
            : ts.createBinary(
                identifier,
                ts.createToken(ts.SyntaxKind.FirstCompoundAssignment),
                this.transformExpression(node.step),
            );

        return ts.createFor(
            ts.createVariableDeclarationList(
                [
                    ts.createVariableDeclaration(
                        identifier,
                        undefined,
                        this.transformExpression(node.start),
                    ),
                ],
                ts.NodeFlags.Let,
            ),
            ts.createBinary(
                identifier,
                ts.createToken(ts.SyntaxKind.LessThanEqualsToken),
                this.transformExpression(node.end),
            ),
            incrementor,
            ts.createBlock(
                node.body.map(statement => this.transformStatement(statement)),
                true,
            ),
        )
        throw new Error("Method not implemented.");
    }

    private transformForGenericStatement(node: lua.ForGenericStatement): ts.ForOfStatement {
        throw new Error("Method not implemented.");
    }

    private transformTableKeyString(node: lua.TableKeyString): ts.ObjectLiteralElementLike {
        const name = node.key.type === "Identifier"
            ? this.transformIdentifier(node.key)
            : ts.createComputedPropertyName(this.transformExpression(node.key));

        return ts.createPropertyAssignment(
            name,
            this.transformExpression(node.value),
        );
    }

    private transformTableValue(node: lua.TableValue): ts.Expression {
        return this.transformExpression(node.value);
    }

    private transformTableConstructorExpression(
        node: lua.TableConstructorExpression,
    ): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
        const usingTableKeyStrings = node.fields.some(field => field.type === "TableKeyString");
        const usingTableValues = node.fields.some(field => field.type === "TableValue");
        if (usingTableKeyStrings && usingTableValues) {
            throw new Error("Cannot use table keys and values together");
        }

        if (usingTableValues) {
            return ts.createArrayLiteral(
                node.fields.map(field => this.transformTableValue(field as lua.TableValue)),
            );
        } else {
            return ts.createObjectLiteral(
                node.fields.map(field => this.transformTableKeyString(field as lua.TableKeyString)),
            );
        }
    }

    private transformParameterDeclaration(node: lua.Identifier, availableTags: tags.Tags[]): ts.ParameterDeclaration {
        const [tparam] = availableTags.filter(
            currentTag => currentTag.kind === "tparam" && currentTag.name === node.name,
        ) as tags.TParamTag[];
        const type = tparam ?
            tparam.type === "number" ? ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword) :
                tparam.type === "string" ? ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) :
                    undefined : undefined;

        return ts.createParameter(
            undefined,
            undefined,
            undefined,
            this.transformIdentifier(node),
            undefined,
            type,
            undefined,
        );
    }

    private transformNumericLiteral(node: lua.NumericLiteral): ts.NumericLiteral {
        return ts.createNumericLiteral(node.value.toString());
    }

    private transformStringLiteral(node: lua.StringLiteral): ts.StringLiteral {
        return ts.createStringLiteral(node.value);
    }

    private transformAssignmentStatement(node: lua.AssignmentStatement): ts.ExpressionStatement {
        return ts.createExpressionStatement(
            ts.createBinary(
                ts.createArrayLiteral(
                    node.variables.map(variable => variable.type === "Identifier"
                        ? this.transformIdentifier(variable)
                        : this.transformMemberExpression(variable)),
                    false,
                ),
                ts.createToken(ts.SyntaxKind.FirstAssignment),
                ts.createArrayLiteral(
                    node.init.map(expression => this.transformExpression(expression)),
                    false,
                ),
            ),
        );
    }

    private transformCallStatement(node: lua.CallStatement): ts.ExpressionStatement {
        return ts.createExpressionStatement(this.transformCallExpression(node.expression));
    }

    private transformCallExpression(node: lua.CallExpression): ts.CallExpression {
        return ts.createCall(
            this.transformExpression(node.base),
            undefined,
            node.arguments.map(expression => this.transformExpression(expression)),
        );
    }

    private transformVariablesToArrayBindingPattern(identifiers: lua.Identifier[]): ts.ArrayBindingPattern {
        return ts.createArrayBindingPattern(
            identifiers.map(identifier => {
                return ts.createBindingElement(
                    undefined,
                    undefined,
                    ts.createIdentifier(identifier.name),
                    undefined,
                );
            }),
        );
    }

    private transformLocalStatement(node: lua.LocalStatement): ts.VariableStatement {
        return ts.createVariableStatement(
            undefined,
            ts.createVariableDeclarationList(
                [
                    ts.createVariableDeclaration(
                        this.transformVariablesToArrayBindingPattern(node.variables),
                        undefined,
                        ts.createArrayLiteral(
                            node.init.map(identifier => this.transformExpression(identifier)),
                            false,
                        ),
                    ),
                ],
                ts.NodeFlags.Let,
            ),
        );
    }

    /**
     * Returns a FunctionDeclaration when a new function has been defined.
     *
     * Otherwise, it returns a FunctionExpression which must be hoisted to an object literal.
     * @param node A lua function declaration from the AST.
     */
    private transformFunctionDeclaration(
        node: lua.FunctionDeclaration,
    ): ts.FunctionDeclaration | ts.ExpressionStatement {
        const comments = helper.getComments(this.chunk, node);
        const availableTags = helper.getTags(comments);
        const tparams = availableTags.filter(currentTag =>
            currentTag.kind === "treturn" || currentTag.kind === "return",
        ) as Array<tags.ReturnTag | tags.TReturnTag>;
        const tparamsTypeNodes = tparams.map(tparam => {
            return tparam && tparam.kind === "treturn" ?
                tparam.type === "number" ? ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword) :
                    tparam.type === "string" ? ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) :
                        ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword) :
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
        });
        const type = ts.createTupleTypeNode(tparamsTypeNodes);

        switch (node.identifier.type) {
            case "Identifier":
                return ts.createFunctionDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    this.transformIdentifier(node.identifier),
                    undefined,
                    node.parameters.map(identifier => this.transformParameterDeclaration(identifier, availableTags)),
                    type,
                    ts.createBlock(
                        this.transformBlock(node.body),
                        true,
                    ),
                );
            case "MemberExpression": {
                return ts.createExpressionStatement(
                    ts.createAssignment(
                        this.transformExpression(node.identifier),
                        this.transformFunctionExpression(node),
                    ),
                );
            }
            default:
                throw new Error(`Unknown function declaration ${node.identifier!.type}`);
        }
    }

    private transformFunctionExpression(node: lua.FunctionExpression | lua.FunctionDeclaration): ts.FunctionExpression {
        return ts.createFunctionExpression(
            undefined,
            undefined,
            undefined,
            undefined,
            node.parameters.map(parameter => this.transformParameterDeclaration(parameter, [])),
            undefined,
            ts.createBlock(
                this.transformBlock(node.body),
                true,
            ),
        );
    }

}
