import type p5 from 'p5';

export default abstract class RenderObject {
    private static objs: RenderObject[] = [];

    deleted: boolean = false;

    protected constructor(skipRender: boolean = false) {
        if (!skipRender)
            RenderObject.objs.push(this);
    }

    static purge<T extends RenderObject>(...objs: { new(...args: any[]): T }[]) {
        for (const obj of objs)
            for (let a = 0; a < this.objs.length; a++) {
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
            if (obj && !obj.deleted)
                obj.render(sketch);
    }

    public static tick(sketch: p5): void {
        for (const obj of RenderObject.objs)
            if (obj && !obj.deleted)
                obj.update(sketch);
        RenderObject.objs = RenderObject.objs.filter(i => !i.deleted);
    }

    abstract clean(): void;

    abstract render(sketch: p5): void;

    protected abstract update(sketch: p5): void;
}
