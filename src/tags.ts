export type Tags = ParamTag | TParamTag | ReturnTag | TReturnTag;

export interface ParamTag {
    kind: "param";
    name: string;
    description: string;
}

export function createParamTag(name: string, description: string): ParamTag {
    return {
        description,
        kind: "param",
        name,
    };
}

export interface TParamTag {
    kind: "tparam";
    name: string;
    type: string;
    description: string;
}

export function createTParamTag(name: string, type: string, description: string): TParamTag {
    return {
        description,
        kind: "tparam",
        name,
        type,
    };
}

export interface ReturnTag {
    kind: "return";
    description: string;
}

export function createReturnTag(description: string): ReturnTag {
    return {
        description,
        kind: "return",
    };
}

export interface TReturnTag {
    kind: "treturn";
    type: string;
    description: string;
}

export function createTReturnTag(type: string, description: string): TReturnTag {
    return {
        description,
        kind: "treturn",
        type,
    };
}
