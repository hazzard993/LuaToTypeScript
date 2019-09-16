declare module "luaparse" {
    export function parse(luaCode: string, options: { ranges: boolean, locations: boolean }): Chunk;

    export type TextRange = [number, number];

    export type Block = Statement[];

    export interface Node {
        range: TextRange;
        loc: {
            start: {
                line: number;
                column: number;
            };
            end: {
                line: number;
                column: number;
            };
        };
        raw: string;
    }

    export interface Chunk extends Node {
        type: "Chunk";
        body: Statement[];
        comments: Comment[];
    }

    export interface Comment extends Node {
        type: "Comment";
        value: string;
    }

    export type Statement =
        | AssignmentStatement
        | LocalStatement
        | ReturnStatement
        | FunctionDeclaration
        | CallStatement
        | IfStatement
        | ForGenericStatement
        | ForNumericStatement
        | WhileStatement
        | BreakStatement;

    export interface Identifier extends Node {
        type: "Identifier";
        name: string;
    }

    export interface MemberExpression extends Node {
        type: "MemberExpression";
        indexer: "." | ":";
        identifier: Identifier;
        base: Identifier | MemberExpression;
    }

    export interface AssignmentStatement extends Node {
        type: "AssignmentStatement";
        variables: Array<Identifier | MemberExpression | IndexExpression>;
        init: Expression[];
    }

    export interface IfStatement extends Node {
        type: "IfStatement";
        clauses: [IfClause, ...Array<ElseifClause | ElseClause>];
    }

    export interface ForGenericStatement extends Node {
        type: "ForGenericStatement";
        variables: Identifier[];
        iterators: Expression[];
        body: Statement[];
    }

    export interface ForNumericStatement extends Node {
        type: "ForNumericStatement";
        variable: Identifier;
        start: Expression;
        end: Expression;
        step: Expression | null;
        body: Statement[];
    }

    export interface WhileStatement extends Node {
        type: "WhileStatement";
        condition: Expression;
        body: Statement[];
    }

    export interface BreakStatement extends Node {
        type: "BreakStatement";
    }

    export interface IfClause extends Node {
        type: "IfClause";
        condition: Expression;
        body: Statement[];
    }

    export interface ElseifClause extends Node {
        type: "ElseifClause";
        condition: Expression;
        body: Statement[];
    }

    export interface ElseClause extends Node {
        type: "ElseClause";
        condition: Expression;
        body: Statement[];
    }

    export interface LocalStatement extends Node {
        type: "LocalStatement";
        variables: Identifier[];
        init: Expression[];
    }

    export interface ReturnStatement extends Node {
        type: "ReturnStatement";
        arguments: Expression[];
    }

    export interface FunctionDeclaration extends Node {
        type: "FunctionDeclaration";
        identifier: Identifier | MemberExpression;
        isLocal: boolean;
        parameters: Array<Identifier | VarargLiteral>;
        body: Statement[];
    }

    export interface FunctionExpression extends Node {
        type: "FunctionDeclaration";
        identifier: null;
        isLocal: false;
        parameters: FunctionDeclaration["parameters"];
        body: Statement[];
    }

    export interface CallStatement extends Node {
        type: "CallStatement";
        expression: CallExpression;
    }

    export interface CallExpression extends Node {
        type: "CallExpression";
        base: Identifier | MemberExpression;
        arguments: Expression[];
    }

    export interface StringCallExpression extends Node {
        type: "StringCallExpression";
        base: Identifier | MemberExpression;
        argument: StringLiteral;
    }

    export interface TableCallExpression extends Node {
        type: "TableCallExpression";
        base: Identifier | MemberExpression;
        argument: TableConstructorExpression;
    }

    export interface TableConstructorExpression extends Node {
        type: "TableConstructorExpression";
        fields: Array<TableValue | TableKeyString>;
    }

    export interface UnaryExpression extends Node {
        type: "UnaryExpression";
        operator: "not" | "-" | "~" | "#";
        argument: Expression;
    }

    export interface LogicalExpression extends Node {
        type: "LogicalExpression";
        operator: "and" | "or";
        left: Expression;
        right: Expression;
    }

    export interface BinaryExpression extends Node {
        type: "BinaryExpression";
        operator: "+" | "-" | "*" | "/" | "%" | "^" | "-" | "==" | "~=" | ">" | "<" | ">=" | "<=" | "..";
        left: Expression;
        right: Expression;
    }

    export interface TableValue extends Node {
        type: "TableValue";
        value: Expression;
    }

    export interface TableKeyString extends Node {
        type: "TableKeyString";
        key: Expression;
        value: Expression;
    }

    export interface NumericLiteral extends Node {
        type: "NumericLiteral";
        value: number;
    }

    export interface StringLiteral extends Node {
        type: "StringLiteral";
        value: string;
    }

    export interface BooleanLiteral extends Node {
        type: "BooleanLiteral";
        value: boolean;
    }

    export interface VarargLiteral extends Node {
        type: "VarargLiteral";
        value: "...";
    }

    export interface NilLiteral extends Node {
        type: "NilLiteral";
        value: null;
        raw: "nil";
    }

    export interface IndexExpression extends Node {
        type: "IndexExpression";
        base: Identifier | MemberExpression;
        index: Expression;
    }

    export type Expression =
        | NumericLiteral
        | StringLiteral
        | Identifier
        | TableConstructorExpression
        | FunctionExpression
        | UnaryExpression
        | LogicalExpression
        | BinaryExpression
        | MemberExpression
        | CallExpression
        | StringCallExpression
        | TableCallExpression
        | BooleanLiteral
        | VarargLiteral
        | NilLiteral
        | IndexExpression;
}
