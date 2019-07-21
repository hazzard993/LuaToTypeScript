import * as lua from "./ast";
import * as tags from "./tags";

export function getPreviousNode(chunk: lua.Chunk, node: lua.Node): lua.Node | undefined {
    let previousNode: lua.Node | undefined;
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
    parameter: lua.Identifier | lua.VarargLiteral,
    availableTags: tags.Tag[]
): tags.TParamTag | tags.TParamTag[] {
    const name = parameter.type === "Identifier" ? parameter.name : parameter.value;
    const tparams = availableTags.filter(
        currentTag => currentTag.kind === "tparam" && currentTag.name === name
    ) as tags.TParamTag[];
    if (tparams.length === 1) {
        return tparams[0];
    } else {
        return tparams;
    }
}

export function getTagsOfKind(kind: "param", node: lua.Node, chunk: lua.Chunk): tags.ParamTag[];
export function getTagsOfKind(kind: "tparam", node: lua.Node, chunk: lua.Chunk): tags.TParamTag[];
export function getTagsOfKind(kind: "return", node: lua.Node, chunk: lua.Chunk): tags.ReturnTag[];
export function getTagsOfKind(kind: "treturn", node: lua.Node, chunk: lua.Chunk): tags.TReturnTag[];
export function getTagsOfKind(kind: "type", node: lua.Node, chunk: lua.Chunk): tags.TypeTag[];
export function getTagsOfKind(kind: "classmod", node: lua.Node, chunk: lua.Chunk): tags.ClassMod[];
export function getTagsOfKind(kind: "module", node: lua.Node, chunk: lua.Chunk): tags.ModuleTag[];
export function getTagsOfKind(kind: tags.Tag["kind"], node: lua.Node, chunk: lua.Chunk): tags.Tag[] {
    return getTags(getComments(chunk, node)).filter(tag => tag.kind === kind);
}

export function getCommentsAsString(chunk: lua.Chunk, node: lua.Node): string {
    return getComments(chunk, node)
        .map(comment => comment.value)
        .join(" ");
}

export function getComments(chunk: lua.Chunk, node: lua.Node): lua.Comment[] {
    const previousNode = getPreviousNode(chunk, node);
    const comments: lua.Comment[] = [];
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

export function getTags(comments: lua.Comment[]): tags.Tag[] {
    const availableTags: tags.Tag[] = [];
    comments.forEach(comment => {
        const [, tagName, ...text] = comment.raw.split(" ");
        switch (tagName) {
            case "@param": {
                const [name, ...description] = text;
                availableTags.push(tags.createParamTag(name, description.join(" ")));
                break;
            }
            case "@tparam": {
                const [type, name, ...description] = text;
                availableTags.push(tags.createTParamTag(name, type, description.join(" ")));
                break;
            }
            case "@return": {
                const [...description] = text;
                availableTags.push(tags.createReturnTag(description.join(" ")));
                break;
            }
            case "@treturn": {
                const [type, ...description] = text;
                availableTags.push(tags.createTReturnTag(type, description.join(" ")));
                break;
            }
            case "@type": {
                const [type, ...description] = text;
                availableTags.push(tags.createTypeTag(type, description.join(" ")));
                break;
            }
            case "@classmod": {
                const [name] = text;
                availableTags.push(tags.createClassMod(name));
                break;
            }
            case "@module": {
                const [name] = text;
                availableTags.push(tags.createModuleTag(name));
                break;
            }
        }
    });
    return availableTags;
}

export function getMemberExpressionBaseIdentifier(node: lua.MemberExpression): lua.Identifier {
    let base = node.base;
    while (base.type === "MemberExpression") {
        base = base.base;
    }
    return base;
}
