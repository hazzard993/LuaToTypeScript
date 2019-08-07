import * as ts from "typescript";
import * as luaparse from "luaparse";

interface TsBuilderAssociations {
    [ts.SyntaxKind.NumericLiteral]: typeof ts.createNumericLiteral;
}

export class TsBuilder {
    private map: WeakMap<ts.Node, luaparse.Node | undefined>;

    constructor() {
        this.map = new WeakMap();
    }

    public getMap(): WeakMap<ts.Node, luaparse.Node | undefined> {
        return this.map;
    }

    public createNumericLiteral(value: string, original?: luaparse.Node): ts.NumericLiteral {
        const tsNode = ts.createNumericLiteral(value);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createStringLiteral(text: string, original?: luaparse.Node): ts.StringLiteral {
        const tsNode = ts.createStringLiteral(text);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createIdentifier(text: string, original?: luaparse.Node): ts.Identifier {
        const tsNode = ts.createIdentifier(text);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createSuper(original?: luaparse.Node) {
        const tsNode = ts.createSuper();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createThis(original?: luaparse.Node): ts.ThisExpression {
        const tsNode = ts.createThis();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createNull(original?: luaparse.Node): ReturnType<typeof ts.createNull> {
        const tsNode = ts.createNull();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createTrue(original?: luaparse.Node): ReturnType<typeof ts.createTrue> {
        const tsNode = ts.createTrue();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFalse(original?: luaparse.Node): ReturnType<typeof ts.createFalse> {
        const tsNode = ts.createFalse();
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createIf(
        expression: ts.Expression,
        thenStatement: ts.Statement,
        elseStatement?: ts.Statement,
        original?: luaparse.Node
    ): ts.IfStatement {
        const tsNode = ts.createIf(expression, thenStatement, elseStatement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBlock(statements: readonly ts.Statement[], multiLine?: boolean, original?: luaparse.Node): ts.Block {
        const tsNode = ts.createBlock(statements, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createArrayLiteral(
        elements?: readonly ts.Expression[],
        multiLine?: boolean,
        original?: luaparse.Node
    ): ts.ArrayLiteralExpression {
        const tsNode = ts.createArrayLiteral(elements, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createObjectLiteral(
        properties?: readonly ts.ObjectLiteralElementLike[],
        multiLine?: boolean,
        original?: luaparse.Node
    ): ts.ObjectLiteralExpression {
        const tsNode = ts.createObjectLiteral(properties, multiLine);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createParameter(
        decorators: readonly ts.Decorator[] | undefined,
        modifiers: readonly ts.Modifier[] | undefined,
        dotDotDotToken: ts.Token<ts.SyntaxKind.DotDotDotToken> | undefined,
        name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern,
        questionToken?: Parameters<typeof ts.createParameter>[4],
        type?: ts.TypeNode,
        initializer?: ts.Expression,
        original?: luaparse.Node
    ): ts.ParameterDeclaration {
        const tsNode = ts.createParameter(
            decorators,
            modifiers,
            dotDotDotToken,
            name,
            questionToken,
            type,
            initializer
        );
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createElementAccess(
        expression: ts.Expression,
        index: number | ts.Expression,
        original?: luaparse.Node
    ): ts.ElementAccessExpression {
        const tsNode = ts.createElementAccess(expression, index);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createSpread(expression: ts.Expression, original?: luaparse.Node): ts.SpreadElement {
        const tsNode = ts.createSpread(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBinary(
        left: ts.Expression,
        operator: Parameters<typeof ts.createBinary>[1],
        right: ts.Expression,
        original?: luaparse.Node
    ): ts.BinaryExpression {
        const tsNode = ts.createBinary(left, operator, right);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPropertyAccess(
        expression: ts.Expression,
        name: string | ts.Identifier,
        original?: luaparse.Node
    ): ts.PropertyAccessExpression {
        const tsNode = ts.createPropertyAccess(expression, name);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPrefix(
        operator: ts.PrefixUnaryOperator,
        operand: ts.Expression,
        original?: luaparse.Node
    ): ts.PrefixUnaryExpression {
        const tsNode = ts.createPrefix(operator, operand);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createKeywordTypeNode(
        kind: Parameters<typeof ts.createKeywordTypeNode>[0],
        original?: luaparse.Node
    ): ts.KeywordTypeNode {
        const tsNode = ts.createKeywordTypeNode(kind);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createUnionTypeNode(types: readonly ts.TypeNode[], original?: luaparse.Node): ts.UnionTypeNode {
        const tsNode = ts.createUnionTypeNode(types);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPostfix(
        operand: ts.Expression,
        operator: ts.PostfixUnaryOperator,
        original?: luaparse.Node
    ): ts.PostfixUnaryExpression {
        const tsNode = ts.createPostfix(operand, operator);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createToken<T extends ts.SyntaxKind>(token: T, original?: luaparse.Node): ts.Token<T> {
        const tsNode = ts.createToken(token);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFor(
        initializer: ts.Expression | ts.VariableDeclarationList,
        condition: ts.Expression,
        incrementor: ts.Expression,
        statement: ts.Statement,
        original?: luaparse.Node
    ): ts.ForStatement {
        const tsNode = ts.createFor(initializer, condition, incrementor, statement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableDeclarationList(
        declarations: readonly ts.VariableDeclaration[],
        flags?: ts.NodeFlags,
        original?: luaparse.Node
    ): ts.VariableDeclarationList {
        const tsNode = ts.createVariableDeclarationList(declarations, flags);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableDeclaration(
        name: string | ts.Identifier | ts.ObjectBindingPattern | ts.ArrayBindingPattern,
        type?: ts.TypeNode,
        initializer?: ts.Expression,
        original?: luaparse.Node
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
        original?: luaparse.Node
    ): ts.ForOfStatement {
        const tsNode = ts.createForOf(awaitModifier, initializer, expression, statement);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createArrayBindingPattern(
        elements: readonly ts.ArrayBindingElement[],
        original?: luaparse.Node
    ): ts.ArrayBindingPattern {
        const tsNode = ts.createArrayBindingPattern(elements);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBindingElement(
        dotDotDotToken: ts.Token<ts.SyntaxKind.DotDotDotToken> | undefined,
        propertyName: Parameters<typeof ts.createBindingElement>[1],
        name: Parameters<typeof ts.createBindingElement>[2],
        initializer?: ts.Expression,
        original?: luaparse.Node
    ): ts.BindingElement {
        const tsNode = ts.createBindingElement(dotDotDotToken, propertyName, name, initializer);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createComputedPropertyName(expression: ts.Expression, original?: luaparse.Node): ts.ComputedPropertyName {
        const tsNode = ts.createComputedPropertyName(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createPropertyAssignment(
        name: string | ts.ComputedPropertyName | ts.Identifier | ts.StringLiteral | ts.NumericLiteral,
        initializer: ts.Expression,
        original?: luaparse.Node
    ): ts.PropertyAssignment {
        const tsNode = ts.createPropertyAssignment(name, initializer);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createExpressionStatement(expression: ts.Expression, original?: luaparse.Node): ts.ExpressionStatement {
        const tsNode = ts.createExpressionStatement(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createCall(
        expression: ts.Expression,
        typeArguments: readonly ts.TypeNode[] | undefined,
        argumentsArray: readonly ts.Expression[] | undefined,
        original?: luaparse.Node
    ): ts.CallExpression {
        const tsNode = ts.createCall(expression, typeArguments, argumentsArray);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createVariableStatement(
        modifiers: readonly ts.Modifier[] | undefined,
        declarationList: ts.VariableDeclarationList | readonly ts.VariableDeclaration[],
        original?: luaparse.Node
    ): ts.VariableStatement {
        const tsNode = ts.createVariableStatement(modifiers, declarationList);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createReturn(expression?: ts.Expression, original?: luaparse.Node): ts.ReturnStatement {
        const tsNode = ts.createReturn(expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createTupleTypeNode(elementTypes: readonly ts.TypeNode[], original?: luaparse.Node): ts.TupleTypeNode {
        const tsNode = ts.createTupleTypeNode(elementTypes);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFunctionDeclaration(
        decorators: readonly ts.Decorator[] | undefined,
        modifiers: readonly ts.Modifier[] | undefined,
        asteriskToken: ts.Token<ts.SyntaxKind.AsteriskToken> | undefined,
        name: string | ts.Identifier | undefined,
        typeParameters: readonly ts.TypeParameterDeclaration[] | undefined,
        parameters: readonly ts.ParameterDeclaration[],
        type: ts.TypeNode | undefined,
        body: ts.Block | undefined,
        original?: luaparse.Node
    ): ts.FunctionDeclaration {
        const tsNode = ts.createFunctionDeclaration(
            decorators,
            modifiers,
            asteriskToken,
            name,
            typeParameters,
            parameters,
            type,
            body
        );
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createAssignment(
        left: ts.Expression,
        right: ts.Expression,
        original?: luaparse.Node
    ): ts.BinaryExpression | ts.DestructuringAssignment {
        const tsNode = ts.createAssignment(left, right);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createFunctionExpression(
        modifiers: readonly ts.Modifier[] | undefined,
        asteriskToken: ts.Token<ts.SyntaxKind.AsteriskToken> | undefined,
        name: string | ts.Identifier | undefined,
        typeParameters: readonly ts.TypeParameterDeclaration[] | undefined,
        parameters: readonly ts.ParameterDeclaration[] | undefined,
        type: ts.TypeNode | undefined,
        body: ts.Block,
        original?: luaparse.Node
    ): ts.FunctionExpression {
        const tsNode = ts.createFunctionExpression(
            modifiers,
            asteriskToken,
            name,
            typeParameters,
            parameters,
            type,
            body
        );
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createClassDeclaration(
        decorators: readonly ts.Decorator[] | undefined,
        modifiers: readonly ts.Modifier[] | undefined,
        name: string | ts.Identifier | undefined,
        typeParameters: readonly ts.TypeParameterDeclaration[] | undefined,
        heritageClauses: readonly ts.HeritageClause[] | undefined,
        members: readonly ts.ClassElement[],
        original: luaparse.Node
    ): ts.ClassDeclaration {
        const tsNode = ts.createClassDeclaration(decorators, modifiers, name, typeParameters, heritageClauses, members);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createExportAssignment(
        decorators: readonly ts.Decorator[] | undefined,
        modifiers: readonly ts.Modifier[] | undefined,
        isExportEquals: boolean | undefined,
        expression: ts.Expression,
        original: luaparse.Node
    ): ts.ExportAssignment {
        const tsNode = ts.createExportAssignment(decorators, modifiers, isExportEquals, expression);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createMethod(
        decorators: readonly ts.Decorator[] | undefined,
        modifiers: readonly ts.Modifier[] | undefined,
        asteriskToken: ts.Token<ts.SyntaxKind.AsteriskToken> | undefined,
        name: string | ts.Identifier | ts.StringLiteral | ts.NumericLiteral | ts.ComputedPropertyName,
        questionToken: ts.QuestionToken | undefined,
        typeParameters: readonly ts.TypeParameterDeclaration[] | undefined,
        parameters: readonly ts.ParameterDeclaration[],
        type: ts.TypeNode | undefined,
        body: ts.Block | undefined,
        original: luaparse.Node
    ): ts.MethodDeclaration {
        const tsNode = ts.createMethod(
            decorators,
            modifiers,
            asteriskToken,
            name,
            questionToken,
            typeParameters,
            parameters,
            type,
            body
        );
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createWhile(expression: ts.Expression, block: ts.Block, original: luaparse.Node): ts.WhileStatement {
        const tsNode = ts.createWhile(expression, block);
        this.map.set(tsNode, original);
        return tsNode;
    }

    public createBreak(original: luaparse.Node): ts.BreakStatement {
        const tsNode = ts.createBreak();
        this.map.set(tsNode, original);
        return tsNode;
    }
}
