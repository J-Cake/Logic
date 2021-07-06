import StateManager from './sys/util/stateManager';
import {Preferences} from './Enums';
import {getPreferences} from "./sys/API/user";

export default class PreferenceManager extends StateManager<Preferences> {
    constructor(preferences?: Partial<Preferences>) {
        super(preferences);

        getPreferences().then(pref => this.setState(pref.data as Partial<Preferences>)).catch(function(err) {
            if (confirm('A network error has occurred while loading preferences. Please ensure you have a stable network connection. View help page for more info?'))
                window.open('https://logicx.jschneiderprojects.com.au/wiki/logicx/help/general-issues.md#');

            console.error(err);
        });

        this.onStateChange(function(preferences) {
            // write preferences to server
        });
    }
}