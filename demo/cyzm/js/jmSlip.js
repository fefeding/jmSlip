/**
 *
 * @author fefeding
 * @date 2014-11-04
 */

(function(win, doc, $) {
	var CSSMAP = ['', '-ms-', '-webkit-', '-o-', '-moz-'];
	var aniTimeout = 500,//动画时间（毫秒）
	aniTimeoutSecond = aniTimeout / 1000; //动画时间（秒）
	var hasTouch = 'ontouchstart' in win;//是否存在touch事件
	var minOffset = 50;//最小滑动距离表示翻页
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
		return new slip(el, mode, option);
	}

	function slip(el, mode, option) {
		this.container = $(el);
		this.containerInner = this.container.children().first();
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
		this.bindEvent();//初始化手指滑动事件
		this.auto();
	}

	slip.prototype.bindEvent = function() {
		var self = this;
		var touched = false;
		var startPosition = {x:0,y:0},prePosition = {x:0,y:0},curposition = {x:0,y:0};
		var ydirection = '',xdirection=''; 
		this.containerInner.bind(touchStart, function(evt) {
			evt = evt || win.event;			
			if(self.interval) {
				clearInterval(self.interval);
			}
			touched = true;
			var obj = evt.touches && evt.touches.length?evt.touches[0]:evt;
			prePosition.x = startPosition.x = obj.clientX || obj.pageX;
			prePosition.y = startPosition.y = obj.clientY || obj.pageY;

			self.transition(false);//停止动画
		});
		this.containerInner.bind(touchMove, function(evt) {
			evt = evt || win.event;
			if(touched) {
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
					ydirection = 'right';
				}
				else {
					ydirection = 'left';
				}
				
				//滑动当前移动距离，让页面跟随手指移动
				var offy = curposition.y - prePosition.y;
				var offx = curposition.x - prePosition.x;
				prePosition.x = curposition.x;
				prePosition.y = curposition.y;
				self.slipObj.offset(offx, offy);				
			}
		});
		this.containerInner.bind(touchEnd, onTouchEnd);
		this.containerInner.bind(touchCancel, onTouchEnd);	

		function onTouchEnd(evt) {
			evt = evt || win.event;
			if(touched) {
				//滑动当前移动距离，让页面跟随手指移动
				var offx = curposition.x - startPosition.x;
				var offy = curposition.y - startPosition.y;				
				self.slipObj.end(offx, offy, xdirection, ydirection);
				self.transition(true);//添加动画
				touched = false;
			}
		}	
	}

	slip.prototype.auto = function() {
		//如果指定了切换时间，则轮循切换
		if(this.option.changeTime && this.slipObj.go) {
			var dir = 1;
			var self = this;
			if(this.interval) {
				clearInterval(this.interval);
			}
			this.interval = setInterval(function() {
				var page = self.slipObj.page + dir;
				if(page < 0) {
					page = 1;
					dir = 1;
				}
				else if(page >= self.containerInner.children().length) {
					dir = -1;
					page = self.slipObj.page + dir;
				}
				self.slipObj.go && self.slipObj.go(page);
			},this.option.changeTime);
		}
	}

	slip.prototype.reset = function() {
		this.transition(true);//添加动画
		this.slipObj.reset && this.slipObj.reset();
	}

	slip.prototype.transition = function(b) {
		var transition = 'none';
		b && (transition='transform '+aniTimeoutSecond+'s ease');
		for(var j=0;j<CSSMAP.length;j++) {
			css(this.containerInner, CSSMAP[j]+'transition', CSSMAP[j]+transition);
		}	
	}

	

	//设置子元素
	slip.prototype.setStyle = function(name, value, map) {
		this.containerInner.children().each(function(i, el) {
			css(el, name, value, map);
		});
	}

	//设置对象样式
	function css(el, name, value, map) {
		map = map || [''];
		for(var i=0;i<map.length;i++) {
			el.css && el.css(map[i] + name,value);
			el.style && (el.style[map[i] + name] = value);
		}
	}

	/**
	 * 翻页滑动对象
	 *
	 */
	function pageSlip(instance) {
		this.instance = instance;
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
			var w = this.instance.container.width()+ 'px';
			css(this.instance.containerInner, 'width', w);
			this.instance.setStyle('width', w);
		}
		else {
			var h = this.instance.container.height()+ 'px';
			css(this.instance.containerInner, 'height', h);
			this.instance.setStyle('height', h);
		}		
		this.go(this.page);
	}

	pageSlip.prototype.offset = function(offx, offy) {
		offy += this.offsetY;
		offx += this.offsetX;
		this.move(offx, offy);
	}

	/**
	 * 手指滑动移动事件
	 *
	 */
	pageSlip.prototype.move = function(offx, offy) {	
		if(this.instance.option.direction == 'x') {
			var tranX = 'translateX(' + offx + 'px)';		
			css(this.instance.containerInner,'transform', tranX, CSSMAP);
			this.offsetX = offx;
		}
		else {	
			var tranY = 'translateY(' + offy + 'px)';		
			css(this.instance.containerInner,'transform', tranY, CSSMAP);
			this.offsetY = offy;
		}
	}

	/**
	 * 滑动结束事件
	 */
	pageSlip.prototype.end = function(offx, offy, xdirection, ydirection) {
		if((offy > minOffset || offx > minOffset) &&
		 (xdirection == 'right' || ydirection == 'down')) {
			this.previous();					
		}
		else if((offy < -minOffset|| offx < -minOffset) && 
			(xdirection == 'left' || ydirection == 'up')) {
			this.next();
		}
		else {
			this.reset();
		}
	}

	pageSlip.prototype.next = function() {
		this.go(this.page + 1);
	}

	pageSlip.prototype.previous = function() {
		this.go(this.page - 1);
	}

	/**
	 * 跳转到指定的页
	 */
	pageSlip.prototype.go = function(page) {
		if(page < 0) page = 0;
		else if(page > this.instance.containerInner.children().length - 1) 
			page = this.instance.containerInner.children().length - 1;
		var winHeight = win.innerHeight;
		var offy = -page * winHeight;//当前滑动距离
		
		var offx = 0,offy = 0;
		if(this.instance.option.direction == 'x') {
			var w = this.instance.container.width();
			offx = -page * w;//当前滑动距离
		}
		else {
			var h = this.instance.container.height();
			offy = -page * h;//当前滑动距离
		}		

		this.move(offx, offy);
		this.page = page;
	}

	return win.jmSlip = jmSlip;
})(window, document, $)