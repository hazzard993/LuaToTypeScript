import * as luaparse from "luaparse";
import { CodeWithSourceMap, SourceNode } from "source-map";
import * as ts from "typescript";

type SourceChunk = SourceNode | string;

export class Printer {
  private map?: WeakMap<ts.Node, luaparse.Node | undefined>;
  private sourceFile!: ts.SourceFile;
  private currentIndent = "";

  constructor(private printer: ts.Printer) {}

  public printSourceFile(
    sourceFile: ts.SourceFile,
    map: WeakMap<ts.Node, luaparse.Node | undefined>,
  ): CodeWithSourceMap {
    this.map = map;
    this.sourceFile = sourceFile;
    const statements = sourceFile.statements.map((statement) =>
      this.printStatement(statement),
    );
    const rootNode = new SourceNode(
      null,
      null,
      sourceFile.fileName,
      statements,
    );
    return rootNode.toStringWithSourceMap();
  }

  protected pushIndent(): void {
    this.currentIndent = this.currentIndent + "    ";
  }

  protected popIndent(): void {
    this.currentIndent = this.currentIndent.slice(4);
  }

  protected indent(input: SourceChunk = ""): SourceChunk {
    return this.currentIndent;
  }

  private createSourceNode(node: ts.Node, chunks?: SourceChunk[]): SourceNode {
    const name = this.printer.printNode(
      ts.EmitHint.Unspecified,
      node,
      this.sourceFile,
    );
    const original = this.map && this.map.get(node);
    if (original) {
      return new SourceNode(
        original.loc.start.line,
        original.loc.start.column,
        this.sourceFile.fileName,
        `${this.currentIndent}${chunks ? chunks : name}`,
        name,
      );
    }
    return new SourceNode(
      null,
      null,
      this.sourceFile.fileName,
      chunks ? chunks : name,
      name,
    );
  }

  private printStatement(node: ts.Statement): SourceNode {
    if (ts.isVariableStatement(node)) {
      return this.printVariableStatement(node);
    }
    if (ts.isFunctionDeclaration(node)) {
      return this.printFunctionDeclaration(node);
    }
    return new SourceNode();
  }

  private printVariableStatement(node: ts.VariableStatement): SourceNode {
    return this.createSourceNode(node);
  }

  private printIdentifier(node: ts.Identifier): SourceNode {
    return this.createSourceNode(node);
  }

  private printParameterDeclaration(node: ts.ParameterDeclaration): SourceNode {
    return this.createSourceNode(node);
  }

  private printFunctionDeclaration(node: ts.FunctionDeclaration): SourceNode {
    if (!node.body || !node.name) {
      return this.createSourceNode(node);
    }

    const chunks: SourceChunk[] = [];
    chunks.push("function ");
    chunks.push(this.printIdentifier(node.name));
    chunks.push("(");
    chunks.push(
      ...node.parameters.map((parameter) =>
        this.printParameterDeclaration(parameter),
      ),
    );
    chunks.push(") {\n");
    this.pushIndent();
    chunks.push(
      ...node.body.statements.map((statement) =>
        this.printStatement(statement),
      ),
    );
    this.popIndent();
    chunks.push("}");
    return this.createSourceNode(node, chunks);
  }
}
