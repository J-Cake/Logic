import * as $ from 'jquery';

export default function touch() {
    const canvas = $("#canvas-container");
    canvas.on('wheel', function (_e) {
        // const e: WheelEvent = _e.originalEvent as WheelEvent;
        // if (e.ctrlKey)
        //     manager.setState(function (prev) {
        //         const newScale = Math.min(Math.max(prev.scale - ((e.deltaX + e.deltaY) / 2 * map(prev.scale, 0.05, 5, 0, 1) / 10), 0.05), 5);
        //         // gridScale: Math.min(Math.max(prev.gridScale - e.deltaY * map(prev.gridScale, 1.5, 150, 0, 1), 1.5), 150),
        //
        //         // const newScale = prev.scale * e.deltaY < 0 ? 1 / Math.abs(e.deltaY) : e.deltaY;
        //         const factor = newScale / prev.scale;
        //         return {
        //             scale: newScale,
        //             pan: [
        //                 prev.mouse.x * (1 - factor) + prev.pan[0] * factor,
        //                 prev.mouse.y * (1 - factor) + prev.pan[1] * factor
        //             ]
        //         };
        //     });
    });
}