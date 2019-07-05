import * as ts from "typescript";
import * as lua from "./ast";

interface TsBuilderAssociations {
    [ts.SyntaxKind.NumericLiteral]: typeof ts.createNumericLiteral;
}

export class TsBuilder {

    private map: WeakMap<ts.Node, lua.Node | undefined>;

    constructor() {
        this.map = new WeakMap();
    }

    public createNumericLiteral(value: string, original?: lua.Node): ts.NumericLiteral {
        const tsNode = ts.createNumericLiteral(value);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createStringLiteral(text: string, original?: lua.Node): ts.StringLiteral {
        const tsNode = ts.createStringLiteral(text);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createIdentifier(text: string, original?: lua.Node): ts.Identifier {
        const tsNode = ts.createIdentifier(text);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createSuper(original?: lua.Node) {
        const tsNode = ts.createSuper();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createThis(original?: lua.Node): ts.ThisExpression {
        const tsNode = ts.createThis();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createNull(original?: lua.Node): ReturnType<typeof ts.createNull> {
        const tsNode = ts.createNull();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createTrue(original?: lua.Node): ReturnType<typeof ts.createTrue> {
        const tsNode = ts.createTrue();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFalse(original?: lua.Node): ReturnType<typeof ts.createFalse> {
        const tsNode = ts.createFalse();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createIf(
        expression: ts.Expression,
        thenStatement: ts.Statement,
        elseStatement?: ts.Statement,
        original?: lua.Node,
    ): ts.IfStatement {
        const tsNode = ts.createIf(expression, thenStatement, elseStatement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBlock(statements: readonly ts.Statement[], multiLine?: boolean, original?: lua.Node): ts.Block {
        const tsNode = ts.createBlock(statements, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createArrayLiteral(
        elements?: readonly ts.Expression[],
        multiLine?: boolean,
        original?: lua.Node,
    ): ts.ArrayLiteralExpression {
        const tsNode = ts.createArrayLiteral(elements, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createObjectLiteral(
        properties?: readonly ts.ObjectLiteralElementLike[],
        multiLine?: boolean,
        original?: lua.Node,
    ): ts.ObjectLiteralExpression {
        const tsNode = ts.createObjectLiteral(properties, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createParameter(
        decorators: readonly ts.Decorator[],
        modifiers: readonly ts.Modifier[],
        dotDotDotToken: ts.Token<ts.SyntaxKind.DotDotDotToken>,
        name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern,
        questionToken?: Parameters<typeof ts.createParameter>[4],
        type?: ts.TypeNode,
        initializer?: ts.Expression,
        original?: lua.Node,
    ): ts.ParameterDeclaration {
        const tsNode = ts.createParameter(
            decorators,
            modifiers,
            dotDotDotToken,
            name,
            questionToken,
            type,
            initializer,
        );
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createElementAccess(
        expression: ts.Expression,
        index: number | ts.Expression,
        original?: lua.Node,
    ): ts.ElementAccessExpression {
        const tsNode = ts.createElementAccess(expression, index);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createSpread(expression: ts.Expression, original?: lua.Node): ts.SpreadElement {
        const tsNode = ts.createSpread(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBinary(
        left: ts.Expression,
        operator: Parameters<typeof ts.createBinary>[1],
        right: ts.Expression,
        original?: lua.Node,
    ): ts.BinaryExpression {
        const tsNode = ts.createBinary(left, operator, right);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPropertyAccess(
        expression: ts.Expression,
        name: string | ts.Identifier,
        original?: lua.Node,
    ): ts.UnaryExpression {
        const tsNode = ts.createPropertyAccess(expression, name);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPrefix(
        operator: ts.PrefixUnaryOperator,
        operand: ts.Expression,
        original?: lua.Node,
    ): ts.PrefixUnaryExpression {
        const tsNode = ts.createPrefix(operator, operand);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createKeywordTypeNode(
        kind: Parameters<typeof ts.createKeywordTypeNode>[0],
        original?: lua.Node,
    ): ts.KeywordTypeNode {
        const tsNode = ts.createKeywordTypeNode(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createUnionTypeNode(types: readonly ts.TypeNode[], original?: lua.Node): ts.UnionTypeNode {
        const tsNode = ts.createUnionTypeNode(types);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPostfix(
        operand: ts.Expression,
        operator: ts.PostfixUnaryOperator,
        original?: lua.Node,
    ): ts.PostfixUnaryExpression {
        const tsNode = ts.createPostfix(operand, operator);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createToken<T extends ts.SyntaxKind>(token: T, original?: lua.Node): ts.Token<T> {
        const tsNode = ts.createToken(token);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFor(
        initializer: ts.Expression | ts.VariableDeclarationList,
        condition: ts.Expression,
        incrementor: ts.Expression,
        statement: ts.Statement,
        original?: lua.Node,
    ): ts.ForStatement {
        const tsNode = ts.createFor(initializer, condition, incrementor, statement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableDeclarationList(
        declarations: readonly ts.VariableDeclaration[],
        flags?: ts.NodeFlags,
        original?: lua.Node,
    ): ts.VariableDeclarationList {
        const tsNode = ts.createVariableDeclarationList(declarations, flags);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableDeclaration(
        name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern,
        type?: ts.TypeNode,
        initializer?: ts.Expression,
        original?: lua.Node,
    ): ts.VariableDeclaration {
        const tsNode = ts.createVariableDeclaration(name, type, initializer);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createForOf(
        awaitModifier: ts.Token<ts.SyntaxKind.AwaitKeyword> | undefined,
        initializer: ts.Expression | ts.VariableDeclarationList,
        expression: ts.Expression,
        statement: ts.Statement,
        original?: lua.Node,
    ): ts.ForOfStatement {
        const tsNode = ts.createForOf(awaitModifier, initializer, expression, statement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createArrayBindingPattern(
        elements: readonly ts.ArrayBindingElement[],
        original?: lua.Node,
    ): ts.ArrayBindingPattern {
        const tsNode = ts.createArrayBindingPattern(elements);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBindingElement(
        dotDotDotToken: ts.Token<ts.SyntaxKind.DotDotDotToken>,
        propertyName: Parameters<typeof ts.createBindingElement>[1],
        name: Parameters<typeof ts.createBindingElement>[2],
        initializer?: ts.Expression,
        original?: lua.Node,
    ): ts.BindingElement {
        const tsNode = ts.createBindingElement(dotDotDotToken, propertyName, name, initializer);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createComputedPropertyName(expression: ts.Expression, original?: lua.Node): ts.ComputedPropertyName {
        const tsNode = ts.createComputedPropertyName(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPropertyAssignment(name: any, arg1: ts.Expression): ts.ObjectLiteralElementLike {
        const tsNode = ts.createPropertyAssignment(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createExpressionStatement(arg0: any): ts.ExpressionStatement {
        const tsNode = ts.createExpressionStatement(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createCall(arg0: ts.Expression, undefined: undefined, arg2: ts.Expression[]): ts.CallExpression {
        const tsNode = ts.createCall(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableStatement(undefined: undefined, arg1: any): ts.VariableStatement {
        const tsNode = ts.createVariableStatement(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createReturn(returnNode: ts.Expression | undefined): ts.ReturnStatement {
        const tsNode = ts.createReturn(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createTupleTypeNode(treturnTypes: ts.TypeNode[]) {
        const tsNode = ts.createTupleTypeNode(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFunctionDeclaration(undefined: undefined, undefined: undefined, undefined: undefined, arg3: ts.Identifier, undefined: undefined, arg5: ts.ParameterDeclaration[], type: any, arg7: ts.Block): ts.FunctionDeclaration | ts.ExpressionStatement {
        const tsNode = ts.createFunctionDeclaration(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createAssignment(arg0: ts.Expression, arg1: ts.FunctionExpression): any {
        const tsNode = ts.createAssignment(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFunctionExpression(undefined: undefined, undefined: undefined, undefined: undefined, undefined: undefined, arg4: ts.ParameterDeclaration[], undefined: undefined, arg6: ts.Block): ts.FunctionExpression {
        const tsNode = ts.createFunctionExpression(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }
}
