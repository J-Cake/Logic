import $ from 'jquery';
import {manager} from '../../../State';
import {WireEditMode} from '../../../Enums';

export default function bindWireMode() {
    $("#wire-mode-selector span.option").on("click", function (this: HTMLElement) {
        const enumIndex = Number($(this).data('enum'));

        if (enumIndex in WireEditMode)
            manager.setState({
                wireEditMode: enumIndex as WireEditMode
            });

        $(`#wire-mode-selector span.option.selected`).removeClass('selected');
        $(`#wire-mode-selector span.option[data-enum=${enumIndex}]`).addClass('selected');
    });
}

export function setWireMode(mode: WireEditMode) {
    console.log('setting wire mode', WireEditMode[mode]);

    manager.setState({
        wireEditMode: mode
    });

    $(`#wire-mode-selector span.option.selected`).removeClass('selected');
    $(`#wire-mode-selector span.option[data-enum=${mode}]`).addClass('selected');
}