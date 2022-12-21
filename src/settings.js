import { getSetting, setSetting } from "./utils";
import { schemePresets } from "./scheme-presets";
import { applyScheme } from "./main";
import './settings.scss';
class MDSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			scheme: 'dark-blue',
			ignoreNowPlaying: true
		};
		this.setScheme = this.setScheme.bind(this);
	}
	componentDidMount() {
		this.setState({
			scheme: getSetting('scheme', 'dark-blue'),
			ignoreNowPlaying: getSetting('ignore-now-playing', true)
		});
	}
	setScheme(scheme) {
		this.setState({ scheme: scheme.name });
		applyScheme(scheme.name);
		setSetting('scheme', scheme.name);
	}
	render() {
		return (
			<div>
				<button
					id="md-theme-setting-btn"
					className={ `${ this.state.open ? 'active' : ''}`}
					onClick={ () => {
						if (!this.state.open) {
							this.playingProgressInterval = setInterval(() => {
								document.body.style.setProperty('--md-now-playing-persentage', document.querySelector(".m-player .prg .has").style.width);
							}, 500);
							document.body.style.setProperty('--md-now-playing-persentage', document.querySelector(".m-player .prg .has").style.width);
						} else {
							clearInterval(this.playingProgressInterval);
						}
						this.setState({ open: !this.state.open });
					}} >
					<div className="md-inner-icon"></div>
				</button>
				<div id="md-theme-setting" className={ `${ this.state.open ? 'active' : ''}`}>
					<div className="md-theme-setting-title">设置</div>
					<div className="md-theme-setting-subtitle">Material You Theme</div>
					<div className="md-scheme-list">
						{
							this.props.list.map((item, index) => {
								return (
									<SchemeItem key={ index } scheme={ item } active={ this.state.scheme === item.name } setScheme={ this.setScheme } />
								);
							})
						}
					</div>
					<div className="md-theme-setting-subtitle">其他设置</div>					
					<div class="md-checkbox-wrapper">
						<input id="md-ignore-now-playing" type="checkbox" className="md-checkbox" checked={ this.state.ignoreNowPlaying } onChange={ (e) => {
							this.setState({ ignoreNowPlaying: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('ignore-now-playing');
							} else {
								document.body.classList.remove('ignore-now-playing');
							}
							setSetting('ignore-now-playing', e.target.checked);
						}} />
						<label for="md-ignore-now-playing" class="md-checkbox-label">在正在播放页面中不应用主题</label>
					</div>
				</div>
			</div>
		);
	}
}

class SchemeItem extends React.Component {
	constructor(props) {
		super(props);
	}
	render() {
		return (
			<div className={`md-scheme-item ${this.props.active ? 'active' : ''}`}>
				<SchemePreview scheme={ this.props.scheme.palette } setScheme= {() => { this.props.setScheme(this.props.scheme); }} />
				<div className="md-scheme-item-name-container">
					<span className="md-scheme-item-indicator"></span>
					<span className="md-scheme-item-name">{ this.props.scheme.name.replace(/\-/g, ' ') }</span>
				</div>
			</div>
		);
	}
}

class SchemePreview extends React.Component {
	constructor(props) {
		super(props);
	}
	
	getAccentColorStyle = () => {
		let result = {};
		this.props.scheme['secondary'] ??= this.props.scheme['primary'];
		for (let name in this.props.scheme) {
			if (name == 'light') {
				continue;
			}
			

			const [r, g, b] = this.props.scheme[name];
			if (name == '' || name == 'primary') {
				name = '--md-accent-color';
			} else {
				name = '--md-accent-color-' + name;
			}
			result[name] = `rgb(${r}, ${g}, ${b})`;
			result[name + '-rgb'] = `${r}, ${g}, ${b}`;
		}
		return result;
	}

	render() {
		return (
			<div className="md-scheme-preview"
				style={ this.getAccentColorStyle() }
				onClick={
					() => {
						this.props.setScheme();
					}
				}>
				<div className="md-bottombar"></div>
				<div className="md-leftbar"></div>
				<div className="md-btn-1"></div>
				<div className="md-btn-2"></div>
				<div className="md-btn-3"></div>
				<div className="md-leftbar-content-1"></div>
				<div className="md-leftbar-content-2"></div>
				<div className="md-leftbar-content-3"></div>
				<div className="md-leftbar-content-4"></div>
				<div className="md-leftbar-content-5"></div>
				<div className="md-leftbar-content-6"></div>
				<div className="md-leftbar-content-7"></div>
				<div className="md-main">
					<div className="md-today-recommend-demo">
						<div className="md-today-recommend-1"></div>
						<div className="md-today-recommend-2"></div>
						<div className="md-today-recommend-3"></div>
					</div>
					<div className="md-recommend-demo">
						<div className="md-recommend-1"></div>
						<div className="md-recommend-2"></div>
						<div className="md-recommend-3"></div>
						<div className="md-recommend-4"></div>
						<div className="md-recommend-5"></div>
						<div className="md-recommend-6"></div>
						<div className="md-recommend-7"></div>
						<div className="md-recommend-8"></div>
						<div className="md-recommend-9"></div>
						<div className="md-recommend-10"></div>
					</div>
				</div>
			</div>
		);
	}
}

export const initSettingMenu = () => {
	const user = document.querySelector('header .m-tool .user');
	if (!user) {
		setTimeout(() => { initSettingMenu() } , 100);
		return;
	}
	const dom = document.createElement('div');
	dom.id = 'md-settings-menu-container';
	dom.addEventListener('dblclick', (e) => {
		e.stopPropagation();
	});
	dom.addEventListener('mousedown', (e) => {
		e.stopPropagation();
	});
	
	let list = [];
	for (let key in schemePresets) {
		if (schemePresets.hasOwnProperty(key)) {
			list.push( {
				name: key,
				palette: schemePresets[key]
			});
		}
	}

	ReactDOM.render(<MDSettings list={ list }/>, dom);
	user.parentNode.insertBefore(dom, user.nextSibling);
}