declare module 'parse-css-color' {

    enum Type {
        hsl,
        rgb,
    }

    type ret = {
        type: keyof Type,
        values: import('./src/sys/util/Colour').rgb,
        alpha: number
    }
    function p(colour: string): ret;
    module p {}
    export = p;
}

declare module "eva-icons" {
    interface Options {
        fill: string,
        class: string
    }
    function replace(options?: Partial<Options>): void;
}