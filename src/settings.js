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
			ignoreNowPlaying: true,
			customPreset: JSON.parse(getSetting('custom-scheme', JSON.stringify({
				'primary': [189, 230, 251],
				'secondary': [],
				'bg': [30, 37, 41],
				'bg-darken': [23, 29, 32],
				'light': false
			})))
		};
		this.setScheme = this.setScheme.bind(this);
	}
	componentDidMount() {
		this.setState({
			scheme: getSetting('scheme', 'dark-blue'),
			ignoreNowPlaying: getSetting('ignore-now-playing', false)
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
						<SchemeItem key="custom" scheme={ {name: 'custom', palette: this.state.customPreset} } active={ this.state.scheme === 'custom' } setScheme={ 
							(scheme) => {
								setSetting('custom-scheme', JSON.stringify(this.state.customPreset));
								this.setScheme(scheme);
							}
						} />
					</div>
					{
						this.state.scheme === 'custom' ? (
							<CustomSchemeSetting scheme={ this.state.customPreset } setCustomPreset={ (preset) => {
								this.setState({ customPreset: preset }, () => {	
									setSetting('custom-scheme', JSON.stringify(this.state.customPreset));
									applyScheme('custom');
								});
							}} />
						) : null
					}
					<div className="md-theme-setting-subtitle">其他设置</div>					
					<div class="md-checkbox-wrapper">
						<input id="md-ignore-now-playing-page" type="checkbox" className="md-checkbox" checked={ this.state.ignoreNowPlayingPage } onChange={ (e) => {
							this.setState({ ignoreNowPlayingPage: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('ignore-now-playing');
							} else {
								document.body.classList.remove('ignore-now-playing');
							}
							setSetting('ignore-now-playing-page', e.target.checked);
						}} />
						<label for="md-ignore-now-playing-page" class="md-checkbox-label">在正在播放页面中不应用主题</label>
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

class CustomSchemeSetting extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			scheme: this.props.scheme
		}
	}
	
	updateScheme = () => {
		let scheme = this.state.scheme;
		this.props.setCustomPreset(scheme);
	}
	
	setColor = (name, value) => {
		this.setState({
			scheme: {
				...this.state.scheme,
				[name]: value
			}
		}, () => {
			this.updateScheme();
		});
	}
	
	render() {
		return (
			<div className="md-custom-scheme-setting">
				<div className="md-theme-setting-subtitle">自定义</div>
				<ColorField color={ this.state.scheme['primary'] } label="主色" defaultColor={[189, 230, 251]} setColor={ (value) => { this.setColor('primary', value); } } />
				<ColorField color={ this.state.scheme['secondary'] } label="次色 (文字)" defaultColor={this.state.scheme['primary'] ?? [189, 230, 251]} setColor={ (value) => { this.setColor('secondary', value); } } optional={true} />
				<ColorField color={ this.state.scheme['bg'] } label="背景" defaultColor={[30, 37, 41]} setColor={ (value) => { this.setColor('bg', value); } } />
				<ColorField color={ this.state.scheme['bg-darken'] } label="背景 (暗化)" defaultColor={[23, 29, 32]} setColor={ (value) => { this.setColor('bg-darken', value); } } />
				<div class="md-checkbox-wrapper">
					<input id="md-custom-scheme-light" type="checkbox" className="md-checkbox" checked={ this.state.scheme.light } onChange={ (e) => {
						this.setColor('light', e.target.checked);
					}} />
					<label for="md-custom-scheme-light" class="md-checkbox-label">亮色主题</label>
				</div>
			</div>
		);
	}
}

class ColorField extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			color: this.props.color ?? ['', '', ''],
		}
	}

	componentDidUpdate( prevProps ) {
		if (prevProps.defaultColor.toString() != this.props.defaultColor.toString() && this.state.color.filter((v) => v !== '').length !== 3) {
			this.props.setColor(this.getCurrentColor());
		}
	}

	getCurrentColor() {
		if (this.state.color.filter((v) => v !== '').length === 3) {
			return this.state.color;
		} else {
			return this.props.defaultColor;
		}
	}

	render() {
		return (
			<div className="md-color-field">
				<div className="md-color-field-color" style={{ backgroundColor: `rgb(${this.getCurrentColor().join(',')})` }}></div>
				<div className="md-color-field-label">{ this.props.label }</div>
				{
					['R', 'G', 'B'].map((v, i) => {
						return (
							<div className="md-color-field-input-wrapper">
								<input type="number" min="0" max="255" step="1" value={ this.state.color[i] ?? '' }
									onInput={ (e) => {
										const color = this.state.color;
										if (e.target.value === '') {
											color[i] = '';
										} else {
											color[i] = Math.min(255, Math.max(0, parseInt(e.target.value)));
											e.target.value = color[i];
										}
										this.setState({ color }, () => {
											this.props.setColor(this.getCurrentColor());
										});
									}}
								/>
								<div className="md-color-field-input-label">{ v }</div>
							</div>
						)
					})
				}
				<button className="md-color-field-reset" onClick={ () => {
					this.setState({ color: ['', '', ''] }, () => {
						this.props.setColor(this.getCurrentColor());
					});
				} }><svg xmlns="http://www.w3.org/2000/svg" height="24" width="24"><path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"/></svg></button>
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