"use strict";

var adblockOnandOff = document.querySelector("input[name=checkbox1]");
var infoMessage = document.querySelector("input[name=checkbox2]");

adblockOnandOff.addEventListener('change', function() {
    saveUserOptions();
});

infoMessage.addEventListener('change', function() {
    saveUserOptions();
});

function saveUserOptions() {
    if (document.querySelector("input[name=checkbox1]").checked) {
        chrome.storage.local.set({
            adblockOnandOffTTV: "true"
        }, function() {});
    } else {
        chrome.storage.local.set({
            adblockOnandOffTTV: "false"
        }, function() {});
    }
    if (document.querySelector("input[name=checkbox2]").checked) {
        chrome.storage.local.set({
            infoMessageTTV: "true"
        }, function() {});
    } else {
        chrome.storage.local.set({
            infoMessageTTV: "false"
        }, function() {});
    }
}

function restoreUserOptions() {
    chrome.storage.local.get(['adblockOnandOffTTV'], function(result) {
        if (result.adblockOnandOffTTV == "true") {
            document.querySelector("input[name=checkbox1]").checked = true;
        } else if (result.adblockOnandOffTTV == "false") {
            document.querySelector("input[name=checkbox1]").checked = false;
        }
    });

    chrome.storage.local.get(['infoMessageTTV'], function(result) {
        if (result.infoMessageTTV == "true") {
            document.querySelector("input[name=checkbox2]").checked = true;
        } else if (result.infoMessageTTV == "false") {
            document.querySelector("input[name=checkbox2]").checked = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', restoreUserOptions);