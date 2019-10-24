
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
    this._currentListener = null
    this._alredyGotRequest = false
  }
  start(regex, isStopAfterFirstRequest, handler) {

    this._regex = getRegex(regex)

    if (this._lastRequestInAdvance != null){
      if (this._lastRequestInAdvance.regex.source != this._regex.source)
        throw `Undefined behaviour: start regex: ${this._regex} and startInAdvance regex: ${this._lastRequestInAdvance.regex} should be same`
        this._handler = handler
      this._handler(this._lastRequestInAdvance.url, this._lastRequestInAdvance.body)
      this._lastRequestInAdvance = null
    } else {
      if (this._isListening && !this._isListeningInAdvance) {
        this.stop()
        if (this._handler != null)
          this._handler(null, null)
      }

      this._handler = handler
      
      if (!this._isListeningInAdvance){
        this._currentListener = response => {
          this._onRequestFinished(response)
        }
        this._alredyGotRequest = false
        this._isStopAfterFirstRequest = isStopAfterFirstRequest
        chrome.devtools.network.onRequestFinished.addListener(this._currentListener);
      }
    }
  }
  stop() {
    if (this._isListening) {
      chrome.devtools.network.onRequestFinished.removeListener(this._currentListener);
      this._currentListener = null
    }
  }

  startInAdvance(regex){
    this._regex = getRegex(regex)

    if (this._isListening) {
      this.stop()
      if (this._handler != null)
        this._handler(null, null)
    }

    this._currentListener = response => {
      this._onRequestFinished(response)
    }
    this._handler = null
    chrome.devtools.network.onRequestFinished.addListener(this._currentListener)
  }

  //private
  get _isListening(){
    return this._currentListener != null
  }
  get _isListeningInAdvance(){
    return this._isListening && this._handler == null
  }

  _onRequestFinished(request) {
    request.getContent((body) => {
      if (request.request && request.request.url && this._regex.test(request.request.url)) {
        if (this._isListeningInAdvance)
          this._lastRequestInAdvance = {url: request.request.url, body:body, regex:this._regex}
        else{
          let alredyGotRequest = this._alredyGotRequest
          this._alredyGotRequest = true
          if (alredyGotRequest && this._isStopAfterFirstRequest)
            this.stop()
          else
            this._handler(request.request.url, body)
        }
      }
    });
  }
}