import { getSetting, setSetting } from "./utils";
import { schemePresets } from "./scheme-presets";
import { applyScheme, getThemeCSSFromColor, updateDynamicTheme } from "./main";
import './settings.scss';
class MDSettings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			scheme: 'dynamic-auto',
			ignoreNowPlaying: false,
			capsuleSidebar: false,
			hideNCMLogo: false,
			disableNewUI: false,
			floatingBottombar: false,
			transparentFramework: false,
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
			scheme: getSetting('scheme', 'dynamic-default-auto'),
			ignoreNowPlaying: getSetting('ignore-now-playing-page', false),
			capsuleSidebar: getSetting('capsule-sidebar', false),
			hideNCMLogo: getSetting('hide-ncm-logo', false),
			disableNewUI: getSetting('disable-new-ui', false),
			floatingBottombar: getSetting('floating-bottombar', false),
			transparentFramework: getSetting('transparent-framework', false)
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
						<div className="md-scheme-list-section-title">动态主题</div>
						<div className="md-scheme-list-section-description">根据歌曲封面动态生成配色</div>
						<DynamicSchemeSet name="default" activeScheme={ this.state.scheme } setScheme={ this.setScheme } />
						<DynamicSchemeSet name="tonal-spot" activeScheme={ this.state.scheme } setScheme={ this.setScheme } />
						<DynamicSchemeSet name="vibrant" activeScheme={ this.state.scheme } setScheme={ this.setScheme } />
						<DynamicSchemeSet name="expressive" activeScheme={ this.state.scheme } setScheme={ this.setScheme } />
						<DynamicSchemeSet name="neutral" activeScheme={ this.state.scheme } setScheme={ this.setScheme } />
					</div>
					<CustomDynamicThemeSetting show={ this.state.scheme.startsWith('dynamic-') } />
					<div className="md-scheme-list">
						<div className="md-scheme-list-section-title">普通主题</div>
						{
							this.props.list.map((item, index) => {
								return (
									<SchemeItem key={ index } scheme={ item } active={ this.state.scheme === item.name } setScheme={ this.setScheme } />
								);
							})
						}
					</div>
					<div className="md-scheme-list">
						<div className="md-scheme-list-section-title">自定义主题</div>
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
					<div className="md-theme-setting-subtitle">界面</div>
					{
						!this.state.disableNewUI && <>
							<div className="md-checkbox-wrapper">
								<input id="md-hide-ncm-logo" type="checkbox" className="md-checkbox" checked={ this.state.hideNCMLogo } onChange={ (e) => {
									this.setState({ hideNCMLogo: e.target.checked });
									if (e.target.checked) {
										document.body.classList.add('hide-ncm-logo');
									} else {
										document.body.classList.remove('hide-ncm-logo');
									}
									setSetting('hide-ncm-logo', e.target.checked);
								}} />
								<label for="md-hide-ncm-logo" className="md-checkbox-label">隐藏网易云 Logo</label>
							</div>
							<div className="md-checkbox-wrapper">
								<input id="md-capsule-sidebar" type="checkbox" className="md-checkbox" checked={ this.state.capsuleSidebar } onChange={ (e) => {
									this.setState({ capsuleSidebar: e.target.checked });
									if (e.target.checked) {
										document.body.classList.add('capsule-sidebar');
									} else {
										document.body.classList.remove('capsule-sidebar');
									}
									setSetting('capsule-sidebar', e.target.checked);
								}} />
								<label for="md-capsule-sidebar" className="md-checkbox-label">胶囊侧栏</label>
							</div>
						</>
					}
					<div className="md-checkbox-wrapper">
						<input id="md-disable-new-ui" type="checkbox" className="md-checkbox" checked={ this.state.disableNewUI } onChange={ (e) => {
							this.setState({ disableNewUI: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('md-disable-new-ui');
							} else {
								document.body.classList.remove('md-disable-new-ui');
							}
							setSetting('disable-new-ui', e.target.checked);
						}} />
						<label for="md-disable-new-ui" className="md-checkbox-label">禁用新 UI</label>
					</div>
					<div className="md-checkbox-wrapper">
						<input id="md-floating-bottombar" type="checkbox" className="md-checkbox" checked={ this.state.floatingBottombar } onChange={ (e) => {
							this.setState({ floatingBottombar: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('floating-bottombar');
							} else {
								document.body.classList.remove('floating-bottombar');
							}
							setSetting('floating-bottombar', e.target.checked);
						}} />
						<label for="md-floating-bottombar" className="md-checkbox-label">悬浮底栏</label>
					</div>
					<div className="md-checkbox-wrapper md-transparent-framework-switch">
						<input id="md-transparent-framework" type="checkbox" className="md-checkbox" checked={ this.state.transparentFramework } onChange={ (e) => {
							this.setState({ transparentFramework: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('transparent-framework');
							} else {
								document.body.classList.remove('transparent-framework');
							}
							setSetting('transparent-framework', e.target.checked);
						}} />
						<label for="md-transparent-framework" className="md-checkbox-label">全透明框架</label>
					</div>
					<div className="md-theme-setting-subtitle">其他设置</div>
					<div className="md-checkbox-wrapper">
						<input id="md-ignore-now-playing-page" type="checkbox" className="md-checkbox" checked={ this.state.ignoreNowPlaying } onChange={ (e) => {
							this.setState({ ignoreNowPlaying: e.target.checked });
							if (e.target.checked) {
								document.body.classList.add('ignore-now-playing');
							} else {
								document.body.classList.remove('ignore-now-playing');
							}
							setSetting('ignore-now-playing-page', e.target.checked);
						}} />
						<label for="md-ignore-now-playing-page" className="md-checkbox-label">在正在播放页面中不应用主题</label>
					</div>
				</div>
			</div>
		);
	}
}

