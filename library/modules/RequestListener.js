
//Request listener
//must be initialized in dev tools panel
function getRegex(regex){
  if (typeof regex === 'string' || regex instanceof String )
    return new RegExp(regex)
  else if (regex instanceof RegExp)
    return regex
  else 
    throw `illegal regex: ${regex}`
}

class RequestListener {
  //public
  constructor() {
    this._isListening = false
  }
  start(regex, handler) {
    this._handler = handler
    this._regex = getRegex(regex)

    if (this._isListening) {
      this.stop()
      this._handler(null, null)
    }
    this._isListening = true
    let instance = this
    chrome.devtools.network.onRequestFinished.addListener(response => {
      this._onRequestFinished(response)
    });

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
      if (request.request && request.request.url && this._regex.test(request.request.url)) {
        this._handler(request.request.url, body)
      } else {
       console.log("Clicker waitRequest rejected url: " + request.request.url + " urlRegex: " + this._regex)
      }
    });
  }
}