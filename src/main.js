import './styles.scss';
import { injectHTML, waitForElement, getSetting, setSetting, makeToast } from './utils.js';
import { schemePresets } from './scheme-presets.js';
import { initSettingMenu } from './settings.js';

let pluginPath;
const loadFile = async (path) => {
	let fullPath = pluginPath + '/' + path;
	fullPath = fullPath.replace(/\\/g, '/');
    return await betterncm.fs.readFileText(fullPath);
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

const setHref = (id, href) => {
	const dom = document.getElementById(id);
	if (!dom) {
		return;
	}
	if (dom.href != href) {
		dom.href = href;
	}
}

const overrideNCMCSS = (mutated) => {
	if (mutated == 'pri-skin-gride') {
		setHref(
			'pri-skin-gride',
			window.mdThemeType == 'dark' ? 'orpheus://skin/default/default/web/css/skin.ls.css' : 'orpheus://skin/default/red/web/css/skin.ls.css'
		);
	} else if (mutated == 'skin_default') {
		if (document.getElementById('skin_fullscreen').href.endsWith(".css")) {
			return;
		}
		setHref(
			'skin_default',
			window.mdThemeType == 'dark' ? 'orpheus://orpheus/style/res/less/default/css/skin.ls.css' : 'orpheus://orpheus/pub/app.html'
		);
	}
}

export const applyScheme = (scheme) => {
	if (!schemePresets[scheme]) {
		scheme = 'dark-blue';
	}

	const preset = schemePresets[scheme];

	preset['secondary'] ??= preset['primary'];

	if (preset['light']) {
		preset['grey-base'] ??= [0, 0, 0];
		window.mdThemeType = 'light';
	} else {
		preset['grey-base'] ??= [255, 255, 255];
		window.mdThemeType = 'dark';
	}
	for (const name in preset) {
		if (name == 'light') {
			continue;
		}
		updateAccentColor(preset[name], name);
	}
	overrideNCMCSS('pri-skin-gride');
	overrideNCMCSS('skin_default');
}

const initSettings = () => {	
	applyScheme(getSetting('scheme', 'dark-blue'));

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

const updateGreeting = () => {
	const timeSegments = [
		[0, 3, '夜深了'],
		[3, 6, '凌晨好'],
		[6, 12, '早上好'],
		[12, 18, '下午好'],
		[18, 23, '晚上好'],
		[23, 24, '夜深了']
	];
	const now = new Date();
	const hour = now.getHours();
	for (const segment of timeSegments) {
		if (hour >= segment[0] && hour < segment[1]) {
			document.body.style.setProperty('--md-greeting', `'${segment[2]}'`);
			break;
		}
	}
}


const isPlaylistSpecial = (dom) => {
	if (dom.querySelector(".date .day")) {
		return true;
	}
	const title = dom.querySelector('.desc a *')?.innerText;
	if (!title) return false;
	if (dom.classList.contains('processed')) {
		return true;
	}
	if (title.endsWith("私人雷达")) {
		return true;
	}
	if (title.match(/^\[(.*?)\] /)) {
		return true;
	}
	return false;
}
const processPlaylistTitles = () => {
	const items = document.querySelectorAll('.md-today-recommend li');
	for (let item of items) {
		if (item.classList.contains('processed')) {
			continue;
		}
		const title = item.querySelector('.desc a *');
		if (!title) continue;
		if (title.innerText.endsWith('私人雷达')) {
			const subtitle = (title.innerText.match(/《(.*?)》/) ?? ['', '根据听歌记录为你打造'])[1];
			title.innerHTML = '私人雷达';
			title.insertAdjacentHTML('afterend', `<div class="subtitle">${subtitle}</div>`);
			item.classList.add('processed');
		}
		if (title && title.innerText.match(/^\[(.*?)\] /)) {
			title.innerHTML = title.innerText.match(/^\[(.*?)\] /)[1];
			item.classList.add('processed');
		}
	}
}
const playlistMovetoSpecific = (dom) => {
	const recommendBox = document.querySelector(".md-today-recommend");

	const link = dom.querySelector('a.lnk').href;
	for (const item of recommendBox.querySelectorAll('li')) {
		if (item.querySelector('a.lnk').href == link) {
			dom.remove();
			return;
		}
	}

	const playBtn = dom.querySelector('.ply');
	dom.appendChild(playBtn);

	recommendBox.appendChild(dom);
}
const playlistMovetoNormal = (dom) => {
	const listBox = document.querySelector('.g-mn .p-recmd .m-list-recmd[data-nej-selector="__nPlaylistBox"]');

	const link = dom.querySelector('a.lnk').href;
	for (const item of listBox.querySelectorAll('li')) {
		if (item.querySelector('a.lnk').href == link) {
			dom.remove();
			return;
		}
	}

	const playBtn = dom.querySelector('.ply');
	dom.querySelector('.cvr').appendChild(playBtn);

	listBox.appendChild(dom);
}
const updateRecommendPlaylists = () => {
	const listBox = document.querySelector('.g-mn .p-recmd .m-list-recmd[data-nej-selector="__nPlaylistBox"]');
	let pos = 0;
	while (pos < listBox.children.length) {
		const item = listBox.children[pos];
		if (isPlaylistSpecial(item)) {
			playlistMovetoSpecific(item);
		} else {
			pos++;
		}
	}
	processPlaylistTitles();

	const recommendBox = document.querySelector(".md-today-recommend");
	pos = 0;
	while (pos < recommendBox.children.length) {
		const item = recommendBox.children[pos];
		if (!isPlaylistSpecial(item)) {
			playlistMovetoNormal(item);
		} else {
			pos++;
		}
	}	
}
const initRecommendPlaylists = () => {
	const container = document.querySelector('.g-mn .p-recmd:not(.patched)');
	if (!container) {
		return;
	}

	const bannerBox = container.querySelector('.g-mn .p-recmd .m-banner');

	const recommendBox = document.createElement('div');
	recommendBox.classList.add('md-today-recommend');
	bannerBox.parentNode.insertBefore(recommendBox, bannerBox.nextSibling);

	container.classList.add('patched');
	if (window.initRecommendPlaylistsInterval) {
		clearInterval(window.initRecommendPlaylistsInterval);
	}
	updateRecommendPlaylists();
}
const removeRedundantPlaylists = () => {
	const listBox = document.querySelector('.g-mn .p-recmd .m-list-recmd[data-nej-selector="__nPlaylistBox"]');
	if (!listBox) {
		return;
	}
	updateRecommendPlaylists();
}

let lastPlaylistTitle = "";
const titleSizeController = document.createElement('style');
titleSizeController.innerHTML = '';
document.head.appendChild(titleSizeController);
const recalculateTitleSize = (forceRefresh = false) => {
	const title = document.querySelector('.g-mn .m-info .tit .name h2 .f-ust');
	if (!title) {
		return;
	}
	if (title.innerText === lastPlaylistTitle && !forceRefresh) {
		return;
	}
	lastPlaylistTitle = title.innerText;
	const text = title.innerText;
	const testDiv = document.createElement('div');
	testDiv.style.position = 'absolute';
	testDiv.style.top = '-9999px';
	testDiv.style.left = '-9999px';
	testDiv.style.width = 'auto';
	testDiv.style.height = 'auto';
	testDiv.style.whiteSpace = 'nowrap';
	testDiv.innerText = text;
	document.body.appendChild(testDiv);

	const maxThreshold = 80;
	const minThreshold = 24;
	const targetWidth = document.querySelector('.g-mn .m-info .tit .name').clientWidth - 30;

	let l = 1, r = 61;
	while (l < r) {
		const mid = Math.floor((l + r) / 2);
		testDiv.style.fontSize = `${mid}px`;
		const width = testDiv.clientWidth;
		if (width > targetWidth) {
			r = mid;
		} else {
			l = mid + 1;
		}
	}
	let fontSize = l - 1;
	fontSize = Math.max(Math.min(fontSize, maxThreshold), minThreshold);
	document.body.removeChild(testDiv);
	titleSizeController.innerHTML = `
		.g-mn .m-info .tit .name h2 {
			font-size: ${fontSize}px !important;
		}
	`;
}

const scrollToCurrentPlaying = () => {
	const currentPlaying = document.querySelector('.m-plylist .itm.z-play') ?? document.querySelector('.m-plylist .itm.z-pause');
	if (!currentPlaying) {
		makeToast(`
			<i class="icon u-icn u-icn-operatefail"></i>
			<span class="u-tit f-ff2 errTxt">定位失败</span>`);
		return;
	}
	const currentPlayingIndex =
		Array.from(currentPlaying.parentNode.parentNode.children).indexOf(currentPlaying.parentNode) * 20 +
		Array.from(currentPlaying.parentNode.children).indexOf(currentPlaying) + 1;
	const currentPlayingOffset = 
		document.querySelector('.m-plylist ul').offsetTop -
		(document.documentElement.clientHeight / 2) +
		currentPlayingIndex * 50 + 100;
	document.querySelector('.g-mn').scrollTo(0, currentPlayingOffset);
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

	// Greeting and two recomment playlists
	setInterval(() => {
		updateGreeting();
	}, 30000);
	updateGreeting();
	waitForElement('.g-mn', (dom) => {
		new MutationObserver(() => {
			initRecommendPlaylists();
			removeRedundantPlaylists();
		}).observe(dom, { childList: true, subtree: true });
		window.initRecommendPlaylistsInterval = setInterval(() => {
			initRecommendPlaylists();
		}, 100);
	});


	waitForElement('.g-mn', (dom) => {
		new MutationObserver(() => {
			// action buttons innerText to css property
			const buttons = document.querySelectorAll('.u-ibtn5');
			for (let button of buttons) {
				button.style.setProperty('--text', `'${button.innerText}'`);
			}
			
			// playlist title size recalculation
			recalculateTitleSize();

			// add custom jump to playing button
			if (document.querySelector('.u-playinglocation')) {
				if (!document.querySelector('.u-playinglocation + .u-playinglocation')) {
					const button = document.createElement('button');
					button.classList.add('u-playinglocation');
					button.classList.add('j-flag');
					button.innerHTML = '<svg><use xlink:href="orpheus://orpheus/style/res/svg/icon.sp.svg#playinglocation"></use></svg>';
					button.addEventListener('click', () => {
						scrollToCurrentPlaying();
					});
					document.querySelector('.u-playinglocation').after(button);
				}
			}
		}).observe(dom, { childList: true, subtree: true });
	});
	window.addEventListener('resize', () => {
		recalculateTitleSize();
	});

	// observer theme change
	new MutationObserver(() => { overrideNCMCSS('pri-skin-gride'); }).observe(document.getElementById('pri-skin-gride'), { attributes: true });
	new MutationObserver(() => { overrideNCMCSS('skin_default'); }).observe(document.getElementById('skin_default'), { attributes: true });

	// init setting menu
	waitForElement('header .m-tool .user', (dom) => {
		initSettingMenu();
	});

	// Fix playlist scroll
	waitForElement('.g-mn', (dom) => {
		const listScrollVisibilityController = document.createElement('style');
		listScrollVisibilityController.innerHTML = '';
		document.head.appendChild(listScrollVisibilityController);
		dom.addEventListener('scroll', () => {
			const listContainer = document.querySelector('.m-plylist-pl2 ul .lst');
			if (!listContainer) {
				listScrollVisibilityController.innerHTML = '';
				return;
			}
			const topOfList = Math.max(-(listContainer.getBoundingClientRect().top - 60), 0);
			const listLength = listContainer.childElementCount;
			const currentVisibleChild = Math.floor(topOfList / 1000) + 1;
			const l = Math.max(currentVisibleChild - 2, 1), r = Math.min(currentVisibleChild + 2, listLength);
			let css = `.m-plylist-pl2 ul .lst {
				padding-top: ${(l - 1) * 1000}px !important;
				padding-bottom: ${(listLength - r) * 1000}px !important;
				counter-reset: tlistorder ${(l - 1) * 20} !important;
			}`;
			for (let i = 1; i <= l - 1; i++) {
				css += `.m-plylist-pl2 ul .lst > div:nth-child(${i}) { display: none !important; }`;
			}
			for (let i = r + 1; i <= listLength; i++) {
				css += `.m-plylist-pl2 ul .lst > div:nth-child(${i}) { display: none !important; }`;
			}
			if (listScrollVisibilityController.innerHTML != css) {
				listScrollVisibilityController.innerHTML = css;
			}
		});
	});

	// Fix toolbar button offset
	waitForElement('.g-sd', (dom) => {
		const toolbarLeftPart = document.querySelector('header.g-hd .m-leftbox');
		new MutationObserver(() => {
			toolbarLeftPart.style.setProperty('--offset', `${parseInt(dom.style?.width ?? 199) - 199}px`);
		}).observe(dom, { attributes: true, attributeFilter: ['style'] });
		toolbarLeftPart.style.setProperty('--offset', `${parseInt(dom.style?.width ?? 199) - 199}px`);
	});
});

plugin.onConfig((tools) => {
	return dom("div", {},
		dom("span", { innerHTML: "打开设置面板 " , style: { fontSize: "18px" } }),
		tools.makeBtn("打开", async () => {
			document.querySelector("#md-theme-setting-btn:not(.active)").click();
		})
	);
});