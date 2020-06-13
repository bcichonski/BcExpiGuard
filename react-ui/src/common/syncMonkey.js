import dbProvider from '../persistence'

class SyncMonkey {
    constructor() {
        this.max_timeout_ms = 5 * 60 * 1000;
        this.min_timeout_ms = 1000;
        this.setTimeout(this.min_timeout_ms)
        this.inSync = false
    }

    start() {
        this.stop()
        this.setHandle()
    }

    stop() {
        if (this.handle) {
            clearTimeout(this.handle)
            this.handle = null
        }
    }

    getSalt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min;
    }

    setHandle() {
        this.handle = setTimeout(() => {
            this.sync()
        }, this.timeout + this.getSalt(10, 100))
    }

    setTimeout(value) {
        if (this.timeout !== value) {
            console.log(`sync monkey will wake up every ${Math.round(value / 1000)} seconds`)
            this.timeout = value
        }
    }

    backoff() {
        if (typeof this.timeout !== 'number' || this.timeout < this.min_timeout_ms) {
            this.reset()
            return
        }

        let ratio = 1.2
        if(this.timeout > this.max_timeout_ms / 4) {
            ratio = 1.5
        } else if(this.timeout > this.max_timeout_ms / 2) {
            ratio = 1.1
        }

        let newtimeout = Math.round(this.timeout * ratio) + this.getSalt(10, 1000)

        if (newtimeout > this.max_timeout_ms) {
            newtimeout = this.max_timeout_ms
        }

        this.setTimeout(newtimeout)
    }

    reset() {
        if (this.inSync) {
            this.resetAfterSync = true
        } else {
            this.stop()
            this.setTimeout(this.min_timeout_ms)
            this.start()
        }
    }

    async sync() {
        this.inSync = true
        this.stop()
        try {
            const itemNameChanges = await dbProvider.replicate('item_names')
            const itemChanges = await dbProvider.replicate('items')

            if (itemNameChanges || itemChanges) {
                this.resetAfterSync = true
            } else {
                this.backoff()
            }
        } catch {
            this.backoff()
        }
        if (this.resetAfterSync) {
            this.setTimeout(this.min_timeout_ms)
            this.resetAfterSync = false
        }
        this.start()
        this.inSync = false
    }
}

const instance = new SyncMonkey()

export default instance;