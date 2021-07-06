import _ from 'lodash';

export enum WireEditMode {
    Place = 0,
    Remove = 1
}

export enum DebugMode {
    Change = 0,
    Input = 1,
    Output = 2,
    Update = 3,
}

export enum Colour {
    Primary,
    Danger,
    Active,
    Label,
    Accent,
    Secondary,
    SecondaryAccent,
    Cursor,
    Panel,
    Background,
    Blank,
    Dark,
}

export enum Theme {
    System,
    Dark,
    Light,
    DarkBlue,
    DarkRed,
    DarkOrange,
}

export interface Preferences {
    showGrid: boolean,
    gridSize: number,

    colouriseComponents: boolean,
    enableTrackpadGestures: boolean,

    theme: Theme,

    enableTooltips: boolean,

    undoSize: number
}


export const defaultPreferences: Preferences = {
    enableTooltips: true,
    colouriseComponents: true,
    enableTrackpadGestures: true,
    gridSize: 35,
    showGrid: false,
    theme: 0 as Theme,
    undoSize: 20
};

export enum PreferenceType {
    Toggle,
    Checkbox,
    Slider,
    Int,
    Text,
    Dropdown,
}

export const PreferenceDescriptor: Record<keyof Preferences, {
    type: PreferenceType,
    details: any,
    description: string,
    helpUrl: string,
    label: string
}> = {
    colouriseComponents: {
        description: "Colour-coordinate components by type for easier identification",
        helpUrl: "/wiki/application/preferences.md#colourise-components",
        label: "Colourise Components",
        details: undefined,
        type: PreferenceType.Toggle
    },
    enableTooltips: {
        description: "Show useful information about components",
        details: undefined,
        helpUrl: "/wiki/application/preferences.md#tooltips",
        label: "Show Tooltips",
        type: PreferenceType.Toggle
    },
    enableTrackpadGestures: {
        description: "Allow easier navigation with gesture-based controls for Trackpad devices",
        details: undefined,
        helpUrl: "/wiki/application/preferences.md#trackpad-gestures",
        label: "Trackpad Gestures",
        type: PreferenceType.Checkbox
    },
    theme: {
        description: "Theme to use instead of system theme",
        details: _.mapValues(_.keyBy(Object.keys(Theme).filter(i => typeof Theme[i as keyof typeof Theme] !== 'number').map(i => [Number(i), Theme[i as keyof typeof Theme]]), '0'), i => i[1]),
        helpUrl: "/wiki/application/preferences.md#theme",
        label: "Theme",
        type: PreferenceType.Dropdown
    },
    gridSize: {
        description: "The size of the application grid",
        details: [5, 100],
        helpUrl: "/wiki/application/preferences.md#grid-size",
        label: "Grid Size",
        type: PreferenceType.Slider
    },
    showGrid: {
        description: "Indicates whether the grid should be visible",
        details: undefined,
        helpUrl: "/wiki/application/preferences.md#show-grid",
        label: "Grid",
        type: PreferenceType.Toggle
    },
    undoSize: {
        description: "The maximum undo history size",
        details: [5, 150],
        helpUrl: "/wiki/application/preferences.md#undoSize",
        label: "Undo Size",
        type: PreferenceType.Slider
    }
}