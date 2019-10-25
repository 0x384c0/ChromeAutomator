
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
    this._isOnBeforeRequest = null
  }
  start(regex, isOnBeforeRequest, isStopAfterFirstRequest, handler) {
    this._isOnBeforeRequest = isOnBeforeRequest

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
        this._addListener(this._currentListener);
      }
    }
  }
  stop() {
    if (this._isListening) {
      this._removeListener(this._currentListener);
      this._isOnBeforeRequest = null
      this._currentListener = null
    }
  }

  startInAdvance(regex, isOnBeforeRequest){
    this._isOnBeforeRequest = isOnBeforeRequest

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
    this._addListener(this._currentListener)
  }

  //private
  get _isListening(){
    return this._currentListener != null
  }
  get _isListeningInAdvance(){
    return this._isListening && this._handler == null
  }

  _onRequestFinished(request) {
    if (this._isOnBeforeRequest){
      console.log("onBeforeRequest")
      console.log(request)
      let url = request.redirectUrl != null ? request.redirectUrl : request.url
      console.log(url)
      this._onRequestFinishedWithBody(url,null)
    } else{
      console.log("onRequestFinished")//TODO: should not be called
      console.log(request)
      let url = (request.response != null && request.response.redirectURL != null) ? request.response.redirectURL : request.request.url
      if (url == null)
        request.url
      console.log(url)
      request.getContent(body => this._onRequestFinishedWithBody(url,body))
    }
  }

  _onRequestFinishedWithBody(url,body){
      if (url && this._regex.test(url)) {
        if (this._isListeningInAdvance)
          this._lastRequestInAdvance = {url: url, body:body, regex:this._regex}
        else{
          let alredyGotRequest = this._alredyGotRequest
          this._alredyGotRequest = true
          if (alredyGotRequest && this._isStopAfterFirstRequest)
            this.stop()
          else
            this._handler(url, body)
        }
      } else {
        // console.log(`_onRequestFinished rejected url: ${url} regex: ${this._regex}`)
      }
  }

  _addListener(listener){
    if (this._isOnBeforeRequest){
      let filter = {  urls: ["<all_urls>"]  }
      chrome.webRequest.onBeforeRequest.addListener(listener,filter)
    }
    else
      chrome.devtools.network.onRequestFinished.addListener(listener)
  }
  _removeListener(listener){
    if (this._isOnBeforeRequest == null)
      throw 'RequestListener illegal state: this._isOnBeforeRequest is null'
    if (this._isOnBeforeRequest)
      chrome.webRequest.onBeforeRequest.removeListener(listener)
    else{
      chrome.devtools.network.onRequestFinished.removeListener(listener)
    }
  }
}