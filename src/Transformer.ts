import * as ts from "typescript";
import * as lua from "./ast";
import * as helper from "./helper";
import * as tags from "./tags";
import * as classmod from "./classmod";
import * as moduleTag from "./module";
import { TsBuilder } from "./TsBuilder";
import { Options } from "./transpile";

export class Transformer {
    private chunk!: lua.Chunk;
    private checker?: ts.TypeChecker;
    private diagnostics: string[];
    private builder: TsBuilder;
    private blockScopeLevel = 0;

    constructor(program: ts.Program | undefined, private options: Options) {
        if (program) {
            this.checker = program.getTypeChecker();
        }
        this.diagnostics = [];
        this.builder = new TsBuilder();
    }

    public getDiagnostics(): string[] {
        return this.diagnostics;
    }

    public getBuilder(): TsBuilder {
        return this.builder;
    }

    public transformChunk(ast: lua.Chunk): ts.Statement[] {
        this.chunk = ast;
        this.blockScopeLevel = 0;

        let statements = ast.body;
        const result: ts.Statement[] = [];

        if (this.options.module && moduleTag.canBeTransformedToModule(statements, this.chunk)) {
            const [exportedFunctions, remainingStatements] = this.transformExportedFunctionMembers(statements);
            statements = remainingStatements;
            result.push(...exportedFunctions);
        }

        result.push(...this.transformBlock(statements));

        return result;
    }

    private transformBlock(statements: lua.Block): ts.Statement[] {
        this.blockScopeLevel++;

        const result: ts.Statement[] = [];
        if (this.options.classmod && classmod.canBeTransformedToClass(statements, this.chunk)) {
            const [classDeclaration, ...remainingStatements] = this.transformStatementsAsClass(statements);
            statements = remainingStatements;
            result.push(classDeclaration);
        }

        const remainingStatements = statements.map(statement => this.transformStatement(statement));
        result.push(...remainingStatements);

        this.blockScopeLevel--;

        return result;
    }

    private transformStatementsAsClass(statements: lua.Statement[]): [ts.ClassDeclaration, ...lua.Statement[]] {
        const [localStatement, ...statementsToCheck] = statements;
        const memberExpressionFunctionDeclarations: lua.FunctionDeclaration[] = [];
        const remainingStatements = statementsToCheck.filter(statement => {
            if (statement.type === "FunctionDeclaration" && statement.identifier.type === "MemberExpression") {
                memberExpressionFunctionDeclarations.push(statement);
            } else {
                return true;
            }
        });

        const name =
            localStatement && localStatement.type === "LocalStatement" ? localStatement.variables[0].name : undefined;
        const methods = memberExpressionFunctionDeclarations.map(statement =>
            this.transformFunctionDeclarationAsMethod(statement as lua.FunctionDeclaration)
        );

        const classDeclaration = this.builder.createClassDeclaration(
            undefined,
            undefined,
            name ? this.builder.createIdentifier(name, localStatement) : undefined,
            undefined,
            undefined,
            methods,
            localStatement
        );

        return [classDeclaration, ...remainingStatements];
    }

    private transformExportedFunctionMembers(statements: lua.Statement[]): [ts.FunctionDeclaration[], lua.Statement[]] {
        const exportedFunctions: ts.FunctionDeclaration[] = [];
        const remainingStatements = statements.slice(1).filter(statement => {
            if (statement.type === "FunctionDeclaration" && statement.identifier.type === "MemberExpression") {
                const functionDeclaration = this.transformFunctionDeclarationAsExportedFunction(
                    statement as lua.FunctionDeclaration
                );
                exportedFunctions.push(functionDeclaration);
                return false;
            } else {
                return true;
            }
        });

        return [exportedFunctions, remainingStatements];
    }

