
//Request listener
class RequestListener {
    //public
    constructor(handler) {
      this._handler = handler
      this._isListening = false
    }
    setRegex(regex) {
      this.regex = new RegExp(regex)
    }
    start(regex) {
      this.setRegex(regex)
      if (!this._isListening) {
        this._isListening = true
        let instance = this
        chrome.devtools.network.onRequestFinished.addListener(response => {
          this._onRequestFinished(response)
        });
      }
    }
    stop() {
      if (this._isListening) {
        this._isListening = false
        chrome.devtools.network.onRequestFinished.removeListener(this._onRequestFinished);
      }
    }
  
    //private
    _onRequestFinished(request) {
      request.getContent((body) => {
        if (request.request && request.request.url && this.regex.test(request.request.url)) {
          this._handler(request.request.url, body)
        }
      });
    }
  }