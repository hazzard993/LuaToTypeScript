import * as lua from "./ast";

export function getPreviousNode(chunk: lua.Chunk, node: lua.Node): lua.Node {
    let previousNode: lua.Node;
    for (const statement of chunk.body) {
        if (statement !== node) {
            previousNode = statement;
        } else {
            return previousNode;
        }
    }
    return undefined;
}

export function getCommentsAsString(chunk: lua.Chunk, node: lua.Node): string {
    const previousNode = getPreviousNode(chunk, node);
    const comments: lua.Comment[] = [];
    for (const comment of chunk.comments) {
        const min = previousNode ? previousNode.range[1] : 0;
        if (comment.range[0] >= min && comment.range[1] <= node.range[0]) {
            comments.push(comment);
        }
    }
    return comments.map((comment) => comment.value).join(" ");
}

export function getTags(comments: lua.Comment[]) {
    const text = comments.map((comment) => comment.value).join(" ");
    console.log(text);
}
