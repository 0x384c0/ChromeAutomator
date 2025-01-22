export class Storage {
    //Private
    // promise wrappers for chrome APIs
    _setValue(key, value) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                else
                    resolve()
            });
        });
    }
    _getValue(key, defaultValue) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                if (result == null)
                    resolve(defaultValue)
                else if (chrome.runtime.lastError)
                    reject(chrome.runtime.lastError)
                else
                    resolve(result[key])
            });
        });
    }


    //Public
    setIsVerboseLogging(isVerboseLogging) {
        return this._setValue("isVerboseLogging", isVerboseLogging)
    }
    getIsVerboseLogging() {
        return this._getValue("isVerboseLogging", false)
    }
}