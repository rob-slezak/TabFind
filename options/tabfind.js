function retrieveOptions() {
	// get textSize
	browser.storage.local.get("textSize").then((result) => {
		let options = document.getElementsByName("textSize");
		let selectedOption = result.textSize ?? 12;
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
}

function saveTextSize(e) {
	e.preventDefault();

	let options = document.getElementsByName("textSize");
	let selectedOption = 12;
	for (let opt of options) {
		if (opt.checked) {
			selectedOption = opt.value;
		}
	}
	
	browser.storage.local.set({ textSize: selectedOption });
}

function saveBadgeColor(e) {
	e.preventDefault();

	let selectedOption = document.getElementById("badgeColor").value;
	browser.storage.local.set({ badgeColor: selectedOption });
}

function init() {
	document.addEventListener("DOMContentLoaded", retrieveOptions);

	let options = document.getElementsByName("textSize");
	for (let opt of options) {
		opt.addEventListener("change", saveTextSize);
	}

	document.getElementById("badgeColor").addEventListener("input", saveBadgeColor);
}

init();