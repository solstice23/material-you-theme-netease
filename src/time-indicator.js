import { getSetting, setSetting } from './utils.js';

const useState = React.useState;
const useEffect = React.useEffect;

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


export function TimeIndicator(props) {
	const [passedTime, setPassedTime] = useState(0);
	const [totalTime, setTotalTime] = useState(0);
	const [mode, setMode] = useState(getSetting('time-indicator', 'remain'));
	const [rightOffset, setRightOffset] = useState(0);

	const parentDOM = props.parentDOM ?? document.querySelector('#main-player');

	const calcRightOffset = () => {
		const selectorList = ['.brt', '.speed', '.audioEffect', '.spk'];
		let leftestButton;
		for (const selector of selectorList) {
			leftestButton = parentDOM.querySelector(selector);
			if (!leftestButton) {
				continue;
			}
			if (leftestButton.childElementCount != 0) {
				break;
			}
		}
		const right = parseInt(window.getComputedStyle(leftestButton).right) + leftestButton.clientWidth + 15;
		setRightOffset(right);
	}
	useEffect(() => {
		calcRightOffset();
		const observer = new MutationObserver(() => {
			calcRightOffset();
		});
		if (parentDOM.querySelector('.brt')) observer.observe(parentDOM.querySelector('.brt'), { childList: true });
		if (parentDOM.querySelector('.speed')) observer.observe(parentDOM.querySelector('.speed'), { childList: true });
		return () => {
			observer.disconnect();
		}
	}, []);

	const updateTime = () => {
		const passedTime = timeToSeconds(parentDOM.querySelector('time.now').innerText);
		const totalTime = timeToSeconds(parentDOM.querySelector('time.all').innerText);	
		setPassedTime(passedTime);
		setTotalTime(totalTime);
	}
	useEffect(() => {
		updateTime();
		const observer = new MutationObserver(() => {
			updateTime();
		});
		observer.observe(parentDOM.querySelector('time.now'), { childList: true });
		return () => {
			observer.disconnect();
		}
	}, []);

	const toggleMode = () => {
		if (mode === 'remain') {
			document.body.dispatchEvent(new CustomEvent('time-indicator-mode-change', { detail: 'total' }));
			setSetting('time-indicator', 'total');
		} else {
			document.body.dispatchEvent(new CustomEvent('time-indicator-mode-change', { detail: 'remain' }));
			setSetting('time-indicator', 'remain');
		}
		calcRightOffset();
	}
	useEffect(() => {
		const handler = (e) => {
			setMode(e.detail);
		}
		document.body.addEventListener('time-indicator-mode-change', handler);
		return () => {
			document.body.removeEventListener('time-indicator-mode-change', handler);
		}
	}, []);

	return (
		<div
			className="md-time-indicator"
			style={{
				right: rightOffset,
				opacity: 0,
			}}
		>
			<span id="time-passed">{secondsToTime(passedTime)}</span>
			<span> / </span>
			{
				mode === 'remain' ?
				<span id="time-rest" onClick={toggleMode}>-{secondsToTime(totalTime - passedTime)}</span>
				:
				<span id="time-total" onClick={toggleMode}>{secondsToTime(totalTime)}</span>
			}
		</div>
	);
}