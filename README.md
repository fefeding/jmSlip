jmSlip/slip.js
=========

一个简单的WEB前端滑动组件

主页:[http://slip.jm47.com/](http://slip.jm47.com/)

开始
---
```html
<script src="../../src/jmSlip.js"></script>
<section class="banner js-banner" id="banner">
	<ul>
		<li>
		</li>
	</ul>
</section>
<script>
	var banner = 'banner'; //$('.js-banner');  //可以是id或jquery对象或原生node
	var slip = new jmSlip(banner,'page',{
		direction: 'x',
		repeat: true //这里用平铺，表示不用上面那种移动不显示的页。一般用在需要显示部分边页的情况
	});
    $(window).resize(function(){
	    slip.reset();
    });
</script>
```
参数
---
1. `element` 当前组件控制的dom容器。可以是id、jquery对象或原生node对象。
2. `type`   滑动方式，`page`、`scale`、`drag`等。
3. `option` 滑动参数。格式
```json
{
    "changeTime": 1000,  //type为page时有效。自动切换时间，毫秒
    "direction": 'x', //type为page时有效。x:横向滑动，y:纵向滑动
    "repeat": false, //是否平铺开，在type=page时，表示是否把所有页都加到容器里，否为只加入当前页和前后三页。以提高太多页时的性能。
    "loop": false, //是否循环切换，如果为true，当滑到最后一页后依然会从第一页开始向后滑。
    "onPageStart": function(page){}, //翻页前执行，return false会阻断翻页
    "onPageEnd" : function(oldpage, newpage){}, //翻页结束后执行
}
```