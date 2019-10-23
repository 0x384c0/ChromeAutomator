function isUrl(text){
    return /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(text)
}

let title = executeScript('document.querySelector("#dle-content > div.content-block > div > h2 > a").innerText')
log(title)

let hostsObjects = []
let hosts = executeScript('Array.from(document.querySelectorAll(".accordion > h3 > span")).map(sp=>sp.innerText)')
hosts.forEach((host, hostId) => {
    log(`   ${host}`)
    let releases = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("h3 > span")).map(sp=>sp.innerText)`)
    let releaseObjects = []
    releases.forEach((release, releaseId) => {
        log(`       ${release}`)
        let videos = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > p[id^=an_ul]")).map(sp=>sp.innerText)`)
        videos = videos.filter(isUrl)
        log(`           found ${videos.length} video urls`)
        releaseObjects.push({ title:release, videos:videos })
    })
    hostsObjects.push({ title:host, releases:releaseObjects })
})
debugger; 