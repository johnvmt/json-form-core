
const splitPath = (pathOrPathParts, separator) => {
    let pathParts = Array.isArray(pathOrPathParts)
        ? pathOrPathParts
        : pathOrPathParts.split(separator);

    return pathParts.map(pathPart => {
        return pathPart.trim()
    });
}

const pathIsAbsolute = (pathParts) => {
    return pathParts[0].length === 0;
}

const mergeOptions = (options) => {
    return {
        separator: '/',
        parent: '..',
        current: '.',
        ...options
    };
}

const normalizePathParts = (pathOrPathParts, options) => {
    const mergedOptions = mergeOptions(options);

    let pathParts = splitPath(pathOrPathParts, mergedOptions.separator);

    const absolutePath = pathIsAbsolute(pathParts);

    pathParts = pathParts.filter(pathPart => pathPart.length > 0);

    const includedPathParts = [];

    for(let pathPart of pathParts) {
        if(pathPart === '..') {
            if(includedPathParts.length > 0)
                includedPathParts.pop();
            else
                throw new Error('Invalid path (above root)')
        }
        else if(pathPart !== mergedOptions.current)
            includedPathParts.push(pathPart);
    }

    return {
        pathParts: includedPathParts,
        absolute: absolutePath,
        options: mergedOptions
    }

}

const normalizePath = (pathOrPathParts, options) => {
    const {
        pathParts,
        absolute: absolutePath,
        options: mergedOptions
    } = normalizePathParts(pathOrPathParts, options);

    if(absolutePath)
        pathParts.unshift('');

    return pathParts.join(mergedOptions.separator);
}

const resolvePath = (pathOrPathParts, basePathOrPathParts = [], options = {}) => {
    const { separator } =  mergeOptions(options);
    const pathParts = splitPath(pathOrPathParts, separator);

    if(pathIsAbsolute(pathParts))
        return normalizePath(pathParts, options);
    else {
        const basePathParts = splitPath(basePathOrPathParts, separator);
        return normalizePath([...basePathParts, ...pathParts], options);
    }
}

const resolvePathParts = (pathOrPathParts, basePathOrPathParts, options = {}) => {
    const { separator } =  mergeOptions(options);
    const pathParts = splitPath(pathOrPathParts, separator);

    if(pathIsAbsolute(pathParts))
        return normalizePathParts(pathParts, options).pathParts;
    else {
        const basePathParts = splitPath(basePathOrPathParts, separator);
        return normalizePathParts([...basePathParts, ...pathParts], options).pathParts;
    }
}

export {
    resolvePath as default,
    resolvePath,
    resolvePathParts
};
