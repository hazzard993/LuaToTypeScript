export type Tag = ParamTag | TParamTag | ReturnTag | TReturnTag | TypeTag | ClassMod | ModuleTag;

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

export interface TypeTag {
    kind: "type";
    type: string;
    description: string;
}

export function createTypeTag(type: string, description: string): TypeTag {
    return {
        description,
        kind: "type",
        type,
    };
}

export interface ClassMod {
    kind: "classmod";
    name: string;
}

export function createClassMod(name: string): ClassMod {
    return {
        kind: "classmod",
        name,
    };
}

export interface ModuleTag {
    kind: "module";
    name: string;
}

export function createModuleTag(name: string): ModuleTag {
    return {
        kind: "module",
        name,
    };
}
