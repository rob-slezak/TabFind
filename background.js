async function countDuplicateTabs(tabs) {
	const result = await browser.storage.local.get("findDups");
	findDups = result.findDups ?? "both";

	let duplicates = {};
	for (let tab of tabs) {
		let searchVal;
		switch(findDups) {
			case "name":
				searchVal = tab.title;
				break;
			case "url":
				searchVal = tab.url;
				break;
			case "both":
			default:
				searchVal = `${tab.title}|${tab.url}`;
				break;
		}	
		
		if (searchVal in duplicates) {
			duplicates[searchVal] = duplicates[searchVal] + 1;
		}
		else {
			duplicates[searchVal] = 1;
		}
	}

	let duplicateCount = 0;
	for (let key in duplicates) {
		let count = duplicates[key];
		if (count > 1) {
			duplicateCount += count;
		}
	}

	return duplicateCount.toString();
}

async function updateBadgeColor(badgeColor) {
	if (badgeColor == null) {
		// Retrieve badge color from storage
		let result = await browser.storage.local.get("badgeColor");
		badgeColor = result.badgeColor ?? '#8a2be2';
	}

	browser.browserAction.setBadgeBackgroundColor({'color': badgeColor});
}

function updateBadgeCount(tabId, oldWindowId, isOnRemoved) {
	browser.windows.getAll({ populate: true })
	.then(async (windows) => {
		// Retrieve badge count from storage
		let result = await browser.storage.local.get("badgeCount");
		let badgeCount = result.badgeCount ?? 'all';
			
		for (let win of windows) {
			let tabs = win.tabs;

			// onRemoved (and onDetached) fires too early and the count is one too many.
			// see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
			if (isOnRemoved && tabId) {
				if (oldWindowId && oldWindowId == win.id) {
					tabs = tabs.filter((t) => { 
						return t.id !== tabId;
					});
				}
				else if (oldWindowId == null) {
					tabs = tabs.filter((t) => {
						return t.id !== tabId;
					});
				}
			}
			
			let length = Math.max(tabs.length, 1);

			// Set badge count
			let badgeText = length.toString();
			if (badgeCount == 'duplicates') {
				badgeText = await countDuplicateTabs(tabs);
			}
			browser.browserAction.setBadgeText({text: badgeText, windowId: win.id });
		}
	});
}

browser.storage.onChanged.addListener((changes, area) => {
	if (changes['badgeColor']) {
		updateBadgeColor(changes['badgeColor'].newValue);
	}

	if (changes['badgeCount']) {
		updateBadgeCount(null, null, false);
	}
});

browser.tabs.onRemoved.addListener((tabId) => { 
	updateBadgeCount(tabId, null, true);
});
browser.tabs.onCreated.addListener((tabId) => {
	updateBadgeCount(tabId, null, false);
});
browser.tabs.onDetached.addListener((tabId, detachInfo) => {
	updateBadgeCount(tabId, detachInfo.oldWindowId, true);
});
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
	if (changeInfo.url) {
		updateBadgeCount(tabId, null, false);
	}
});

updateBadgeColor(null);
updateBadgeCount(null, null, false);
