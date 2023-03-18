import './styles.scss';
import './dynamic-theme.scss'
import './refined-now-playing-accent-color-compatibility.scss'
import { injectHTML, waitForElement, waitForElementAsync, getSetting, setSetting, makeToast, chunk } from './utils.js';
import { argb2Rgb } from './color-utils.js';
import { schemePresets } from './scheme-presets.js';
import { initSettingMenu } from './settings.js';
import { themeFromSourceColor, QuantizerCelebi, Hct, Score, SchemeExpressive, SchemeVibrant, SchemeMonochrome, SchemeTonalSpot, SchemeNeutral, MaterialDynamicColors } from "../material-color-utilities/typescript/dist";
import { ListViewSwitcher } from './list-view-switcher.js';
import { TimeIndicator } from './time-indicator.js';

const migrateSettings = () => {
	if (getSetting('scheme') == 'dynamic-auto') {
		setSetting('scheme', 'dynamic-default-auto');
	}
}
migrateSettings();

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
const getCalculatedPrimaryColorBGRHEX = () => { // HEX (Blue Green Red)
	const color = window.getComputedStyle(document.body).getPropertyValue('--md-accent-color');
	const rgb = color.match(/\d+/g);
	const bgr = rgb.reverse();
	return bgr.map((v) => parseInt(v).toString(16).padStart(2, '0')).join('');
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
const updateNativeTheme = () => {
	if (window.mdThemeType == 'dark') {
		channel.call('app.loadSkinPackets', ()=>{}, ["default", "default", {btn_color: {h: 0, s: 89, l: 59}}]);
	} else {
		channel.call('app.loadSkinPackets', ()=>{}, ["default", "red", {btn_color: {h: 0, s: 89, l: 59}}]);
	}
}
// Hook context menu
const _channalCall = channel.call;
channel.call = (name, ...args) => {
	//console.log(name, args);
	if (name === 'winhelper.updateMenuItem') {
		const primary = `#ff${getCalculatedPrimaryColorBGRHEX()}`;
		args[1] = args[1].map((item) => {
			if (item.color) item.color = primary;
			return item;
		});
	} else if (name === 'winhelper.popupMenu') {
		const primary = `#ff${getCalculatedPrimaryColorBGRHEX()}`;
		let content = JSON.parse(args[1][0].content);
		//console.log(content);
		content = content.map((item) => {
			if (item.image_color) item.image_color = primary;
			return item;
		});
		args[1][0].content = JSON.stringify(content);
	}
	_channalCall(name, ...args);
};

export const applyScheme = (scheme) => {
	window.mdScheme = scheme;
	if (scheme.startsWith('dynamic')) {
		document.body.classList.add('md-dynamic-theme');
		document.body.classList.remove('md-dynamic-theme-light', 'md-dynamic-theme-dark', 'md-dynamic-theme-auto');
		const mode = scheme.split('-').slice(-1)[0];
		document.body.classList.add(`md-dynamic-theme-${mode}`);
		if (mode != 'auto') {
			window.mdThemeType = mode;
			overrideNCMCSS('pri-skin-gride');
			overrideNCMCSS('skin_default');
			updateNativeTheme();
		}
		window.mdScheme = scheme;
		updateDynamicTheme();
		return;
	} else {
		document.body.classList.remove('md-dynamic-theme');
	}

	let preset;
	if (scheme == 'custom') {
		preset = JSON.parse(getSetting('custom-scheme', JSON.stringify(schemePresets['dark-blue'])));
	} else {
		if (!schemePresets[scheme]) {
			scheme = 'dark-blue';
		}
		preset = schemePresets[scheme];
	}

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
	updateNativeTheme();
}

const initSettings = () => {
	applyScheme(getSetting('scheme', 'dynamic-default-auto'));

	addOrRemoveGlobalClassByOption('ignore-now-playing', getSetting('ignore-now-playing-page', false));
	addOrRemoveGlobalClassByOption('hide-ncm-logo', getSetting('hide-ncm-logo', false));
	addOrRemoveGlobalClassByOption('capsule-sidebar', getSetting('capsule-sidebar', false));
	addOrRemoveGlobalClassByOption('md-disable-new-ui', getSetting('disable-new-ui', false));
	addOrRemoveGlobalClassByOption('floating-bottombar', getSetting('floating-bottombar', false));
	addOrRemoveGlobalClassByOption('transparent-framework', getSetting('transparent-framework', false));
	document.body.style.setProperty('--bottombar-height', `${getSetting('bottombar-height', 90)}px`);
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
const updateDailyRecommendationDate = () => {
	const ele = document.querySelector('.u-cover-daily .date .day');
	if (!ele) return;
	const newDate = (new Date().getHours() < 8 ? new Date(Date.now() - 86400000) : new Date()).getDate();
	if (ele.innerText != newDate) {
		ele.innerText = newDate;
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
	const itemHeight = parseInt(getComputedStyle(document.querySelector('.m-plylist')).getPropertyValue('--item-height') || 50);
	const currentPlayingIndex =
		Array.from(currentPlaying.parentNode.parentNode.children).indexOf(currentPlaying.parentNode) * 20 +
		Array.from(currentPlaying.parentNode.children).indexOf(currentPlaying) + 1;
	const currentPlayingOffset = 
		document.querySelector('.m-plylist ul').offsetTop -
		(document.documentElement.clientHeight / 2) +
		currentPlayingIndex * itemHeight + 100;
	document.querySelector('.g-mn:not(.better-ncm-manager)').scrollTo(0, currentPlayingOffset);
}



export const getDynamicThemeColor = () => {
	const source = window.mdDynamicThemeColorSource ?? getSetting('dynamic-theme-color-source', 'cover');
	if (source == 'cover') {
		return window.mdCoverDominantColor;
	} else if (source == 'bg-enhanced') {
		return window.mdBGEnhancedDominantColor ?? window.mdCoverDominantColor;
	}
	else {
		const color = window.mdCostomDynamicThemeColor ?? JSON.parse(getSetting('custom-dynamic-theme-color', '[189, 230, 251]'));
		return (color[0] << 16 >>> 0) | (color[1] << 8 >>> 0) | color[2];
	}
}
export const getThemeCSSFromColor = (schemeName = null) => {
	let color = getDynamicThemeColor();
	if (!color) {
		return defaultDynamicColor;
	}
	if (!schemeName) {
		schemeName = window.mdScheme ?? 'dynamic-default-auto';
	}
	if (!schemeName.startsWith('dynamic-')) {
		return '';
	}
	schemeName = schemeName.replace(/^dynamic-/, '');
	schemeName = schemeName.replace(/-(light|dark|auto)$/, '');

	if (schemeName === 'default') {
		const theme = themeFromSourceColor(color);

		theme.schemes.light.bgDarken = (Hct.from(theme.palettes.neutral.hue, theme.palettes.neutral.chroma, 97.5)).toInt();
		theme.schemes.dark.bgDarken = (Hct.from(theme.palettes.neutral.hue, theme.palettes.neutral.chroma, 15)).toInt();

		let newCSSItems = {};
		const updateColor = (colorMode, key, name) => {
			const [r, g, b] = [...argb2Rgb(theme.schemes[colorMode][key])]
			newCSSItems[`--md-dynamic-${colorMode}-${name}`] = `rgb(${r}, ${g}, ${b})`;
			newCSSItems[`--md-dynamic-${colorMode}-${name}-rgb`] = `${r}, ${g}, ${b}`;
		}
		for (let colorMode of ['light', 'dark']) {
			updateColor(colorMode, 'primary', 'primary');
			updateColor(colorMode, 'secondary', 'secondary');
			updateColor(colorMode, 'inverseOnSurface', 'bg');
			updateColor(colorMode, 'bgDarken', 'bg-darken');
		}
		return newCSSItems;
	} else {
		const schemeGenerator = {
			'tonal-spot': SchemeTonalSpot,
			'vibrant': SchemeVibrant,
			'expressive': SchemeExpressive,
			'neutral': SchemeNeutral,
		};
		const dynamicScheme = {};
		dynamicScheme.light = new schemeGenerator[schemeName](
			Hct.fromInt(color),
			false,
			0.0
		);
		dynamicScheme.dark = new schemeGenerator[schemeName](
			Hct.fromInt(color),
			true,
			0.0
		);

		let newCSSItems = {};
		const updateColor = (colorMode, key, name) => {
			const [r, g, b] = [...argb2Rgb(MaterialDynamicColors[key].getArgb(dynamicScheme[colorMode]))];
			newCSSItems[`--md-dynamic-${colorMode}-${name}`] = `rgb(${r}, ${g}, ${b})`;
			newCSSItems[`--md-dynamic-${colorMode}-${name}-rgb`] = `${r}, ${g}, ${b}`;
		}
		for (let colorMode of ['light', 'dark']) {
			updateColor(colorMode, 'primary', 'primary');
			updateColor(colorMode, 'secondary', 'secondary');
			updateColor(colorMode, 'background', 'bg');
			updateColor(colorMode, 'surfaceSub2', 'bg-darken');
		}
		return newCSSItems;
	}
}
const dynamicColorController = document.createElement('style');
const defaultDynamicColor = {
	'--md-dynamic-light-primary': 'rgb(103, 80, 164)',
	'--md-dynamic-light-primary-rgb': '103, 80, 164',
	'--md-dynamic-light-secondary': 'rgb(98, 91, 113)',
	'--md-dynamic-light-secondary-rgb': '98, 91, 113',
	'--md-dynamic-light-bg': 'rgb(244, 239, 244)',
	'--md-dynamic-light-bg-rgb': '244, 239, 244',
	'--md-dynamic-light-bg-darken': 'rgb(251, 246, 251)',
	'--md-dynamic-light-bg-darken-rgb': '251, 246, 251',

	'--md-dynamic-dark-primary': 'rgb(208, 188, 255)',
	'--md-dynamic-dark-primary-rgb': '208, 188, 255',
	'--md-dynamic-dark-secondary': 'rgb(204, 194, 220)',
	'--md-dynamic-dark-secondary-rgb': '204, 194, 220',
	'--md-dynamic-dark-bg': 'rgb(49, 48, 51)',
	'--md-dynamic-dark-bg-rgb': '49, 48, 51',
	'--md-dynamic-dark-bg-darken': 'rgb(38, 37, 40)',
	'--md-dynamic-dark-bg-darken-rgb': '38, 37, 40',
};
document.head.appendChild(dynamicColorController);
export const updateDynamicTheme = () => {
	const CSSItems = getThemeCSSFromColor();
	let CSS = '';
	for (const [key, value] of Object.entries(CSSItems)) {
		CSS += `${key}: ${value};`;
	}
	dynamicColorController.innerHTML = `:root {${CSS}}`;
};
updateDynamicTheme();
const updateDynamicColorFromCover = () => {
	const dom = document.querySelector(".m-pinfo .j-cover");
	if (!dom) return;

	const canvas = document.createElement('canvas');
	canvas.width = 48;
	canvas.height = 48;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(dom, 0, 0, 48, 48);
	const pixels = chunk(ctx.getImageData(0, 0, 48, 48).data, 4).map((pixel) => {
		return ((pixel[3] << 24 >>> 0) | (pixel[0] << 16 >>> 0) | (pixel[1] << 8 >>> 0) | pixel[2]) >>> 0;
	});

	const quantizedColors = QuantizerCelebi.quantize(pixels, 128);
	const ranked = Score.score(quantizedColors);
	const top = ranked[0];

	window.mdCoverDominantColor = top;
	document.body.dispatchEvent(new CustomEvent('md-dominant-color-change'));

	updateDynamicTheme();
}
const updateDynamicColorFromBGEnhanced = () => {
	const dom = document.querySelector(".BGEnhanced-BackgoundDom .background img");
	if (!dom) return;

	const canvas = document.createElement('canvas');
	let width = dom.naturalWidth;
	let height = dom.naturalHeight;
	if (width > 60 || height > 60) {
		const ratio = width / height;
		if (ratio > 1) {
			width = 60;
			height = 60 / ratio;
		} else {
			width = 60 * ratio;
			height = 60;
		}
	}
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	ctx.drawImage(dom, 0, 0, width, height);
	const pixels = chunk(ctx.getImageData(0, 0, width, height).data, 4).map((pixel) => {
		return ((pixel[3] << 24 >>> 0) | (pixel[0] << 16 >>> 0) | (pixel[1] << 8 >>> 0) | pixel[2]) >>> 0;
	});

	const quantizedColors = QuantizerCelebi.quantize(pixels, 128);
	const ranked = Score.score(quantizedColors);
	const top = ranked[0];

	window.mdBGEnhancedDominantColor = top;
	document.body.dispatchEvent(new CustomEvent('md-dominant-color-change'));

	updateDynamicTheme();
}

plugin.onLoad(async (p) => {
	initSettings();

	document.body.classList.add('material-you-theme');

	if (loadedPlugins['BGEnhanced']) {
		document.body.classList.add('md-has-background');
	}

	// Listen hash change and add attribute
	window.addEventListener('hashchange', () => {
		document.body.setAttribute('page-hash', window.location.hash);
	});

	// Alternative time indicator
	waitForElement('#main-player', (dom) => {
		const timeIndicator = document.createElement('div');
		timeIndicator.style.position = 'unset';
		timeIndicator.classList.add('time-indicator-container');
		timeIndicator.classList.add('md-time-indicator-container');
		dom.appendChild(timeIndicator);
		ReactDOM.render(<TimeIndicator parentDOM={dom}/>, timeIndicator);
	});
	waitForElement('.m-player-fm', (dom) => {
		const timeIndicator = document.createElement('div');
		timeIndicator.style.position = 'unset';
		timeIndicator.classList.add('time-indicator-container');
		timeIndicator.classList.add('md-time-indicator-container');
		dom.appendChild(timeIndicator);
		ReactDOM.render(<TimeIndicator parentDOM={dom}/>, timeIndicator);
	});

	// Alternative jump to playing location button
	waitForElement('#main-player', (dom) => {
		const queueNotifyToast = document.querySelector('#main-player .list .m-queuenotify');
		new MutationObserver(() => {
			const jumpToPlaylocationBtn = document.querySelector('button.u-playinglocation');
			if (!jumpToPlaylocationBtn) {
				return;
			}
			if (queueNotifyToast.classList.contains('f-dn')) {
				jumpToPlaylocationBtn.classList.remove('pull-up');
			} else {
				jumpToPlaylocationBtn.classList.add('pull-up');
			}
		}).observe(queueNotifyToast, { attributes: true, attributeFilter: ['class'] });
	});

	// Greeting and two recomment playlists
	setInterval(() => {
		updateGreeting();
		updateDailyRecommendationDate();
	}, 30000);
	updateGreeting();
	waitForElement('.g-mn', (dom) => {
		new MutationObserver(() => {
			try { initRecommendPlaylists();} catch (e) {}
			removeRedundantPlaylists();
		}).observe(dom, { childList: true, subtree: true });
		window.initRecommendPlaylistsInterval = setInterval(() => {
			try { initRecommendPlaylists();} catch (e) {}
		}, 100);
	});


	waitForElement('.g-mn', (dom) => {
		new MutationObserver(() => {
			// action buttons innerText to css property
			const buttons = document.querySelectorAll('.u-ibtn5');
			for (let button of buttons) {
				button.style.setProperty('--text', `'${button.innerText}'`);
			}
			// 单曲数，专辑数，MV 数
			const artistInfoItems = document.querySelectorAll('.g-mn .m-info .inf .item');
			for (let item of artistInfoItems) {
				item.style.setProperty('--number', `'${item.innerHTML.match(/(\d+)/)[1]}'`);
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

	// Fix toolbar button offset
	waitForElement('.g-sd', (dom) => {
		const toolbarLeftPart = document.querySelector('header.g-hd .m-leftbox');
		new MutationObserver(() => {
			document.body.style.setProperty('--sidebar-width', `${parseInt(dom.style?.width || 199)}px`);
			toolbarLeftPart.style.setProperty('--offset', `${parseInt(dom.style?.width || 199) - 199}px`);
		}).observe(dom, { attributes: true, attributeFilter: ['style'] });
		document.body.style.setProperty('--sidebar-width', `${parseInt(dom.style?.width || 199)}px`);
		toolbarLeftPart.style.setProperty('--offset', `${parseInt(dom.style?.width || 199) - 199}px`);
	});
	
	// Dynamic scheme color (cover)
	waitForElement('.m-pinfo', (dom) => {
		let oldSrc = '';
		const update = () => {
			const img = dom.querySelector('.j-cover');
			if (oldSrc == img?.src) return;
			if (img?.complete) {
				oldSrc = img.src;
				updateDynamicColorFromCover();
			} else {
				img?.addEventListener('load', () => {
					update();
				});
			}
		};
		new MutationObserver(() => {
			update();
		}).observe(dom, { childList: true, subtree: true });
		update();
	});

	// Dynamic scheme color (BGEnhanced)
	if (document.body.classList.contains('BGEnhanced')) {
		waitForElement('.BGEnhanced-BackgoundDom .background', (dom) => {
			let oldSrc = '';
			const update = () => {
				const img = dom.querySelector('img');
				if (oldSrc == img?.src) return;
				if (img?.complete) {
					oldSrc = img.src;
					updateDynamicColorFromBGEnhanced();
				} else {
					img?.addEventListener('load', () => {
						update();
					});
				}
			};
			new MutationObserver(() => {
				update();
			}).observe(dom, { childList: true, subtree: true });
			update();
		});
	}

	// Add list view switcher
	window.addEventListener('hashchange', async () => {
		let targetContainer = null;
		if (window.location.hash.includes('m/playlist')) {
			targetContainer = await waitForElementAsync('.g-mn .u-tab2 .m-lstoper');
		} else if (window.location.hash.includes('m/dailysong')) {
			targetContainer = await waitForElementAsync('.g-mn .m-plylist .hd');
		}
		if (!targetContainer) {
			return;
		}
		if (targetContainer.classList.contains('md-list-switcher-patched')) {
			return;
		}
		targetContainer.classList.add('md-list-switcher-patched');
		const switcher = document.createElement('div');
		switcher.classList.add('md-list-view-switcher');
		ReactDOM.render(<ListViewSwitcher />, switcher);
		targetContainer.appendChild(switcher);
	});

	// Listen system theme change
	const toggleSystemDarkmodeClass = (media) => {
		document.body.classList.add(media.matches ? 'md-dark' : 'md-light');
		document.body.classList.remove(media.matches ? 'md-light' : 'md-dark');
		if (document.body.classList.contains('md-dynamic-theme-auto')) {
			window.mdThemeType = media.matches ? 'dark' : 'light';
			overrideNCMCSS('pri-skin-gride');
			overrideNCMCSS('skin_default');
			updateNativeTheme();
		}
	};
	const systemDarkmodeMedia = window.matchMedia('(prefers-color-scheme: dark)');
	systemDarkmodeMedia.addEventListener('change', () => { toggleSystemDarkmodeClass(systemDarkmodeMedia); });
	document.body.addEventListener('md-dynamic-theme-auto', () => {	toggleSystemDarkmodeClass(systemDarkmodeMedia); });
	toggleSystemDarkmodeClass(systemDarkmodeMedia);
});

plugin.onConfig((tools) => {
	return dom("div", {},
		dom("span", { innerHTML: "打开设置面板 " , style: { fontSize: "18px" } }),
		tools.makeBtn("打开", async () => {
			document.querySelector("#md-theme-setting-btn:not(.active)").click();
		})
	);
});