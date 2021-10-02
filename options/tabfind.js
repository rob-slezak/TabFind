function init() {
	browser.storage.local.get("textSize").then((result) => {

		let options = document.getElementsByName("textSize");
		let selectedOption = 12;
		for (let opt of options) {
			if (opt.value === result.textSize) {
				opt.checked = true;
			}
		}
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

document.addEventListener("DOMContentLoaded", init);

let options = document.getElementsByName("textSize");
for (let opt of options) {
	opt.addEventListener("change", saveTextSize);
}