//logs
let logger = new Logger()

// utils
let requestListener = new RequestListener()
let taskHandler = async clicker => {
  logger.info("%c Started")
  let catalogUrl = "^https://smotret-anime-365.ru/catalog/"
  let promoEmbedUrl = "^https://anime-365.ru/promo/embed"
  let videoEmbedUrl = "^https://smotret-anime-365.ru/translations/embed"
  let videoEmbedSel = "iframe[src^='https://smotret-anime-365.ru/translations/embed']"
  let nexEpSel = "i[class='material-icons right']"
  let playSel = "div[class='vjs-play-control vjs-control ']"
  let skipSel = "div.skip-button"
  var hasNextEpisode = false


  do {
    var isNeedWaitRequest = true
    await clicker.sleep(5000) //TODO: use wait page loaded 
    let hasNoPromo = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("src") != null', hrefRegex: videoEmbedUrl })
    let hasLongPromo = await clicker.exists({ selector: "iframe", innerTextRegex: null, hrefRegex: videoEmbedUrl })
    let hasPromo = await clicker.exists({ selector: playSel, innerTextRegex: null, hrefRegex: videoEmbedUrl })
    if (hasNoPromo) {
      logger.info("%c Has No Promo.")
      isNeedWaitRequest = false
    } else if (hasLongPromo) {
      logger.info("%c Has Long Promo. Skipping it")
      await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }],hrefRegex: videoEmbedUrl })
      await clicker.sleep(1000)
      await clicker.wait({ selector: skipSel, innerTextRegex: "Пропустить рекламу(?! \\()", waitTimout: 25000, hrefRegex: promoEmbedUrl })
      await clicker.executeScript({ code: "this.doSkip()", hrefRegex: promoEmbedUrl })
    } else if (hasPromo) {
      logger.info("%c Has Short Promo. Skipping it")
      await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }],hrefRegex: videoEmbedUrl })
    } else {//TODO: add case when only youtube frame
      throw "Invalid state"
    }

    if (isNeedWaitRequest) {
      //wait url
      let body = await clicker.waitRequest({ urlRegex: "/translations/embedActivation", waitTimout: 25000 })
      await clicker.sleep(500)
    }
    //play video
    if (hasNoPromo) {
      logger.info("Playing video with play button")
      await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
    } else if (hasLongPromo || hasPromo) {
      logger.info("Playing video with skip button")
      await clicker.click({ selector: skipSel, isTrusted: true, innerTextRegex: "Пропустить рекламу(?! \\()", waitTimout: 25000, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
    } else {
      throw "Invalid state"
    }
    await clicker.sleep(500)

    //grab data
    let dataTitle = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("data-title")', hrefRegex: videoEmbedUrl })
    let dataSrc = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("src")', hrefRegex: videoEmbedUrl })
    let dataSubtitles = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("data-subtitles")', hrefRegex: videoEmbedUrl })
    logger.info("------")
    logger.info("Got data:")
    logger.info("title: " + dataTitle)
    logger.info("video: " + dataSrc)
    logger.info("subtitles: " + dataSubtitles)
    logger.info("------")


    //go to next episode
    hasNextEpisode = await clicker.exists({ selector: nexEpSel, innerTextRegex: null, hrefRegex: catalogUrl })
    if (hasNextEpisode) {
      logger.info("Going to next episode")
      await clicker.click({ selector: nexEpSel, isTrusted: true, hrefRegex: catalogUrl })
    }
  } while (hasNextEpisode);

  logger.info("Finished");
}
let clicker = new Clicker(requestListener)

//UI Binding
var message_element = new Vue({ el: '#message_element', data: { text: 'null\n' } })
var start_button = new Vue({ el: '#start_button', methods: { click: start } })

var coordinates = new Vue({ el: "#coordinates", data: { x: 0, y: 0 } })
var click_coordinates = new Vue({ el: '#click_coordinates', methods: { click: clickCoordinates } })


//UI Actions
function start() {
  logger.info("start")
  clicker.start(chrome.devtools.inspectedWindow.tabId, taskHandler)
}

function clickCoordinates() {

  let clickTaskHandler = async (clicker) => {
    await clicker.clickCoordinate({ x: coordinates.x, y: coordinates.y })
  }
  logger.info("clickCoordinates")
  clicker.start(chrome.devtools.inspectedWindow.tabId, clickTaskHandler)
}

//function editor
let editor = null
initEditor()
async function  initEditor(){
  window.MonacoEnvironment = {
    getWorkerUrl: function(workerId, label) {
      return 'monaco-editor-worker-loader-proxy.js';
    }
  };
  
  require.config({ paths: { 'vs': '../../library/external/monaco-editor/min/vs' }});

  editor = monaco.editor.create(document.getElementById('container'), {
    value: [
      'function x() {',
      '\tconsole.log("Hello world!");',
      '}'
    ].join('\n'),
    language: 'javascript',
    theme: 'vs-dark'
  });
}