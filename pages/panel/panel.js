//logs
function info(text) {
  console.log('%c ' + text + ' ', 'color: lightgreen');
}

// utils
let requestListener = new RequestListener()
let taskHandler = async clicker => {
  console.log("%c Started")
  let catalogUrl = "^https://smotret-anime-365.ru/catalog/"
  let promoEmbedUrl = "^https://anime-365.ru/promo/embed"
  let videoEmbedUrl = "^https://smotret-anime-365.ru/translations/embed"
  let nexEpSel = "i[class='material-icons right']"
  let playSel = "div[class='vjs-play-control vjs-control ']"
  var hasNextEpisode = false


  do {
    let hasPromo = await clicker.currentTab_exists(playSel, null, videoEmbedUrl)
    let hasLongPromo = await clicker.currentTab_exists("iframe", null, videoEmbedUrl)
    if (hasLongPromo) {
      info("%c Has Long Promo. Skipping it")
      let offset = await clicker.currentTab_calculateOffset([
        { hrefRegex: catalogUrl, selector: "iframe[src^='https://smotret-anime-365.ru/translations/embed']" }/*,
        { hrefRegex: videoEmbedUrl, selector: "iframe[src^='https://anime-365.ru/promo/embed']" }*/
      ])
      await clicker.currentTab_click(playSel, true, videoEmbedUrl, offset) //TODO: fix misclick when need scroll
      await clicker.sleep(1000)
      await clicker.currentTab_wait("div[class='skip-button']", "Пропустить рекламу(?! \\()", 25000, promoEmbedUrl)
      await clicker.currentTab_executeScript("this.doSkip()", promoEmbedUrl)
    } else if (hasPromo) {
      info("%c Has Short Promo. Skipping it")
      let offset = await clicker.currentTab_calculateOffset([
        { hrefRegex: catalogUrl, selector: "iframe[src^='https://smotret-anime-365.ru/translations/embed']" }
      ])
      await clicker.currentTab_click(playSel, true, videoEmbedUrl, offset) //TODO: fix misclick when need scroll
    } else {
      info("%c Has No Promo.")
    }

    //get url
    let body = await clicker.waitRequest("/translations/embedActivation", 25000)
    info(JSON.parse(JSON.parse(body).sources)[0].urls[0])

    //play video to avoid ad
    let offset = await clicker.currentTab_calculateOffset([
      { hrefRegex: "^https://smotret-anime-365.ru/catalog/", selector: "iframe[src^='https://smotret-anime-365.ru/translations/embed']" }
    ])
    await clicker.currentTab_waitAndClick("div.skip-button", true, "Пропустить рекламу(?! \\()", 25000, videoEmbedUrl, offset)

    //go to next episode
    hasNextEpisode = await clicker.currentTab_exists(nexEpSel, null, catalogUrl)
    if (hasNextEpisode) {
      info("Going to next episode")
      await clicker.currentTab_click(nexEpSel, true, catalogUrl)
      await clicker.sleep(1000) //TODO: use wait page loaded 
    }
  } while (hasNextEpisode);



  // await clicker.currentTab_click("div[class='skip-button']", false, promoEmbedUrl)
  // await clicker.currentTab_click("div > div.m-select-sibling-episode > a", true)

  // var urlRegex = "(https?:\/\/[^\s]+)";
  // let urls = await clicker.currentTab_search(urlRegex)
  // info(urls)

  // await clicker.currentTab_goBack()

  info("Finished");
}
let clicker = new Clicker(requestListener)

//UI Binding
var message_element = new Vue({ el: '#message_element', data: { text: 'null\n' } })
var start_button = new Vue({ el: '#start_button', methods: { click: start } })

var coordinates = new Vue({ el: "#coordinates", data: { x: 0, y: 0 } })
var click_coordinates = new Vue({ el: '#click_coordinates', methods: { click: clickCoordinates } })

//UI Actions
function start() {
  info("start")
  message_element.message += "Loading tab ...\n"
  chrome.tabs.query({ active: true, currentWindow: true }, tabCallback)
}

function clickCoordinates() {
  info("clickCoordinates")
  message_element.message += "Loading tab ...\n"
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    clicker.start(tabs[0], async (clicker) => {
      await clicker.currentTab_clickCoordinate(coordinates.x, coordinates.y)
    })
  })
}

//Callbacks
function tabCallback(tabs) {
  message_element.text += "Tab id: " + tabs[0].id + "\n"
  clicker.start(tabs[0], taskHandler)
}