/**
 * 
 *Gallery3d
 *Description:html5+原生javascript,css3实现的3d 相册
 *Auther: Liyuan Dong
 *Version: 0.1
 *Github: https://github.com/happydongzh
 *Date: Jan/12/2017
 *
 *
 *
 * Bugs:
 *
 *
 * Coming soon:
 	1. remove elements
	2. add elements when scroll to Z bottom.
	
 **/



(function () {

	//var colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e', '#607d8b'];

	var winSize = {
		w: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
		h: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
	};

	function Gallery3d(domElmt, options) {
		var self = this;
		this.containers = domElmt;

		this.settings = {
			//container Size, 如果自定义了size，则窗口改变大小时不调整元素
			layerConSize: {
				w: Math.floor(winSize.w * 0.8),
				h: Math.floor(winSize.h * 0.8)
			},
			//child element size
			elmtSize: {
				w: Math.floor(winSize.w / 10),
				h: Math.floor(winSize.h / 10)
			},

			//排列形式，random：散列 | martrix：矩阵
			effect: 'hash',

			//元素形状，可选circle | rect,默认 rect
			style: options.style || 'rect',

			//景深
			perspective: 1000,

			//点击切换元素时是否保持原来3d状态
			keepState: true,

			elementRender: null,

			elementClick: null,
			//点击元素时,是否幻灯片显示 open slide-show when cell click
			osswcc: true

		};
		if (options && typeof options === 'object') {
			for (p in options) {
				this.settings[p] = options[p];
			}
			this.dynamicSize = options['layerConSize'] ? false : true;
		};

		this.data = [],
			this.timer = null,
			this.processing = true,
			this.isOpen = false, this.loading;
		this.transformState = {},
			this.perspective = this.settings.perspective || 1000,
			this.rotate3d = {
				x: 0,
				y: 0,
				z: 0
			},
			this.translate3d = {
				x: 0,
				y: 0,
				z: 0
			};

		self.init();
	};

	Gallery3d.prototype = {
		//初始化dom
		init: function () {

			//创建loading元素
			var _loadingDiv = document.createElement('DIV')
			var _loading = document.createElement('DIV');
			_loadingDiv.appendChild(_loading);
			document.body.appendChild(_loadingDiv);
			_loading.appendChild(document.createElement('DIV'));
			_loading.className = 'loading';
			_loading.style.width = '60px';
			_loading.style.height = '60px';
			_loading.style.top = (winSize.h - 60) / 2 + 'px';
			_loading.style.left = (winSize.w - 60) / 2 + 'px';
			this.loading = _loadingDiv;


			//设置container元素样式
			this.containers.style.width = this.settings.layerConSize.w + 'px';
			this.containers.style.height = this.settings.layerConSize.h + 'px';
			this.containers.style.margin = (winSize.h - this.settings.layerConSize.h) / 2 + 'px auto';

			//设置loading元素样式
			this.loading.style.display = '';
			this.loading.style.width = '100%';
			this.loading.style.height = '100%';
			this.loading.style.backgroundColor = '#000';
			this.loading.style.opacity = '0.7';
			this.loading.style.position = 'absolute';
			this.loading.style.top = '0';
			this.loading.style.left = '0';

			this.initEventsListeners();
		},
		//初始化事件监听
		initEventsListeners: function () {
			var self = this,
				step = 100,
				mousedown = false,
				targetSpan = {};

			function updateTransform() {
				self.containers.style.transform = 'rotateX(' + self.rotate3d.y + 'deg) rotateY(' + -self.rotate3d.x + 'deg) rotateZ(' + self.rotate3d.z + 'deg) translateX(' + self.translate3d.x + 'px) translateY(' + self.translate3d.y + 'px) translateZ(' + self.translate3d.z + 'px) ';
			};

			var _support = "onwheel" in document.createElement("div") ? "wheel" : // 各个厂商的高版本浏览器都支持"wheel"
				document.onmousewheel !== undefined ? "mousewheel" : // Webkit 和 IE一定支持"mousewheel"
				"DOMMouseScroll"; // 低版本firefox
			window.addEventListener(_support, function (e) {
				var childLength = self.containers.children.length;
				if (childLength == 0) return;

				if (self.processing) return;

				var zoomIn = e.deltaY > 0;
				if (zoomIn) { //zoom in 放大
					if (self.translate3d.z >= self.perspective) {
						self.translate3d.z = self.perspective;
						console.log(self.perspective);
					} else {
						self.translate3d.z += 100;
					}
				} else { //zoom out 缩小
					if (self.translate3d.z <= 0) {
						self.translate3d.z = 0
					} else {
						self.translate3d.z -= 100;
					}
				}

				updateTransform();

				//				if (self.translate3d.z >= self.perspective / 2) {
				//					self.perspective += 5000;
				//					console.log(self.perspective);
				//					self.more();
				//				}

			}, false);

			window.addEventListener('mousedown', function (e) {
				if (self.processing) return;

				mousedown = true;
			}, false);

			window.addEventListener('mouseup', function (e) {
				if (self.processing) return;

				mousedown = false;
			}, false);

			window.addEventListener('mousemove', function (e) {
				if (!mousedown) return;

				if (self.processing) return;

				var x = Math.round(step / (self.settings.layerConSize.w / 2) * (self.settings.layerConSize.w / 2 - e.clientX)),
					y = Math.round(step / (self.settings.layerConSize.h / 2) * (self.settings.layerConSize.h / 2 - e.clientY));

				self.rotate3d.x = x;
				self.rotate3d.y = y;
				updateTransform();
			}, false);

			window.addEventListener('keydown', function (e) {
				if (self.processing) return;

				switch (e.keyCode) {
				case 37:
					self.translate3d.x--
						break;
				case 38:
					self.translate3d.y--
						break;
				case 39:
					self.translate3d.x++
						break;
				case 40:
					self.translate3d.y++
						break;
				default:

				};


				self.containers.style.transform = 'rotateX(' + self.rotate3d.y + 'deg) rotateY(' + -self.rotate3d.x + 'deg) rotateZ(' + self.rotate3d.z + 'deg) translateX(' + self.translate3d.x * step + 'px) translateY(' + self.translate3d.y * step + 'px) translateZ(' + self.translate3d.z + 'px) ';

			}, false);
			window.addEventListener('resize', function () {
				//console.log('resizing...');
				if (!self.dynamicSize) {
					return;
				}

				winSize = {
					w: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
					h: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
				};
				self.settings.layerConSize.w = Math.floor(winSize.w * 0.8);
				self.settings.layerConSize.h = Math.floor(winSize.h * 0.8);

				self.containers.style.width = self.settings.layerConSize.w + 'px';
				self.containers.style.height = self.settings.layerConSize.h + 'px';
				self.loading.firstChild.style.top = (winSize.h - 60) / 2 + 'px';
				self.loading.firstChild.style.left = (winSize.w - 60) / 2 + 'px';

				self.perspective = self.settings.perspective;
				var domElmts = self.containers.children;

				self.settings.effect == 'hash' ?
					self.placeElementRandom(domElmts) : self.placeElementMartrix(domElmts);
			}, false);
			self.containers.addEventListener('click', function (e) {
				if (!self.settings.osswcc) return;

				if (e.target != e.currentTarget) {
					var elmt = e.target.parentNode != e.currentTarget ? e.target.parentNode : e.target.children[0];
					self.slideShow(elmt);
				} else {
					self.slideClose();
				}
			}, false);

		},
		//创建元素
		domElementCreate: function (number) {
			var self = this;
			var elms = [];
			for (var i = 0; i < number; i++) {
				var elm = document.createElement('div');
				elm.style.width = self.settings.elmtSize.w + 'px';
				elm.style.height = self.settings.elmtSize.h + 'px';
				if (self.settings.style == 'circle') {
					elm.style.borderRadius = '50%';
				}
				/**
				comming soon
				if (self.settings.style) {
					if (typeof self.settings.style === 'object') {
						for (p in self.settings.style) {
							elm.style[p] = self.settings.style[p].replace('_color_', colors[Math.floor(Math.random() * colors.length)])
						}
					}
				}
				**/
				elm.className = 'invisible';
				if (self.settings.elementRender != null) {
					self.settings.elementRender(elm, self.data[i]);
				}
				if (self.settings.elementClick != null && typeof self.settings.elementClick === 'function') {
					var elmData = self.data[i];
					elm.addEventListener('click', function (e) {
						self.settings.elementClick.call(this, elmData);
					}, false);
				}
				self.containers.appendChild(elm);
				elms.push(elm);
			}
			return elms;
		},
		//定位元素--散列
		placeElementRandom: function (domElmts) {
			var self = this;
			var elms = domElmts;
			var ps = [];
			for (var i = 0; i < elms.length; i++) {
				var elm = elms[i];
				var t = Math.floor(Math.random() * self.settings.layerConSize.h),
					l = Math.floor(Math.random() * self.settings.layerConSize.w),
					transValue = Math.floor((Math.random()) * self.perspective);

				elm.style.top = t + 'px';
				elm.style.left = l + 'px';
				elm.style.transform = 'translateZ(' + -transValue + 'px)';
				if (self.isOpen) {
					elm.style.width = self.settings.elmtSize.w + 'px';
					elm.style.height = self.settings.elmtSize.h + 'px';
				}
				ps.push(transValue);
			}

			//重新设置景深为最后一个元素的Z位置
			var perst = Math.max.apply(Math, ps);
			//console.log(self.perspective + '|' + perst);
			//self.perspective = Math.min(self.perspective, perst) * 5;
			self.perspective += 300; //Math.min(self.perspective, perst) * 5;
			self.show(elms);

		},
		//定位元素--矩阵
		placeElementMartrix: function (domElmts) {
			var self = this;
			var elmts = domElmts;
			var amount = domElmts.length,
				lStep = self.settings.elmtSize.w + 50, //x轴间距
				tStep = self.settings.elmtSize.h + 50, //y轴间距
				zStep = (lStep < tStep ? lStep : tStep) / 2, //z轴间距
				cols = Math.floor(self.settings.layerConSize.w / lStep), //列的数量
				rows = Math.floor(self.settings.layerConSize.h / tStep), //行的数量
				zCount = Math.ceil(amount / (cols * rows)), //层的数量

				count = 0, //计数器
				t = 0, //y轴坐标计数器
				l = 0, //x轴坐标计数器
				xSpace = (self.settings.layerConSize.w - lStep * cols) / 2, //左右间距
				ySpace = (self.settings.layerConSize.h - tStep * rows) / 2, //上下间距
				z = 0,
				r = 0,
				c = 0;
			for (; z < zCount; z++) {
				for (; r < rows; r++) {
					for (; c < cols; c++) {
						if (count < amount) {
							var elmt = elmts[count];
							if (self.isOpen && self.transformState.elemt === elmt) {
								self.slideClose();
							}
							elmt.style.transform = 'translateZ(' + -(z * zStep == 0 ? 10 : z * zStep) + 'px)';
							elmt.style.left = (c == 0 ? l + xSpace : l) + 'px';
							elmt.style.top = (r == 0 ? t + ySpace : t) + 'px';
							count++;
							l = lStep * (c + 1) + xSpace;
						}
					}
					//当上一行绘制完成，将y坐标累加即设置第二行的y坐标位置，同时重置l的值即x坐标值
					t = (r + 1) * tStep + ySpace;
					l = 0;
					c = 0;
				}
				//当上一层绘制完成，将所有x,y重置开始绘制层，z值不重置(z-index)
				t = 0;
				l = 0;

				r = 0;
				c = 0;
			}

			self.perspective = (zCount * zStep) * 2 + 1000; //self.perspective;

			self.show(elmts);
		},
		//切换效果 散列／矩阵
		switchEffect: function (effect) {
			var self = this;
			self.settings.effect = effect;
			var domElmts = self.containers.children;
			self.settings.effect == 'hash' ?
				self.placeElementRandom(domElmts) : self.placeElementMartrix(domElmts);
		},
		//显示元素
		show: function (elmts, idx) {
			var self = this;
			var index = idx || 0;
			if (index == elmts.length) {
				clearTimeout(self.timer);
				self.timer = null;
				self.processing = false;
				self.loading.style.display = 'none';
				return;
			}
			self.timer = setTimeout(function () {
				clearTimeout(self.timer);
				elmts[index].className = '';
				self.show(elmts, ++index);
			}, 100);
		},
		//打开幻灯显示
		slideShow: function (item) {
			var self = this;
			if (self.isOpen) {
				self.slideClose();
			}

			//保存当前元素和container的位置信息
			self.transformState.transform = item.style.transform;
			self.transformState.top = item.style.top;
			self.transformState.left = item.style.left;
			self.transformState.elemt = item;

			if (self.settings.keepState) {
				self.transformState.currentContainerStyle = self.containers.style.transform;
			}

			//设置元素和container的位置信息
			item.style.transform = '';
			item.style.top = (self.settings.layerConSize.h - self.settings.elmtSize.h * 4) / 2 + 'px';
			item.style.left = (self.settings.layerConSize.w - self.settings.elmtSize.w * 4) / 2 + 'px';
			item.style.width = self.settings.elmtSize.w * 4 + 'px';
			item.style.height = self.settings.elmtSize.h * 4 + 'px';
			self.containers.style.transform = '';
			self.isOpen = true;
		},

		//关闭幻灯显示
		slideClose: function () {
			var self = this;
			//恢复元素和container的位置信息
			if (self.transformState.elemt) {
				self.transformState.elemt.style.transform = self.transformState.transform;
				self.transformState.elemt.style.top = self.transformState.top;
				self.transformState.elemt.style.left = self.transformState.left;
				self.transformState.elemt.style.width = self.settings.elmtSize.w + 'px';
				self.transformState.elemt.style.height = self.settings.elmtSize.h + 'px';
				if (self.settings.keepState) {
					self.containers.style.transform = self.transformState.currentContainerStyle;
				}
				self.transformState = {};
				self.isOpen = false;
			}

		},

		//重置container transform
		reset: function () {
			var self = this;
			self.rotate3d.x = 0;
			self.rotate3d.y = 0;
			self.rotate3d.z = 0;
			self.translate3d.x = 0;
			self.translate3d.y = 0;
			self.translate3d.z = 0;
			self.containers.style.transform = 'rotateX(0deg) rotateY(0deg) rotateZ(0deg) translateX(0px) translateY(0px) translateZ(0px) ';
		},
		//加载数据
		go: function (data) {
			var self = this;
			self.loading.style.display = '';
			self.data = self.data.concat(data);
			self.processing = true;
			var domElmts = self.domElementCreate(data.length);
			if (self.settings.effect === 'hash') {
				self.placeElementRandom(domElmts)
			} else {
				self.placeElementMartrix(self.containers.children);
			}

		},
		//添加更多
		more: function (data) {
			var self = this;
			self.go(data);
		}
	};



	window.Gallery3d = Gallery3d;

})();