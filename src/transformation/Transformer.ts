import * as luaparse from "luaparse";
import * as ts from "typescript";
import * as ldoc from "../ast/ldoc";
import { Options } from "../transpile";
import { assertNever, nodeType } from "../typeguards";
import * as classmod from "./classmod";
import * as helper from "./helper";
import * as moduleTag from "./module";

export class Transformer {
  private chunk!: luaparse.Chunk;
  private checker?: ts.TypeChecker;
  private diagnostics: string[];
  private blockScopeLevel = 0;

  constructor(
    program: ts.Program | undefined,
    private options: Options,
  ) {
    if (program) {
      this.checker = program.getTypeChecker();
    }
    this.diagnostics = [];
  }

  public getDiagnostics(): string[] {
    return this.diagnostics;
  }

  public transformChunk(ast: luaparse.Chunk): ts.Statement[] {
    this.chunk = ast;
    this.blockScopeLevel = 0;

    let statements = ast.body;
    const result: ts.Statement[] = [];

    if (
      this.options.module &&
      moduleTag.canBeTransformedToModule(statements, this.chunk)
    ) {
      const [exportedFunctions, remainingStatements] =
        this.transformExportedFunctionMembers(statements);
      statements = remainingStatements;
      result.push(...exportedFunctions);
    }

    result.push(...this.transformBlock(statements));

    return result;
  }

  private transformBlock(statements: luaparse.Block): ts.Statement[] {
    this.blockScopeLevel++;

    const result: ts.Statement[] = [];
    if (
      this.options.classmod &&
      classmod.canBeTransformedToClass(statements, this.chunk)
    ) {
      const [classDeclaration, ...remainingStatements] =
        this.transformStatementsAsClass(statements);
      statements = remainingStatements;
      result.push(classDeclaration);
    }

    const remainingStatements = statements.map((statement) =>
      this.transformStatement(statement),
    );
    result.push(...remainingStatements);

    this.blockScopeLevel--;

    return result;
  }

  private transformStatementsAsClass(
    statements: luaparse.Statement[],
  ): [ts.ClassDeclaration, ...luaparse.Statement[]] {
    const [localStatement, ...statementsToCheck] = statements;
    const memberExpressionFunctionDeclarations: luaparse.FunctionDeclaration[] =
      [];
    const remainingStatements = statementsToCheck.filter((statement) => {
      if (
        statement.type === "FunctionDeclaration" &&
        statement.identifier.type === "MemberExpression"
      ) {
        memberExpressionFunctionDeclarations.push(statement);
      } else {
        return true;
      }
    });

    const name =
      localStatement && localStatement.type === "LocalStatement"
        ? localStatement.variables[0].name
        : undefined;
    const methods = memberExpressionFunctionDeclarations.map((statement) =>
      this.transformFunctionDeclarationAsMethod(
        statement as luaparse.FunctionDeclaration,
      ),
    );

    const classDeclaration = ts.factory.createClassDeclaration(
      undefined,
      name ? ts.factory.createIdentifier(name) : undefined,
      undefined,
      undefined,
      methods,
    );

    return [classDeclaration, ...remainingStatements];
  }

  private transformExportedFunctionMembers(
    statements: luaparse.Statement[],
  ): [ts.FunctionDeclaration[], luaparse.Statement[]] {
    const exportedFunctions: ts.FunctionDeclaration[] = [];
    const remainingStatements = statements.slice(1).filter((statement) => {
      if (
        statement.type === "FunctionDeclaration" &&
        statement.identifier.type === "MemberExpression"
      ) {
        const functionDeclaration =
          this.transformFunctionDeclarationAsExportedFunction(
            statement as luaparse.FunctionDeclaration,
          );
        exportedFunctions.push(functionDeclaration);
        return false;
      } else {
        return true;
      }
    });

    return [exportedFunctions, remainingStatements];
  }

