function isUrl(text){
    return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(text)
}

let title = executeScript('document.querySelector("#dle-content > div.content-block > div > h2 > a").innerText')
log(title)

let hostsObjects = []
let hosts = executeScript('Array.from(document.querySelectorAll(".accordion > h3 > span")).map(el=>el.innerText)')
hosts.forEach((host, hostId) => {
    log(`   ${host}`)
    let releases = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("h3 > span")).map(el=>el.innerText)`)
    let releaseObjects = []
    releases.forEach((release, releaseId) => {
        log(`       ${release}`)
        let videoUrls = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > p[id^=an_ul]")).map(el=>el.innerText)`)
        videoUrls = videoUrls.filter(isUrl)
        let titles =    executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > h3[id^=top_div_]")).map(el=>el.innerText)`)
        
        let videoObjects = []
        videoUrls.forEach((videoUrl,videoUrlId) => { 
            videoObjects.push({title:titles[videoUrlId],videoUrl:videoUrl})
        })
        releaseObjects.push({ title:release, videos:videoObjects })

        log(`           found ${videoObjects.length} video urls`)
    })
    hostsObjects.push({ title:host, releases:releaseObjects })
})
log(JSON.stringify(hostsObjects))