function DynamicSchemeSet(props) {
	const [cssVariables, setCssVariables] = React.useState({});

	React.useEffect(() => {
		const onDominantColorChange = () => {
			const newCssVariables = getThemeCSSFromColor(`dynamic-${props.name}`);
			setCssVariables(newCssVariables);
		};
		document.body.addEventListener('md-dominant-color-change', () => {
			onDominantColorChange();
		});
		onDominantColorChange();
		return () => {
			document.body.removeEventListener('md-dominant-color-change', () => {
				onDominantColorChange();
			});
		};
	}, []);

	return (
		<React.Fragment>
			<SchemeItem
				key={`dynamic-${props.name}-dark`}
				dynamic={true}
				scheme={ {name: `dynamic-${props.name}-dark`, palette: {}}}
				active={ props.activeScheme === `dynamic-${props.name}-dark` }
				setScheme={ props.setScheme }
				cssVariablesOverride={cssVariables}
			/>
			<SchemeItem
				key={`dynamic-${props.name}-light`}
				dynamic={true}
				scheme={ {name: `dynamic-${props.name}-light`, palette: {}}}
				active={ props.activeScheme === `dynamic-${props.name}-light` }
				setScheme={ props.setScheme }
				cssVariablesOverride={cssVariables}
			/>
			<SchemeItem
				key={`dynamic-${props.name}-auto`}
				dynamic={true}
				scheme={ {name: `dynamic-${props.name}-auto`, palette: {}}}
				active={ props.activeScheme === `dynamic-${props.name}-auto` }
				setScheme={ (scheme) => {
					props.setScheme(scheme);
					document.body.dispatchEvent(new CustomEvent('md-dynamic-theme-auto'));
				}}
				cssVariablesOverride={cssVariables}
			/>
		</React.Fragment>
	);
}

