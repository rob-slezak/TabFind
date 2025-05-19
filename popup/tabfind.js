const TABS_ALL = 0;
const TABS_DUPLICATE = 1;

var currentState;
var search = '';

var findDups;
var searchBy;

/**
 * retrieves all windows with tabs
 */
function getWindows() {
	return browser.windows.getAll({ populate: true });
}

/**
 * retrieves all tabs for the current window
 */
function getTabs() {
	return browser.tabs.query({currentWindow: true});
}

/**
 * Switch to the given tab
 */
async function switchTab(tabId) {
	return browser.tabs.update(tabId, { active: true });
}

/**
 * Close the given tab
 */
async function closeTab(tabId) {
	return browser.tabs.remove(tabId);
}

/**
 * Close all tab(s) based on the search term
 */
async function closeAllTabs() {
	var tabs = await getTabs();

	let tabIds = [];
	for (let tab of tabs) {
		if (checkSearch(tab)) {
			tabIds.push(tab.id)
		}
	}

	await closeTab(tabIds);
}

/**
 * Reload tab list
 */
function reloadTabList(scrollToActiveTab = false) {
	switch (currentState) {
		case TABS_DUPLICATE:
			listDuplicateTabs(scrollToActiveTab);
			break;
		case TABS_ALL:
		default:
			listAllTabs(scrollToActiveTab);
			break;
	}
}

/**
 * makes the provided tab active
 */
function makeTabActive(tab) {
	currentState = tab;
	
	let tabAll = document.getElementById('tabs-all');
	let tabDuplicate = document.getElementById('tabs-duplicate');

	let searchWrapper = document.getElementById('search-wrapper');
	let clearDuplicates = document.getElementById('clear-duplicates');
	
	tabAll.classList.remove('active');
	tabDuplicate.classList.remove('active');
	
	switch (tab) {
		case TABS_DUPLICATE:
			tabDuplicate.classList.add('active');
			searchWrapper.classList.add('hidden');
			clearDuplicates.classList.remove('hidden');
			break;
		case TABS_ALL:
		default:
			tabAll.classList.add('active');
			clearDuplicates.classList.add('hidden');
			searchWrapper.classList.remove('hidden');
			break;
	}
}

/**
 * update tab count
 */
function updateTabCount() {
	getWindows().then((windows) => {
		let totalTabs = 0, currentTabs = 0;
		
		for (let win of windows) {
			totalTabs += win.tabs.length;
			if (win.focused) {
				currentTabs = win.tabs.length;
			}
		}
		
		let tabCount = document.getElementById('tab-count');
		tabCount.textContent = `${currentTabs} / ${totalTabs} [${windows.length}]`;
		tabCount.setAttribute('title', 'tabs in current window / all tabs [number of windows]');
  });
}

/**
 * Builds the li for a given tab
 */
function buildListItemFromTab(tab) {
	let tabLink = document.createElement('li');
	tabLink.setAttribute('href', tab.id);
	tabLink.classList.add('switch-tabs');
	if (tab.active) {
		tabLink.classList.add('active');
	}
	
	let tabImg = document.createElement('img');
	tabImg.onerror = () => {
		tabImg.classList.add('invisible');
	}
	tabImg.setAttribute('href', tab.id);
	tabImg.classList.add('switch-tabs');
	tabImg.src = tab.favIconUrl;

	let tabContent = document.createElement('span');
	tabContent.setAttribute('href', tab.id);
	tabContent.classList.add('switch-tabs');
	tabContent.textContent = tab.title || tab.url;
	if (tab.discarded) {
		tabContent.classList.add('discarded');
	}
	
	let tabDel = document.createElement('div');
	tabDel.setAttribute('href', tab.id);
	tabDel.classList.add('delete-btn');
	
	tabLink.append(tabImg);
	tabLink.append(tabContent);
	tabLink.append(tabDel);
	
	return tabLink;
}

/**
 * Scroll to the active tab
 */
function ScrollToActiveTab(tabsList) {
	let activeTab = tabsList.getElementsByClassName("active")[0];
	if (activeTab) {
		activeTab.scrollIntoView();
	}
}

/**
 * lists all the tabs in the active window
 */
function checkSearch(tab) {
	let searchVal;
	switch(searchBy) {
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
	
	return search === '' || searchVal.toLowerCase().includes(search.toLowerCase());
}
function listAllTabs(scrollToActiveTab) {
	getTabs().then((tabs) => {
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let tab of tabs) {
			if (checkSearch(tab)) {
				tabsList.appendChild(buildListItemFromTab(tab));
			}
		}
		
		let deleteAll = document.getElementById('delete-all-btn');
		if (tabsList.childElementCount === 0) {
			deleteAll.classList.add('disabled');
		}
		else {
			deleteAll.classList.remove('disabled');
		}

		if (scrollToActiveTab) {
			ScrollToActiveTab(tabsList);
		}
	});
}

