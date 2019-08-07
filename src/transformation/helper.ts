import * as luaparse from "luaparse";
import * as ldoc from "../ast/ldoc";

export function getPreviousNode(chunk: luaparse.Chunk, node: luaparse.Node): luaparse.Node | undefined {
    let previousNode: luaparse.Node | undefined;
    for (const statement of chunk.body) {
        if (statement === node) {
            return previousNode;
        } else {
            previousNode = statement;
        }
    }
}

export function noLeadingWhitespace(strings: readonly string[], ...values: any[]) {
    const stringWithWhitespace = strings
        .map((formattedString, index) => {
            const value = values[index];
            return `${formattedString}${value || ""}`;
        })
        .join("");
    return stringWithWhitespace.replace(/^(\s*)/gm, "").replace(/\n$/g, "");
}

export function getParameterTParam(
    parameter: luaparse.Identifier | luaparse.VarargLiteral,
    availableTags: ldoc.Tag[]
): ldoc.TParamTag | ldoc.TParamTag[] {
    const name = parameter.type === "Identifier" ? parameter.name : parameter.value;
    const tparams = availableTags.filter(
        currentTag => currentTag.kind === "tparam" && currentTag.name === name
    ) as ldoc.TParamTag[];
    if (tparams.length === 1) {
        return tparams[0];
    } else {
        return tparams;
    }
}

export function getTagsOfKind(kind: "param", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.ParamTag[];
export function getTagsOfKind(kind: "tparam", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.TParamTag[];
export function getTagsOfKind(kind: "return", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.ReturnTag[];
export function getTagsOfKind(kind: "treturn", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.TReturnTag[];
export function getTagsOfKind(kind: "type", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.TypeTag[];
export function getTagsOfKind(kind: "classmod", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.ClassMod[];
export function getTagsOfKind(kind: "module", node: luaparse.Node, chunk: luaparse.Chunk): ldoc.ModuleTag[];
export function getTagsOfKind(kind: ldoc.Tag["kind"], node: luaparse.Node, chunk: luaparse.Chunk): ldoc.Tag[] {
    return getTags(getComments(chunk, node)).filter(tag => tag.kind === kind);
}

export function getCommentsAsString(chunk: luaparse.Chunk, node: luaparse.Node): string {
    return getComments(chunk, node)
        .map(comment => comment.value)
        .join(" ");
}

export function getComments(chunk: luaparse.Chunk, node: luaparse.Node): luaparse.Comment[] {
    const previousNode = getPreviousNode(chunk, node);
    const comments: luaparse.Comment[] = [];
    for (const comment of chunk.comments) {
        const [nodeBegin] = node.range;
        const [commentBegin, commendEnd] = comment.range;
        const min = previousNode ? previousNode.range[1] : 0;
        if (commentBegin >= min && commendEnd <= nodeBegin) {
            comments.push(comment);
        }
    }
    return comments;
}

export function getTags(comments: luaparse.Comment[]): ldoc.Tag[] {
    const availableTags: ldoc.Tag[] = [];
    comments.forEach(comment => {
        const [, tagName, ...text] = comment.raw.split(" ");
        switch (tagName) {
            case "@param": {
                const [name, ...description] = text;
                availableTags.push(ldoc.createParamTag(name, description.join(" ")));
                break;
            }
            case "@tparam": {
                const [type, name, ...description] = text;
                availableTags.push(ldoc.createTParamTag(name, type, description.join(" ")));
                break;
            }
            case "@return": {
                const [...description] = text;
                availableTags.push(ldoc.createReturnTag(description.join(" ")));
                break;
            }
            case "@treturn": {
                const [type, ...description] = text;
                availableTags.push(ldoc.createTReturnTag(type, description.join(" ")));
                break;
            }
            case "@type": {
                const [type, ...description] = text;
                availableTags.push(ldoc.createTypeTag(type, description.join(" ")));
                break;
            }
            case "@classmod": {
                const [name] = text;
                availableTags.push(ldoc.createClassMod(name));
                break;
            }
            case "@module": {
                const [name] = text;
                availableTags.push(ldoc.createModuleTag(name));
                break;
            }
        }
    });
    return availableTags;
}

export function getMemberExpressionBaseIdentifier(node: luaparse.MemberExpression): luaparse.Identifier {
    let base = node.base;
    while (base.type === "MemberExpression") {
        base = base.base;
    }
    return base;
}
