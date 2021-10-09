const TABS_ALL = 0;
const TABS_DUPLICATE = 1;
const TABS_SEARCH = 2;

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
 * Reload tab list
 */
function reloadTabList(scrollToActiveTab = false) {
	switch (currentState) {
		case TABS_ALL:
			listAllTabs(scrollToActiveTab);
			break;
		case TABS_DUPLICATE:
			listDuplicateTabs(scrollToActiveTab);
			break;
		case TABS_SEARCH:
			listSearchTabs(scrollToActiveTab);
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
	let tabSearch = document.getElementById('tabs-search');

	let searchInput = document.getElementById('search-input');
	let tabList = document.getElementById('tabs-list');
	
	tabAll.classList.remove('active');
	tabDuplicate.classList.remove('active');
	tabSearch.classList.remove('active');
	
	switch (tab) {
		case TABS_ALL:
			tabAll.classList.add('active');
			searchInput.classList.add('hidden');
			tabList.classList.add('no-search');
			break;
		case TABS_DUPLICATE:
			tabDuplicate.classList.add('active');
			searchInput.classList.add('hidden');
			tabList.classList.add('no-search');
			break;
		case TABS_SEARCH:
			tabSearch.classList.add('active');
			searchInput.classList.remove('hidden');
			tabList.classList.remove('no-search');
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
	activeTab.scrollIntoView();
}

/**
 * lists all the tabs in the active window
 */
function listAllTabs(scrollToActiveTab) {
	getTabs().then((tabs) => {
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let tab of tabs) {
			tabsList.appendChild(buildListItemFromTab(tab));
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
		
		let keys = Object.keys(duplicates);
		for (let key of keys) {
			let tabs = duplicates[key];
			
			if (tabs.length > 1) {
				for (let tab of tabs) {
					tabsList.appendChild(buildListItemFromTab(tab));
				}
			}
		}

		if (scrollToActiveTab) {
			ScrollToActiveTab(tabsList);
		}
	});
}

/**
 * lists the tabs in the active window with a search box
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
			searchVal = `${tab.title}|${tab.url}`;
			break;
	}
	
	return search === '' || searchVal.toLowerCase().includes(search.toLowerCase());
}
function listSearchTabs(scrollToActiveTab) {
	getTabs().then((tabs) => {
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let tab of tabs) {
			if (checkSearch(tab)) {
				tabsList.appendChild(buildListItemFromTab(tab));
			}
		}
		
		if (scrollToActiveTab) {
			ScrollToActiveTab(tabsList);
		}
	});
}

function init () {
	document.getElementById('search-input').addEventListener("input", (e) => {
		search = e.target.value;
		listSearchTabs();
	});

	let promiseTextSize = browser.storage.local.get("textSize");
	let promiseFindDups = browser.storage.local.get("findDups");
	let promiseSearchBy = browser.storage.local.get("searchBy");
	let promisePopupWidth = browser.storage.local.get("popupWidth");

	Promise.all([promiseTextSize, promiseFindDups, promiseSearchBy, promisePopupWidth]).then((values) => {
		let textSize = values[0].textSize ?? "small";
		document.getElementById('tabs-list').classList.add(textSize);

		findDups = values[1].findDups ?? "both";

		searchBy = values[2].searchBy ?? "both";

		let popupWidth = values[3].popupWidth ?? "normal";
		document.body.classList.add(popupWidth);

		makeTabActive(TABS_ALL);
		updateTabCount();
		reloadTabList(true);
	});
}
document.addEventListener("DOMContentLoaded", init);

document.addEventListener("click", async (e) => {
	e.preventDefault();

	if (e.target.id === "tabs-all" && currentState !== TABS_ALL) {
		makeTabActive(TABS_ALL);
		reloadTabList(true);
	}
	else if (e.target.id === "tabs-duplicate" && currentState !== TABS_DUPLICATE) {
		makeTabActive(TABS_DUPLICATE);
		reloadTabList(true);
	}
	else if (e.target.id === "tabs-search" && currentState !== TABS_SEARCH) {
		makeTabActive(TABS_SEARCH);
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
});