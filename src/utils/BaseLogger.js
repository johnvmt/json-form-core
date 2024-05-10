// BaseLogger v0.0.1
class BaseLogger {
    /**
     * Debug to console
     * @param messages
     */
    debug(...messages) {
        console.log(...messages)
    }

    /**
     * Info messages to console
     * @param messages
     */
    info(...messages) {
        console.info(...messages)
    }

    /**
     * Warning message to the console
     * @param messages
     */
    warn(...messages) {
        console.warn(...messages)
    }

    /**
     * Error message to the console
     * @param messages
     */
    error(...messages) {
        console.error(...messages)
    }
}

export default BaseLogger;
