import * as luaparse from "luaparse";

export function assertNever(_: never, errorMessage: string): never {
  throw new Error(errorMessage);
}

export function nodeType(node: luaparse.Node) {
  if ("type" in node) {
    return (node as { type: string }).type;
  }

  return "unknown";
}
