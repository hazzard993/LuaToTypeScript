export type TextRange = [number, number];

export type NodeTypes = "Chunk"
    | "Comment"
    | "Identifier"
    | "AssignmentStatement"
    | "LocalStatement"
    | "NumericLiteral";

export interface Node {
    range: TextRange;
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

export type Statement = AssignmentStatement | LocalStatement;

export interface Identifier extends Node {
    type: "Identifier";
    name: string;
}

export interface AssignmentStatement extends Node {
    type: "AssignmentStatement";
    variables: Identifier[];
}

export interface LocalStatement extends Node {
    type: "LocalStatement";
    variables: Identifier[];
    init: Expression[];
}

export interface NumericLiteral extends Node {
    type: "NumericLiteral";
    value: number;
}

export type Expression = NumericLiteral;
