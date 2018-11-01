/**
 * 前端滑动组件，主要用于移动端
 * https://github.com/jiamao/jmSlip
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
		if(typeof option.minOffset == 'string'){
			minOffset = Number(option.minOffset);
		}
		//滑动项补充大小差异
		option.itemOffWidth = option.itemOffWidth || 0;
		option.itemOffHeight = option.itemOffHeight || 0;
		option.zIndex = option.zIndex || 10000;

		mode = mode || option.mode || 'page';	
		minOffset = option.minOffset || minOffset;
			
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
			case 'scrollItem': {				
				this.slipObj = new scrollItemSlip(this);
				break;
			}
			case 'drag': {
				this.slipObj = new dragSlip(this);
				break;
			}
			case 'scale': {
				this.slipObj = new scaleSlip(this);
				break;
			}
		}
		//css(el, 'overflow', 'hidden');
		this.reset();		
		this.bindEvent();//初始化手指滑动事件		
		this.auto();
	}

	//销毁组件
	slip.prototype.destory = function() {
		this.bindEvent(false); //解绑事件
		if(this.interval) {
			clearTimeout(this.interval);
		}
	}

	slip.prototype.bindEvent = function(b) {
		var self = this;
		this.touched = false;
		var startPosition = [],prePosition = [],curposition = [];
		var ydirection = '',xdirection='';
		var isMoved = false;//是否有移动过
		var startTime = null;//记录滑动开始时间
		//触控开始事件
		function onTouchStart(evt) {
			evt = evt || win.event;

			startPosition = [];
			prePosition = [];
			curposition = [];

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
			isMoved = false;

			startTime = evt.timeStamp;
			if(evt.touches && evt.touches.length) {
				for(var i=0;i<evt.touches.length;i++) {
					curposition[i] = prePosition[i] = {
						x: evt.touches[i].clientX || evt.touches[i].pageX,
						y: evt.touches[i].clientY || evt.touches[i].pageY
					};
					startPosition[i] = {
						x: curposition[i].x,
						y: curposition[i].y
					};
				}
			}
			else {
				curposition[0] = prePosition[0] = {
					x: evt.clientX || evt.pageX,
					y: evt.clientY || evt.pageY
				};
				startPosition[0] = {
					x: curposition[0].x,
					y: curposition[0].y
				};
			}

			//如果有停止动画的函数，则直接调用，否则调用默认的
			if(self.slipObj && self.slipObj.setTransition) {
				self.slipObj.setTransition(false);
			}
			else {
				self.transition(false);//停止动画
			}
			//evt.stopPropagation && evt.stopPropagation();
			//evt.preventDefault && evt.preventDefault();//阻止默认响应
		}

		//移动事件
		function onTouchMove(evt) {
			evt = evt || win.event;
			if(self.touched) {
				var offsetPos = [];

				//先把上回的点赋值给prePosition
				for(var i=0;i<prePosition.length;i++) {
					//滑动当前移动距离，让页面跟随手指移动
					if(prePosition[i] && curposition[i]) {
						prePosition[i].x = curposition[i].x;
						prePosition[i].y = curposition[i].y;
					}
				}

				if(evt.touches && evt.touches.length) {
					for(var i=0;i<evt.touches.length;i++) {
						curposition[i] = {
							x: evt.touches[i].clientX || evt.touches[i].pageX,
							y: evt.touches[i].clientY || evt.touches[i].pageY
						};
						//滑动当前移动距离，让页面跟随手指移动
						if(prePosition[i]) {
							offsetPos[i] = {
								x: curposition[i].x - prePosition[i].x,
								y: curposition[i].y - prePosition[i].y,
								absoluteX: curposition[i].x - startPosition[i].x,
								absoluteY: curposition[i].y - startPosition[i].y
							};

							if(curposition[i] && curposition[i].y > prePosition[i].y) {
								offsetPos[i].yDirection = ydirection = 'down';
							}
							else {
								offsetPos[i].yDirection = ydirection = 'up';
							}
							if(curposition[i] && curposition[i].x > prePosition[i].x) {
								offsetPos[i].xDirection = xdirection = 'right';
							}
							else {
								offsetPos[i].xDirection = xdirection = 'left';
							}
						}
					}
				}
				else {
					curposition[0] = {
						x: evt.clientX || evt.pageX,
						y: evt.clientY || evt.pageY
					};
					if(prePosition[0]) {
						//滑动当前移动距离，让页面跟随手指移动
						offsetPos[0] = {
							x: curposition[0].x - prePosition[0].x,
							y: curposition[0].y - prePosition[0].y,
							absoluteX: curposition[0].x - startPosition[0].x,
							absoluteY: curposition[0].y - startPosition[0].y
						};
						if(curposition[0] && curposition[0].y > prePosition[0].y) {
							offsetPos[0].yDirection = ydirection = 'down';
						}
						else {
							offsetPos[0].yDirection = ydirection = 'up';
						}
						if(curposition[0] && curposition[0].x > prePosition[0].x) {
							offsetPos[0].xDirection = xdirection = 'right';
						}
						else {
							offsetPos[0].xDirection = xdirection = 'left';
						}
					}
				}

				evt.prePositions = prePosition;//上一点集合
				evt.positions = curposition;//挂上所有点
				evt.offsetPos = offsetPos;//滑动参数，计算

				var off = true;
				if(self.option && self.option.onTouchMove && typeof self.option.onTouchMove == 'function') {
					var stop = self.option.onTouchMove.call(self.slipObj, evt, {
						offx:offsetPos[0]?offsetPos[0].absoluteX:0,
						offy:offsetPos[0]?offsetPos[0].absoluteY:0
					});
					//如果回调返回false , 则中止当前滑动
					if(stop === false) {
						off = false;
					}
				}

				if(off && offsetPos[0]) {
					isMoved = true;
					off = self.slipObj.offset(offsetPos[0].x, offsetPos[0].y, evt);
				}
				//如果返回中止，则中止此次移动事件
				if(off === false) {
					onTouchEnd.call(this, evt);
				}
			}
		}

		function onTouchEnd(evt) {
			evt = evt || win.event;
			//console.log(evt);
			if(self.touched) {
				var offsetPos = [];

				if(evt.touches && evt.touches.length) {
					for(var i=0;i<evt.touches.length;i++) {
						//滑动当前移动距离，让页面跟随手指移动
						if(prePosition[i]) {
							offsetPos[i] = {
								x: curposition[i].x - prePosition[i].x,
								y: curposition[i].y - prePosition[i].y,
								absoluteX: curposition[i].x - startPosition[i].x,
								absoluteY: curposition[i].y - startPosition[i].y
							};
						}
						curposition[i] = {
							x: evt.touches[i].clientX || evt.touches[i].pageX,
							y: evt.touches[i].clientY || evt.touches[i].pageY
						};
					}
				}
				else {
					if(prePosition[0]) {
						//滑动当前移动距离，让页面跟随手指移动
						offsetPos[0] = {
							x: curposition[0].x - prePosition[0].x,
							y: curposition[0].y - prePosition[0].y,
							absoluteX: curposition[0].x - startPosition[0].x,
							absoluteY: curposition[0].y - startPosition[0].y
						};
						prePosition[0].x = curposition[0].x;
						prePosition[0].y = curposition[0].y;
					}
					curposition[0] = {
						x: evt.clientX || evt.pageX,
						y: evt.clientY || evt.pageY
					};
				}

				evt.offsetPos = offsetPos;//滑动参数，计算

				if(self.option && self.option.onTouchEnd && typeof self.option.onTouchEnd == 'function') {
					var stop = self.option.onTouchEnd.call(self.slipObj, evt, {
						offx:offsetPos[0]?offsetPos[0].absoluteX:0,
						offy:offsetPos[0]?offsetPos[0].absoluteY:0
					});
					//如果回调返回false , 则中止当前滑动
					if(stop === false) {
						return;
					}
				}

				//添加动画
				//如果有启用动画的函数，则直接调用，否则调用默认的
				if(self.slipObj && self.slipObj.setTransition) {
					self.slipObj.setTransition(true);
				}
				else {
					self.transition(true);//启用动画
				}

				evt.startTime = startTime;//记录滑动起始时间

				if(isMoved && self.slipObj.end) self.slipObj.end(offsetPos[0].absoluteX, offsetPos[0].absoluteY, xdirection, ydirection, evt);

				self.touched = false;
				self.auto();
				//evt.stopPropagation && evt.stopPropagation();
				//evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
		}

		//滚轮事件
		var wheelInterval = 0;
		var wheelOff = 0;
		function onMousewheel(e){
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
		}

		if(b === false) {
			unbind(this.target, touchStart, onTouchStart);
			unbind(this.container, touchMove, onTouchMove);
			unbind(this.container, touchEnd, onTouchEnd);
			unbind(this.container, touchCancel, onTouchEnd);	
		}
		else {			
			bind(this.target, touchStart, onTouchStart);
			bind(this.container, touchMove, onTouchMove);
			bind(this.container, touchEnd, onTouchEnd);
			bind(this.container, touchCancel, onTouchEnd);	
		}

		//如果需要支持滚轮
		if(this.option.mousewheel) {
			if(b === false) unbind(document, 'mousewheel', onMousewheel);
			else {			
				bind(document, 'mousewheel', onMousewheel);
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
				//当前有多少页
				var pageCount = self.containerInner.children.length;
				if(self.slipObj.children && self.slipObj.children.length) pageCount = self.slipObj.children.length;
				//如果设置循环处理，则不需要变动方向
				if(!self.option.loop){
					if(page < 0) {
						page = 1;
						dir = 1;
					}
					else if(page >= pageCount) {
						dir = -1;
						page = self.slipObj.page + dir;
					}
				}				
				self.slipObj.go && self.slipObj.go(page, 'auto');
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
		children = children || this.containerInner.children;
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
			if(this.instance.containerInner.children[this.page]) 
				this.instance.containerInner.children[this.page].style.zIndex = this.option.zIndex;
		}
	}

	//初始化子页
	pageSlip.prototype.initChildren = function() {
        if(this.option.repeat) {
            this.children = [];
        }
		if(this.instance && this.instance.containerInner) {
			var lastIndex = 1;
			for(var i=0;i<this.instance.containerInner.children.length;i++) {
				var ch = this.instance.containerInner.children[i];
				//如果在属性中没有设置page属性，则表示为后续补齐的，设置其page
				var index = attr(ch, 'data-page');
				if(typeof index == 'undefined') {
					attr(ch, 'data-page', i%lastIndex);
				}
				else {
					lastIndex = parseInt(index, 10)+1;
				}
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
                }
                //初始化位置，如果是平铺的，则按顺序位移，否则只保留三页即可
                if(this.instance.option.direction == 'x') {
                    var offx = 0;
                    if(this.option.repeat) {
                        offx = (i - this.page) * this.pageWidth;
                    }
                    else {
                        offx = i < this.page?-this.pageWidth:i>this.page?this.pageWidth:0;
                    }
                    css(ch,'transform', 'translate3d(' + offx + 'px,0px,0px)', CSSMAP);
                }
                else {
                    var offy = 0;
                    if(this.option.repeat) {
                        offx = (i - this.page) * this.pageHeight;
                    }
                    else {
                        offy = i < this.page?-this.pageHeight:i>this.page?this.pageHeight:0;
                    }
                    css(ch,'transform', 'translate3d(0px,'+offy+'px,0px)', CSSMAP);
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

		var len = this.instance.containerInner.children.length;
		//如果设置了循环，且只有二个元素，则复制为4个
		if(len == 2 && this.option.loop) {
			for(var i=0;i<len;i++) {
				var item = this.instance.containerInner.children[i];
				attr(item, 'data-page', i);
				this.instance.containerInner.innerHTML += this.instance.containerInner.children[i].outerHTML;
			}
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
		var nextpage = this.children[parseInt(this.page||0,10) + 1];

		//当前页没加入则直接加入
		if(curpage && !curpage.parentNode && !this.option.repeat) this.instance.containerInner.appendChild(curpage);

		//如果设置了循环，则最后一面后再回到第一页
		if(this.option.loop) {
			//如果没有上一页，则循环到最后一页
			if(!prepage) prepage = this.children[this.children.length - 1];
			//如果没有下一页，则循 环到第一页
			if(!nextpage) nextpage = this.children[0];
		}
		if(offx !== false) {
			if(this.option.locked && !prepage && offx > 0) {
				//如果锁定，则不能滑出当前区域
				return;
			}
			if(this.option.locked && !nextpage && offx < 0) {
				//如果锁定，则不能滑出当前区域
				return;
			}

            if(this.option.repeat) {
                for(var i=0;i<this.children.length;i++) {
                    var ox = (i - this.page) * this.pageWidth + offx;
                    css(this.children[i],'transform', 'translate3d(' + ox + 'px,0px,0px)', CSSMAP);
                }
            }
            else {
                if(prepage) {
                    css(prepage,'transform', 'translate3d(' + (offx - this.pageWidth) + 'px,0px,0px)', CSSMAP);
                }

                if(nextpage) {
                    css(nextpage,'transform', 'translate3d(' + (this.pageWidth + offx) + 'px,0px,0px)', CSSMAP);
                }

                var tranX = 'translate3d(' + offx + 'px,0px,0px)';
                if(curpage) {
                    css(curpage,'transform', tranX, CSSMAP);
                    curpage.style.zIndex = this.option.zIndex;
                }
            }
			this.offsetX = offx;
		}
		if(offy !== false) {
			if(this.option.locked && !prepage && offy > 0) {
				//如果锁定，则不能滑出当前区域
				return;
			}
			if(this.option.locked && !nextpage && offy < 0) {
				//如果锁定，则不能滑出当前区域
				return;
			}
			if(!prepage && this.option.locked) return;

            if(this.option.repeat) {
                for(var i=0;i<this.children.length;i++) {
                    var oy = (i - this.page) * this.pageHeight + offy;
                    css(this.children[i],'transform', 'translate3d(0px,' + oy + 'px,0px)', CSSMAP);
                }
            }
            else {
                if(prepage) {
                    css(prepage,'transform', 'translate3d(0px,' + (offy - this.pageHeight) + 'px,0px)', CSSMAP);
                }

                if(nextpage) {
                    css(nextpage,'transform', 'translate3d(0px,' + (this.pageHeight + offy) + 'px,0px)', CSSMAP);
                }

                var tranY = 'translate3d(0px,' + offy + 'px,0px)';
                if(curpage) {
                    css(curpage,'transform', tranY, CSSMAP);
                    curpage.style.zIndex = this.option.zIndex;
                }
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
	pageSlip.prototype.go = function(page, actionType) {		
		var len = this.children.length;
		var oldpage = this.page;
		if(page < 0) {
			//如果设置了循环，则头尾相接
			if(this.option.loop) {
				page = len - 1;
			}
			else {
				page = 0;
			}
		}
		else if(page > len - 1) {
			if(this.option.loop) {
				page = 0;
			}
			else {
				page = len - 1;
			}
		}
		//如果页面没有改变。则不执行后面的
		//if(page == oldpage) return;

		//翻页前先调用自定义回调，如果返回false则中止
		if(this.option && this.option.onPageStart && typeof this.option.onPageStart == 'function') {
			var stop = this.option.onPageStart.call(this, page, oldpage, actionType);
			//如果回调返回false , 则中止
			if(stop === false) {
				this.reset();
				return;
			}
		}

        this.page = this.instance.page = page;

        //只保留 三页
        if(!this.option.repeat) {
            var curpage = this.children[page];
            curpage && (curpage.style.zIndex = this.option.zIndex);
            if(oldpage > page) {
                if(!this.option.repeat) {
                    //去掉后面的一页
                    var lastpage = this.children[oldpage + 1];
                    if(lastpage && curpage != lastpage && lastpage.parentNode) this.instance.containerInner.removeChild(lastpage);
                    //如果是从最后一页到第一页，则下一页为第二页,加入后面
                    else if(!lastpage && page == 0) {
                        var lastpage = this.children[page + 1];
                        if(lastpage) {
                            lastpage.style.zIndex = this.option.zIndex - 2;
                            !lastpage.parentNode && this.instance.containerInner.appendChild(lastpage);
                        }
                    }
                }
                //插入第一页
                var firstpage = this.children[page - 1];
                //如果有设置循环翻页，则第一页后跳到最后一页
                if(!firstpage && page === 0 && this.option.loop) {
                    firstpage = this.children[len - 1];
                }
                if(firstpage) {
                    //如果原页为最后一个，且跳到第二个页，这时就会导致第一个页面从最后跳到第一个，把它置底，省得会挡住动画
                    if(oldpage == len-1 || page == 1) firstpage.style.zIndex = this.option.zIndex - 2;
                    if(this.instance.option.direction == 'x') {
                        css(firstpage,'transform', 'translate3d(' + (0 - this.pageWidth) + 'px,0px,0px)', CSSMAP);
                    }
                    else css(firstpage,'transform', 'translate3d(0px,' + (0 - this.pageHeight) + 'px,0px)', CSSMAP);
                    if(!this.option.repeat && !firstpage.parentNode) {
                        firstpage.style.zIndex = this.option.zIndex - 2;
                        if(curpage.parentNode) this.instance.containerInner.insertBefore(firstpage, curpage);
                        else this.instance.containerInner.appendChild(firstpage);
                    }
                }
            }
            else if(oldpage < page) {
                if(!this.option.repeat) {
                    //去掉第一页
                    var firstpage = this.children[oldpage - 1];
                    if(firstpage && curpage != firstpage && firstpage.parentNode) this.instance.containerInner.removeChild(firstpage);

                    if(oldpage === 0 && page === len-1 && !firstpage) {
                        firstpage = this.children[page - 1];
                        if(firstpage) {
                            firstpage.style.zIndex = this.option.zIndex - 2;
                            if(!firstpage.parentNode) {
                                if(curpage.parentNode) this.instance.containerInner.insertBefore(firstpage, curpage);
                                else this.instance.containerInner.appendChild(firstpage);
                            }
                        }
                    }
                }

                var lastpage = this.children[page + 1];
                //如果有设置循环翻页，则最后一页后面跟着的是第一页
                if(!lastpage && page === len-1 && this.option.loop) {
                    lastpage = this.children[0];
                }
                if(lastpage) {
                    //如果原页为第一个，且跳到最后第二页，这时就会导致最后一页从第一个跳到最后，把它置底，省得会挡住动画
                    if(oldpage == 0 || page == len-2) lastpage.style.zIndex = this.option.zIndex - 2;
                    if(this.instance.option.direction == 'x') css(lastpage,'transform', 'translate3d(' + this.pageWidth + 'px,0px,0px)', CSSMAP);
                    else css(lastpage,'transform', 'translate3d(0px,' + this.pageHeight + 'px,0px)', CSSMAP);
                    if(!this.option.repeat && !lastpage.parentNode) {
                        lastpage.style.zIndex = this.option.zIndex - 2;
                        this.instance.containerInner.appendChild(lastpage);
                    }
                }
            }
            //如果不变，则只保留三页
            else if(!this.option.repeat && this.instance.containerInner.children.length > 3) {
                var chlen = this.instance.containerInner.children.length;
                for(var i=chlen-1;i>=0;i--) {
                    var ch = this.instance.containerInner.children[i];
                    if(i < page - 1 || i > page + 1) {
                        if(page == 0 && this.option.loop && i == chlen-1) continue;
                        else if(page == chlen-1 && this.option.loop && i == 0) continue;
                        if(ch.parentNode  && curpage != ch) this.instance.containerInner.removeChild(ch);
                    }
                }
            }
        }
        else {
            this.initChildren();
        }
		this.move(0, 0);

		//翻页后先调用自定义回调，以备做一些其它自定义处理
		if(this.option && this.option.onPageEnd && typeof this.option.onPageEnd == 'function') {
			var pageindex = curpage?(attr(curpage, 'data-page') || page):page;
			this.option.onPageEnd.call(this, oldpage, pageindex, actionType);
		}
		//执行动画结束后效果处理
		//this.pageEnd(oldpage, page);
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
			var w = this.instance.option.paddingRight||0;
			for(var i=0;i<len;i++) {
				w += this.instance.containerInner.children[i].offsetWidth + this.instance.option.itemOffWidth;
			}
			css(this.instance.containerInner, 'min-width', w + 'px');
		}
		//纵向滑动，容器高度为每个子元素高度和
		else {
			var h = this.instance.option.paddingBottom||0;
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
					minOffset && this.offset(xdirection=='left'?-minOffset:minOffset, false);
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
					minOffset && this.offset(false, ydirection=='up'?-minOffset:minOffset);
				}
			}
		}
		//滚动事件回调
		if(this.instance.option.onScrollEnd) this.instance.option.onScrollEnd.call(this, this.offsetX, this.offsetY, xdirection, ydirection, evt);
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

	/**
	 * 滑动列表中的子项，但事件是绑在了父节点
	 *
	 */
	function scrollItemSlip(instance) {
		this.instance = instance;
		this.option = instance.option;
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	scrollItemSlip.prototype.reset = function(target) {	
		//如果指定了某个对象，则只对它复位
		if(target) {
			//归位
			this.move(0, 0, target);
			this.setTransition(true, target);
			return;
		}
		var self = this;
		//设定元素动画
		setTimeout(function(){
			var len = self.instance.container.children.length;
			for(var i=0;i<len;i++) {
				var target = self.instance.container.children[i];
				//如果有指定CSS选择器
				if(self.option.itemSelector) {
					target = target.querySelector(self.option.itemSelector);
					if(!target) continue;//没找到就不处理
				}
				self.reset(target);
			}			
		},10);	
	}

	/**
	 * 启用或停止动画效果
	 * 主要用在拖动时，更灵敏
	 */
	scrollItemSlip.prototype.setTransition = function(b, el) {
		//如果指定了元素，则直接设置它即可
		if(el) {			
			this.instance.transition(!!b, el);
			return;
		}

		var len = this.instance.container.children.length;
		for(var i=0;i<len;i++) {
			var target = this.instance.container.children[i];
			//如果有指定CSS选择器
			if(this.option.itemSelector) {
				target = target.querySelector(this.option.itemSelector);
			}
			if(target) {
				this.setTransition(b, target);
			}
		}
	}

	/**
	 * 动画偏移
	 * 并组止符合条件的事件默认效果，别能在事件全局阻止，会影响业务上的事件
	 *
	 */
	scrollItemSlip.prototype.offset = function(offx, offy, evt) {
		if(!evt) return;
		var target = evt.target||evt.srcElement;		
		//如果有指定CSS选择器
		if(this.option.itemSelector) {
			target = elParent(target, this.option.itemSelector);
			if(!target) return;//没找到就不处理
		}
		if(this.instance.option.direction == 'x') {
			//只有在横向移动更多才移动
			if(Math.abs(offx) > Math.abs(offy)) {
				var tx = Number(attr(target, 'data-offsetx'))||0;//读取当前偏移量
				offx += tx;

				var maxoff = this.option.maxOffset||target.offsetWidth;

				//如果有指定滑向，则不能反向滑
				if(this.option.orientation == 'left' && (offx > 0 || offx < -maxoff)) return
				else if(this.option.orientation == 'right' && (offx < 0 || offx > maxoff)) return;

				evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
			else offx = false;
			offy = false;
		}
		else {
			//只有在横向移动更多才移动
			if(Math.abs(offy) > Math.abs(offx)) {
				var ty = Number(attr(target, 'data-offsety'))||0;//读取当前偏移量
				offy += ty;

				var maxoff = this.option.maxOffset||target.offsetHeight;

				//如果有指定滑向，则不能反向滑
				if(this.option.orientation == 'top' && (offy > 0 || offy < -maxoff)) return
				else if(this.option.orientation == 'bottom' && (offy < 0 || offy > maxoff)) return;

				evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
			else offy = false;			
			offx = false;
		}
		return this.move(offx, offy, target);
	}

	/**
	 * 手指滑动移动事件
	 *
	 */
	scrollItemSlip.prototype.move = function(offx, offy, target) {			
		if(!target) return;

		if(offx !== false) {
			var tranX = 'translate3d(' + offx + 'px,0px,0px)';		
			css(target,'transform', tranX, CSSMAP);
			attr(target, 'data-offsetx', offx);//把偏移量写到属性中
		}
		if(offy !== false) {	
			var tranY = 'translate3d(0px,' + offy + 'px,0px)';		
			css(target,'transform', tranY, CSSMAP);
			attr(target, 'data-offsety', offy);//把偏移量写到属性中
		}
	}

	/**
	 * 滑动结束事件
	 */
	scrollItemSlip.prototype.end = function(offx, offy, xdirection, ydirection, evt) {
		var target = evt.target||evt.srcElement;		
		//如果有指定CSS选择器
		if(this.option.itemSelector) {
			target = elParent(target, this.option.itemSelector);
			if(!target) return;//没找到就不处理
		}

		if(this.instance.option.direction == 'x') {
			var tx = Number(attr(target, 'data-offsetx'))||0;
			if(!tx) return;

			//如果只能左向滑，则复位
			if((tx > 0 && this.option.orientation == 'left') || (tx < 0 && this.option.orientation == 'right')) this.reset(target);
			else {
				var maxoff = this.option.maxOffset||target.offsetWidth;
				//左向滑，如果超过了一半最大滑动，则滑满
				if(this.option.orientation == 'left' && tx <= -maxoff/2) {
					this.move(-maxoff , false, target);
				}
				//右向滑，如果超过了一半最大滑动，则滑满
				else if(this.option.orientation == 'right' && tx >= maxoff/2) {
					this.move(maxoff , false, target);
				}
				else {
					//复位
					this.reset(target);
				}
			}
		}
		else {
			var ty = Number(attr(target, 'data-offsety'))||0;
			if(!ty) return;

			if((ty > 0 && this.option.orientation == 'top')||(ty<0 && this.option.orientation == 'bottom')) this.reset(target);
			else {
				var maxoff = this.option.maxOffset||target.offsetHeight;
				//上向滑，如果超过了一半最大滑动，则滑满
				if(this.option.orientation == 'top' && ty <= -maxoff/2) {
					this.move(false, -maxoff, target);
				}
				//下向滑，如果超过了一半最大滑动，则滑满
				else if(this.option.orientation == 'bottom' && ty >= maxoff/2) {
					this.move(false , maxoff, target);
				}
				else {
					//复位
					this.reset(target);
				}
			}
		}
		
		//如果上一个不是这个，且设置了互斥，则回位上一个
		if(this.last_target && this.last_target != target) {
			this.reset(this.last_target);
		}
		this.last_target = target;

		//滚动事件回调
		if(this.instance.option.onScrollEnd) this.instance.option.onScrollEnd.call(this, tx, ty, xdirection, ydirection, evt, target);
	};

	/**
	 * 缩放对象
	 *
	 */
	function scaleSlip(instance) {
		this.instance = instance;

		this.option = instance.option;
		instance.containerInner = this.option.target || instance.containerInner;

		this.offsetY = 0;
		this.offsetX = 0;
		this.scaleX = 1;
		this.scaleY = 1;
	}

	/**
	 * 重置和初始化滑动对象
	 *
	 */
	scaleSlip.prototype.reset = function() {
		this.set(1, 0, 0);
	}

	/**
	 * 动画偏移
	 *
	 */
	scaleSlip.prototype.offset = function(offx, offy, evt) {
		//计算二手指滑动距离，然后再通过在父容器中的占比得到缩放比例
		if(evt.offsetPos && evt.offsetPos.length == 2) {
			//上次滑动二指的距离
			var preOffX = evt.prePositions[0].x - evt.prePositions[1].x;
			var preOffY = evt.prePositions[0].y - evt.prePositions[1].y;
			var preDis = Math.sqrt(preOffX * preOffX + preOffY * preOffY);
			//当次滑动二指的距离
			var curOffX = evt.positions[0].x - evt.positions[1].x;
			var curOffY = evt.positions[0].y - evt.positions[1].y;
			var curDis = Math.sqrt(curOffX * curOffX + curOffY * curOffY);

			var disx = Math.abs(preOffX - curOffX);//x轴滑行的距离
			var disy = Math.abs(preOffY - curOffY);//y轴滑行的距离

			var cW = this.instance.container.offsetWidth || this.instance.container.clientWidth;
			var cH = this.instance.container.offsetHeight || this.instance.container.clientHeight;
			if(!cW || !cH) return;
			//计算放大比例
			var offxper = disx / cW;
			var offyper = disy / cH;

			//往外拉，则表示放大
			if(preDis < curDis) {
				var per = this.scaleX + this.scaleX * Math.max(offxper, offyper);
			}
			//缩小
			else if(preDis > curDis) {
				var per = this.scaleX * Math.min(1 - offxper, 1- offyper);
			}
			if(per) {
				if(this.option.onScaleStart) {
					var o = this.option.onScaleStart(per, evt);
					if(o === false) return;
				}
				this.set(per);//缩放
				this.option.onScaleEnd && this.option.onScaleEnd(per, evt);
				evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
			}
        }
        //如果支持滑动。则单指表示
        else if(this.option.supportTranslate && evt.offsetPos && evt.offsetPos.length == 1) {
            if(offx === false) offx = this.offsetX;
            if(offy === false) offy = this.offsetY;

            this.set(0, this.offsetX + offx, this.offsetY + offy);

            evt && evt.preventDefault && evt.preventDefault();//阻止默认响应
        }
	}

	/**
	 * 设置scall 或偏移量
	 *
	 */
	scaleSlip.prototype.set = function(v, offx, offy) {
        if(!v) v = this.scaleX;
        if(typeof offx == 'undefined') offx = this.offsetX;
        if(typeof offy == 'undefined') offy = this.offsetY;

        this.offsetX = offx;
        this.offsetY = offy;

		var tranX = 'scale3d(' + v + ',' + v + ',1) translate3d(' + offx + 'px,'+ offy +'px,0px)';
		css(this.instance.containerInner,'transform', tranX, CSSMAP);
		this.scaleX = this.scaleY = v;
	}

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

	/**
	 * 解绑事件
	 * 
	 * @method bind
	 * @param {element} html元素对象
	 * @param {string} name 事件名称
	 * @param {function} fun 事件委托
	 */
	function unbind(target,name,fun) {
		if(target.removeEventListener) {
	        target.removeEventListener(name,fun, false);
	        return true;
	    }
	    else if(target.detachEvent) {
	        return target.detachEvent("on"+name,fun);
	    }  
	    return false;
	}

	//检查对象是否为数组
	function isArray(arr) {
		var t = Object.prototype.toString.call(arr);		
	    return t == '[object Array]' || t == '[object NodeList]';
	}	

	//查找元素父级，通过选择器先择
	function elParent(el, selector) {
		var parent = el.parentElement||el.parentNode;
		if(!parent) return null;
		var sel = parent.querySelector(selector);
		if(sel && sel == el) return el;
		//如果没有找到，，则继续从父元素找，直接找完为止
		else {
			return elParent(parent, selector);
		}
	}

	// 有 Sea.js 等 CMD 模块加载器存在
	if (typeof define === "function" && define.cmd) {
	  	define(function(require, exports, module) {
	  		module.exports = jmSlip;
	  	});
	}

	return win.jmSlip = jmSlip;
})(window, document);