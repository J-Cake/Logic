import StateManager from "./sys/util/stateManager";
import {Preferences} from "./Enums";

export default class PreferenceManager extends StateManager<Preferences> {
    constructor(preferences?: Partial<Preferences>) {
        super(preferences);

        fetch('/user/preferences').then(i => i.json().then(i => this.setState(i)));

        this.onStateChange(function(preferences) {
            // write preferences to server
        });
    }
}