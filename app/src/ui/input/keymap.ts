import * as mousetrap from "mousetrap";

import {Action, triggerAction} from "./Action";

export const keyMap: Record<Action, string[]> = {
    [Action.Enter]: ['enter'],
    [Action.Delete]: ['del', 'backspace', '8'],
    [Action.UpdateComponent]: ['space'],
    [Action.Close]: ['esc'],

    [Action.PointerTool]: ['1', 'p'],
    [Action.SelectTool]: ['2', 'b'],
    [Action.MoveTool]: ['3', 'g'],
    [Action.WireTool]: ['4', 'w'],
    [Action.DebugTool]: ['5', 'd'],
    [Action.LabelTool]: ['6', 'l'],

    [Action.WireTool_WireMode_Move]: ['w 1', '4 1'],
    [Action.WireTool_WireMode_Place]: ['w 2', '4 2'],
    [Action.WireTool_WireMode_Remove]: ['w 3', '4 3'],
    [Action.WireTool_WireMode_Select]: ['w 4', '4 4'],

    [Action.DebugTool_DebugMode_Change]: ['d 1', '5 1'],
    [Action.DebugTool_DebugMode_Input]: ['d 2', '5 2'],
    [Action.DebugTool_DebugMode_Output]: ['d 3', '5 3'],
    [Action.DebugTool_DebugMode_Update]: ['d 4', '5 4'],

    [Action.SelectAll]: ['ctrl+a'],
    [Action.SelectNone]: ['ctrl+alt+a'],

    [Action.Save]: ['ctrl+s'],
    [Action.Cut]: ['ctrl+x'],
    [Action.Copy]: ['ctrl+c'],
    [Action.Paste]: ['ctrl+v'],
    [Action.Undo]: ['ctrl+z'],
    [Action.Redo]: ['ctrl+y', 'ctrl+shift+z'],

    [Action.Debugger_Step]: ['tab', 'f2'],
    [Action.Debugger_Resume]: ['enter', 'f3'],

    [Action.OpenComponentMenu]: ['f9', '7'],
    [Action.OpenImportMenu]: ['f10', '9'],

    [Action.Flip]: ['up', 'down'],
    [Action.Rotate_Clockwise]: ['right'],
    [Action.Rotate_Counterclockwise]: ['left'],

    [Action.ViewDocument]: ['f12'],
    [Action.Help]: ['f1'],

    [Action.Pan_Up]: ['up'],
    [Action.Pan_Down]: ['down'],
    [Action.Pan_Left]: ['left'],
    [Action.Pan_Right]: ['right'],
}

export default function bind() {
    for (const [a, i] of Object.entries(keyMap))
        mousetrap.bind(i, function (e: mousetrap.ExtendedKeyboardEvent) {
            e.preventDefault();
            return triggerAction(Number(a) as Action);
        });
}

/**
 * Records a key combination, such that it can be applied to the action map
 * @returns {string} The recorded key combination
 */
export function recordKeys(): string {
    return '';
}