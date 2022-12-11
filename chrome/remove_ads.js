window.addEventListener("message", (event) => {
    if (event.source != window)
        return;
    if (event.data.type && (event.data.type == "SetHideBlockingMessage")) {
        if (twitchMainWorker) {
            twitchMainWorker.postMessage({
                key: 'SetHideBlockingMessage',
                value: event.data.value
            });
        }
    }
}, false);

function declareOptions(scope) {
    scope.AdSignifier = 'stitched';
    scope.PlayerType1 = 'site';
    scope.CurrentChannelName = null;
    scope.WasShowingAd = false;
    scope.ShowingAdFree = false;
    scope.AdFreeStream = null;
    scope.HideBlockingMessage = false;
    scope.IsSquadStream = false;
}

declareOptions(window);

var twitchMainWorker = null;

var adBlockDiv = null;

var OriginalVideoPlayerQuality = null;

var IsPlayerAutoQuality = null;

const oldWorker = window.Worker;

window.Worker = class Worker extends oldWorker {
    constructor(twitchBlobUrl) {
        if (twitchMainWorker) {
            super(twitchBlobUrl);
            return;
        }
        var jsURL = getWasmWorkerUrl(twitchBlobUrl);
        if (typeof jsURL !== 'string') {
            super(twitchBlobUrl);
            return;
        }
        var newBlobStr = `
                ${processM3U8.toString()}
                ${hookWorkerFetch.toString()}
                ${declareOptions.toString()}
                declareOptions(self);
                self.addEventListener('message', function(e) {
                    if (e.data.key == 'UpdateIsSquadStream') {
                        IsSquadStream = e.data.value;
                    } else if (e.data.key == 'SetHideBlockingMessage') {
                        if (e.data.value == "true") {
                        HideBlockingMessage = false;
                        } else if (e.data.value == "false") {
                        HideBlockingMessage = true;
                        }
                    }
                });
                hookWorkerFetch();
                importScripts('${jsURL}');
            `;
        super(URL.createObjectURL(new Blob([newBlobStr])));
        twitchMainWorker = this;
        this.onmessage = function(e) {
            if (e.data.key == 'HideAdBlockBanner') {
                if (adBlockDiv == null) {
                    adBlockDiv = getAdBlockDiv();
                }
                adBlockDiv.style.display = 'none';
            } else if (e.data.key == 'ShowDonateBanner') {
                if (adBlockDiv == null) {
                    adBlockDiv = getAdBlockDiv();
                }
                adBlockDiv.P.textContent = 'Blocking ads..Help support me..';
                adBlockDiv.style.display = 'block';
            } else if (e.data.key == 'PauseResumePlayer') {
                doTwitchPlayerTask(true, false, false, false);
            } else if (e.data.key == 'ForceChangeQuality') {
                try {
                    var autoQuality = doTwitchPlayerTask(false, false, true, false);
                    var currentQuality = doTwitchPlayerTask(false, true, false, false);

                    if (IsPlayerAutoQuality == null) {
                        IsPlayerAutoQuality = autoQuality;
                    }
                    if (OriginalVideoPlayerQuality == null) {
                        OriginalVideoPlayerQuality = currentQuality;
                    }
                    if (!currentQuality.includes('480') || e.data.value != null) {
                        if (!OriginalVideoPlayerQuality.includes('480')) {
                            var settingsMenu = document.querySelector('div[data-a-target="player-settings-menu"]');
                            if (settingsMenu == null) {
                                var settingsCog = document.querySelector('button[data-a-target="player-settings-button"]');
                                if (settingsCog) {
                                    settingsCog.click();
                                    var qualityMenu = document.querySelector('button[data-a-target="player-settings-menu-item-quality"]');
                                    if (qualityMenu) {
                                        qualityMenu.click();
                                    }
                                    var lowQuality = document.querySelectorAll('input[data-a-target="tw-radio"');
                                    if (lowQuality) {
                                        var qualityToSelect = lowQuality.length - 3;
                                        if (e.data.value != null) {
                                            if (e.data.value.includes('original')) {
                                                e.data.value = OriginalVideoPlayerQuality;
                                                if (IsPlayerAutoQuality) {
                                                    e.data.value = 'auto';
                                                }
                                            }
                                            if (e.data.value.includes('160p')) {
                                                qualityToSelect = 5;
                                            }
                                            if (e.data.value.includes('360p')) {
                                                qualityToSelect = 4;
                                            }
                                            if (e.data.value.includes('480p')) {
                                                qualityToSelect = 3;
                                            }
                                            if (e.data.value.includes('720p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('822p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('864p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('900p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('936p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('960p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('1080p')) {
                                                qualityToSelect = 2;
                                            }
                                            if (e.data.value.includes('source')) {
                                                qualityToSelect = 1;
                                            }
                                            if (e.data.value.includes('auto')) {
                                                qualityToSelect = 0;
                                            }
                                        }
                                        var currentQualityLS = window.localStorage.getItem('video-quality');

                                        lowQuality[qualityToSelect].click();
                                        settingsCog.click();

                                        window.localStorage.setItem('video-quality', currentQualityLS);

                                        if (e.data.value != null) {
                                            OriginalVideoPlayerQuality = null;
                                            IsPlayerAutoQuality = null;
                                            doTwitchPlayerTask(false, false, true, true);
                                        }
                                    }

                                }
                            }
                        }
                    }
                } catch (err) {
                    OriginalVideoPlayerQuality = null;
                    IsPlayerAutoQuality = null;
                }
            }
        };

        function getAdBlockDiv() {
            var playerRootDiv = document.querySelector('.video-player');
            var adBlockDiv = null;
            if (playerRootDiv != null) {
                adBlockDiv = playerRootDiv.querySelector('.adblock-overlay');
                if (adBlockDiv == null) {
                    adBlockDiv = document.createElement('div');
                    adBlockDiv.className = 'adblock-overlay';
                    adBlockDiv.innerHTML = '<a href="https://paypal.me/ttvadblock" target="_blank"><div class="player-adblock-notice" style="color: white; background-color: rgba(0, 0, 0, 0.8); position: absolute; top: 0px; left: 0px; padding: 5px;"><p></p></div></a>';
                    adBlockDiv.style.display = 'none';
                    adBlockDiv.P = adBlockDiv.querySelector('p');
                    playerRootDiv.appendChild(adBlockDiv);
                }
            }
            return adBlockDiv;
        }
    }
};

function getWasmWorkerUrl(twitchBlobUrl) {
    var req = new XMLHttpRequest();
    req.open('GET', twitchBlobUrl, false);
    req.send();
    return req.responseText.split("'")[1];
}

function hookWorkerFetch() {
    var realFetch = fetch;
    fetch = async function(url, options) {
        if (typeof url === 'string') {
            if (url.includes('video-weaver')) {
                return new Promise(function(resolve, reject) {
                    var processAfter = async function(response) {

                        var responseText = await response.text();
                        var weaverText = await processM3U8(url, responseText, realFetch, PlayerType1);

                        resolve(new Response(weaverText));
                    };
                    var send = function() {
                        return realFetch(url, options).then(function(response) {
                            processAfter(response);
                        })['catch'](function(err) {
                            reject(err);
                        });
                    };
                    send();
                });
            } else if (url.includes('/api/channel/hls/')) {
                var channelName = (new URL(url)).pathname.match(/([^\/]+)(?=\.\w+$)/)[0];
              
                CurrentChannelName = channelName;

                var isPBYPRequest = url.includes('picture-by-picture');
                if (isPBYPRequest) {
                    url = '';
                }
                AdFreeStream = null;
                ShowingAdFree = false;
            }
        }
        return realFetch.apply(this, arguments);
    };
}

async function processM3U8(url, textStr, realFetch, playerType) {

    if (IsSquadStream == true) {
        return textStr;
    }

    if (!textStr) {
        return textStr;
    }

    if (!textStr.includes(".ts") && !textStr.includes(".mp4")) {
        return textStr;
    }

    var haveAdTags = textStr.includes(AdSignifier);

    if (haveAdTags) {

        postMessage({
            key: 'ForceChangeQuality'
        });

        if (ShowingAdFree) {
            var showingAdFreeResponseFree = await realFetch(AdFreeStream);
            if (showingAdFreeResponseFree.status == 200) {
                var adFreem3u8Text = await showingAdFreeResponseFree.text();
                return adFreem3u8Text;
            }
        }

        try { 
            var encodingsM3u8ResponseFree = await realFetch('https://api.ttv.lol/playlist/' + CurrentChannelName + '.m3u8%3Fallow_source%3Dtrue', {headers: {'X-Donate-To': 'https://ttv.lol/donate'}});
            if (encodingsM3u8ResponseFree.status === 200) {
                var encodingsM3u8Free = await encodingsM3u8ResponseFree.text();
                streamM3u8UrlFreeCount = encodingsM3u8Free.match(/^https:.*\.m3u8$/mg).length;
                streamM3u8UrlFree = encodingsM3u8Free.match(/^https:.*\.m3u8$/mg)[streamM3u8UrlFreeCount - 3];
                var streamM3u8ResponseFree = await realFetch(streamM3u8UrlFree);
                if (streamM3u8ResponseFree.status == 200) {
                    m3u8Text = await streamM3u8ResponseFree.text();
                    AdFreeStream = streamM3u8UrlFree;
                    ShowingAdFree = true;


                    postMessage({
                        key: 'ForceChangeQuality'
                    });


                } else {

                    postMessage({
                        key: 'ForceChangeQuality'
                    });

                }
            }


            if (m3u8Text.length > 10) {

                WasShowingAd = true;

                if (HideBlockingMessage == false) {
                    postMessage({
                        key: 'ShowDonateBanner'
                    });
                } else if (HideBlockingMessage == true) {
                    postMessage({
                        key: 'HideAdBlockBanner'
                    });
                }

                return m3u8Text;
            } else {
                return textStr;
            }
        } catch (err) {}
        return textStr;
    } else {
        if (WasShowingAd) {
            WasShowingAd = false;

            postMessage({
                key: 'ForceChangeQuality',
                value: 'original'
            });

            AdFreeStream = null;
            ShowingAdFree = false;

            postMessage({
                key: 'PauseResumePlayer'
            });
            postMessage({
                key: 'HideAdBlockBanner'
            });
        }
        return textStr;
    }
    return textStr;
}

function doTwitchPlayerTask(isPausePlay, isCheckQuality, isAutoQuality, setAutoQuality) {
    try {
        var videoController = null;
        var videoPlayer = null;

        function findReactNode(root, constraint) {
            if (root.stateNode && constraint(root.stateNode)) {
                return root.stateNode;
            }
            let node = root.child;
            while (node) {
                const result = findReactNode(node, constraint);
                if (result) {
                    return result;
                }
                node = node.sibling;
            }
            return null;
        }
        var reactRootNode = null;
        var rootNode = document.querySelector('#root');
        if (rootNode && rootNode._reactRootContainer && rootNode._reactRootContainer._internalRoot && rootNode._reactRootContainer._internalRoot.current) {
            reactRootNode = rootNode._reactRootContainer._internalRoot.current;
        }
        videoPlayer = findReactNode(reactRootNode, node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance);
        videoPlayer = videoPlayer && videoPlayer.props && videoPlayer.props.mediaPlayerInstance ? videoPlayer.props.mediaPlayerInstance : null;

        if (isPausePlay) {
            videoPlayer.pause();
            videoPlayer.play();
            return;
        }
        if (isCheckQuality) {
            if (typeof videoPlayer.getQuality() == 'undefined') {
                return;
            }
            var playerQuality = JSON.stringify(videoPlayer.getQuality());
            if (playerQuality) {
                return playerQuality;
            } else {
                return;
            }
        }
        if (isAutoQuality) {
            if (typeof videoPlayer.isAutoQualityMode() == 'undefined') {
                return false;
            }
            var autoQuality = videoPlayer.isAutoQualityMode();
            if (autoQuality) {
                videoPlayer.setAutoQualityMode(false);
                return autoQuality;
            } else {
                return false;
            }
        }
        if (setAutoQuality) {
            videoPlayer.setAutoQualityMode(true);
            return;
        }
    } catch (err) {}
}

function hookFetch() {
    var realFetch = window.fetch;
    window.fetch = function(url, init, ...args) {
        if (typeof url === 'string') {
            if (window.location.pathname.includes('/squad')) {
                if (twitchMainWorker) {
                    twitchMainWorker.postMessage({
                        key: 'UpdateIsSquadStream',
                        value: true
                    });
                }
            } else {
                if (twitchMainWorker) {
                    twitchMainWorker.postMessage({
                        key: 'UpdateIsSquadStream',
                        value: false
                    });
                }
            }
            if (url.includes('/access_token') || url.includes('gql')) {
                if (url.includes('gql') && init && typeof init.body === 'string' && init.body.includes('PlaybackAccessToken') && init.body.includes('picture-by-picture')) {
                    init.body = '';
                }
                var isPBYPRequest = url.includes('picture-by-picture');
                if (isPBYPRequest) {
                    url = '';
                }
            }
        }
        return realFetch.apply(this, arguments);
    };
}
hookFetch();