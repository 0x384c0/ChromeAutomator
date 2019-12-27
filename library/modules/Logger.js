class Logger {
    constructor() {
        this.storage = new Storage()
        this.isVerboseLogging = null
        this.reset()
    }

    _log(object) {
        if (this.isVerboseLogging){
            // console.trace()
            console.log(object)
        }
    }

    reset(){
        this.storage
            .getIsVerboseLogging()
            .then((isVerboseLogging) => {
                this.isVerboseLogging = isVerboseLogging
            })
    }

    log(object) {
        if (this.isVerboseLogging == null)
            this.storage
                .getIsVerboseLogging()
                .then((isVerboseLogging) => {
                    this.isVerboseLogging = isVerboseLogging
                    this._log(object)
                })
        else
            this._log(object)
    }
    info(text) {
        console.log('%c ' + text + ' ', 'color: lightgreen');
    }
}