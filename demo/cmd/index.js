
define(function(require, exports){
	var $ = require('./zepto.js');
	var jmSlip = require('../../src/jmSlip.js?20141112');
	exports.init = function(){
		//需要传入依赖的jquery/zepto
		var slip = new jmSlip('banner','page',
				{
					changeTime: 2000, 
					direction: 'x'
				});

		$(window).resize(function(){

			slip.reset();
		});
	}
})