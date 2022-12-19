import './styles.scss';

let pluginPath;
const loadFile = async (path) => {
	let fullPath = pluginPath + '/' + path;
	fullPath = fullPath.replace(/\\/g, '/');
    return await betterncm.fs.readFileText(fullPath);
}

const injectCSS = (css) => {
	const style = document.createElement('style');
	style.innerHTML = css;
	document.head.appendChild(style);
}
const injectHTML = (type, html, parent, fun = (dom) => {}) => {
	const dom = document.createElement(type);
	dom.innerHTML = html;
	fun.call(this, dom);

	parent.appendChild(dom);
	return dom;
}
var loadedJs = {};
const loadJsOnce = async (path) => {
	if (loadedJs[path]) {
		return;
	}
	loadedJs[path] = true;
	const js = await loadFile(path);
	const script = document.createElement('script');
	script.innerHTML = js;
	document.body.appendChild(script);
}
const waitForElement = (selector, fun) => {
	selector = selector.split(',');
	let done = true;
	let interval = setInterval(() => {
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

const getSetting = (option, defaultValue = '') => {
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
const setSetting = (option, value) => {
	option = "material-you-theme-" + option;
	localStorage.setItem(option, value);
}
const addOrRemoveGlobalClassByOption = (className, optionValue) => {
	if (optionValue) {
		document.body.classList.add(className);
	} else {
		document.body.classList.remove(className);
	}
}

const updateAccentColor = ([r, g, b], name = '') => {
	if (name == '' || name == 'primary') {
		name = '--md-accent-color';
	} else {
		name = '--md-accent-color-' + name;
	}
	document.body.style.setProperty(name, `rgb(${r}, ${g}, ${b})`);
	document.body.style.setProperty(name + '-rgb', `${r}, ${g}, ${b}`);
}

const accentColorPresets = {
	'dark-blue': {
		'primary': [189, 230, 251],
		'bg': [30, 37, 41],
		'bg-darken': [23, 29, 32]
	}
}

const initSettings = () => {
	const scheme = getSetting('scheme', 'dark-blue');
	if (!accentColorPresets[scheme]) {
		scheme = 'dark-blue';
	}
	const preset = accentColorPresets[scheme];
	for (const name in preset) {
		updateAccentColor(preset[name], name);
	}

	addOrRemoveGlobalClassByOption('ignore-now-playing', getSetting('ignore-now-playing', true));
	document.body.style.setProperty('--bottombar-height', `${getSetting('bottombar-height', 90)}px`);
	
	window.timeIndicator = getSetting('time-indicator', 'remain');
}
const addPrefixZero = (num, len) => {
	num = num.toString();
	while (num.length < len) {
		num = '0' + num;
	}
	return num;
}
const timeToSeconds = (time) => {
	let seconds = 0;
	const parts = time.split(':');
	for (let i = 0; i < parts.length; i++) {
		seconds += parseInt(parts[i]) * Math.pow(60, parts.length - i - 1);
	}
	return seconds;
}
const secondsToTime = (seconds) => {
	const m = Math.floor(seconds / 60);
	const s = Math.floor(seconds % 60);
	return `${m}:${addPrefixZero(s, 2)}`;
}


const updateTimeIndicator = () => {
	const passed = document.querySelector('#time-passed');
	const rest = document.querySelector('#time-rest');

	const passedTime = timeToSeconds(document.querySelector('time.now').innerText);
	const totalTime = timeToSeconds(document.querySelector('time.all').innerText);
	const remainTime = totalTime - passedTime;

	passed.innerText = secondsToTime(passedTime);
	rest.innerText = window.timeIndicator == 'remain' ? '-' + secondsToTime(remainTime) : secondsToTime(totalTime);
}
const updateTimeIndicatorPosition = () => {
	const selectorList = ['.brt', '.speed', '.audioEffect', '.spk'];
	let leftestButton;
	for (const selector of selectorList) {
		leftestButton = document.querySelector('.m-player ' + selector);
		if (!leftestButton) {
			continue;
		}
		if (leftestButton.childElementCount != 0) {
			break;
		}
	}
	const right = parseInt(window.getComputedStyle(leftestButton).right) + leftestButton.clientWidth + 10;
	document.querySelector('#time-indicator').style.right = right + 'px';
}



plugin.onLoad(async (p) => {
	pluginPath = p.pluginPath;

	initSettings();

	// Alternative time indicator
	waitForElement('#main-player', (dom) => {
		injectHTML('div', `
			<span id="time-passed">0:00</span>
			/
			<span id="time-rest">0:00</span>
		`, dom, (dom) => {
			dom.id = 'time-indicator';
			dom.style = 'opacity: 0';
		});
		document.querySelector('#time-rest').addEventListener('click', () => {
			if ((window.timeIndicator ?? 'remain') == 'remain') {
				window.timeIndicator = 'total';
			} else {
				window.timeIndicator = 'remain';
			}
			setSetting('time-indicator', window.timeIndicator);
			updateTimeIndicator();
			updateTimeIndicatorPosition();
		});

		new MutationObserver((mutations) => {
			updateTimeIndicator();
		}).observe(document.querySelector('time.now'), { childList: true });
		new MutationObserver(() => {
			updateTimeIndicatorPosition();
		}).observe(document.querySelector('#main-player .brt'), { childList: true });
		
		new MutationObserver(() => {
			updateTimeIndicatorPosition();
		}).observe(document.querySelector('#main-player .speed'), { childList: true });
	});
});

plugin.onConfig((tools) => {
	return dom("div", {},
		dom("span", { innerHTML: "TODO" , style: { fontSize: "18px" } }),
	);
});