  private transformStatement(node: luaparse.Statement): ts.Statement {
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
        assertNever(node, `Unknown Statement Type: ${nodeType(node)}`);
    }
  }

  private transformExpression(node: luaparse.Expression): ts.Expression {
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
        assertNever(node, `Unknown Expression Type: ${nodeType(node)}`);
    }
  }

  private transformNilLiteral(node: luaparse.NilLiteral): ts.Identifier {
    return ts.factory.createIdentifier("undefined");
  }

  private transformIndexExpression(
    node: luaparse.IndexExpression,
  ): ts.ElementAccessExpression {
    return ts.factory.createElementAccessExpression(
      this.transformExpression(node.base),
      this.transformExpression(node.index),
    );
  }

  private transformVarargLiteral(node: luaparse.VarargLiteral): ts.Expression {
    return ts.factory.createSpreadElement(
      ts.factory.createIdentifier("vararg"),
    );
  }

  private transformBooleanLiteral(
    node: luaparse.BooleanLiteral,
  ): ts.Expression {
    if (node.value) {
      return ts.factory.createTrue();
    } else {
      return ts.factory.createFalse();
    }
  }

  private transformBinaryExpression(
    node: luaparse.BinaryExpression,
  ): ts.BinaryExpression {
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

    return ts.factory.createBinaryExpression(
      this.transformExpression(node.left),
      operator,
      this.transformExpression(node.right),
    );
  }

  private transformLogicalExpression(
    node: luaparse.LogicalExpression,
  ): ts.BinaryExpression {
    const operator =
      node.operator === "and"
        ? ts.SyntaxKind.AmpersandAmpersandToken
        : node.operator === "or"
          ? ts.SyntaxKind.BarBarToken
          : undefined;
    if (!operator) {
      throw new Error("Unknown operator");
    }

    return ts.factory.createBinaryExpression(
      this.transformExpression(node.left),
      operator,
      this.transformExpression(node.right),
    );
  }

  private transformUnaryExpression(
    node: luaparse.UnaryExpression,
  ): ts.UnaryExpression {
    let operator: ts.SyntaxKind;
    switch (node.operator) {
      case "#":
        return ts.factory.createPropertyAccessExpression(
          this.transformExpression(node.argument),
          ts.factory.createIdentifier("length"),
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

    return ts.factory.createPrefixUnaryExpression(
      operator,
      this.transformExpression(node.argument),
    );
  }

  private transformMemberExpression(
    node: luaparse.MemberExpression,
  ): ts.PropertyAccessExpression {
    return ts.factory.createPropertyAccessExpression(
      this.transformExpression(node.base),
      this.transformIdentifier(node.identifier),
    );
  }

  private transformIdentifier(node: luaparse.Identifier): ts.Identifier {
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
    return ts.factory.createIdentifier(chosenName);
  }

  private transformIfStatement(node: luaparse.IfStatement): ts.IfStatement {
    const ifClause: luaparse.IfClause = node.clauses[0];
    const rootIfStatement = ts.factory.createIfStatement(
      this.transformExpression(ifClause.condition),
      ts.factory.createBlock(
        ifClause.body.map((statement) => this.transformStatement(statement)),
        undefined,
      ),
      undefined,
    );
    let lastIfStatement = rootIfStatement;

    node.clauses.forEach((clause) => {
      switch (clause.type) {
        case "ElseifClause":
          // @ts-ignore: TODO: Use an alternate building method
          lastIfStatement.elseStatement = ts.factory.createIf(
            this.transformExpression(ifClause.condition),
            ts.factory.createBlock(
              ifClause.body.map((statement) =>
                this.transformStatement(statement),
              ),
              undefined,
            ),
          );
          lastIfStatement = lastIfStatement.elseStatement as ts.IfStatement;
          break;
        case "ElseClause":
          // @ts-ignore: TODO: Use an alternate building method
          lastIfStatement.elseStatement = ts.factory.createBlock(
            clause.body.map((statement) => this.transformStatement(statement)),
          );
          break;
      }
    });

    return rootIfStatement;
  }

  private transformType(type: string): ts.TypeNode {
    const types = type.split("|").map((typeString) => {
      switch (typeString) {
        case "number":
          return ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
        case "string":
          return ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
        default:
          throw new Error(`Unknown type ${typeString}`);
      }
    });
    if (types.length === 1) {
      return types[0];
    } else {
      return ts.factory.createUnionTypeNode(types);
    }
  }

  private transformForNumericStatement(
    node: luaparse.ForNumericStatement,
  ): ts.ForStatement {
    const identifier = this.transformIdentifier(node.variable);
    const incrementor =
      node.step === null
        ? ts.factory.createPostfixUnaryExpression(
            identifier,
            ts.SyntaxKind.PlusPlusToken,
          )
        : ts.factory.createBinaryExpression(
            identifier,
            ts.factory.createToken(ts.SyntaxKind.FirstCompoundAssignment),
            this.transformExpression(node.step),
          );

    return ts.factory.createForStatement(
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            identifier,
            undefined,
            undefined,
            this.transformExpression(node.start),
          ),
        ],
        ts.NodeFlags.Let,
      ),
      ts.factory.createBinaryExpression(
        identifier,
        ts.factory.createToken(ts.SyntaxKind.LessThanEqualsToken),
        this.transformExpression(node.end),
      ),
      incrementor,
      ts.factory.createBlock(
        node.body.map((statement) => this.transformStatement(statement)),
        true,
      ),
    );
  }

  private transformForGenericStatement(
    node: luaparse.ForGenericStatement,
  ): ts.ForOfStatement {
    return ts.factory.createForOfStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [
          ts.factory.createVariableDeclaration(
            ts.factory.createArrayBindingPattern(
              node.variables.map((identifier) =>
                ts.factory.createBindingElement(
                  undefined,
                  undefined,
                  this.transformIdentifier(identifier),
                  undefined,
                ),
              ),
            ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
      this.transformExpression(node.iterators[0]),
      ts.factory.createBlock(this.transformBlock(node.body), true),
    );
  }

  private transformWhileStatement(
    node: luaparse.WhileStatement,
  ): ts.WhileStatement {
    return ts.factory.createWhileStatement(
      this.transformExpression(node.condition),
      ts.factory.createBlock(this.transformBlock(node.body), true),
    );
  }

  private transformBreakStatement(
    node: luaparse.BreakStatement,
  ): ts.BreakStatement {
    return ts.factory.createBreakStatement();
  }

  private transformTableKey(
    node: luaparse.TableKey,
  ): ts.ObjectLiteralElementLike {
    const name = ts.factory.createComputedPropertyName(
      this.transformExpression(node.key),
    );
    return ts.factory.createPropertyAssignment(
      name,
      this.transformExpression(node.value),
    );
  }

  private transformTableKeyString(
    node: luaparse.TableKeyString,
  ): ts.ObjectLiteralElementLike {
    const name = this.transformIdentifier(node.key);
    return ts.factory.createPropertyAssignment(
      name,
      this.transformExpression(node.value),
    );
  }

  private transformTableValue(node: luaparse.TableValue): ts.Expression {
    return this.transformExpression(node.value);
  }

  private transformTableConstructorExpression(
    node: luaparse.TableConstructorExpression,
  ): ts.ObjectLiteralExpression | ts.ArrayLiteralExpression {
    const usingTableKeyStrings = node.fields.some(
      (field) => field.type === "TableKey" || field.type === "TableKeyString",
    );
    const usingTableValues = node.fields.some(
      (field) => field.type === "TableValue",
    );
    if (usingTableKeyStrings && usingTableValues) {
      throw new Error("Cannot use table keys and values together");
    }

    if (usingTableValues) {
      return ts.factory.createArrayLiteralExpression(
        node.fields.map((field) =>
          this.transformTableValue(field as luaparse.TableValue),
        ),
      );
    } else {
      return ts.factory.createObjectLiteralExpression(
        node.fields.map((field) =>
          field.type === "TableKey"
            ? this.transformTableKey(field)
            : this.transformTableKeyString(field as luaparse.TableKeyString),
        ),
      );
    }
  }

  private transformParameterDeclaration(
    node: luaparse.Identifier | luaparse.VarargLiteral,
    availableTags: ldoc.Tag[],
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
        this.diagnostics.push(
          `Many @tparams found for parameter ${name}. Using the first one.`,
        );
      }
    }
    const tparam: ldoc.TParamTag | undefined = Array.isArray(tparams)
      ? tparams[0]
      : tparams;
    const type = tparam ? this.transformType(tparam.type) : undefined;

    switch (node.type) {
      case "Identifier":
        return ts.factory.createParameterDeclaration(
          undefined,
          undefined,
          this.transformIdentifier(node),
          undefined,
          type,
          undefined,
        );
      case "VarargLiteral":
        return ts.factory.createParameterDeclaration(
          undefined,
          ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
          ts.factory.createIdentifier("vararg"),
          undefined,
          type,
          undefined,
        );
    }
  }

  private transformNumericLiteral(
    node: luaparse.NumericLiteral,
  ): ts.NumericLiteral {
    return ts.factory.createNumericLiteral(node.value.toString());
  }

  private transformStringLiteral(
    node: luaparse.StringLiteral,
  ): ts.StringLiteral {
    return ts.factory.createStringLiteral(node.raw.replace(/^.|.$/g, ""));
  }

  private transformAssignmentLeftHandSideExpression(
    node:
      | luaparse.Identifier
      | luaparse.MemberExpression
      | luaparse.IndexExpression,
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
    variables: Array<
      luaparse.Identifier | luaparse.MemberExpression | luaparse.IndexExpression
    >,
    expressions: luaparse.Expression[],
  ): {
    left:
      | ts.Identifier
      | ts.PropertyAccessExpression
      | ts.ElementAccessExpression
      | ts.ArrayLiteralExpression;
    right: ts.Expression;
  } {
    const transformedVariables = variables.map((variable) =>
      this.transformAssignmentLeftHandSideExpression(variable),
    );
    const transformedExpressions = expressions.map((expression) =>
      this.transformExpression(expression),
    );
    if (variables.length > 1) {
      if (expressions.length > 1) {
        return {
          left: ts.factory.createArrayLiteralExpression(
            transformedVariables,
            false,
          ),
          right: ts.factory.createArrayLiteralExpression(
            transformedExpressions,
            false,
          ),
        };
      } else {
        return {
          left: ts.factory.createArrayLiteralExpression(
            transformedVariables,
            false,
          ),
          right: transformedExpressions[0],
        };
      }
    } else {
      return {
        left: transformedVariables[0],
        right: transformedExpressions[0],
      };
    }
  }

  private transformAssignmentStatement(
    node: luaparse.AssignmentStatement,
  ): ts.ExpressionStatement {
    const { left, right } = this.transformAssignment(node.variables, node.init);
    return ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        left,
        ts.factory.createToken(ts.SyntaxKind.FirstAssignment),
        right,
      ),
    );
  }

  private transformCallStatement(
    node: luaparse.CallStatement,
  ): ts.ExpressionStatement {
    return ts.factory.createExpressionStatement(
      this.transformExpression(node.expression),
    );
  }

  private transformCallExpression(
    node: luaparse.CallExpression,
  ): ts.CallExpression {
    return ts.factory.createCallExpression(
      this.transformExpression(node.base),
      undefined,
      node.arguments.map((expression) => this.transformExpression(expression)),
    );
  }

  private transformStringCallExpression(
    node: luaparse.StringCallExpression,
  ): ts.CallExpression {
    return ts.factory.createCallExpression(
      this.transformExpression(node.base),
      undefined,
      [this.transformExpression(node.argument)],
    );
  }

  private transformTableCallExpression(
    node: luaparse.TableCallExpression,
  ): ts.CallExpression {
    return ts.factory.createCallExpression(
      this.transformExpression(node.base),
      undefined,
      [this.transformExpression(node.arguments)],
    );
  }

  private transformLocalBindingPattern(
    variables: luaparse.Identifier[],
    expressions: luaparse.Expression[],
  ): {
    left: ts.Identifier | ts.ArrayBindingPattern;
    right: ts.Expression;
  } {
    const transformedVariables = variables.map((variable) =>
      this.transformIdentifier(variable),
    );
    const transformedExpressions = expressions.map((expression) =>
      this.transformExpression(expression),
    );
    if (variables.length > 1) {
      if (expressions.length > 1) {
        return {
          left: ts.factory.createArrayBindingPattern(
            transformedVariables.map((variable) =>
              ts.factory.createBindingElement(
                undefined,
                undefined,
                variable,
                undefined,
              ),
            ),
          ),
          right: ts.factory.createArrayLiteralExpression(
            transformedExpressions,
            false,
          ),
        };
      } else {
        return {
          left: ts.factory.createArrayBindingPattern(
            transformedVariables.map((variable) =>
              ts.factory.createBindingElement(
                undefined,
                undefined,
                variable,
                undefined,
              ),
            ),
          ),
          right: transformedExpressions[0],
        };
      }
    } else {
      return {
        left: transformedVariables[0],
        right: transformedExpressions[0],
      };
    }
  }

  private transformLocalStatement(
    node: luaparse.LocalStatement,
  ): ts.VariableStatement {
    const { left, right } = this.transformLocalBindingPattern(
      node.variables,
      node.init,
    );
    const [tag] = helper.getTagsOfKind("type", node, this.chunk);
    const type = tag ? this.transformType(tag.type) : undefined;

    return ts.factory.createVariableStatement(
      undefined,
      ts.factory.createVariableDeclarationList(
        [ts.factory.createVariableDeclaration(left, undefined, type, right)],
        ts.NodeFlags.Let,
      ),
    );
  }

  private transformReturnStatement(
    node: luaparse.ReturnStatement,
  ): ts.ReturnStatement | ts.ExportAssignment {
    const returnArguments = node.arguments.map((argument) =>
      this.transformExpression(argument),
    );
    const returnExpression =
      returnArguments.length > 0
        ? returnArguments.length === 1
          ? returnArguments[0]
          : ts.factory.createArrayLiteralExpression(returnArguments, false)
        : undefined;

    if (this.blockScopeLevel === 1 && returnExpression) {
      return ts.factory.createExportAssignment(
        undefined,
        true,
        returnExpression,
      );
    }

    return ts.factory.createReturnStatement(returnExpression);
  }

  private transformFunctionDeclaration(
    node: luaparse.FunctionDeclaration,
  ): ts.FunctionDeclaration | ts.ExpressionStatement {
    const comments = helper.getComments(this.chunk, node);
    const availableTags = helper.getTags(comments);
    const treturns = availableTags.filter(
      (currentTag) => currentTag.kind === "treturn",
    ) as ldoc.TReturnTag[];
    const treturnTypes = treturns.map((treturn) =>
      this.transformType(treturn.type),
    );
    const type =
      treturnTypes.length > 0
        ? treturnTypes.length > 1
          ? ts.factory.createTupleTypeNode(treturnTypes)
          : treturnTypes[0]
        : ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

    switch (node.identifier.type) {
      case "Identifier":
        return ts.factory.createFunctionDeclaration(
          undefined,
          undefined,
          this.transformIdentifier(node.identifier),
          undefined,
          node.parameters.map((identifier) =>
            this.transformParameterDeclaration(identifier, availableTags),
          ),
          type,
          ts.factory.createBlock(this.transformBlock(node.body), true),
        );
      case "MemberExpression": {
        if (node.identifier.indexer === ":") {
          node.parameters.unshift({
            type: "Identifier",
            name: "self",
            range: node.range,
            loc: node.identifier.loc,
            raw: "self",
          });
        }

        return ts.factory.createExpressionStatement(
          ts.factory.createAssignment(
            this.transformExpression(node.identifier),
            this.transformFunctionExpression(node),
          ),
        );
      }
      default:
        assertNever(node.identifier, `Unknown function declaration ${node}`);
    }
  }

  private transformFunctionDeclarationAsMethod(
    node: luaparse.FunctionDeclaration,
  ): ts.MethodDeclaration {
    if (node.identifier.type === "Identifier") {
      throw new Error("Expected a member expression");
    }

    const comments = helper.getComments(this.chunk, node);
    const availableTags = helper.getTags(comments);
    const treturns = availableTags.filter(
      (currentTag) => currentTag.kind === "treturn",
    ) as ldoc.TReturnTag[];
    const treturnTypes = treturns.map((treturn) =>
      this.transformType(treturn.type),
    );
    const type =
      treturnTypes.length > 0
        ? treturnTypes.length > 1
          ? ts.factory.createTupleTypeNode(treturnTypes)
          : treturnTypes[0]
        : ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

    return ts.factory.createMethodDeclaration(
      undefined,
      undefined,
      ts.factory.createIdentifier(node.identifier.identifier.name),
      undefined,
      undefined,
      node.parameters.map((identifier) =>
        this.transformParameterDeclaration(identifier, availableTags),
      ),
      type,
      ts.factory.createBlock(this.transformBlock(node.body)),
    );
  }

  private transformFunctionDeclarationAsExportedFunction(
    node: luaparse.FunctionDeclaration,
  ): ts.FunctionDeclaration {
    const comments = helper.getComments(this.chunk, node);
    const availableTags = helper.getTags(comments);
    const treturns = availableTags.filter(
      (currentTag) => currentTag.kind === "treturn",
    ) as ldoc.TReturnTag[];
    const treturnTypes = treturns.map((treturn) =>
      this.transformType(treturn.type),
    );
    const type =
      treturnTypes.length > 0
        ? treturnTypes.length > 1
          ? ts.factory.createTupleTypeNode(treturnTypes)
          : treturnTypes[0]
        : ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword);

    const modifiers = [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)];

    if (node.identifier.type === "Identifier") {
      throw new Error("Cannot export a non-MemberExpression function");
    }

    if (node.identifier.base.type === "MemberExpression") {
      throw new Error("Cannot export nested member expression functions");
    }

    const name = this.transformIdentifier(node.identifier.identifier);

    return ts.factory.createFunctionDeclaration(
      modifiers,
      undefined,
      name,
      undefined,
      node.parameters.map((identifier) =>
        this.transformParameterDeclaration(identifier, availableTags),
      ),
      type,
      ts.factory.createBlock(this.transformBlock(node.body), true),
    );
  }

  private transformFunctionExpression(
    node: luaparse.FunctionExpression | luaparse.FunctionDeclaration,
    modifiers?: ReadonlyArray<ts.Modifier>,
  ): ts.FunctionExpression {
    return ts.factory.createFunctionExpression(
      modifiers,
      undefined,
      undefined,
      undefined,
      node.parameters.map((parameter) =>
        this.transformParameterDeclaration(parameter, []),
      ),
      undefined,
      ts.factory.createBlock(this.transformBlock(node.body), true),
    );
  }
}
