function updateCount(tabId, isOnRemoved) {
	browser.windows.getAll({ populate: true })
	.then((windows) => {
		for (let win of windows) {
			let tabs = win.tabs;
			let length = tabs.length;

			// onRemoved fires too early and the count is one too many.
			// see https://bugzilla.mozilla.org/show_bug.cgi?id=1396758
			if (isOnRemoved && tabId && tabs.map((t) => { return t.id; }).includes(tabId)) {
				length--;
			}

			browser.browserAction.setBadgeText({text: length.toString(), windowId: win.id });
			
			// Retrieve badge color from storage
			browser.storage.local.get("badgeColor").then((result) => {
				let badgeColor = result.badgeColor ?? '#8a2be2';
				browser.browserAction.setBadgeBackgroundColor({'color': badgeColor});
			});
		}
	});
}

browser.storage.onChanged.addListener((changes, area) => {
	if (changes['badgeColor']) {
		browser.browserAction.setBadgeBackgroundColor({'color': changes['badgeColor'].newValue});
	}
});

browser.tabs.onRemoved.addListener(
	(tabId) => { updateCount(tabId, true);
});
browser.tabs.onCreated.addListener(
	(tabId) => { updateCount(tabId, false);
});
browser.tabs.onDetached.addListener(
	(tabId) => { updateCount(tabId, false);
});
updateCount();
