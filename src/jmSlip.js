/**
 * 前端滑动组件，主要用于移动端
 * 支持一些特殊动画效果
 * 参数说明：
 * mode： page=翻页效果，scroll=跟随滑动效果，类似于滚动条效果
 * option: 参数配置
 * 			direction: 方向参数x=横向，y=纵向
 *			changeTime: 自动翻页时间，不设置不会自动，单位（毫秒）
 *			onPageStart: {function} 翻页开始前回调，如果返回false则翻页中止
 *			onPageEnd: {function} 翻页结束回调
 *			onTouchStart: {function} 滑动开始，返回false中止滑动
 *			onTouchMove: {function} 滑动中，返回false中止
 *			onTouchEnd: {function} 滑动结束，返回false中止
 * @author fefeding
 * @date 2014-11-04
 */

(function(win, doc) {
	var CSSMAP = ['', '-ms-', '-webkit-', '-o-', '-moz-'],	
	hasTouch = 'ontouchstart' in win,//是否存在touch事件
	minOffset = 30,//最小滑动距离表示翻页
	touchStart = hasTouch?'touchstart':'mousedown',
	touchMove = hasTouch?'touchmove':'mousemove',
	touchEnd = hasTouch?'touchend':'mouseup',
	touchCancel = hasTouch?'touchcancel':'mouseleave',
	undefined;

	function jmSlip(el, mode, option) {
		if(typeof mode == 'object') {
			option = mode;
			mode = option.mode || 'page';
		}		
		option = option || {};
		option.duration = option.duration || 500;
		option.durations = option.duration / 1000;
		//滑动项补充大小差异
		option.itemOffWidth = option.itemOffWidth || 0;
		option.itemOffHeight = option.itemOffHeight || 0;

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
		this.target = this.container = el;		
		this.containerInner = this.container.children[0];
		this.mode = mode;
		this.page = option.page || 0;
		this.offsetY = 0;
		this.option = option;
		//css(doc.body, 'margin', 0);
		this.slipObj = null;
		switch(mode) {
			case 'page': {
				this.slipObj = new pageSlip(this);
				break;
			}
			case 'item': {
				this.slipObj = new itemSlip(this);
				break;
			}
			case 'scroll': {
				this.slipObj = new scrollSlip(this);
				break;
			}
			case 'drag': {
				this.slipObj = new dragSlip(this);
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
		this.touched = false;
		var startPosition = {x:0,y:0},prePosition = {x:0,y:0},curposition = {x:0,y:0};
		var ydirection = '',xdirection=''; 
		var startTime = null;//记录滑动开始时间
		bind(this.target, touchStart, function(evt) {
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
			startTime = evt.timeStamp;
			var obj = evt.touches && evt.touches.length?evt.touches[0]:evt;
			curposition.x=prePosition.x = startPosition.x = obj.clientX || obj.pageX;
			curposition.y=prePosition.y = startPosition.y = obj.clientY || obj.pageY;
			//console.log(touchStart);
			//console.log(startPosition);
			self.transition(false);//停止动画
			//evt.stopPropagation && evt.stopPropagation();
			//evt.preventDefault && evt.preventDefault();//阻止默认响应
		});
		bind(this.container, touchMove, function(evt) {
			evt = evt || win.event;
			if(self.touched) {
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

				var off = true;
				if(self.option && self.option.onTouchMove && typeof self.option.onTouchMove == 'function') {
					var stop = self.option.onTouchMove.call(self.slipObj, evt, {offx:curposition.x - startPosition.x,offy:curposition.y - startPosition.y});
					//如果回调返回false , 则中止当前滑动
					if(stop === false) {
						off = false;
					}
				}	

				if(off) off = self.slipObj.offset(offx, offy, evt);	
				//如果返回中止，则中止此次移动事件
				if(off === false) {
					onTouchEnd.call(this, evt);
				}
				//evt.stopPropagation && evt.stopPropagation();
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
				
				curposition.x = evt.clientX || evt.pageX;
				curposition.y = evt.clientY || evt.pageY;
				//console.log(touchEnd);
				//console.log(startPosition);

				self.transition(true);//添加动画
				evt.startTime = startTime;//记录滑动起始时间		
				
				self.slipObj.end(offx, offy, xdirection, ydirection, evt);							
				
				self.touched = false;
				self.auto();
				//evt.stopPropagation && evt.stopPropagation();
				//evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
		}	
		//如果需要支持滚轮
		if(this.option.mousewheel) {
			var wheelInterval = 0;
			var wheelOff = 0;
			bind(document, 'mousewheel', function(e){
				//清除上次的翻页事件，用户还在滚动中
				if(wheelInterval) clearTimeout(wheelInterval);
				e = e || win.event;	
				var off = e.wheelDelta;	
				wheelOff += off;		
				
				self.slipObj.offset(0, off, e);
				wheelInterval = setTimeout(function(){
					self.transition(true, null, 'linear');//动画
					if(wheelOff > 0) self.slipObj.previous();
					else if(wheelOff < 0) self.slipObj.next();
					wheelOff = 0;
				},500);	
			});
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
		this.slipObj.reset && this.slipObj.reset();
		/*var self = this;
		setTimeout(function(){
			self.transition(true);//添加动画
		},10);*/
	}

	//设置/取消当前动画
	slip.prototype.transition = function(b, el, tran) {
		if(typeof b == 'undefined') b= true;
		tran = tran || 'ease';
		var transition = 'transform 0s '+tran+' 0s';
		if(b) {
			transition=this.slipObj && this.slipObj.transition?this.slipObj.transition:('transform '+this.option.durations+'s '+tran+' 0s');
		}
		//当动画为默认的时，效果发生成inner上，否则发生成子元素上
		if(!this.option.animate || this.option.animate == 'default') {
			for(var j=0;j<CSSMAP.length;j++) {
				css(el||this.containerInner, CSSMAP[j]+'transition', CSSMAP[j]+transition);
			}	
		}
		else {
			for(var j=0;j<CSSMAP.length;j++) {
				this.setStyle(CSSMAP[j]+'transition', CSSMAP[j]+transition, null, el);
			}	
		}
	}

	//设置子元素
	slip.prototype.setStyle = function(name, value, map, children) {
		var children = children || this.containerInner.children;
		for(var i=0;i<children.length;i++) {
			css(children[i], name, value, map);
		}
	}

	//跳转
	slip.prototype.go = function(index) {
		if(this.slipObj.go) this.slipObj.go(index);
	}


	/**
	 * 翻页滑动对象
	 *
	 */
	function pageSlip(instance) {
		this.instance = instance;
		this.option = instance?instance.option:{};
		this.option.animate = 'page';
		this.offsetY = 0;
		this.offsetX = 0;
		this.page = instance && instance.page?instance.page: 0;
		this.transition = 'transform '+this.option.durations+'s ease-in-out 0s';
		this.children = [];
		if(instance && instance.containerInner) {			
			css(instance.containerInner, 'position', 'relative');
			if(this.instance.containerInner.children[this.page]) this.instance.containerInner.children[this.page].style.zIndex = 10000;
		}
	}

	//初始化子页
	pageSlip.prototype.initChildren = function() {
		if(this.instance && this.instance.containerInner) {
			for(var i=0;i<this.instance.containerInner.children.length;i++) {
				var ch = this.instance.containerInner.children[i];
				var exists = false;
				for(var j=0;j<this.children.length;j++) {
					if(this.children[j] == ch) {
						exists = true;
						break;
					}
				}
				if(!exists) {
					this.children.push(ch);
					css(ch, {'position': 'absolute', 'width':'100%', 'height':'100%', 'top':0,'left':0});
					if(this.instance.option.direction == 'x') {
						var offx = i < this.page?-this.pageWidth:i>this.page?this.pageWidth:0;
						css(ch,'transform', 'translate3d(' + offx + 'px,0px,0px)', CSSMAP);
					}
					else {
						var offy = i < this.page?-this.pageHeight:i>this.page?this.pageHeight:0;
						css(ch,'transform', 'translate3d(0px,'+offy+'px,0px)', CSSMAP);
					}
				}
			}			
		}
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	pageSlip.prototype.reset = function() {		

		if(this.instance.option.direction == 'x') {
			this.pageWidth = this.instance.option.width || this.instance.container.offsetWidth;
			//如果是默认的翻页方式，则内框的宽度为子元素总宽度和
			//其它动画效果为容器宽高，使用绝对定位
			
			//css(this.instance.containerInner, 'width', this.pageWidth + 'px');
			//his.instance.setStyle('width', this.pageWidth + 'px');
		}
		else {
			this.pageHeight = (this.instance.option.height || this.instance.container.offsetHeight);
			//css(this.instance.containerInner, 'height', this.pageHeight + 'px');
			//this.instance.setStyle('height', this.pageHeight + 'px');
		}		

		//初始化子页面元素
		this.initChildren();

		
		this.instance.transition(false, this.children);
		this.go(this.page);
		var self = this;
		//设定元素动画
		setTimeout(function(){
			self.instance.transition(true, self.children);
		},50);		
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
		//普通翻页动画，就是位移	
		var prepage = this.children[this.page - 1];
		var curpage = this.children[this.page];
		var nextpage = this.children[this.page + 1];
		if(offx !== false) {
			var tranX = 'translate3d(' + offx + 'px,0px,0px)';			
			if(prepage) {
				css(prepage,'transform', 'translate3d(' + (offx - this.pageWidth) + 'px,0px,0px)', CSSMAP);
			}
			if(curpage) {
				css(curpage,'transform', tranX, CSSMAP);
				curpage.style.zIndex = 10000;
			}
			if(nextpage) {
				css(nextpage,'transform', 'translate3d(' + (this.pageWidth + offx) + 'px,0px,0px)', CSSMAP);
			}
			this.offsetX = offx;
		}
		if(offy !== false) {	
			var tranY = 'translate3d(0px,' + offy + 'px,0px)';	
			if(prepage) {
				css(prepage,'transform', 'translate3d(0px,' + (offy - this.pageHeight) + 'px,0px)', CSSMAP);
			}
			if(curpage) {
				css(curpage,'transform', tranY, CSSMAP);
				curpage.style.zIndex = 10000;
			}
			if(nextpage) {
				css(nextpage,'transform', 'translate3d(0px,' + (this.pageHeight + offy) + 'px,0px)', CSSMAP);
			}
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
			else this.go(this.page);
		}
		else {
			if(offy > minOffset && ydirection == 'down') this.previous();
			else if(offy < -minOffset && ydirection == 'up') this.next();
			else this.go(this.page);
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
		var len = this.children.length;
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
				this.reset();
				return;
			}
		}

		//开始翻页计算
		var offx = false,offy = false;
		if(this.instance.option.direction == 'x') {
			offx = 0;//当前滑动距离
		}
		else {
			offy = 0;//当前滑动距离
		}
		
		//只保留 三页
		var curpage = this.children[page];
		if(this.page > page) {
			//去掉后面的一页
			var lastpage = this.children[this.page + 1];
			if(lastpage) this.instance.containerInner.removeChild(lastpage);
			//插入第一页
			var firstpage = this.children[page - 1];
			if(firstpage) {
				if(this.instance.option.direction == 'x') css(firstpage,'transform', 'translate3d(' + (0 - this.pageWidth) + 'px,0px,0px)', CSSMAP);
				else css(firstpage,'transform', 'translate3d(0px,' + (0 - this.pageHeight) + 'px,0px)', CSSMAP);
				this.instance.containerInner.insertBefore(firstpage, curpage);
			}
		}
		else if(this.page < page) {
			//去掉第一页
			var firstpage = this.children[this.page - 1];
			if(firstpage) this.instance.containerInner.removeChild(firstpage);
			var lastpage = this.children[page + 1];
			if(lastpage) {
				if(this.instance.option.direction == 'x') css(lastpage,'transform', 'translate3d(' + this.pageWidth + 'px,0px,0px)', CSSMAP);
				else css(lastpage,'transform', 'translate3d(0px,' + this.pageHeight + 'px,0px)', CSSMAP);
				this.instance.containerInner.appendChild(lastpage);
			}
		}
		//如果不变，则只保留三页
		else if(this.instance.containerInner.children.length > 3) {
			var chlen = this.instance.containerInner.children.length;
			for(var i=chlen-1;i>=0;i--) {
				var ch = this.instance.containerInner.children[i];
				if(i < page - 1 || i > page + 1) {
					this.instance.containerInner.removeChild(ch);
				}
			}
		}
		this.page = this.instance.page = page;
		this.move(0, 0);

		//翻页后先调用自定义回调，以备做一些其它自定义处理
		if(this.option && this.option.onPageEnd && typeof this.option.onPageEnd == 'function') {
			this.option.onPageEnd.call(this, oldpage, page);
		}
		//执行动画结束后效果处理
		this.pageEnd(oldpage, page);
		this.offsetX = 0;
		this.offsetY = 0;
		return true;	
	};

	/**
	 * 翻页结束处理
	 *
	 * @param {int} srcPage 从当前页开始
	 * @param {int} desPage 跳到当前页
	 **/
	pageSlip.prototype.pageEnd = function(srcPage, desPage) {
		if(typeof desPage == 'string') desPage = parseInt(desPage, 10);
		if(typeof srcPage == 'string') srcPage = parseInt(srcPage, 10);
		if(srcPage == desPage || srcPage < 0 || desPage < 0) return;//如果没有换页则不用处理动画
		var pages = this.children && this.children.length?this.children:this.instance.containerInner.children;
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
		if(oldpage) {
			var anis = oldpage.querySelectorAll('.jmslip-ani');
			toggleClass(anis, 'jmslip-ani', false);
			toggleClass(anis, 'jmslip-ani-normal', false);
			setTimeout(function(){
				toggleClass(anis,'jmslip-ani', true);
			},20);
		}
		
		setTimeout(function(){
			var fs = page.querySelectorAll('.jmslip-flash');
			for(var i=0;i<fs.length;i++) {
				var cn = 'jmslip-flash'+((i % 3)+1);
				toggleClass(fs[i], cn, true);
			}
			if(oldpage) {
				fs = oldpage.querySelectorAll('.jmslip-flash');
				for(var i=0;i<fs.length;i++) {
					var cn = 'jmslip-flash'+((i % 3)+1);
					toggleClass(fs[i], cn, false);
				}
			}			
		},500);
	};

	/**
	 * 普通平滑滚动对象
	 *
	 */
	function scrollSlip(instance) {
		this.instance = instance;
		this.option = instance.option;
		this.offsetY = 0;
		this.offsetX = 0;
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	scrollSlip.prototype.reset = function() {		
		var len = this.instance.containerInner.children.length;
		//横向滑动的话，容器 为每个子元素宽度和
		if(this.instance.option.direction == 'x') {
			var w = 0;
			for(var i=0;i<len;i++) {
				w += this.instance.containerInner.children[i].offsetWidth + this.instance.option.itemOffWidth;
			}
			css(this.instance.containerInner, 'min-width', w + 'px');
		}
		//纵向滑动，容器高度为每个子元素高度和
		else {
			var h = 0;
			for(var i=0;i<len;i++) {
				h += this.instance.containerInner.children[i].offsetHeight + this.instance.option.itemOffHeight;
			}
			css(this.instance.containerInner, 'min-height', h + 'px');
		}
		//归位
		this.move(0, 0);
		var self = this;
		//设定元素动画
		setTimeout(function(){
			self.instance.transition(true, self.instance.containerInner);
		},10);	
	}

	/**
	 * 动画偏移
	 * 并组止符合条件的事件默认效果，别能在事件全局阻止，会影响业务上的事件
	 *
	 */
	scrollSlip.prototype.offset = function(offx, offy, evt) {
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
	scrollSlip.prototype.move = function(offx, offy) {	
		if(offx !== false) {
			var tranX = 'translate3d(' + offx + 'px,0px,0px)';		
			css(this.instance.containerInner,'transform', tranX, CSSMAP);
			this.offsetX = offx;
		}
		if(offy !== false) {	
			var tranY = 'translate3d(0px,' + offy + 'px,0px)';		
			css(this.instance.containerInner,'transform', tranY, CSSMAP);
			this.offsetY = offy;
		}
	}

	/**
	 * 滑动结束事件
	 */
	scrollSlip.prototype.end = function(offx, offy, xdirection, ydirection, evt) {
		if(this.instance.option.direction == 'x') {
			if(this.offsetX > 0) this.reset();
			else {
				var maxoff = this.instance.containerInner.offsetWidth - this.instance.container.offsetWidth;
				if(this.offsetX < -maxoff) {
					this.move(-maxoff , false);
				}
				else {
					//获取滑动时间，并计算速度
					/*var time = evt.timeStamp - evt.startTime;
					var s = offx / time * 100;
					if(s < -maxoff) s = -maxoff;*/
					this.offset(xdirection=='left'?-minOffset:minOffset, false);
				}
			}
		}
		else {
			if(this.offsetY > 0) this.reset();
			else {
				var maxoff = this.instance.containerInner.offsetHeight - this.instance.container.offsetHeight;
				if(this.offsetY < -maxoff) {
					this.move(false , -maxoff);
				}
				else {
					this.offset(false, ydirection=='up'?-minOffset:minOffset);
				}
			}
		}
	};

	/**
	 * 切换滑动对象
	 *
	 */
	function itemSlip(instance) {
		this.instance = instance;
		this.option = instance.option;
		this.offsetY = 0;
		this.offsetX = 0;
		this.page = instance.page || 0;
		this.transition = 'transform '+this.option.durations+'s ease-in-out 0s';
	}
	//简单继承pageslip
	itemSlip.prototype = new pageSlip();

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	itemSlip.prototype.reset = function() {		
		if(this.instance.option.direction == 'x') {
			var totalwidth = 0;
			//计算所有项总宽度
			for(var i=0;i<this.instance.containerInner.children.length;i++) {
				totalwidth += this.instance.containerInner.children[i].offsetWidth + this.instance.option.itemOffWidth;
			}
			css(this.instance.containerInner, 'width', totalwidth + 'px');			
		}
		else {
			var totalheight = 0;
			//计算所有项总高度
			for(var i=0;i<this.instance.containerInner.children.length;i++) {
				totalheight += this.instance.containerInner.children[i].offsetHeight + this.instance.option.itemOffHeight;
			}
			css(this.instance.containerInner, 'height', totalheight);			
		}		
		this.go(this.page);
		var self = this;
		//设定元素动画
		setTimeout(function(){
			self.instance.transition(true, self.instance.containerInner);
		},10);	
	}

	/**
	 * 滑动结束事件
	 */
	itemSlip.prototype.end = function(offx, offy, xdirection, ydirection, evt) {
		var suc = false;
		if(this.instance.option.direction == 'x') {
			if(offx > minOffset || offx < -minOffset) {
				var index = this.getCenterIndex(offx, offy);
				//如果有自定义选中的项，则采用自定义的结果
				if(this.instance.option.selectHandler) {
					var newindex = this.instance.option.selectHandler(this.page, index);
					if(typeof(newindex) == 'number' && newindex != index) index = newindex;
					else if(newindex === false) {
						index = this.page;//返回，如果指定为false
					}
				}
				suc = this.go(index);
			}
		}
		else {
			if(offy > minOffset || offy < -minOffset) {
				var index = this.getCenterIndex(offx, offy);
				//如果有自定义选中的项，则采用自定义的结果
				if(this.instance.option.selectHandler) {
					var newindex = this.instance.option.selectHandler(this.page, index);
					if(typeof(newindex) == 'number' && newindex != index) index = newindex;
					else if(newindex === false) {
						index = this.page;//返回，如果指定为false
					}
				}
				suc = this.go(index);
			}
		}
		if(!suc) this.reset();
	};

	/**
	 * 跳转到指定的页
	 */
	itemSlip.prototype.go = function(page) {
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
				return false;
			}
			else if(typeof stop == 'number') {
				page = stop;
			}
		}	

		//开始翻页计算
		var offx = false,offy = false;
		if(this.instance.option.direction == 'x') {
			offx = this.instance.container.offsetWidth / 2;
			for(var i=0;i<len;i++) {
				var w = this.instance.containerInner.children[i].offsetWidth + this.instance.option.itemOffWidth;
				if(i == page) {
					offx -= w / 2;
					break;
				}
				offx -= w;
			}			
		}
		else {
			offy = this.instance.container.offsetHeight / 2;
			for(var i=0;i<len;i++) {
				var h = this.instance.containerInner.children[i].offsetHeight + this.instance.option.itemOffHeight;
				if(i == page) {
					offy -= h / 2;
					break;
				}
				offy -= h;
			}	
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

	//获取在中间的项索引
	itemSlip.prototype.getCenterIndex = function(offx, offy) {
		if(this.instance.option.direction == 'x') {			
			var len = this.instance.containerInner.children.length;
			var lastindex = 0;
			var leftwidth = 0;
			var lastoffx = 0;
			var mleft = this.instance.container.offsetWidth / 2 - this.offsetX;
			//找到离中间最近的项
			for(var i=0;i<len;i++) {		
				var itemw = this.instance.containerInner.children[i].offsetWidth + this.instance.option.itemOffWidth; 			
				leftwidth += itemw;
				if(leftwidth >= mleft) {
					//如果刚过中间，且它比上一个离中线还近，则取它，否则取上一个
					//这里是减去itemw/2  因为此项比中线要远
					if(leftwidth - mleft - itemw / 2 < lastoffx) {
						lastindex = i;
					}
					break;
				}
				//离项中间的距离
				lastoffx = mleft - leftwidth + itemw / 2;
				lastindex = i;
			}	
			return lastindex;
		}
		else {
			var len = this.instance.containerInner.children.length;
			var lastindex = 0;
			var topheight = 0;
			var lastoffy = 0;
			var mtop = this.instance.container.offsetHeight / 2 - this.offsetY;
			//找到离中间最近的项
			for(var i=0;i<len;i++) {		
				var itemh = this.instance.containerInner.children[i].offsetHeight + this.instance.option.itemOffHeight; 			
				topheight += itemh;
				if(topheight >= mtop) {
					//如果刚过中间，且它比上一个离中线还近，则取它，否则取上一个
					//这里是减去itemw/2  因为此项比中线要远
					if(topheight - mtop - itemh / 2 < lastoffy) {
						lastindex = i;
					}
					break;
				}
				//离项中间的距离
				lastoffy = mtop - topheight + itemh / 2;
				lastindex = i;
			}	
			return lastindex;
		}
	}

	/**
	 * 动画偏移
	 * 并组止符合条件的事件默认效果，别能在事件全局阻止，会影响业务上的事件
	 *
	 */
	itemSlip.prototype.offset = function(offx, offy, evt) {
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
	itemSlip.prototype.move = function(offx, offy) {	
		//普通翻页动画，就是位移
		if(!this.instance.option.animate || this.instance.option.animate == 'default') {
			if(offx !== false) {
				var tranX = 'translate3d(' + offx + 'px,0px,0px)';		
				css(this.instance.containerInner,'transform', tranX, CSSMAP);
				this.offsetX = offx;
			}
			if(offy !== false) {	
				var tranY = 'translate3d(0px,' + offy + 'px,0px)';		
				css(this.instance.containerInner,'transform', tranY, CSSMAP);
				this.offsetY = offy;
			}
		}
 		else {
 			var next = Math.ceil(Math.abs(offx / this.instance.container.offsetWidth));
 			var rotate = Math.abs(offx % this.instance.container.offsetWidth) / this.instance.container.offsetWidth * 180;
 			if(next > this.page) rotate = -rotate;
 			switch(this.instance.option.animate) {
 				//翻转效果
 				case 'flip': {
 					css(this.instance.containerInner.children[this.page],'transform', 'rotateY(' + rotate + 'deg)', CSSMAP);
 					css(this.instance.containerInner.children[next],'transform', 'rotateY(' + (-rotate) + 'deg)', CSSMAP);
 				}
 			}
 		}
	}

	/**
	 * 拖放对象
	 *
	 */
	function dragSlip(instance) {
		this.instance = instance;
		//把容器重置为document
		instance.container = document;
		instance.containerInner = instance.target;
		this.option = instance.option;
		this.offsetY = 0;
		this.offsetX = 0;
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	dragSlip.prototype.reset = function() {		
		this.instance.transition(true, this.instance.containerInner);		
	}

	/**
	 * 动画偏移
	 *
	 */
	dragSlip.prototype.offset = function(offx, offy, evt) {		
		offx += this.offsetX;		
		offy += this.offsetY;
		evt && evt.preventDefault && evt.preventDefault();//阻止默认响应			
		return this.move(offx, offy);
	}

	/**
	 * 手指滑动移动事件
	 *
	 */
	dragSlip.prototype.move = function(offx, offy) {		
		var tranX = 'translate3d(' + offx + 'px,' + offy + 'px,0px)';		
		css(this.instance.containerInner,'transform', tranX, CSSMAP);
		this.offsetX = offx;
		this.offsetY = offy;
	}

	/**
	 * 滑动结束事件
	 */
	dragSlip.prototype.end = function(offx, offy, xdirection, ydirection, evt) {
		if(this.option.dragEnd && typeof this.option.dragEnd == 'function') {
			this.option.dragEnd.call(this, offx, offy);
		}
	};


	//设置对象样式
	function css(el, name, value, map) {
		if(isArray(value)) {
			map = value;
		}
		map = map || [''];
		if(typeof name == 'object') {
			for(var k in name) {
				if(typeof name[k] == 'string' || typeof name[k] == 'number') {
					css(el, k, name[k], map);
				}
			}
		}
		else {
			for(var i=0;i<map.length;i++) {
				//el.css && el.css(map[i] + name,value);
				el.style && (el.style[map[i] + name] = value);
			}
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
								-webkit-transform: translate3d(2px,-2px,0px);\
								transform: translate3d(2px,-2px,0px);\
							}\
							25%  {\
								-webkit-transform: translate3d(4px,-4px,0px);\
								transform: translate3d(4px,-4px,0px);\
							}\
							50%  {\
								-webkit-transform: translate3d(4px,4px,0px);\
								transform: translate3d(4px,4px,0px);\
							}\
							75%  {\
								-webkit-transform: translate3d(-4px,4px,0px);\
								transform: translate3d(-4px,4px,0px);\
							}\
							100% {\
								-webkit-transform: translate3d(-4px,-4px,0px);\
								transform: translate3d(-4px,-4px,0px);\
							}\
						}\
						.jmslip-ani-flash1 {\
							-webkit-animation: jmslip-flash-keyframes 4s ease-in 0s infinite alternate;\
							animation: jmslip-flash-keyframes 4s ease-in 0s infinite alternate;\
						}\
						.jmslip-ani-flash2 {\
							-webkit-animation: jmslip-flash-keyframes 6s ease-in 0s infinite alternate;\
							animation: jmslip-flash-keyframes 6s ease-in 0s infinite alternate;\
						}\
						.jmslip-ani-flash3 {\
							-webkit-animation: jmslip-flash-keyframes 7s ease-in 0s infinite alternate;\
							animation: jmslip-flash-keyframes 7s ease-in 0s infinite alternate;\
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
							-moz-transform: translate3d(0,0,0) scale3d(1,1,1)!important;\
						    -webkit-transform: translate3d(0,0,0) scale3d(1,1,1)!important;\
						    -o-transform: translate3d(0,0,0) scale3d(1,1,1)!important;\
						    -ms-transform: translate3d(0,0,0) scale3d(1,1,1)!important;\
						    transform: translate3d(0,0,0) scale3d(1,1,1)!important;\
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
							-moz-transform: scale3d(0.2,0.2,1);\
						    -webkit-transform: scale3d(0.2,0.2,1);\
						    -o-transform: scale3d(0.2,0.2,1);\
						    -ms-transform: scale3d(0.2,0.2,1);\
						    transform: scale3d(0.2,0.2,1);\
						}\
						.jmslip-ani-scalesmall{\
							-moz-transform: scale3d(2,2,1);\
						    -webkit-transform: scale3d(2,2,1);\
						    -o-transform: scale3d(2,2,1);\
						    -ms-transform: scale3d(2,2,1);\
						    transform: scale3d(2,2,1);\
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