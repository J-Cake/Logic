let value = false;

component.onClick(function(renderObj) {
    value = !value
    component.update();
});

component.setComputeFn(function (inputs) {
    return [value];
});