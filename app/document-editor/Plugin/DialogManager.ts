export enum InputType {
    File,
    Directory,
    String,
    Int,
    Float,
    Boolean,
}

interface modalBody extends Record<InputType, any> {
    [InputType.File]: {
        filter?: string,
    },
    [InputType.Directory]: {},
    [InputType.String]: {},
    [InputType.Int]: {},
    [InputType.Float]: {},
    [InputType.Boolean]: {},
}

export function showModal<T, Input extends InputType>(options: {
    inputType?: Input,
    body: modalBody[Input],
    heading?: string,
    subHeading?: string,
}): Promise<T> {
    return new Promise(res => res('' as unknown as T));
}