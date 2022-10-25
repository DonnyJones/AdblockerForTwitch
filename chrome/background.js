// Show options and install message on first install only.
function handleInstalled(details) {
  if (details.reason == "install") {
    let createData = {
      focused: true,
      type: "popup",
      url: "dropdown/install.html",
      width: 366,
      height: 750,
    };

    chrome.windows.create(createData);
  }
}

chrome.runtime.onInstalled.addListener(handleInstalled);
