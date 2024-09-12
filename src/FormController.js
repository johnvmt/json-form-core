import DataLoader from "dataloader";
import SimpleEventEmitter from "./utils/SimpleEventEmitter.js";
import {
    NestedObjectWithSubscriptions
} from "object-subscriptions";

import BaseLogger from "./utils/BaseLogger.js";
import FormNode from "./FormNode.js";

class FormController extends SimpleEventEmitter {
    constructor(options = {}) {
        super();
        this._options = {
            ...options,
            paths: {
                schema: ['schema'],
                value: ['value'],
                extras: ['extras'],
                components: ['components'],
                ...options.paths
            },
            types: {
                node: FormNode,
                ...options.types
            },
            object: {
                separator: "/",
                parent: "..",
                current: ".",
            }
        };
        
        this._logger = this._options.logger ?? new BaseLogger();

        this._store = this._options.store ?? new NestedObjectWithSubscriptions(this._options.object);

        if(this._options.fragments) // form schema fragments (keyed on fragment key)
            this.fragments = this._options.fragments;

        if(this._options.schema) // form schema (schema path)
            this.schema = this._options.schema;

        if(this._options.value !== undefined) // form value (value path)
            this.value = this._options.value;

        if(this._options.extras) // form extras (value path)
            this.extras = this._options.extras; // alias to set extrasTree

        if(this._options.components) // components (special case? TODO remove?)
            this.components = this._options.components;

        this._fragmentLoader = new DataLoader((keys) => {
            // TODO clear dataloader and cache in store? where?
            this.log("debug", `Loading fragments: ${keys.join(", ")}`);
            this._options.loadFragments(keys);
        });

        // TODO set value, if set
        // TODO set schema, if set
        // TODO set (schema) fragments, if set
    }

    /**
     * Returns the full store
     * @returns {*|((credential: Credential) => Promise<Credential>)|((typedArray: (Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array), index: number, value: number) => number)|((typedArray: (BigInt64Array | BigUint64Array), index: number, value: bigint) => bigint)|NestedObjectWithSubscriptions}
     */
    get store() {
        return this._store;
    }

    /**
     * Return a form node at the given value path and schema path
     * @param valuePathOrPathParts
     * @param schemaPathOrPathParts
     * @param options
     * @returns {FormNode}
     */
    node(valuePathOrPathParts, schemaPathOrPathParts, options = {}) {
        const valuePathParts = this._store.pathPartsFromPath(valuePathOrPathParts); // path in values tree
        const schemaPathParts = this._store.pathPartsFromPath(schemaPathOrPathParts); // path in schema tree
        // TODO return the same node each time so automations do not double-run
        return new this._options.types.node(this, valuePathParts, schemaPathParts, options);
    }

    /**
     * Returns the root value
     */
    get value() {
        return this._store.get(this.storeValueRootPathParts);
    }

    /**
     * Set the root value
     * @param value
     * @returns {*}
     */
    set value(value) {
        this.log("debug", "Setting root value");
        return this._store.set(this.storeValueRootPathParts, value);
    }

    /**
     * Subscribes to root value in store
     * @param callback
     * @returns {*}
     */
    subscribeValue(callback) {
        return this.pathSubscribeValue([], callback);
    }

