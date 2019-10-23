let title = executeScript('document.querySelector("#dle-content > div.content-block > div > h2 > a").innerText')
log(title)

let hosts = executeScript('Array.from(document.querySelectorAll(".accordion > h3 > span")).map(sp=>sp.innerText)')
hosts.forEach((host, hostId) => {
    log(`   ${host}`)
    let releases = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("h3 > span")).map(sp=>sp.innerText)`)
    releases.forEach((release, releaseId) => {
        log(`       ${release}`)
        let videos = executeScript(`Array.from(document.querySelectorAll(".accordion > div")[${hostId}].querySelectorAll("div > center > div")[${releaseId}].querySelectorAll("center > p[id^=an_ul]")).map(sp=>sp.innerText)`)
        videos.forEach((video, videoId) => {
            log(`           ${video}`)
        })
    })
})