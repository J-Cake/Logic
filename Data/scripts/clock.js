let speed = 0;

let state = false;

const clock = () => setInterval(function () {
    state = !state;
    return component.update();
}, 1000 / (2 * speed));

let interval = clock();

component.onClick(function(renderObj) {
    speed++;
    if (speed > 5)
        speed = 0;

    clearInterval(interval);
    if (speed > 0)
        interval = clock();
});

component.setComputeFn(function (inputs) {
    return [state];
});