/**
 *
 * @author fefeding
 * @date 2014-11-04
 */

(function(win, doc) {
	var CSSMAP = ['', '-ms-', '-webkit-', '-o-', '-moz-'];
	var aniTimeout = 500,//动画时间（毫秒）
	aniTimeoutSecond = aniTimeout / 1000; //动画时间（秒）
	var hasTouch = 'ontouchstart' in win;//是否存在touch事件
	var minOffset = 30;//最小滑动距离表示翻页
	var touchStart = hasTouch?'touchstart':'mousedown',
	touchMove = hasTouch?'touchmove':'mousemove',
	touchEnd = hasTouch?'touchend':'mouseup',
	touchCancel = hasTouch?'touchcancel':'mouseleave';

	function jmSlip(el, mode, option) {
		if(typeof mode == 'object') {
			option = mode;
			mode = '';
		}		
		option = option || {};
		mode = mode || option.mode || 'page';		
		if(typeof el == 'string') {
			el = document.getElementById(el);
		}
		if(el && el.length) {
			el = el[0];
		}
		return new slip(el, mode, option);
	}

	function slip(el, mode, option) {
		this.container = el;		
		this.containerInner = this.container.children[0];
		this.mode = mode;
		this.page = 0;
		this.offsetY = 0;
		this.option = option;
		//css(doc.body, 'margin', 0);
		this.slipObj = null;
		switch(mode) {
			case 'page': {
				this.slipObj = new pageSlip(this);
				break;
			}
		}
		css(el, 'overflow', 'hidden');
		this.reset();
		var self = this;
		self.bindEvent();//初始化手指滑动事件		
		this.auto();
	}

	slip.prototype.bindEvent = function() {
		var self = this;
		this.touched = false;
		var startPosition = {x:0,y:0},prePosition = {x:0,y:0},curposition = {x:0,y:0};
		var ydirection = '',xdirection=''; 
		bind(this.container, touchStart, function(evt) {
			evt = evt || win.event;		
			if(self.option && self.option.onTouchStart && typeof self.option.onTouchStart == 'function') {
				var stop = self.option.onTouchStart.call(self.slipObj, evt);
				//如果回调返回false , 则中止当前滑动
				if(stop === false) {
					return;
				}
			}	
			if(self.interval) {
				clearTimeout(self.interval);
			}
			self.touched = true;
			var obj = evt.touches && evt.touches.length?evt.touches[0]:evt;
			prePosition.x = startPosition.x = obj.clientX || obj.pageX;
			prePosition.y = startPosition.y = obj.clientY || obj.pageY;

			self.transition(false);//停止动画
			evt.stopPropagation && evt.stopPropagation();
			//evt.preventDefault && evt.preventDefault();//阻止默认响应
		});
		bind(this.container, touchMove, function(evt) {
			evt = evt || win.event;
			if(self.touched) {				
				if(self.option && self.option.onTouchMove && typeof self.option.onTouchMove == 'function') {
					var stop = self.option.onTouchMove.call(self.slipObj, evt);
					//如果回调返回false , 则中止当前滑动
					if(stop === false) {
						return;
					}
				}	
				var obj = evt.touches && evt.touches.length?evt.touches[0]:evt;
				curposition.x = obj.clientX || obj.pageX;
				curposition.y = obj.clientY || obj.pageY;
				if(curposition.y > prePosition.y) {
					ydirection = 'down';
				}
				else {
					ydirection = 'up';
				}
				if(curposition.x > prePosition.x) {
					xdirection = 'right';
				}
				else {
					xdirection = 'left';
				}
				
				//滑动当前移动距离，让页面跟随手指移动
				var offy = curposition.y - prePosition.y;
				var offx = curposition.x - prePosition.x;
				prePosition.x = curposition.x;
				prePosition.y = curposition.y;
				console.log('move: offx:' + offx);
				console.log('move: offy:' + offy);
				var off = self.slipObj.offset(offx, offy, evt);	
				//如果返回中止，则中止此次移动事件
				if(off === false) {
					onTouchEnd.call(this, evt);
				}
				evt.stopPropagation && evt.stopPropagation();
				//evt.preventDefault && evt.preventDefault();//阻止默认响应			
			}
		});
		bind(this.container, touchEnd, onTouchEnd);
		bind(this.container, touchCancel, onTouchEnd);	

		function onTouchEnd(evt) {
			evt = evt || win.event;
			//console.log(evt);
			if(self.touched) {
				if(self.option && self.option.onTouchEnd && typeof self.option.onTouchEnd == 'function') {
					var stop = self.option.onTouchEnd.call(self.slipObj, evt);
					//如果回调返回false , 则中止当前滑动
					if(stop === false) {
						return;
					}
				}	
				//滑动当前移动距离，让页面跟随手指移动
				var offx = curposition.x - startPosition.x;
				var offy = curposition.y - startPosition.y;	

				self.transition(true);//添加动画			
				self.slipObj.end(offx, offy, xdirection, ydirection, evt);
				
				self.touched = false;
				self.auto();
				evt.stopPropagation && evt.stopPropagation();
				//evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
		}	
	}

	slip.prototype.auto = function() {
		//如果指定了切换时间，则轮循切换
		if(this.option.changeTime && this.slipObj.go) {
			var dir = 1;
			var self = this;
			if(this.interval) {
				clearTimeout(this.interval);
			}
			function intervalHandler() {
				if(self.touched) return;//如果正在滑动操作中，则不处理
				var page = self.slipObj.page + dir;
				if(page < 0) {
					page = 1;
					dir = 1;
				}
				else if(page >= self.containerInner.children.length) {
					dir = -1;
					page = self.slipObj.page + dir;
				}
				self.slipObj.go && self.slipObj.go(page);
				self.interval = setTimeout(intervalHandler,self.option.changeTime);
			}
			this.interval = setTimeout(intervalHandler,this.option.changeTime);
		}
	}

	slip.prototype.reset = function() {
		this.transition(true);//添加动画
		this.slipObj.reset && this.slipObj.reset();
	}

	//设置/取消当前动画
	slip.prototype.transition = function(b) {
		if(typeof b == 'undefined') b= true;
		var transition = 'transform 0 ease 0';
		if(b) transition='transform '+aniTimeoutSecond+'s ease';
		for(var j=0;j<CSSMAP.length;j++) {
			css(this.containerInner, CSSMAP[j]+'transition', CSSMAP[j]+transition);
		}	
	}

	//设置子元素
	slip.prototype.setStyle = function(name, value, map) {
		var children = this.containerInner.children;
		for(var i=0;i<children.length;i++) {
			css(children[i], name, value, map);
		}
	}
	/**
	 * 翻页滑动对象
	 *
	 */
	function pageSlip(instance) {
		this.instance = instance;
		this.option = instance.option;
		this.offsetY = 0;
		this.offsetX = 0;
		this.page = 0;
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	pageSlip.prototype.reset = function() {		
		if(this.instance.option.direction == 'x') {
			var w = this.instance.container.offsetWidth;
			css(this.instance.containerInner, 'width', w * this.instance.containerInner.children.length + 'px');
			this.instance.setStyle('width', w + 'px');
		}
		else {
			var h = this.instance.container.offsetHeight+ 'px';
			//css(this.instance.containerInner, 'height', h);
			this.instance.setStyle('height', h);
		}		
		this.go(this.page);
	}

	/**
	 * 动画偏移
	 * 并组止符合条件的事件默认效果，别能在事件全局阻止，会影响业务上的事件
	 *
	 */
	pageSlip.prototype.offset = function(offx, offy, evt) {
		if(this.instance.option.direction == 'x') {
			//只有在横向移动更多才移动
			if(Math.abs(offx) > Math.abs(offy)) {
				offx += this.offsetX;
				evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
			else offx = false;
			offy = false;
		}
		else {
			//只有在横向移动更多才移动
			if(Math.abs(offy) > Math.abs(offx)) {
				offy += this.offsetY;
				evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
			else offy = false;			
			offx = false;
		}
		return this.move(offx, offy);
	}

	/**
	 * 手指滑动移动事件
	 *
	 */
	pageSlip.prototype.move = function(offx, offy) {	
		if(offx !== false) {
			var tranX = 'translateX(' + offx + 'px)';		
			css(this.instance.containerInner,'transform', tranX, CSSMAP);
			this.offsetX = offx;
		}
		if(offy !== false) {	
			var tranY = 'translateY(' + offy + 'px)';		
			css(this.instance.containerInner,'transform', tranY, CSSMAP);
			this.offsetY = offy;
		}
	}

	/**
	 * 滑动结束事件
	 */
	pageSlip.prototype.end = function(offx, offy, xdirection, ydirection, evt) {
		if(this.instance.option.direction == 'x') {
			if(offx > minOffset && xdirection == 'right') this.previous();
			else if(offx < -minOffset && xdirection == 'left') this.next();
			else this.reset();
		}
		else {
			if(offy > minOffset && ydirection == 'down') this.previous();
			else if(offy < -minOffset && ydirection == 'up') this.next();
			else this.reset();
		}
	};

	pageSlip.prototype.next = function() {
		this.go(this.page + 1);
	};

	pageSlip.prototype.previous = function() {
		this.go(this.page - 1);
	};

	/**
	 * 跳转到指定的页
	 */
	pageSlip.prototype.go = function(page) {
		
		var len = this.instance.containerInner.children.length;
		var oldpage = this.page;
		if(page < 0) page = 0;
		else if(page > len - 1) 
			page = len - 1;
		//如果页面没有改变。则不执行后面的
		//if(page == oldpage) return;

		//翻页前先调用自定义回调，如果返回false则中止
		if(this.option && this.option.onPageStart && typeof this.option.onPageStart == 'function') {
			var stop = this.option.onPageStart.call(this, page);
			//如果回调返回false , 则中止
			if(stop === false) {
				return;
			}
		}	

		//开始翻页计算
		var offx = false,offy = false;
		if(this.instance.option.direction == 'x') {
			var w = this.instance.container.offsetWidth;
			offx = -page * w;//当前滑动距离
		}
		else {
			var h = this.instance.container.offsetHeight;
			offy = -page * h;//当前滑动距离
		}		

		this.move(offx, offy);
		this.page = this.instance.page = page;

		//翻页后先调用自定义回调，以备做一些其它自定义处理
		if(this.option && this.option.onPageEnd && typeof this.option.onPageEnd == 'function') {
			this.option.onPageEnd.call(this, oldpage, page);
		}
		//执行动画结束后效果处理
		this.pageEnd(oldpage, page);
		return true;	
	};

	/**
	 * 翻页结束处理
	 *
	 * @param {int} srcPage 从当前页开始
	 * @param {int} desPage 跳到当前页
	 **/
	pageSlip.prototype.pageEnd = function(srcPage, desPage) {
		if(srcPage == desPage) return;//如果没有换页则不用处理动画
		var pages = this.instance.containerInner.children;
		var oldpage = pages[srcPage];
		var page = pages[desPage];		
		//加载图片
		var imgs = page.querySelectorAll('img[data-src]');
		for(var i=0;i<imgs.length;i++) {
			var img = imgs[i];
			attr(img, 'src', attr(img, 'data-src'));
		}
		//把指定了动画效果的元素归位，这样就形动了动画出现
		toggleClass(page.querySelectorAll('.jmslip-ani'),'jmslip-ani-normal',true);		
		//先去除动画效果，让元素到动画前位置，再加上动画基类，为了过去的页面改变不出现动画效果。
		var anis = oldpage.querySelectorAll('.jmslip-ani');
		toggleClass(anis, 'jmslip-ani', false);
		toggleClass(anis, 'jmslip-ani-normal', false);
		setTimeout(function(){
			toggleClass(anis,'jmslip-ani', true);
		},20);
		setTimeout(function(){
			var fs = page.querySelectorAll('.jmslip-flash');
			for(var i=0;i<fs.length;i++) {
				var cn = 'jmslip-flash'+((i % 3)+1);
				toggleClass(fs[i], cn, true);
			}
			fs = oldpage.querySelectorAll('.jmslip-flash');
			for(var i=0;i<fs.length;i++) {
				var cn = 'jmslip-flash'+((i % 3)+1);
				toggleClass(fs[i], cn, false);
			}
		},500);
	};

	//设置对象样式
	function css(el, name, value, map) {
		map = map || [''];
		for(var i=0;i<map.length;i++) {
			//el.css && el.css(map[i] + name,value);
			el.style && (el.style[map[i] + name] = value);
		}
	}

	//添加或删除样式类名
	function toggleClass(el, name, b) {		
		if(typeof b == 'undefined') b = 1;
		if(isArray(el)) {
			for(var i=0;i<el.length;i++) {
				toggleClass(el[i], name, b);
			}
			return;
		}
		var cls = el.className || '';
		var clsarr = cls.split(' ');
		var exists = false;
		var l = clsarr.length;
		for(var i=0;i<l;i++) {
			if(clsarr[i] == name) {
				//如果是要删除样式则置为空,否则表示已存在，不需重新加
				if(!b) clsarr[i] = '';
				exists = true;
			}
		}
		//只有当存在但要删除或不存在但要添加才需要重置样式
		if((exists && !b) || (!exists && b)) {
			b && clsarr.push(name);
			el.className = clsarr.join(' ');
		}
	}

	/**
	 * 设定或获取元素属性值
	 *
	 * @method attr
	 * @param {HTMLElement} el 操作的元素
	 * @param {string} name 属性名
	 * @param {string} value 属性值
	 * @return {string} 返回属性的值
	 */
	function attr(el, name, value) {
		if(isArray(el)) {
			var v = null;
			for(var i=0;i<el.length;i++) {
				v = attr(el[i], name, value);
			}
			return v;
		}
		var att = el.attributes[name];
		if(typeof value == 'undefined') {
			return att?att.nodeValue:null;
		}
		else {
			if(att) att.nodeValue = value;
			else {
				att = document.createAttribute(name);
				att.nodeValue = value;
				el.setAttributeNode(att);
			}
			return value;
		}
	}

	/**
	 * 绑定事件到html对象
	 * 
	 * @method bind
	 * @param {element} html元素对象
	 * @param {string} name 事件名称
	 * @param {function} fun 事件委托
	 */
	function bind(target,name,fun) {
		if(target.addEventListener) {
	        target.addEventListener(name,fun, false);
	        return true;
	    }
	    else if(target.attachEvent) {
	        return target.attachEvent("on"+name,fun);
	    }  
	    return false;
	}

	//检查对象是否为数组
	function isArray(arr) {
		var t = Object.prototype.toString.call(arr);		
	    return t == '[object Array]' || t == '[object NodeList]';
	}

	//初始化动画样式
	(function(){
		var nod = document.createElement('style');  
		var styleText = '@-webkit-keyframes jmslip-flash-keyframes\
						{\
							0%   {\
								-webkit-transform: translate(2px,-2px);\
								transform: translate(2px,-2px);\
							}\
							25%  {\
								-webkit-transform: translate(4px,-4px);\
								transform: translate(4px,-4px);\
							}\
							50%  {\
								-webkit-transform: translate(4px,4px);\
								transform: translate(4px,4px);\
							}\
							75%  {\
								-webkit-transform: translate(-4px,4px);\
								transform: translate(-4px,4px);\
							}\
							100% {\
								-webkit-transform: translate(-4px,-4px);\
								transform: translate(-4px,-4px);\
							}\
						}\
						.jmslip-ani-flash1 {\
							-webkit-animation: jmslip-flash-keyframes 4s ease-in 0 infinite alternate;\
							animation: jmslip-flash-keyframes 4s ease-in 0 infinite alternate;\
						}\
						.jmslip-ani-flash2 {\
							-webkit-animation: jmslip-flash-keyframes 6s ease-in 0 infinite alternate;\
							animation: jmslip-flash-keyframes 6s ease-in 0 infinite alternate;\
						}\
						.jmslip-ani-flash3 {\
							-webkit-animation: jmslip-flash-keyframes 7s ease-in 0 infinite alternate;\
							animation: jmslip-flash-keyframes 7s ease-in 0 infinite alternate;\
						}\
						.jmslip-ani {\
							-moz-transition: all 1s ease-in;\
						    -webkit-transition: all 1s ease-in;\
						    -o-transition: all 1s ease-in;\
						    -ms-transition: all 1s ease-in;\
						    transition: all 1s ease-in;\
						    display: inline-block;\
						}\
						.jmslip-ani-delay1{\
							-webkit-transition-delay: 0.1s;\
							transition-delay: 0.1s;\
						}\
						.jmslip-ani-delay2{\
							-webkit-transition-delay: 0.2s;\
							transition-delay: 0.2s;\
						}\
						.jmslip-ani-delay3{\
							-webkit-transition-delay: 0.3s;\
							transition-delay: 0.3s;\
						}\
						.jmslip-ani-delay4{\
							-webkit-transition-delay: 0.4s;\
							transition-delay: 0.4s;\
						}\
						.jmslip-ani-delay5{\
							-webkit-transition-delay: 0.5s;\
							transition-delay: 0.5s;\
						}\
						.jmslip-ani-delay6{\
							-webkit-transition-delay: 0.6s;\
							transition-delay: 0.6s;\
						}\
						.jmslip-ani-delay7{\
							-webkit-transition-delay: 0.7s;\
							transition-delay: 0.7s;\
						}\
						.jmslip-ani-opacity {\
							opacity: 0;\
						}\
						.jmslip-ani-normal {\
							-moz-transform: translate(0,0) scale(1)!important;\
						    -webkit-transform: translate(0,0) scale(1)!important;\
						    -o-transform: translate(0,0) scale(1)!important;\
						    -ms-transform: translate(0,0) scale(1)!important;\
						    transform: translate(0,0) scale(1)!important;\
						    opacity: 1!important;\
						}\
						.jmslip-ani-leftin {\
						    -moz-transform: translateX(-150%);\
						    -webkit-transform: translateX(-150%);\
						    -o-transform: translateX(-150%);\
						    -ms-transform: translateX(-150%);\
						    transform: translateX(-150%); \
						}\
						.jmslip-ani-rightin {	\
						    -moz-transform: translateX(500px);\
						    -webkit-transform: translateX(500px);\
						    -o-transform: translateX(500px);\
						    -ms-transform: translateX(500px);\
						    transform: translateX(500px);  \
						}\
						.jmslip-ani-topin {\
							-moz-transform: translateY(-500px);\
						    -webkit-transform: translateY(-500px);\
						    -o-transform: translateY(-500px);\
						    -ms-transform: translateY(-500px);\
						    transform: translateY(-500px);  \
						}\
						.jmslip-ani-bottomin {\
							-moz-transform: translateY(500px);\
						    -webkit-transform: translateY(500px);\
						    -o-transform: translateY(500px);\
						    -ms-transform: translateY(500px);\
						    transform: translateY(500px);  \
						}\
						.jmslip-ani-scalebig{\
							-moz-transform: scale(0.2);\
						    -webkit-transform: scale(0.2);\
						    -o-transform: scale(0.2);\
						    -ms-transform: scale(0.2);\
						    transform: scale(0.2);\
						}\
						.jmslip-ani-scalesmall{\
							-moz-transform: scale(2);\
						    -webkit-transform: scale(2);\
						    -o-transform: scale(2);\
						    -ms-transform: scale(2);\
						    transform: scale(2);\
						}'; 		
		if(nod.styleSheet){         //ie下  
			nod.styleSheet.cssText = styleText;  
		} else {  
			nod.innerHTML = styleText;
		}  
		document.getElementsByTagName('head')[0].appendChild(nod);  
	})();

	// 有 Sea.js 等 CMD 模块加载器存在
	if (typeof define === "function" && define.cmd) {
	  	define(function(require, exports, module) {
	  		module.exports = jmSlip;
	  	});
	}

	return win.jmSlip = jmSlip;
})(window, document);