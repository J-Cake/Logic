export enum Interpolation {
    linear,
    reverseLinear,
    // sig,
    quadratic,
    exponential
}

export const map = (n: number, start1: number, stop1: number, start2: number, stop2: number) => (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;

export const interpolationFunctions: Record<Interpolation, (n: number) => number> = { // each function needs to return numbers in range 0-1
    [Interpolation.linear]: (n: number) => constrain(n, 0, 1),
    [Interpolation.reverseLinear]: (n: number) => constrain(1 - n, 0, 1),
    [Interpolation.quadratic]: (n: number) => constrain((Math.tanh(2 * n * Math.PI - Math.PI) + 1) / 2, 0, 1), // seemingly 'inverse' s-curve.
    [Interpolation.exponential]: (n: number) => constrain(Math.tanh(n * Math.PI - Math.PI) + 1, 0, 1)
};

export const constrain: (n: number, min: number, max: number) => number = (n: number, min: number, max: number) => min < max ? Math.min(Math.max(n, min), max) : Math.min(Math.max(n, max), min);

export default function interpolate(n: number, from: number, to: number, type: Interpolation): number {
    return map(interpolationFunctions[type](map(n, from, to, 0, 1)), 0, 1, from, to);
}