jmSlip/slip.js
=========

一个简单的WEB前端滑动组件

主页:[http://jiamao.github.io/jmSlip/](http://jiamao.github.io/jmSlip/)

开始
---
```html
<script src="../../src/jmSlip.js"></script>
<section class="banner js-banner" id="banner">
	<ul>
	<li></li>
	</ul>
</section>
<script>
	var banner = 'banner'; //$('.js-banner');  //可以是id或jquery对象或原生node
	var slip = new jmSlip(banner,'page', {
		direction: 'x',
		repeat: true //这里用平铺
	});
	//窗口改变
    window.onresize = function(){
	    slip.reset();
    };
</script>
```
### 参数
1. `element` 当前组件控制的dom容器。可以是id、jquery对象或原生node对象。
2. `type`   滑动方式，`page`、`scale`、`drag`等。
3. `option` 滑动参数。格式
```javascript
{
    "direction": 'x', //type为page时有效。x:横向滑动，y:纵向滑动
    "onPageStart": function(page){
	}, 
	//翻页结束后执行
	"onPageEnd" : function(oldpage, newpage){}, 
	//滑动开始事件
	"onTouchStart": function(e){
		//return false 阻止
	},
	//滑动中
	"onTouchMove": function(e, offset){
		//return false 阻止
		//offset: {offx:0,offy:0}     移动距离
	},
	//结束滑动
	"onTouchEnd": function(e, offset) {
		//return false 阻止
		//offset: {offx:0,offy:0}     移动距离
	}
}
```

## 翻页(page)
按页切换
* 横向翻页：[http://jiamao.github.io/jmSlip/demo/page/x.html](http://jiamao.github.io/jmSlip/demo/page/x.html)
```javascript
var slip = new jmSlip(banner1,'page',{
		//changeTime: 1000, 
		direction: 'x',
		repeat: false,
		//是否循环切换，如果为true，当滑到最后一页后依然会从第一页开始向后滑。如果设为true，最好把repeat也指定为false
		loop: true,
		mousewheel:true,//支持滚轮
		onPageStart: function(page) {
			console.log(page);
			//if(page > 2) return false; //可按条件阻断翻页
		}, //翻页开始前回调，如果返回false则翻页中止
		onPageEnd: function(oldpage, newpage){
			console.log(oldpage);
			console.log(newpage);
			
		} ,//翻页结束回调
		onTouchStart: function(evt){
			console.log(evt);
		}, //滑动开始，返回false中止滑动
		onTouchMove: function(evt, offset){
			evt.preventDefault();
			console.log(evt);
			console.log(offset);//相对于start的位移
		}, //滑动中，返回false中止
		onTouchEnd: function(evt){
			console.log(evt);
		} //滑动结束，返回false中止
	});
```
* 纵向翻页 [http://jiamao.github.io/jmSlip/demo/page/y.html](http://jiamao.github.io/jmSlip/demo/page/y.html)
```javascript
var slip = new jmSlip('wrap','page',{
	changeTime: 0,
	//是否循环切换，如果为true，当滑到最后一页后依然会从第一页开始向后滑。如果设为true，最好把repeat也指定为false
	loop: true,
	mousewheel:true, //支持滚轮
	onPageStart: function(page) {
		console.log(page);
	}, //翻页开始前回调，如果返回false则翻页中止
	onPageEnd: function(oldpage, newpage){
		console.log(oldpage);
		console.log(newpage);
	} ,//翻页结束回调
	onTouchStart: function(evt){
		console.log(evt);
	}, //滑动开始，返回false中止滑动
	onTouchMove: function(evt, offset){
		evt.preventDefault();
		console.log(evt);
		console.log(offset);//相对于start的位移
	}, //滑动中，返回false中止
	onTouchEnd: function(evt){
		console.log(evt);
	} //滑动结束，返回false中止
});
```

## 滚动选中(item)
一排滚动，中心位被选中效果。
示例：[http://jiamao.github.io/jmSlip/demo/item/index.html](http://jiamao.github.io/jmSlip/demo/item/index.html)
```javascript
var slip = new jmSlip('banner','item',{
	//changeTime: 1500, 
	direction: 'x', 
	page: 0, //默认所在项
	duration: 800, //滚动延时
	itemOffWidth: 1, //每个项需要计算的偏移量。一般用作间距
	onTouchStart: function(){
		//$('#banner li.cur').toggleClass('cur',false);
	},
	onTouchMove: function(evt, offset) {
		evt.preventDefault();
		//找到中间项，然后让它滑过中间时放大
		var len = this.instance.containerInner.children.length;		
		var leftwidth = 0;
		var lastoffx = 0;
		var lastindex = 0;
		var mleft = this.instance.container.offsetWidth / 2 - this.offsetX;
		//找到离中间最近的项
		for(var i=0;i<len;i++) {		
			var itemw = this.instance.containerInner.children[i].offsetWidth; 			
			leftwidth += itemw;
			var c = leftwidth - itemw / 2;
			if(c >= mleft) {
				var curoffx = Math.abs(c - mleft);
				if(lastindex != i) {
					var sc = Math.max((1-lastoffx / itemw),0) * 0.2 + 0.8;
					$('#banner li').eq(lastindex).css('transform', 'scale3d('+sc+', '+sc+', 1)');
				}
				var sc = Math.max((1 - curoffx / itemw),0) * 0.2 + 0.8;
				$('#banner li').eq(i).css('transform', 'scale3d('+sc+', '+sc+', 1)');
				break;
			}
			//离项中间的距离
			lastoffx = Math.abs(mleft - c);
			lastindex = i;
		}	
	},
	onPageStart: function(p) {
		//限制这跳到第三个项，超过注返回第三个
		/*if(p > 2) {
			this.go(2);
			return false;
		}*/
	},
	onPageEnd: function(oldPage,newPage) {		
		setTimeout(function(){
			$('#banner li.cur').toggleClass('cur',false);
			$('#banner li').eq(newPage).toggleClass('cur',true);
		},100);		
	}
});
```

## 缩放(scale)
主要用于图片的缩放操作
示例：[https://jiamao.github.io/jmSlip/demo/scale/index.html](https://jiamao.github.io/jmSlip/demo/scale/index.html)

```javascript
var slip = new jmSlip(container, 'scale', {
        target: container.find('img')[0], //被操作的img对象
        supportTranslate: true,//是否支持移动
        maxScale: 4, //最大放大4倍
        minScale: 0.1, //最小缩小到10%
        onTouchMove: function(e){
            //if(e.offsetPos.length == 2)container.append(JSON.stringify(e.offsetPos));
        },
        onScaleStart: function(per, e) {
            container.append('scale:' + per + '<br />');
        }
    });
```

## 拖放(drag)
拖放对象，可以做一些贴边操作
示例：[https://jiamao.github.io/jmSlip/demo/drag/index.html](https://jiamao.github.io/jmSlip/demo/drag/index.html)
```javascript
var entry = $('.act-enter');
var slip = new jmSlip(entry,'drag', {
	onTouchStart: function(e){
      e && e.preventDefault && e.preventDefault();//阻止默认响应
    },
	dragEnd: function() {	
		var offx = this.offsetX;//当前偏移量
		var offy = this.offsetY;

		var posw = entry.offset().left + entry.width() / 2;
		var winw = $(window).width();
		//如果偏左的话，则定到左侧
		if(posw <= winw / 2) {
			offx -= entry.offset().left;           
		}
		else {
			offx += winw - posw - entry.width() / 2;  
		}
		//粘到左右边上
		this.move(offx, offy);
	}
});
```

## 滚动(scroll)
跟原生滚动条类似
示例：[http://jiamao.github.io/jmSlip/demo/scroll/index.html](http://jiamao.github.io/jmSlip/demo/scroll/index.html)

列表操作项：[http://jiamao.github.io/jmSlip/demo/scroll/scroll_item.html](http://jiamao.github.io/jmSlip/demo/scroll/scroll_item.html)