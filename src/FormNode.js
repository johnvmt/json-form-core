import { SubscriptionObjectRulesEngineAutomation } from "object-rules-engine";

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
        
        if(this._options.start)
            this.startAutomations();
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

    startAutomations() {
        this.stopAutomations(); // stop all existing automations
        const automationConfigs = this.options.automations ?? [];

        this._automations = automationConfigs.map(automationConfig => new SubscriptionObjectRulesEngineAutomation(
            automationConfig,
            this._controller.store,
            {
                pathPrefix: "$",
                basePaths: {
                    // TODO allow overrides
                    value: this._valuePathParts,
                    schema: this._schemaPathParts
                }
            }
        ));

    }

    stopAutomations() {
        if(this._automations) {
            for(let automation of this._automations) {
                automation.destroy();
            }

            delete this._automations;
        }
    }

    remove() {
        this.destroy();
        this._controller.remove(this._valuePathParts);
    }

    destroy() {
        // TODO remove merged?
        this.stopAutomations();
    }
}

export default FormNode;
