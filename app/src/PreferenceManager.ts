import StateManager from './sys/util/stateManager';
import {Preferences} from './Enums';
import {getPreferences} from "./sys/API/user";

export default class PreferenceManager extends StateManager<Preferences> {
    constructor(preferences?: Partial<Preferences>) {
        super(preferences);

        getPreferences().then(pref => this.setState(pref as Partial<Preferences>));
        // fetch('/user/preferences').then(i => i.json().then(i => this.setState(i)));

        this.onStateChange(function(preferences) {
            // write preferences to server
        });
    }
}