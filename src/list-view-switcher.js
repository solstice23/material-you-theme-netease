import './list-view-switcher.scss';
import { getSetting, setSetting } from './utils.js';

export function ListViewSwitcher() {
	const [currentView, setCurrentView] = React.useState(getSetting('list-view', 'comfortable')); // compact, comfortable, spacious

	React.useEffect(() => {
		const onListViewChange = (e) => {
			setCurrentView(e.detail);
		};
		document.body.addEventListener('list-view-change', onListViewChange);
		return () => {
			document.body.removeEventListener('list-view-change', onListViewChange);
		};
	}, []);

	const setView = (view) => {
		document.body.dispatchEvent(new CustomEvent('list-view-change', { detail: view }));
		document.body.removeAttribute('data-list-view');
		document.body.setAttribute('data-list-view', view);
		setSetting('list-view', view);
	};

	React.useEffect(() => {
		if (!document.body.hasAttribute('data-list-view')) {
			document.body.setAttribute('data-list-view', getSetting('list-view', 'comfortable'));
		}
	}, []);

	return (
		<>
			<button className={`md-list-view-button ${currentView === 'compact' ? 'active' : ''}`} onClick={() => setView('compact')}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4,5V7H21V5M4,11H21V9H4M4,19H21V17H4M4,15H21V13H4V15Z"/></svg>
			</button>
			<button className={`md-list-view-button ${currentView === 'comfortable' ? 'active' : ''}`} onClick={() => setView('comfortable')}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 5H21V9H3V5M3 10H21V14H3V10M3 15H21V19H3V15Z"/></svg>
			</button>
			<button className={`md-list-view-button ${currentView === 'spacious' ? 'active' : ''}`} onClick={() => setView('spacious')}>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4,5V11H21V5M4,18H21V12H4V18Z" /></svg>
			</button>
		</>
	);
}