    private joinObjectAssignmentStatements(statements: ts.Statement[]): ts.Statement[] {
        const block = this.builder.createBlock(statements);
        // tsquery(block, "ExpressionStatement > BinaryExpression > PropertyAccessExpression > Identifier[name=x]")
        // tsquery(this.builder.createBlock(statements),)
        const variableDeclarations = statements.filter(
            statement =>
                ts.isVariableStatement(statement) &&
                ts.isVariableDeclaration(statement.declarationList.declarations[0]) &&
                ts.isIdentifier(statement.declarationList.declarations[0].name)
        ) as ts.VariableStatement[] & { declarationList: { declarations: [{ name: ts.Identifier }] } };
        const objectLiteralDeclarations = variableDeclarations.filter(
            variableDeclaration =>
                variableDeclaration.declarationList.declarations[0].initializer &&
                ts.isObjectLiteralExpression(variableDeclaration.declarationList.declarations[0].initializer)
        ) as Array<
            ts.VariableStatement & {
                declarationList: { declarations: [{ name: ts.Identifier; initializer: ts.Expression }] };
            }
        >;
        const objectLiteralNodes = objectLiteralDeclarations.map(objectLiteralDeclaration => ({
            identifier: objectLiteralDeclaration.declarationList.declarations[0].name,
            objectLiteralExpression: objectLiteralDeclaration.declarationList.declarations[0].initializer,
        })) as Array<{ identifier: ts.Identifier; objectLiteralExpression: ts.ObjectLiteralExpression }>;
        return objectLiteralDeclarations;
    }

    private transformStatement(node: lua.Statement): ts.Statement {
        switch (node.type) {
            case "LocalStatement":
                return this.transformLocalStatement(node);
            case "ReturnStatement":
                return this.transformReturnStatement(node);
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
            case "WhileStatement":
                return this.transformWhileStatement(node);
            case "BreakStatement":
                return this.transformBreakStatement(node);
            default:
                throw new Error(`Unknown Statement Type: ${node!.type}`);
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
            case "StringCallExpression":
                return this.transformStringCallExpression(node);
            case "TableCallExpression":
                return this.transformTableCallExpression(node);
            case "BooleanLiteral":
                return this.transformBooleanLiteral(node);
            case "VarargLiteral":
                return this.transformVarargLiteral(node);
            case "NilLiteral":
                return this.transformNilLiteral(node);
            case "IndexExpression":
                return this.transformIndexExpression(node);
            default:
                throw new Error(`Unknown Expression Type: ${node!.type} ${node!.range}`);
        }
    }

    private transformNilLiteral(node: lua.NilLiteral): ts.Identifier {
        return this.builder.createIdentifier("undefined");
    }

    private transformIndexExpression(node: lua.IndexExpression): ts.ElementAccessExpression {
        return this.builder.createElementAccess(
            this.transformExpression(node.base),
            this.transformExpression(node.index)
        );
    }

    private transformVarargLiteral(node: lua.VarargLiteral): ts.Expression {
        return this.builder.createSpread(this.builder.createIdentifier("vararg"));
    }

    private transformBooleanLiteral(node: lua.BooleanLiteral): ts.Expression {
        if (node.value) {
            return this.builder.createTrue();
        } else {
            return this.builder.createFalse();
        }
    }

    private transformBinaryExpression(node: lua.BinaryExpression): ts.BinaryExpression {
        let operator: ts.SyntaxKind;
        switch (node.operator) {
            case "%":
                operator = ts.SyntaxKind.PercentToken;
                break;
            case "*":
                operator = ts.SyntaxKind.AsteriskToken;
                break;
            case "+":
                operator = ts.SyntaxKind.PlusToken;
                break;
            case "-":
                operator = ts.SyntaxKind.MinusToken;
                break;
            case "..":
                operator = ts.SyntaxKind.PlusToken;
                break;
            case "/":
                operator = ts.SyntaxKind.SlashToken;
                break;
            case "<":
                operator = ts.SyntaxKind.LessThanToken;
                break;
            case "<=":
                operator = ts.SyntaxKind.LessThanEqualsToken;
                break;
            case "==":
                operator = ts.SyntaxKind.EqualsEqualsEqualsToken;
                break;
            case ">":
                operator = ts.SyntaxKind.GreaterThanToken;
                break;
            case ">=":
                operator = ts.SyntaxKind.GreaterThanEqualsToken;
                break;
            case "^":
                operator = ts.SyntaxKind.CaretToken;
                break;
            case "~=":
                operator = ts.SyntaxKind.ExclamationEqualsEqualsToken;
                break;
            default:
                throw new Error("Unknown operator");
        }

        return this.builder.createBinary(
            this.transformExpression(node.left),
            operator,
            this.transformExpression(node.right)
        );
    }

