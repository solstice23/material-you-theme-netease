export const injectCSS = (css) => {
	const style = document.createElement('style');
	style.innerHTML = css;
	document.head.appendChild(style);
}
export const injectHTML = (type, html, parent, fun = (dom) => {}) => {
	const dom = document.createElement(type);
	dom.innerHTML = html;
	fun.call(this, dom);

	parent.appendChild(dom);
	return dom;
}
export const waitForElement = (selector, fun) => {
	selector = selector.split(',');
	let done = true;
	for (const s of selector) {
		if (!document.querySelector(s)) {
			done = false;
		}
	}
	if (done) {
		for (const s of selector) {
			fun.call(this, document.querySelector(s));
		}
		return;
	}
	let interval = setInterval(() => {
		let done = true;
		for (const s of selector) {
			if (!document.querySelector(s)) {
				done = false;
			}
		}
		if (done) {
			clearInterval(interval);
			for (const s of selector) {
				fun.call(this, document.querySelector(s));
			}
		}
	}, 100);
}
export const waitForElementAsync = async (selector) => {
	if (document.querySelector(selector)) {
		return document.querySelector(selector);
	}
	return await betterncm.utils.waitForElement(selector);
}
export const getSetting = (option, defaultValue = '') => {
	option = "material-you-theme-" + option;
	let value = localStorage.getItem(option);
	if (!value) {
		value = defaultValue;
	}
	if (value === 'true') {
		value = true;
	} else if (value === 'false') {
		value = false;
	}
	return value;
}
export const setSetting = (option, value) => {
	option = "material-you-theme-" + option;
	localStorage.setItem(option, value);
}
export const makeToast = (html, duration = 1000) => {
	let noIntroAnimation = false;
	if (document.querySelector('.md-toast')) {
		noIntroAnimation = true;
		document.querySelector('.md-toast').remove();
	}
	const toast = document.createElement('div');
	toast.classList.add('md-toast');
	toast.classList.add('u-result');
	toast.classList.add('j-tips');
	toast.innerHTML = `
		<div class="wrap">
			<div class="inner j-flag" style="${ noIntroAnimation ? 'animation-duration: 0s;' : ''}">
				${html}
			</div>
		</div>
	`;
	document.body.appendChild(toast);
	setTimeout(() => {
		toast.classList.add('z-hide');
		toast.querySelector('.inner').style = '';
	}, duration);
	setTimeout(() => {
		document.body.removeChild(toast);
	}, duration + 500);
}
export const chunk = (input, size) => {
	return input.reduce((arr, item, idx) => {
		return idx % size === 0
			? [...arr, [item]]
			: [...arr.slice(0, -1), [...arr.slice(-1)[0], item]];
	}, []);
};