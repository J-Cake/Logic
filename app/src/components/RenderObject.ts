import * as p5 from 'p5';

export default abstract class RenderObject {
    private static objs: RenderObject[] = [];

    protected constructor(skipRender: boolean = false) {
        if (!skipRender)
            RenderObject.objs.push(this);
    }

    static purge<T extends RenderObject>(...objs: { new(...args: any[]): T }[]) {
        for (const obj of objs)
            for (let a = 0; a < this.objs.length; a++){
                let i = this.objs[a];
                if (i instanceof obj) {
                    i.clean();
                    this.objs.splice(a, 1);
                    a--;
                }
            }
    }

    static print() {
        console.log(this.objs);
    }

    public static draw(sketch: p5): void {
        for (const obj of RenderObject.objs)
            if (obj)
                obj.render(sketch);
    }

    public static tick(sketch: p5): void {
        for (const obj of RenderObject.objs)
            if (obj)
                obj.update(sketch);
    }

    abstract clean(): void;

    abstract render(sketch: p5): void;

    protected abstract update(sketch: p5): void;
}
