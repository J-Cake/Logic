declare module 'parse-css-color' {
    enum Type {
        hsl,
        rgb,
    }

    type ret = {
        type: keyof Type,
        values: import('./document-editor/sys/util/Colour').rgb,
        alpha: number
    }
    function p(colour: string): ret;
    module p {}
    export = p;
}