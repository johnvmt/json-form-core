import {
    conditionsPassFromSubscriptionObject,
    conditionsResolvedPathsFromSubscriptionObject,
    runAutomationsFromSubscriptionObject
} from "object-rules-engine";

class FormNode {
    // TODO allow subscribing to component (need to subscribe to schema and components)
    constructor(controller, valuePathParts, schemaPathParts, options = {}) {
        this._controller = controller;
        this._valuePathParts = valuePathParts;
        this._schemaPathParts = schemaPathParts;

        this._options = {
            start: true,
            ...options
        };

        this._automationStopCallbacks = []; // make this a set?

        if(this._options.start)
            this.startAllAutomations();
    }

    /**
     * Emit an action from the controller
     * @param eventName
     * @param args
     * @returns {*}
     */
    emit(eventName, ...args) {
        return this.controller.emit(eventName, ...args);
    }

    get controller() {
        return this._controller;
    }

    get options() {
        return this._options;
    }

    /**
     * Get value at this node's value path
     * @returns {*}
     */
    get value() {
        return this._controller.pathGetValue(this._valuePathParts);
    }

    /**
     * Set value at this node's value path
     * @param value
     * @returns {*}
     */
    set value(value) {
        return this._controller.pathSetValue(this._valuePathParts, value);
    }

    /**
     * Subscribe to value at this node's value path
     * @param callback
     * @returns {*}
     */
    subscribeValue(callback) {
        return this._controller.pathSubscribeValue(this._valuePathParts, callback);
    }

    /**
     * Get schema at this node's schema path
     * @returns {*}
     */
    get schema() {
        return this._controller.pathGetSchema(this._schemaPathParts);
    }

    /**
     * Set schema at this node's schema path
     * @param schema
     * @returns {*}
     */
    set schema(schema) {
        return this._controller.pathSetSchema(this._schemaPathParts, schema);
    }

    /**
     * Subscribe to schema at this node's schema path
     * @param callback
     * @returns {*}
     */
    subscribeSchema(callback) {
        return this._controller.pathSubscribeSchema(this._schemaPathParts, callback);
    }

    /**
     * Get extras at this node's path
     * @returns {*}
     */
    get extrasTree() {
        return this._controller.pathGetExtrasTree(this._valuePathParts);
    }

    /**
     * Set extras tree at this node's path
     * @param extrasTree
     * @returns {*}
     */
    set extrasTree(extrasTree) {
        return this._controller.pathSetExtrasTree(this._valuePathParts, extrasTree);
    }

    /**
     * Subscribe to extras tree at this node's path
     * @param callback
     * @returns {*}
     */
    subscribeExtrasTree(callback) {
        return this._controller.pathSubscribeExtrasTree(this._valuePathParts, callback);
    }

    /**
     * Get extras at this node's extras path
     * @returns {*}
     */
    get extras() {
        return this._controller.pathGetExtras(this._valuePathParts);
    }

    /**
     * Set extras at this node's extras path
     * @param extras
     * @returns {*}
     */
    set extras(extras) {
        return this._controller.pathSetExtras(this._valuePathParts, extras);
    }

    /**
     * Subscribe to extras at this node's extras path
     * @param callback
     * @returns {*}
     */
    subscribeExtras(callback) {
        return this._controller.pathSubscribeExtras(this._valuePathParts, callback);
    }

    /**
     * Get extras at this node's path
     * @returns {*}
     */
    get extrasChildren() {
        return this._controller.pathGetExtrasChildren(this._valuePathParts);
    }

    /**
     * Set extras tree at this node's path
     * @param extrasChildren
     * @returns {*}
     */
    set extrasChildren(extrasChildren) {
        return this._controller.pathSetExtrasChildren(this._valuePathParts, extrasChildren);
    }

    /**
     * Subscribe to extras children at this node's path
     * @param callback
     * @returns {*}
     */
    subscribeExtrasChildren(callback) {
        return this._controller.pathSubscribeExtrasChildren(this._valuePathParts, callback);
    }

    subscribeComponent(callback) {
        // TODO use extras?
        return this._controller.store.calculate(
            [
                this._controller.storeComponentsPathParts(),
                [...this._controller.pathSchemaStorePathParts(this._schemaPathParts), "component"],
                [...this._controller.pathExtrastorePathParts(this._valuePathParts), "schema", "component"]
            ],
            (components, schemaComponentName, extraComponentName) => {
                const componentName = extraComponentName ?? schemaComponentName;
                return components[componentName];
            }, // returns component (or undefined)
            callback
        );
    }

    startAllAutomations() {
        console.log("STARTING AUTOMATIONS");
    }

    stopAllAutomations() {
        console.log("STOPPING AUTOMATIONS");
    }

    startAutomation(automation, options = {}) {
        // TODO how to handle automations if the same node is loaded twice?
        // don't allow the same one twice??
        // TODO need to register automations so they can all be run at once??
        console.log("REGISTER AUTOMATION", automation, options);

        console.log("PR", options.pathReplacements)

        const mergedOptions = {
            conditions: {
                object: {
                    separator: '/' // TODO get from store
                },
                // TODO add option to merge in replacements
                replacements: options.pathReplacements
            },
            actions: {
                // for output object
                store: this.store,
                replacements: options.pathReplacements,
                object: {
                    separator: '/' // TODO get from store
                },
            }
        };

        const conditionsPaths = conditionsResolvedPathsFromSubscriptionObject(stateStore, mergedOptions.conditions);

        console.log(conditionsPaths);

        // subscribe to all paths and re-run subscription when any of them changes
        // cancel subscriptions
        // TODO debounce

        const unsubscribers = conditionsPaths(automation).map(conditionPath => {
            return this.store.subscribe(conditionPath, () => {
                console.log("HIT!")
            });
        });

        /*
        const runAutomations = runAutomationsFromSubscriptionObject(input, options);

        (async () => {
            //console.log("PATHS", conditionsPaths(automation.condition));
            console.log("RESULT", await conditionsPass(automation.condition));
            await runAutomations(automation);
            //console.log("OUTPUT", input, output);
            //console.log(conditionsArgs(automation.condition))
        })();

         */


        // get input paths
        // subscribe to input paths
        // on any change, run automation
        // debounce?

        //automations.add(automationWithOptions);

        return () => { // deregister
            for(let unsubscribe of unsubscribers) {
                unsubscribe();
            }
            // TODO run this when unmounting this component too?
            //automations.delete(automationWithOptions);
        }
    }

    remove() {
        this.destroy();
        this._controller.remove(this._valuePathParts);
    }

    destroy() {
        // TODO remove merged?
        this.stopAllAutomations();
    }
}

export default FormNode;