    private transformLogicalExpression(node: lua.LogicalExpression): ts.BinaryExpression {
        const operator =
            node.operator === "and"
                ? ts.SyntaxKind.AmpersandAmpersandToken
                : node.operator === "or"
                ? ts.SyntaxKind.BarBarToken
                : undefined;
        if (!operator) {
            throw new Error("Unknown operator");
        }

        return this.builder.createBinary(
            this.transformExpression(node.left),
            operator,
            this.transformExpression(node.right)
        );
    }

    private transformUnaryExpression(node: lua.UnaryExpression): ts.UnaryExpression {
        let operator: ts.SyntaxKind;
        switch (node.operator) {
            case "#":
                return this.builder.createPropertyAccess(
                    this.transformExpression(node.argument),
                    this.builder.createIdentifier("length")
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

        return this.builder.createPrefix(operator, this.transformExpression(node.argument));
    }

    private transformMemberExpression(node: lua.MemberExpression): ts.PropertyAccessExpression {
        return this.builder.createPropertyAccess(
            this.transformExpression(node.base),
            this.transformIdentifier(node.identifier)
        );
    }

    private transformIdentifier(node: lua.Identifier): ts.Identifier {
        let chosenName: string;
        switch (node.name) {
            case "_G": {
                chosenName = "globalThis";
                break;
            }
            default: {
                chosenName = node.name;
            }
        }
        return this.builder.createIdentifier(chosenName, node);
    }

    private transformIfStatement(node: lua.IfStatement): ts.IfStatement {
        const ifClause: lua.IfClause = node.clauses[0];
        const rootIfStatement = this.builder.createIf(
            this.transformExpression(ifClause.condition),
            this.builder.createBlock(
                ifClause.body.map(statement => this.transformStatement(statement)),
                undefined,
                ifClause
            ),
            undefined,
            node
        );
        let lastIfStatement = rootIfStatement;

        node.clauses.forEach(clause => {
            switch (clause.type) {
                case "ElseifClause":
                    lastIfStatement.elseStatement = this.builder.createIf(
                        this.transformExpression(ifClause.condition),
                        this.builder.createBlock(
                            ifClause.body.map(statement => this.transformStatement(statement)),
                            undefined,
                            ifClause
                        )
                    );
                    lastIfStatement = lastIfStatement.elseStatement as ts.IfStatement;
                    break;
                case "ElseClause":
                    lastIfStatement.elseStatement = this.builder.createBlock(
                        clause.body.map(statement => this.transformStatement(statement))
                    );
                    break;
            }
        });

        return rootIfStatement;
    }

    private transformType(type: string): ts.TypeNode {
        const types = type.split("|").map(typeString => {
            switch (typeString) {
                case "number":
                    return this.builder.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
                case "string":
                    return this.builder.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
                default:
                    throw new Error(`Unknown type ${typeString}`);
            }
        });
        if (types.length === 1) {
            return types[0];
        } else {
            return this.builder.createUnionTypeNode(types);
        }
    }

    private transformForNumericStatement(node: lua.ForNumericStatement): ts.ForStatement {
        const identifier = this.transformIdentifier(node.variable);
        const incrementor =
            node.step === null
                ? this.builder.createPostfix(identifier, ts.SyntaxKind.PlusPlusToken)
                : this.builder.createBinary(
                      identifier,
                      this.builder.createToken(ts.SyntaxKind.FirstCompoundAssignment),
                      this.transformExpression(node.step)
                  );

        return this.builder.createFor(
            this.builder.createVariableDeclarationList(
                [
                    this.builder.createVariableDeclaration(
                        identifier,
                        undefined,
                        this.transformExpression(node.start),
                        node.start
                    ),
                ],
                ts.NodeFlags.Let,
                node.start
            ),
            this.builder.createBinary(
                identifier,
                this.builder.createToken(ts.SyntaxKind.LessThanEqualsToken, node.end),
                this.transformExpression(node.end),
                node.end
            ),
            incrementor,
            this.builder.createBlock(node.body.map(statement => this.transformStatement(statement)), true, node),
            node
        );
    }

    private transformForGenericStatement(node: lua.ForGenericStatement): ts.ForOfStatement {
        return this.builder.createForOf(
            undefined,
            this.builder.createVariableDeclarationList(
                [
                    this.builder.createVariableDeclaration(
                        this.builder.createArrayBindingPattern(
                            node.variables.map(identifier =>
                                this.builder.createBindingElement(
                                    undefined,
                                    undefined,
                                    this.transformIdentifier(identifier),
                                    undefined,
                                    identifier
                                )
                            )
                        )
                    ),
                ],
                ts.NodeFlags.Const,
                node
            ),
            this.transformExpression(node.iterators[0]),
            this.builder.createBlock(this.transformBlock(node.body), true),
            node
        );
    }

    private transformWhileStatement(node: lua.WhileStatement): ts.WhileStatement {
        return this.builder.createWhile(
            this.transformExpression(node.condition),
            this.builder.createBlock(this.transformBlock(node.body), true, node),
            node
        );
    }

    private transformBreakStatement(node: lua.BreakStatement): ts.BreakStatement {
        return this.builder.createBreak(node);
    }

    private transformTableKeyString(node: lua.TableKeyString): ts.ObjectLiteralElementLike {
        const name =
            node.key.type === "Identifier"
                ? this.transformIdentifier(node.key)
                : this.builder.createComputedPropertyName(this.transformExpression(node.key), node.key);

        return this.builder.createPropertyAssignment(name, this.transformExpression(node.value), node);
    }

    private transformTableValue(node: lua.TableValue): ts.Expression {
        return this.transformExpression(node.value);
    }

    private transformTableConstructorExpression(
        node: lua.TableConstructorExpression
    ): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
        const usingTableKeyStrings = node.fields.some(field => field.type === "TableKeyString");
        const usingTableValues = node.fields.some(field => field.type === "TableValue");
        if (usingTableKeyStrings && usingTableValues) {
            throw new Error("Cannot use table keys and values together");
        }

        if (usingTableValues) {
            return this.builder.createArrayLiteral(
                node.fields.map(field => this.transformTableValue(field as lua.TableValue))
            );
        } else {
            return this.builder.createObjectLiteral(
                node.fields.map(field => this.transformTableKeyString(field as lua.TableKeyString))
            );
        }
    }

    private transformParameterDeclaration(
        node: lua.Identifier | lua.VarargLiteral,
        availableTags: tags.Tag[]
    ): ts.ParameterDeclaration {
        const tparams = helper.getParameterTParam(node, availableTags);
        if (Array.isArray(tparams)) {
            const name = node.type === "Identifier" ? node.name : node.value;
            if (tparams.length === 0) {
                this.diagnostics.push(helper.noLeadingWhitespace`
                    Parameter ${name} does not have a type signature.
                    Use "@tparam <type> ${name}" to define this.
                `);
            } else {
                this.diagnostics.push(`Many @tparams found for parameter ${name}. Using the first one.`);
            }
        }
        const tparam: tags.TParamTag | undefined = Array.isArray(tparams) ? tparams[0] : tparams;
        const type = tparam ? this.transformType(tparam.type) : undefined;

        switch (node.type) {
            case "Identifier":
                return this.builder.createParameter(
                    undefined,
                    undefined,
                    undefined,
                    this.transformIdentifier(node),
                    undefined,
                    type,
                    undefined,
                    node
                );
            case "VarargLiteral":
                return this.builder.createParameter(
                    undefined,
                    undefined,
                    this.builder.createToken(ts.SyntaxKind.DotDotDotToken, node),
                    this.builder.createIdentifier("vararg", node),
                    undefined,
                    type,
                    undefined,
                    node
                );
        }
    }

    private transformNumericLiteral(node: lua.NumericLiteral): ts.NumericLiteral {
        return this.builder.createNumericLiteral(node.value.toString(), node);
    }

    private transformStringLiteral(node: lua.StringLiteral): ts.StringLiteral {
        return this.builder.createStringLiteral(node.value, node);
    }

    private transformAssignmentLeftHandSideExpression(
        node: lua.Identifier | lua.MemberExpression | lua.IndexExpression
    ): ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression {
        switch (node.type) {
            case "Identifier":
                return this.transformIdentifier(node);
            case "MemberExpression":
                return this.transformMemberExpression(node);
            case "IndexExpression":
                return this.transformIndexExpression(node);
        }
    }

    private transformAssignment(
        variables: Array<lua.Identifier | lua.MemberExpression | lua.IndexExpression>,
        expressions: lua.Expression[]
    ):
        | {
              left: ts.Identifier | ts.PropertyAccessExpression | ts.ElementAccessExpression;
              right: ts.Expression;
          }
        | {
              left: ts.ArrayLiteralExpression;
              right: ts.ArrayLiteralExpression;
          } {
        const transformedVariables = variables.map(variable =>
            this.transformAssignmentLeftHandSideExpression(variable)
        );
        const transformedExpressions = expressions.map(expression => this.transformExpression(expression));
        if (variables.length > 1) {
            return {
                left: this.builder.createArrayLiteral(transformedVariables, false),
                right: this.builder.createArrayLiteral(transformedExpressions, false),
            };
        } else {
            return {
                left: transformedVariables[0],
                right: transformedExpressions[0],
            };
        }
    }

    private transformAssignmentStatement(node: lua.AssignmentStatement): ts.ExpressionStatement {
        const { left, right } = this.transformAssignment(node.variables, node.init);
        return this.builder.createExpressionStatement(
            this.builder.createBinary(left, this.builder.createToken(ts.SyntaxKind.FirstAssignment, node), right, node)
        );
    }

    private transformCallStatement(node: lua.CallStatement): ts.ExpressionStatement {
        return this.builder.createExpressionStatement(this.transformCallExpression(node.expression));
    }

    private transformCallExpression(node: lua.CallExpression): ts.CallExpression {
        return this.builder.createCall(
            this.transformExpression(node.base),
            undefined,
            node.arguments.map(expression => this.transformExpression(expression)),
            node
        );
    }

    private transformStringCallExpression(node: lua.StringCallExpression): ts.CallExpression {
        return this.builder.createCall(
            this.transformExpression(node.base),
            undefined,
            [this.transformExpression(node.argument)],
            node
        );
    }

    private transformTableCallExpression(node: lua.TableCallExpression): ts.CallExpression {
        return this.builder.createCall(
            this.transformExpression(node.base),
            undefined,
            [this.transformExpression(node.argument)],
            node
        );
    }

    private transformLocalBindingPattern(
        variables: lua.Identifier[],
        expressions: lua.Expression[]
    ):
        | {
              left: ts.Identifier;
              right: ts.Expression;
          }
        | {
              left: ts.ArrayBindingPattern;
              right: ts.ArrayLiteralExpression;
          } {
        const transformedVariables = variables.map(variable => this.transformIdentifier(variable));
        const transformedExpressions = expressions.map(expression => this.transformExpression(expression));
        if (variables.length > 1) {
            return {
                left: this.builder.createArrayBindingPattern(
                    transformedVariables.map(variable =>
                        this.builder.createBindingElement(undefined, undefined, variable, undefined)
                    )
                ),
                right: this.builder.createArrayLiteral(transformedExpressions, false),
            };
        } else {
            return {
                left: transformedVariables[0],
                right: transformedExpressions[0],
            };
        }
    }

    private transformLocalStatement(node: lua.LocalStatement): ts.VariableStatement {
        const { left, right } = this.transformLocalBindingPattern(node.variables, node.init);
        const [tag] = helper.getTagsOfKind("type", node, this.chunk);
        const type = tag ? this.transformType(tag.type) : undefined;

        return this.builder.createVariableStatement(
            undefined,
            this.builder.createVariableDeclarationList(
                [this.builder.createVariableDeclaration(left, type, right)],
                ts.NodeFlags.Let,
                node
            ),
            node
        );
    }

    private transformReturnStatement(node: lua.ReturnStatement): ts.ReturnStatement | ts.ExportAssignment {
        const returnArguments = node.arguments.map(argument => this.transformExpression(argument));
        const returnExpression =
            returnArguments.length > 0
                ? returnArguments.length === 1
                    ? returnArguments[0]
                    : this.builder.createArrayLiteral(returnArguments, false, node)
                : undefined;

        if (this.blockScopeLevel === 1 && returnExpression) {
            return this.builder.createExportAssignment(undefined, undefined, true, returnExpression, node);
        } else {
            return this.builder.createReturn(returnExpression, node);
        }
    }

    private transformFunctionDeclaration(
        node: lua.FunctionDeclaration
    ): ts.FunctionDeclaration | ts.ExpressionStatement {
        const comments = helper.getComments(this.chunk, node);
        const availableTags = helper.getTags(comments);
        const treturns = availableTags.filter(currentTag => currentTag.kind === "treturn") as tags.TReturnTag[];
        const treturnTypes = treturns.map(treturn => this.transformType(treturn.type));
        const type =
            treturnTypes.length > 0
                ? treturnTypes.length > 1
                    ? this.builder.createTupleTypeNode(treturnTypes)
                    : treturnTypes[0]
                : this.builder.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

        switch (node.identifier.type) {
            case "Identifier":
                return this.builder.createFunctionDeclaration(
                    undefined,
                    undefined,
                    undefined,
                    this.transformIdentifier(node.identifier),
                    undefined,
                    node.parameters.map(identifier => this.transformParameterDeclaration(identifier, availableTags)),
                    type,
                    this.builder.createBlock(this.transformBlock(node.body), true, node),
                    node
                );
            case "MemberExpression": {
                if (node.identifier.indexer === ":") {
                    node.parameters.unshift({
                        type: "Identifier",
                        name: "self",
                        range: node.range,
                        raw: "self"
                    });
                }

                return this.builder.createExpressionStatement(
                    this.builder.createAssignment(
                        this.transformExpression(node.identifier),
                        this.transformFunctionExpression(node),
                        node.identifier
                    ),
                    node
                );
            }
            default:
                throw new Error(`Unknown function declaration ${node.identifier!.type}`);
        }
    }

    private transformFunctionDeclarationAsMethod(node: lua.FunctionDeclaration): ts.MethodDeclaration {
        if (node.identifier.type === "Identifier") {
            throw new Error("Expected a member expression");
        }

        const comments = helper.getComments(this.chunk, node);
        const availableTags = helper.getTags(comments);
        const treturns = availableTags.filter(currentTag => currentTag.kind === "treturn") as tags.TReturnTag[];
        const treturnTypes = treturns.map(treturn => this.transformType(treturn.type));
        const type =
            treturnTypes.length > 0
                ? treturnTypes.length > 1
                    ? this.builder.createTupleTypeNode(treturnTypes)
                    : treturnTypes[0]
                : this.builder.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

        return this.builder.createMethod(
            undefined,
            undefined,
            undefined,
            this.builder.createIdentifier(node.identifier.identifier.name, node.identifier),
            undefined,
            undefined,
            node.parameters.map(identifier => this.transformParameterDeclaration(identifier, availableTags)),
            type,
            ts.createBlock(this.transformBlock(node.body)),
            node
        );
    }

    private transformFunctionDeclarationAsExportedFunction(node: lua.FunctionDeclaration): ts.FunctionDeclaration {
        const comments = helper.getComments(this.chunk, node);
        const availableTags = helper.getTags(comments);
        const treturns = availableTags.filter(currentTag => currentTag.kind === "treturn") as tags.TReturnTag[];
        const treturnTypes = treturns.map(treturn => this.transformType(treturn.type));
        const type =
            treturnTypes.length > 0
                ? treturnTypes.length > 1
                    ? this.builder.createTupleTypeNode(treturnTypes)
                    : treturnTypes[0]
                : this.builder.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

        const modifiers = [ts.createModifier(ts.SyntaxKind.ExportKeyword)];

        if (node.identifier.type === "Identifier") {
            throw new Error("Cannot export a non-MemberExpression function");
        }

        if (node.identifier.base.type === "MemberExpression") {
            throw new Error("Cannot export nested member expression functions");
        }

        const name = this.transformIdentifier(node.identifier.identifier);

        return this.builder.createFunctionDeclaration(
            undefined,
            modifiers,
            undefined,
            name,
            undefined,
            node.parameters.map(identifier => this.transformParameterDeclaration(identifier, availableTags)),
            type,
            this.builder.createBlock(this.transformBlock(node.body), true, node),
            node
        );
    }

    private transformFunctionExpression(
        node: lua.FunctionExpression | lua.FunctionDeclaration,
        modifiers?: ReadonlyArray<ts.Modifier>
    ): ts.FunctionExpression {
        return this.builder.createFunctionExpression(
            modifiers,
            undefined,
            undefined,
            undefined,
            node.parameters.map(parameter => this.transformParameterDeclaration(parameter, [])),
            undefined,
            this.builder.createBlock(this.transformBlock(node.body), true, node),
            node
        );
    }
}