function SchemeItem(props) {
	const containerRef = React.useRef(null);

	React.useEffect(() => {
		if (!props.cssVariablesOverride) return;
		if (containerRef.current) {
			let style = containerRef.current.style;
			for (let i = 0; i < style.length; i++) {
				let key = style[i];
				if (key.startsWith('--')) {
					style.removeProperty(key);
				}
			}
		}
		Object.entries(props.cssVariablesOverride).forEach(([key, value]) => {
			containerRef.current.style.setProperty(key, value);
		});
	}, [props.cssVariablesOverride]);

	return (
		<div ref={containerRef} className={`md-scheme-item ${props.dynamic ? 'md-scheme-item-dynamic' : ''} ${props.active ? 'active' : ''}`}>
			<SchemePreview scheme={ props.scheme.palette } setScheme= {() => { props.setScheme(props.scheme); }} name={ props.scheme.name } />
			<div className="md-scheme-item-name-container">
				<span className="md-scheme-item-indicator"></span>
				<span className="md-scheme-item-name">{ props.scheme.name.replace(/^dynamic\-/, '').replace(/\-/g, ' ') }</span>
			</div>
		</div>
	);
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
			if (!this.props.scheme[name]) continue;
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

	inner = () => (
		<div className="md-scheme-preview-inner">
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

	render() {
		return (
			<div className="md-scheme-preview"
				scheme-name={ this.props.name }
				style={ this.getAccentColorStyle() }
				onClick={
					() => {
						this.props.setScheme();
					}
				}>
				{ this.inner() }
				{ this.props.name.startsWith('dynamic') && this.props.name.endsWith('-auto') ? this.inner() : null }
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
				<div className="md-checkbox-wrapper">
					<input id="md-custom-scheme-light" type="checkbox" className="md-checkbox" checked={ this.state.scheme.light } onChange={ (e) => {
						this.setColor('light', e.target.checked);
					}} />
					<label for="md-custom-scheme-light" className="md-checkbox-label">亮色主题</label>
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
				<input className="md-color-field-color" type="color" value={ '#' + this.getCurrentColor().map((v) => {
					return v.toString(16).padStart(2, '0');
				}).join('') } onChange={ (e) => {
					const color = e.target.value.substr(1).match(/.{2}/g).map((v) => parseInt(v, 16));
					this.setState({ color }, () => {
						this.props.setColor(this.getCurrentColor());
					});
				}} />
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
function CustomDynamicThemeSetting(props) {
	const [dynamicThemeColorSource, setDynamicThemeColorSource] = React.useState(getSetting('dynamic-theme-color-source', 'cover'));
	const [customDynamicThemeColor, setCustomDynamicThemeColor] = React.useState(JSON.parse(getSetting('custom-dynamic-theme-color', '[189, 230, 251]')));

	React.useEffect(() => {
		window.mdDynamicThemeColorSource = dynamicThemeColorSource;
		updateDynamicTheme();
		document.body.dispatchEvent(new CustomEvent('md-dominant-color-change'));
	}, [dynamicThemeColorSource]);
	
	return (
		props.show && 
		(
			<div className="md-custom-scheme-setting">
				<div className="md-theme-setting-subtitle">取色选项</div>
				<div className="md-select">
					<label className="md-select-label">取色来源</label>
					<select className="md-theme-setting-select" value={ dynamicThemeColorSource } onChange={ (e) => {
							setDynamicThemeColorSource(e.target.value);
							setSetting('dynamic-theme-color-source', e.target.value);
						} }>
						<option value="cover">当前歌曲封面</option>
						{
							(document.body.classList.contains('md-has-background') || document.body.classList.contains('bg-enhanced')) &&
							<option value="bg-enhanced">背景图片 (BGEnhanced)</option>
						}
						<option value="custom">自定义颜色</option>
					</select>
				</div>
				{
					dynamicThemeColorSource === 'custom' &&
					(
						<ColorField color={ customDynamicThemeColor } label="自定义颜色" defaultColor={[189, 230, 251]} setColor={ (value) => {
							setCustomDynamicThemeColor(value);
							setSetting('custom-dynamic-theme-color', JSON.stringify(value));
							window.mdCostomDynamicThemeColor = value;
							updateDynamicTheme();
							document.body.dispatchEvent(new CustomEvent('md-dominant-color-change'));
						} } />
					)
				}
			</div>
		)
	);
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