/**
 * lists the duplicate tabs in the active window
 */
function checkDup(duplicates, tab) {
	let searchVal;
	switch(findDups) {
		case "name":
			searchVal = tab.title;
			break;
		case "url":
			searchVal = tab.url;
			break;
		case "both":
			searchVal = `${tab.title}|${tab.url}`;
			break;
	}
	
	if (searchVal in duplicates) {
		duplicates[searchVal] = duplicates[searchVal].concat(tab);
	}
	else {
		duplicates[searchVal] = [tab];
	}
}
function listDuplicateTabs(scrollToActiveTab) {
	getTabs().then((tabs) => {
		let duplicates = {};
		
		for (let tab of tabs) {
			checkDup(duplicates, tab);
		}
		
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let key in duplicates) {
			let tabs = duplicates[key];
			
			if (tabs.length > 1) {
				for (let tab of tabs) {
					tabsList.appendChild(buildListItemFromTab(tab));
				}
			}
		}

		let clearDuplicates = document.getElementById('clear-duplicates');
		if (tabsList.childElementCount === 0) {
			clearDuplicates.classList.add('disabled');
		}
		else {
			clearDuplicates.classList.remove('disabled');
		}

		if (scrollToActiveTab) {
			ScrollToActiveTab(tabsList);
		}
	});
}

/**
 * Close duplicate tab(s)
 */
async function closeDuplicateTabs() {
	let tabs = await getTabs();
	
	let duplicates = {};
	for (let tab of tabs) {
		checkDup(duplicates, tab);
	}
	
	let tabIds = [];
	for (let key in duplicates) {
		let tabs = duplicates[key];
		
		if (tabs.length > 1) {
			for (let [index, tab] of tabs.entries()) {
				if (index < tabs.length - 1) {
					tabIds.push(tab.id);
				}
			}
		}
	}

	await closeTab(tabIds);
}

function init () {
	document.getElementById('search-input').addEventListener("input", (e) => {
		search = e.target.value;
		listAllTabs();
	});

	let promiseTextSize = browser.storage.local.get("textSize");
	let promiseFindDups = browser.storage.local.get("findDups");
	let promiseSearchBy = browser.storage.local.get("searchBy");
	let promisePopupWidth = browser.storage.local.get("popupWidth");
	let promiseDefaultTab = browser.storage.local.get("defaultTab");

	Promise.all([promiseTextSize, promiseFindDups, promiseSearchBy, promisePopupWidth, promiseDefaultTab]).then((values) => {
		let textSize = values[0].textSize ?? "small";
		document.getElementById('tabs-list').classList.add(textSize);

		findDups = values[1].findDups ?? "both";

		searchBy = values[2].searchBy ?? "both";

		let popupWidth = values[3].popupWidth ?? "normal";
		document.body.classList.add(popupWidth);

		let defaultTab = values[4].defaultTab ?? TABS_ALL;
		makeTabActive(defaultTab);
		updateTabCount();
		reloadTabList(true);
	});
}
document.addEventListener("DOMContentLoaded", init);

document.addEventListener("click", async (e) => {
	e.preventDefault();

	if (e.target.id === "tabs-all" && currentState !== TABS_ALL) {
		browser.storage.local.set({ 'defaultTab': TABS_ALL });
		makeTabActive(TABS_ALL);
		reloadTabList(true);
	}
	else if (e.target.id === "tabs-duplicate" && currentState !== TABS_DUPLICATE) {
		browser.storage.local.set({ 'defaultTab': TABS_DUPLICATE });
		makeTabActive(TABS_DUPLICATE);
		reloadTabList(true);
	}
	
	else if (e.target.classList.contains('switch-tabs')) {
		var tabId = +e.target.getAttribute('href');
		
		await switchTab(tabId);
		reloadTabList();
	}
	
	else if (e.target.classList.contains('delete-btn')) {
		var tabId = +e.target.getAttribute('href');
		
		await closeTab(tabId);
		reloadTabList();
	}

	else if (e.target.id === "clear-duplicates" && !e.target.classList.contains('disabled')) {
		await closeDuplicateTabs();
		reloadTabList();
	}

	else if (e.target.id === "delete-all-btn" && !e.target.classList.contains('disabled')) {
		const confirmDialog = document.getElementById("confirm-dialog");
		confirmDialog.showModal();
	}
	else if (e.target.id === "confirm-btn") {
		await closeAllTabs();
		reloadTabList();
		
		const confirmDialog = document.getElementById("confirm-dialog");
		confirmDialog.close();
	}
	else if (e.target.id === "cancel-btn") {
		const confirmDialog = document.getElementById("confirm-dialog");
		confirmDialog.close();
	}
});