# State Management

The State Manager class allows variables to be accessible globally.

### details
| **File**                   | **Export**         | **Definition**                   | **Description**         |
|----------------------------|--------------------|----------------------------------|-------------------------|
| ./src/util/stateManager.ts |`default`           | `StateManager<State extends {}>` | A class to manage state |

## `StateManager<State extends {}>`

* *`constructor(defaults: Partial<State>)`*
    * `defaults`: A list of initialisation values
    * **returns**: `StateManager` An instance of the State Manager
    
* `setState(state?: Partial<State> | ((prev: State) => Partial<State>)) => State` Set the current state.
    * `state?`: A Partial state object of values to update, or a function returning such an object.
        > This only updates top-level keys on the `state?` object 
    * **returns**: `State` The current shape of the state
    
    Triggers: `onStateChange`

* `onStateChange(callback: (state: State) => any) => number` Be notified of global state change. 
    * `callback`: A function whose only argument is the current shape of `State`
    * **returns**: `number` The ID of the state listener. Can be used to unset the listener.
        > Note that the return value of `onStateChange` should not be confused with that of `on` as they take the same shape.

* `removeStateListener(id: number) => void` Remove a global state listener
    * `id`: The ID of the listener to remove. Obtained from `onStateChange`.

* `on(event: string, callback: (state: State) => any) => number` Listen for named events.
    * `event`: An identifier for an event type. These are not predefined and events triggered with `dispatch(<event>)` or `broadcast(<event>)` retain their name.
    * `callback`: A callback function to execute when the event occurs. 
        * `State`: The current instance of `State`
        * **returns**: A value to be discarded
    * **returns**: The ID of the event listener. Can be used to unset the listener.
    
* `off(id: number) => void` Remove an event listener
    * `id`: The ID of the listener to remove. Obtained from `on`.
    
* `dispatch(event: string, state: Partial<State> | ((prev: State) => Partial<State>)) => void` Change the current state and emit an event.
    * `event`: An identifier for an event type. These are not predefined and events caught with `on` retain their name.
    * `state`: A Partial state object of values to update, or a function returning such an object.
    
* `broadcast(event: string) => void` Inform listeners of events
    * `event`: An identifier for an event type. These are not predefined and events caught with `on` retain their name.