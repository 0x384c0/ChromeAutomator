//utils
function isUrl(text){
    return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(text)
}

async function generateClassForElement(elementQueryScript){
    let prefix = ' generated_class_'
    let regex = / generated_class_\d+/
    let className  = executeScript(`${elementQueryScript}.className`)
    if (!regex.test(className)){
        executeScript(`${elementQueryScript}.className += "${prefix}${Math.floor(Math.random() * 10000000000000000)}"`)
        className = executeScript(`${elementQueryScript}.className`)
    }
    return className.match(regex)[0].replace(" ","")
}

//networking
async function getVideoURlSibnet(videoObject){
    let videoId = videoObject.videoUrl.replace(/.*\/(\d+)\.flv$/,"$1")
    let videoEmbedUrlRegex = `^https:..video.sibnet.ru.shell.php.videoid=${videoId}`//TODO: find way to use / instead  of .
    let videoEmbedSel = `iframe[src^='https://video.sibnet.ru/shell.php?videoid=']` //TODO: find way to use ", not only '
    let playSel = "#video_html5_wrapper"
    let catalogUrl = "https:..animespirit.su.anime."
    let videoFileUrlRegex = /dv\d+\.sibnet\.ru.*\.mp4\?st/

    wait({ selector: playSel, waitTimout: 25000, hrefRegex: videoEmbedUrlRegex })
    sleep(500)
    waitRequestInAdvance({urlRegex:videoFileUrlRegex, isOnBeforeRequest: true})
    click({ selector: playSel, isTrusted: true, iframesSelectorInfo: [{ hrefRegex: catalogUrl, selector: videoEmbedSel }], hrefRegex: videoEmbedUrlRegex })
    let request = waitRequest({ urlRegex: videoFileUrlRegex, isOnBeforeRequest: true, waitTimout: 3000 })
    return request.url
}

//actions
async function expandSpoiler(spoiler){
    let isClosed = executeScript(`document.querySelector("${spoiler.contentSelector}").style.display == "none"`)
    if (isClosed)
        click(spoiler.spoilerSelector)
}
async function collapseSpoiler(spoiler){
    let isClosed = executeScript(`document.querySelector("${spoiler.contentSelector}").style.display == "none"`)
    if (!isClosed)
        click(spoiler.spoilerSelector)
}

async function expandSpoilerVideo(videoObject){
    let release = videoObject.parent
    let host = release.parent
    expandSpoiler(host)
    sleep(100)
    expandSpoiler(release)
    sleep(100)
    expandSpoiler(videoObject)
}


async function getVideoURlMuvi(videoObject){
    throw "Not implemented"
}

async function getVideoURl(videoObject){
    expandSpoilerVideo(videoObject)
    let result = videoObject.videoUrl
    if (videoObject.videoUrl.includes("sibnet"))
        result = await getVideoURlSibnet(videoObject)
    else if (videoObject.videoUrl.includes("myvi"))
        result = await getVideoURlMuvi(videoObject)
    collapseSpoiler(videoObject)
    sleep(100)
    return result
}

async function parseAllVideoSpoilers(){
    let hostsObjects = []
    let hosts = executeScript('Array.from(document.querySelectorAll(".accordion > h3[id^=ss5]")).map(el=>el.innerText)')
    hosts.forEach((host, hostId) => {
        log(`   ${host}`)
        let releases = executeScript(`Array.from(document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("h3[id^=ss5]")).map(el=>el.innerText)`)
        let releaseObjects = []
        releases.forEach((release, releaseId) => {
            log(`       ${release}`)
            let videoUrls = executeScript(`Array.from(document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > p[id^=an_ul]")).map(el=>el.innerText)`)
            videoUrls = videoUrls.filter(isUrl)
            let titles =    executeScript(`Array.from(document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > h3[id^=top_div_]")).map(el=>el.innerText)`)
            
            let videoObjects = []
            videoUrls.forEach((videoUrl,videoUrlId) => {
                let spoilerSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > h3[id^=top_div_]")[${videoUrlId}]`)}`
                let contentSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > p[id^=an][align=center]")[${videoUrlId}]`)}`
                let object = {title:titles[videoUrlId],videoUrl:videoUrl, spoilerSelector:spoilerSelector, contentSelector:contentSelector}
                videoObjects.push(object)
            })

            let spoilerSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("h3[id^=ss5]")[${releaseId}]`)}`
            let contentSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}].querySelectorAll("div > center > div")[${releaseId}]`)}`
            let object = { title:release, videos:videoObjects, spoilerSelector:spoilerSelector, contentSelector:contentSelector }
            videoObjects.forEach(childObject => childObject.parent = object)
            releaseObjects.push(object)
            log(`           found ${videoObjects.length} video urls`)
        })

        let spoilerSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > h3[id^=ss5]")[${hostId}]`)}`
        let contentSelector = `.${await generateClassForElement(`document.querySelectorAll(".accordion > div[id^=spoiler_]")[${hostId}]`)}`
        let object = { title:host, releases:releaseObjects, spoilerSelector:spoilerSelector, contentSelector:contentSelector }
        releaseObjects.forEach(childObject => childObject.parent = object)
        hostsObjects.push(object)
    })
    return hostsObjects
}

function isSubtitle(title){
    return title.includes("субтит") ||  title.includes("сабы")
}

//main
let HOST = "sibnet"
let IS_SUBTITLES = true

log("Started")
clearOutput()
setFileName("download.sh")

let title = executeScript('document.querySelector("#dle-content > div.content-block > div > h2 > a").innerText')
log(title)

let hostsObjects = await parseAllVideoSpoilers()

let videosToDownload = hostsObjects
                            .find(o => o.title.toLowerCase().includes(HOST))
                            .releases
                            .find(o => isSubtitle(o.title.toLowerCase()))
                            .videos
videosToDownload.forEach((videoObject, videoObjectId)  => {
    let url = await getVideoURl(videoObject)
    wget(url, `${videoObjectId + 1} ${videoObject.title}.mp4`)
})

log("Finished");