    /**
     * Returns path parts of value root in store (['value'])
     * @returns {string[]}
     */
    get storeValueRootPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.value);
    }

    /**
     * Returns the store path for the value from a value path
     * @param valuePathOrPathParts
     * @returns {*[]}
     */
    pathValueStorePathParts(valuePathOrPathParts) {
        // TODO allow resolving
        const valuePathParts = this._store.pathPartsFromPath(valuePathOrPathParts);
        return [
            ...this.storeValueRootPathParts,
            ...valuePathParts
        ];
    }

    /**
     * Returns the value at the value path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathGetValue(valuePathOrPathParts) {
        return this._store.get(this.pathValueStorePathParts(valuePathOrPathParts));
    }

    /**
     * Sets the value for the given value path
     * @param valuePathOrPathParts
     * @param value
     * @returns {*}
     */
    pathSetValue(valuePathOrPathParts, value) {
        return this._store.set(this.pathValueStorePathParts(valuePathOrPathParts), value);
    }

    /**
     * Deletes the value at the given value path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathDeleteValue(valuePathOrPathParts,) {
        return this._store.delete(this.pathValueStorePathParts(valuePathOrPathParts));
    }

    /**
     * Subscribe to the value at the given value path
     * @param valuePathOrPathParts
     * @param callback
     * @returns {*}
     */
    pathSubscribeValue(valuePathOrPathParts, callback) {
        return this._store.subscribe(this.pathValueStorePathParts(valuePathOrPathParts), callback);
    }

    /**
     * Returns the root schema
     */
    get schema() {
        return this._store.get(this.storeSchemaRootPathParts);
    }

    /**
     * Set the root schema
     * @param schema
     * @returns {*}
     */
    set schema(schema) {
        this.log("debug", "Setting root schema");
        return this._store.set(this.storeSchemaRootPathParts, schema);
    }

    /**
     * Subscribes to root schema in store
     * @param callback
     * @returns {*}
     */
    subscribeSchema(callback) {
        return this.pathSubscribeSchema([], callback);
    }

    /**
     * Returns path parts of schema root in store (['schema'])
     * @returns {string[]}
     */
    get storeSchemaRootPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.schema);
    }

    /**
     * Returns the store path for the schema from a schema path
     * @param schemaPathOrPathParts
     * @returns {*[]}
     */
    pathSchemaStorePathParts(schemaPathOrPathParts) {
        // TODO allow resolving
        const schemaPathParts = this._store.pathPartsFromPath(schemaPathOrPathParts);
        return [
            ...this.storeSchemaRootPathParts,
            ...schemaPathParts
        ];
    }

    /**
     * Returns the schema at the schema path
     * @param schemaPathOrPathParts
     * @returns {*}
     */
    pathGetSchema(schemaPathOrPathParts) {
        return this._store.get(this.pathSchemaStorePathParts(schemaPathOrPathParts));
    }

    /**
     * Sets the schema for the given schema path
     * @param schemaPathOrPathParts
     * @param schema
     * @returns {*}
     */
    pathSetSchema(schemaPathOrPathParts, schema) {
        return this._store.set(this.pathSchemaStorePathParts(schemaPathOrPathParts), schema);
    }

    /**
     * Deletes the schema for the given schema path
     * @param schemaPathOrPathParts
     * @returns {*}
     */
    pathDeleteSchema(schemaPathOrPathParts) {
        return this._store.delete(this.pathSchemaStorePathParts(schemaPathOrPathParts));
    }

    /**
     * Subscribe to the schema at the given schema path
     * @param schemaPathOrPathParts
     * @param callback
     * @returns {*}
     */
    pathSubscribeSchema(schemaPathOrPathParts, callback) {
        return this._store.subscribe(this.pathSchemaStorePathParts(schemaPathOrPathParts), callback);
    }

    /**
     * Returns the root extras
     */
    get extrasTree() {
        return this._store.get(this.storeExtraTreesRootPathParts);
    }

    /**
     * Set the root extras tree
     * @param extrasTree
     * @returns {*}
     */
    set extrasTree(extrasTree) {
        this.log("debug", "Setting root extras tree");
        return this._store.set(this.storeExtrasRootPathParts, extrasTree);
    }

    /**
     * Subscribes to root extras in store
     * @param callback
     * @returns {*}
     */
    subscribeExtrasTree(callback) {
        return this.pathSubscribeExtrasTree([], callback);
    }

    /**
     * Returns path parts of extras root in store (['extras'])
     * @returns {string[]}
     */
    get storeExtrasTreeRootPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.extras);
    }

    /**
     * Returns the store path for the extras from a value path (extras tree + _extras)
     * @param valuePathOrPathParts
     * @returns {*[]}
     */
    pathExtrasTreeStorePathParts(valuePathOrPathParts) {
        const valuePathParts = this._store.pathPartsFromPath(valuePathOrPathParts);
        const extrasPathParts = [];

        for(let valuePathPart of valuePathParts) {
            extrasPathParts.push("_children", valuePathPart);
        }

        return [
            ...this.storeExtrasRootPathParts,
            ...extrasPathParts
        ];
    }

    /**
     * Returns the extras at the extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathGetExtrasTree(valuePathOrPathParts) {
        console.log("GET EXTRAS TREE", valuePathOrPathParts, this.pathExtrasTreeStorePathParts(valuePathOrPathParts), this._store.get(this.pathExtrasTreeStorePathParts(valuePathOrPathParts)));
        return this._store.get(this.pathExtrasTreeStorePathParts(valuePathOrPathParts));
    }

    /**
     * Sets the extras tree (children + extras) for the given extras path
     * @param valuePathOrPathParts
     * @param extrasTree
     * @returns {*}
     */
    pathSetExtrasTree(valuePathOrPathParts, extrasTree) {
        return this._store.set(this.pathExtrasTreeStorePathParts(valuePathOrPathParts), extrasTree);
    }

    /**
     * Sets the extras tree (children + extras) for the given extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathDeleteExtrasTree(valuePathOrPathParts) {
        return this._store.set(this.pathExtrasTreeStorePathParts(valuePathOrPathParts));
    }

    /**
     * Subscribe to the extras at the given extras path
     * @param valuePathOrPathParts
     * @param callback
     * @returns {*}
     */
    pathSubscribeExtrasTree(valuePathOrPathParts, callback) {
        console.log("EXTRAS", this.pathExtrasTreeStorePathParts(valuePathOrPathParts))
        return this._store.subscribe(this.pathExtrasTreeStorePathParts(valuePathOrPathParts), callback);
    }

    /**
     * Returns the root extras
     */
    get extras() {
        return this._store.get(this.storeExtrasRootPathParts);
    }

    /**
     * Set the root extras
     * @param extras
     * @returns {*}
     */
    set extras(extras) {
        this.log("debug", "Setting root extras");
        return this._store.set(this.storeExtrasRootPathParts, extras);
    }

    /**
     * Subscribes to root extras in store
     * @param callback
     * @returns {*}
     */
    subscribeExtras(callback) {
        return this.pathSubscribeExtras([], callback);
    }

    /**
     * Returns path parts of extras root in store (['extras'])
     * @returns {string[]}
     */
    get storeExtrasRootPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.extras);
    }

    /**
     * Returns the store path for the extras from a value path (extras tree + _extras)
     * @param valuePathOrPathParts
     * @returns {*[]}
     */
    pathExtrasStorePathParts(valuePathOrPathParts) {
        return [
            ...this.pathExtrasTreeStorePathParts(valuePathOrPathParts),
            "_extras"
        ];
    }

    /**
     * Returns the extras at the extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathGetExtras(valuePathOrPathParts) {
        return this._store.get(this.pathExtrasStorePathParts(valuePathOrPathParts));
    }

    /**
     * Sets the extras for the given extras path
     * @param valuePathOrPathParts
     * @param extras
     * @returns {*}
     */
    pathSetExtras(valuePathOrPathParts, extras) {
        return this._store.set(this.pathExtrasStorePathParts(valuePathOrPathParts), extras);
    }

    /**
     * Sets the extras for the given extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathDeleteExtras(valuePathOrPathParts) {
        return this._store.set(this.pathExtrasStorePathParts(valuePathOrPathParts));
    }

    /**
     * Subscribe to the extras at the given extras path
     * @param valuePathOrPathParts
     * @param callback
     * @returns {*}
     */
    pathSubscribeExtras(valuePathOrPathParts, callback) {
        return this._store.subscribe(this.pathExtrasStorePathParts(valuePathOrPathParts), callback);
    }

    /**
     * Returns the store path for the extras children from a value path (extras tree + _children)
     * @param valuePathOrPathParts
     * @returns {*[]}
     */
    pathExtrasChildrenStorePathParts(valuePathOrPathParts) {
        return [
            ...this.pathExtrasTreeStorePathParts(valuePathOrPathParts),
            "_children"
        ];
    }

    /**
     * Returns the extras at the extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathGetExtrasChildren(valuePathOrPathParts) {
        return this._store.get(this.pathExtrasChildrenStorePathParts(valuePathOrPathParts));
    }

    /**
     * Sets the extras for the given extras path
     * @param valuePathOrPathParts
     * @param extrasChildren
     * @returns {*}
     */
    pathSetExtrasChildren(valuePathOrPathParts, extrasChildren) {
        return this._store.set(this.pathExtrasChildrenStorePathParts(valuePathOrPathParts), extrasChildren);
    }

    /**
     * Sets the extras for the given extras path
     * @param valuePathOrPathParts
     * @returns {*}
     */
    pathDeleteExtrasChildren(valuePathOrPathParts) {
        return this._store.delete(this.pathExtrasChildrenStorePathParts(valuePathOrPathParts));
    }

    /**
     * Subscribe to the extras at the given extras path
     * @param valuePathOrPathParts
     * @param callback
     * @returns {*}
     */
    pathSubscribeExtrasChildren(valuePathOrPathParts, callback) {
        return this._store.subscribe(this.pathExtrasChildrenStorePathParts(valuePathOrPathParts), callback);
    }

    /**
     * Returns path parts of components root in store
     * @returns {string[]}
     */
    get storeComponentsPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.components);
    }

    /**
     * Returns the computed components
     */
    get components() {
        return this._store.get(this.storeComponentsPathParts);
    }

    /**
     * Set the full computed components
     * @param components
     * @returns {*}
     */
    set components(components) {
        this.log("debug", "Setting components");
        return this._store.set(this.storeComponentsPathParts, components);
    }

    /**
     * Subscribes to components root in store
     * @param callback
     * @returns {*}
     */
    subscribeComponents(callback) {
        return this._store.subscribe(this.storeComponentsPathParts, callback);
    }

    /**
     * Returns path parts of fragments root in store
     * @returns {string[]}
     */
    get storeFragmentsPathParts() {
        return this._store.pathPartsFromPath(this._options.paths.fragments);
    }

    /**
     * Returns the computed fragments
     */
    get fragments() {
        return this._store.get(this.storeFragmentsPathParts);
    }

    /**
     * Set the full computed fragments
     * @param fragments
     * @returns {*}
     */
    set fragments(fragments) {
        this.log("debug", "Setting fragments root value");
        return this._store.set(this.storeFragmentsPathParts, fragments);
    }

    /**
     * Subscribes to fragments root in store
     * @param callback
     * @returns {*}
     */
    subscribeFragments(callback) {
        return this._store.subscribe(this.storeFragmentsPathParts, callback);
    }

    getFragment(key) {
        // TODO check if in store...here or in loader?
        // maybe here? in case loader isn't available?
        return this._fragmentLoader.load(key);
    }

    /**
     * Return logger
     * @returns {*|BaseLogger|BaseLogger}
     */
    get logger() {
        return this._logger;
    }

    /**
     * Return value and extras from store
     * @param valuePathOrPathParts
     */
    delete(valuePathOrPathParts) {
        console.log("CONTROLLER REMOVE VALUE");

        this.pathDeleteValue(valuePathOrPathParts);
        this.pathDeleteExtrasTree(valuePathOrPathParts);

        // destroy()
        console.log("REMOVE");
        // TODO add this function?
        // go up to parent value:
        // if parent value is an array, reset the array without the missing element
        // if not, just remove it
        // how to handle extras?

        // prune value and extras tree???
    }

    log(severity, ...messages) {
        this._logger[severity](messages.join(" "));
    }

    // TODO subscribe to merged input config using calculate()

    destroy() {
        // destroy all nodes
        // TODO need this?
    }
}

export default FormController;
