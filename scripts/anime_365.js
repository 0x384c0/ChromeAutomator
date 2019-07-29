log("Started")
let catalogUrl = "^https://smotret-anime-365.ru/catalog/"
let promoEmbedUrl = "^https://anime-365.ru/promo/embed"
let videoEmbedUrl = "^https://smotret-anime-365.ru/translations/embed"
let videoEmbedSel = "iframe[src^='https://smotret-anime-365.ru/translations/embed']"
let nexEpSel = "i[class='material-icons right']"
let skipAdSel = "Пропустить рекламу(?! \\()"
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
        log("Has No Promo.")
        isNeedWaitRequest = false
    } else if (hasLongPromo) {
        log("Has Long Promo. Skipping it")
        await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
        await clicker.sleep(1000)
        await clicker.wait({ selector: skipSel, innerTextRegex: skipAdSel, waitTimout: 25000, hrefRegex: promoEmbedUrl })
        await clicker.executeScript({ code: "this.doSkip()", hrefRegex: promoEmbedUrl })
    } else if (hasPromo) {
        log("Has Short Promo. Skipping it")
        await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
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
        log("Playing video with play button")
        await clicker.click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
    } else if (hasLongPromo || hasPromo) {
        log("Playing video with skip button")
        await clicker.click({ selector: skipSel, isTrusted: true, innerTextRegex: skipAdSel, waitTimout: 25000, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrl })
    } else {
        throw "Invalid state"
    }
    await clicker.sleep(500)

    //grab data
    let dataTitle = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("data-title")', hrefRegex: videoEmbedUrl })
    let dataSrc = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("src")', hrefRegex: videoEmbedUrl })
    let dataSubtitles = await clicker.executeScript({ code: 'document.querySelector("video").getAttribute("data-subtitles")', hrefRegex: videoEmbedUrl })

    output(dataTitle)
    output(dataSrc)
    output(dataSubtitles)


    //go to next episode
    hasNextEpisode = await clicker.exists({ selector: nexEpSel, innerTextRegex: null, hrefRegex: catalogUrl })
    if (hasNextEpisode) {
        log("Going to next episode")
        await clicker.click({ selector: nexEpSel, isTrusted: true, hrefRegex: catalogUrl })
    }
} while (hasNextEpisode);

log("Finished");