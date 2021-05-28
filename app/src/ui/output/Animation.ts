import type p5 from 'p5';

export interface Animation {
    readonly duration: number,
    readonly repeat: 0 | 1 | 2, // 0 => no, 1 => repeat, 2 => indefinite
    frame: number,
    percent: number,

    render(sketch: p5, props: this): void;

    done?(): void;
}

export default function renderAnimation(animation: Animation, sketch: p5): void {
    animation.percent = animation.frame / animation.duration;
    animation.render(sketch, animation);
    animation.frame++;

    if (animation.frame >= animation.duration && animation.repeat === 1)
        animation.frame = 0;
    else if (animation.frame >= animation.duration && animation.repeat === 0)
        return animation.done?.();
}
