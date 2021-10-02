const TABS_ALL = 0;
const TABS_DUPLICATE = 1;
const TABS_SEARCH = 2;
var currentState;
var search = '';

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
	browser.tabs.update(tabId, { active: true });
}

/**
 * Close the given tab
 */
async function closeTab(tabId) {
	browser.tabs.remove(tabId);
}

/**
 * Reload tab list
 */
function reloadTabList() {
	switch (currentState) {
		case TABS_ALL:
			listAllTabs();
			break;
		case TABS_DUPLICATE:
			listDuplicateTabs();
			break;
		case TABS_SEARCH:
			listSearchTabs();
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
			tabList.classList.add('larger');
			break;
		case TABS_DUPLICATE:
			tabDuplicate.classList.add('active');
			searchInput.classList.add('hidden');
			tabList.classList.add('larger');
			break;
		case TABS_SEARCH:
			tabSearch.classList.add('active');
			searchInput.classList.remove('hidden');
			tabList.classList.remove('larger');
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
function listAllTabs() {
	getTabs().then((tabs) => {
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let tab of tabs) {
			tabsList.appendChild(buildListItemFromTab(tab));
		}
		
		ScrollToActiveTab(tabsList);
	});
}

/**
 * lists the duplicate tabs in the active window
 */
function listDuplicateTabs() {
	getTabs().then((tabs) => {
		let duplicates = {};
		
		for (let tab of tabs) {
			if (tab.url in duplicates) {
				duplicates[tab.url] = duplicates[tab.url].concat(tab);
			}
			else {
				duplicates[tab.url] = [tab];
			}
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

		ScrollToActiveTab(tabsList);
	});
}

/**
 * lists the tabs in the active window with a search box
 */
function listSearchTabs() {
	getTabs().then((tabs) => {
		let tabsList = document.getElementById('tabs-list');
		tabsList.textContent = '';
		
		for (let tab of tabs) {
			if (search === '' || tab.title.toLowerCase().includes(search.toLowerCase())) {
				tabsList.appendChild(buildListItemFromTab(tab));
			}
		}

		ScrollToActiveTab(tabsList);
	});
}

function init () {
	makeTabActive(TABS_ALL);
	updateTabCount();
	listAllTabs();
	
	document.getElementById('search-input').addEventListener("input", (e) => {
		search = e.target.value;
		listSearchTabs();
	});
	
	// Retrieve text size from storage
	browser.storage.local.get("textSize").then((result) => {
		let textSize = result.textSize ?? 12;
		document.getElementById('tabs-list').style.fontSize = textSize + "px";
	});
}
document.addEventListener("DOMContentLoaded", init);

document.addEventListener("click", async (e) => {
	if (e.target.id === "tabs-all" && currentState !== TABS_ALL) {
		makeTabActive(TABS_ALL);
	}
	else if (e.target.id === "tabs-duplicate" && currentState !== TABS_DUPLICATE) {
		makeTabActive(TABS_DUPLICATE);
	}
	else if (e.target.id === "tabs-search" && currentState !== TABS_SEARCH) {
		makeTabActive(TABS_SEARCH);
	}
	
	else if (e.target.classList.contains('switch-tabs')) {
		var tabId = +e.target.getAttribute('href');
		
		await switchTab(tabId);
	}
	
	else if (e.target.classList.contains('delete-btn')) {
		var tabId = +e.target.getAttribute('href');
		
		await closeTab(tabId);
	}
	reloadTabList();
	
	e.preventDefault();
});