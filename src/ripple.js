import './ripple.scss';

const getCloestRippleElement = (e) => {
	const target = e.target;
	let p;
	
	// 左侧栏
	if (target.matches('.m-nav li a')) {
		return [target, false];
	}
	// Tabs
	if (target.matches('.m-tab li a')) {
		return [target, false];
	}
	if (target.matches('.u-tab2 > ul:not(.u-stab) li a')) {
		return [target, false];
	}
	if (target.matches('ul.u-tab2 li a')) {
		return [target, false];
	}
	if (target.matches('.md-list-view-switcher button')) {
		return [target, false];
	}
	// 顶栏按钮
	if (target.matches('header.g-hd .m-hst .btn')) {
		return [target, false];
	}
	if (target.matches('header.g-hd .set') || target.matches('header.g-hd .msg') || target.matches('header.g-hd .j-listentosong a')) {
		return [target, false];
	}
	p = target.closest('.m-tool .user .j-pl-click');
	if (p) return [p, false];
	p = target.closest('#md-theme-setting-btn');
	if (p) return [p, false];
	if (target.matches('.m-winctrl .icn')) {
		return [target, false];
	}
	// 底栏按钮
	if (target.matches('.m-player .btnp')) {
		return [target, true];
	}
	if (target.matches('.m-player .btnc') || target.matches('.m-player .type') || target.matches('.m-player .word') || target.matches('.m-player .subscribe') || target.matches('.m-player .fmdelete')) {
		return [target, false];
	}
	if (target.matches('.m-player .audioEffect') || target.matches('.m-player .spk') || target.matches('.m-player .listenTogether') || target.matches('.m-player .list')) {
		return [target, false];
	}
	if (target.matches('.m-pinfo .btns .btn')) {
		return [target, false];
	}
	// 歌单顶部按钮
	if (target.matches('.m-info .btns .u-ibtn5b .u-ibtn5:first-child') || target.matches('.g-mn .oper .u-ibtn5b .u-ibtn5:first-child') || target.matches('.m-plylist .hd .u-ibtn5b .u-ibtn5:first-child')) {
		return [target, true];
	}
	if (target.matches('.m-info .btns .u-ibtn5b .u-ibtn5-addto') || target.matches('.m-info .btns > .u-ibtn5') || target.matches('.g-mn .oper .u-ibtn5b .u-ibtn5-addto') || target.matches('.m-plylist .hd .u-ibtn5b .u-ibtn5-addto')) {
		return [target, false];
	}
	if (target.matches('.m-info .tit .name .edt')) {
		return [target, false];
	}
	if (target.matches('.g-mn .oper .u-ibtn5') || target.matches('.g-mn .m-plylist .hd .u-ibtn5')) {
		return [target, true];
	}
	// 普通按钮
	if (target.matches('.u-ibtn1') || target.matches('.ply.s-fc1')) {
		return [target, true];
	}
	if (target.matches('.u-ibtn5.u-ibtnsz1') || target.matches('.btns > .u-ibtn5:not([data-res-action])')) {
		return [target, true];
	}
	// 分享菜单
	if (target.matches('.m-card-sharecard li')) {
		return [target, false];
	}

	// 歌单卡片
	if (target.matches('.md-today-recommend > li .ply')) {
		return [target, true];
	}
	p = target.closest('.md-today-recommend > li');
	if (p) return [p, false];

	if (target.matches('.m-list > li .ply')) {
		return [target, true];
	}
	p = target.closest('.m-list > li');
	if (p) return [p, false];
	// 歌单条目
	p = target.closest('.m-plylist ul li');
	if (p) return [p, false];
	// 收藏到歌单 条目
	p = target.closest('.m-addto .list li') ?? target.closest('.m-addto .newLst');
	if (p) return [p, false];
	// 左下角封面
	p = target.closest('.m-pinfo .u-cover .lnk');
	if (p) return [p, true];

	return [false, false];
};


document.addEventListener('pointerdown', function(e) {
	console.log(e.target);
	const [target, invert] = getCloestRippleElement(e);
	if (target) {
		addRipple(e, target, invert);
	}
});

function addRipple(e, target, invert) {
	if (getComputedStyle(target).position !== 'absolute') {
		target.style.position = 'relative';
	}
	if (getComputedStyle(target).overflow !== 'hidden') {
		target.style.overflow = 'hidden';
	}
	const ripple = document.createElement('span');
	ripple.classList.add('md-ripple');

	const rect = target.getBoundingClientRect();
	const diagonal = Math.sqrt(rect.width ** 2 + rect.height ** 2);
	const ox = e.clientX - rect.left;
	const oy = e.clientY - rect.top;
	const maxd = Math.ceil(2 * Math.sqrt(Math.max(ox ** 2 + oy ** 2, (rect.width - ox) ** 2 + oy ** 2, (rect.width - ox) ** 2 + (rect.height - oy) ** 2, ox ** 2 + (rect.height - oy) ** 2)));
	ripple.style.width = '0px';
	ripple.style.height = '0px';
	ripple.style.left = ox + 'px';
	ripple.style.top = oy + 'px';
	if (invert) {
		ripple.style.filter = 'invert(1)';
	}
	target.appendChild(ripple);

	let d = 0;
	let speed = 0.75 * (diagonal / 200); // 0.75px per 200px
	let opacity = 1;
	let status = 'hold';

	const onMouseUp = (e) => {
		speed = 1.2 * (diagonal / 200);
		status = 'release';
		document.removeEventListener('pointerup', onMouseUp);
		document.removeEventListener('mouseout', onMouseUp);
	}
	document.addEventListener('pointerup', onMouseUp);
	document.addEventListener('mouseout', onMouseUp);

	let animation = null;

	let lastTime = null;
	const frame = (time) => {
		const delta = time - (lastTime ?? time);
		lastTime = time;
		d += speed * delta;
		ripple.style.width = d + 'px';
		ripple.style.height = d + 'px';
		if ((status === 'release' && d >= maxd * 0.7) || (status === 'hold' && d >= maxd * 0.9)) {
			opacity -= 0.005 * delta;
			ripple.style.opacity = Math.max(opacity, 0);
			if (opacity <= 0) {
				cancelAnimationFrame(animation);
				document.removeEventListener('pointerup', onMouseUp);
				document.removeEventListener('mouseout', onMouseUp);
				ripple.remove();
				return;
			}
		}
		animation = requestAnimationFrame(frame);
	}
	animation = requestAnimationFrame(frame);
}