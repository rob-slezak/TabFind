function retrieveOptions() {
	// get textSize
	browser.storage.local.get("textSize").then((result) => {
		let options = document.getElementsByName("textSize");
		let selectedOption = result.textSize ?? "small";
		for (let opt of options) {
			if (opt.value === selectedOption) {
				opt.checked = true;
			}
		}
	});

	// get badgeColor
	browser.storage.local.get("badgeColor").then((result) => {
		let opt = document.getElementById("badgeColor");
		opt.value = result.badgeColor ?? '#8a2be2';
	});
	
	// get findDups
	browser.storage.local.get("findDups").then((result) => {
		let options = document.getElementsByName("findDups");
		let selectedOption = result.findDups ?? 'both';
		for (let opt of options) {
			if (opt.value === selectedOption) {
				opt.checked = true;
			}
		}
	});

	// get searchBy
	browser.storage.local.get("searchBy").then((result) => {
		let options = document.getElementsByName("searchBy");
		let selectedOption = result.searchBy ?? 'both';
		for (let opt of options) {
			if (opt.value === selectedOption) {
				opt.checked = true;
			}
		}
	});
}

function saveRadioButtons(optionName, defaultValue) {
	let options = document.getElementsByName(optionName);
	let selectedOption = defaultValue;
	for (let opt of options) {
		if (opt.checked) {
			selectedOption = opt.value;
		}
	}
	browser.storage.local.set({ [optionName]: selectedOption });
}

function saveTextSize(e) {
	e.preventDefault();
	saveRadioButtons("textSize", "small");
}

function saveBadgeColor(e) {
	e.preventDefault();

	let selectedOption = document.getElementById("badgeColor").value;
	browser.storage.local.set({ badgeColor: selectedOption });
}

function saveFindDups(e) {
	e.preventDefault();
	saveRadioButtons("findDups", "both");
}

function saveSearchBy(e) {
	e.preventDefault();
	saveRadioButtons("searchBy", "both");
}

function init() {
	let options;
	
	document.addEventListener("DOMContentLoaded", retrieveOptions);
	
	// event listeners for textSize
	options = document.getElementsByName("textSize");
	for (let opt of options) {
		opt.addEventListener("change", saveTextSize);
	}

	// event listeners for badgeColor
	document.getElementById("badgeColor").addEventListener("input", saveBadgeColor);

	// event listeners for findDups
	options = document.getElementsByName("findDups");
	for (let opt of options) {
		opt.addEventListener("change", saveFindDups);
	}

	// event listeners for searchBy
	options = document.getElementsByName("searchBy");
	for (let opt of options) {
		opt.addEventListener("change", saveSearchBy);
	}
}

init();