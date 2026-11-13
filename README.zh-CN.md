# jmSlip

[English](./README.md) | 简体中文

一个零依赖的 H5（移动 Web）触摸 / 鼠标滑动组件，支持整页翻页、居中选中、类原生滚动、列表项侧滑、自由拖放与双指缩放。

- 运行时零依赖，不需要 jQuery。
- 基于 CSS `transform: translate3d(...)` + CSS transition，无动画框架。
- 单一 UMD 权威源文件，可用 `<script>`、AMD 或 `require()` 加载。
- 手写 TypeScript 类型声明 + DOM 桩测试。

[项目主页](http://fefeding.github.io/jmSlip/) · [仓库](https://github.com/jiamao/jmSlip) · [示例](./demo/)

## 该加载哪个文件？

| 文件 | 说明 |
| --- | --- |
| `dist/jmslip.js` | **浏览器推荐**。UMD 产物，暴露 `window.jmSlip`，由 `npm run build` 生成。 |
| `src/jmSlip.js` | 唯一权威源文件，同样是 UMD：既可直接用经典 `<script>` 加载，也是 `require('jmslip')` 的入口。 |
| `dist/jmslip.es6.js` | ES 模块（默认导出），需 `<script type="module">` 或打包器，不能用经典 script。 |
| `dist/*.min.js` | 压缩版。未安装 `terser` 时构建会输出带明确文件头的未压缩内容（见[开发](#开发)）。 |

```html
<script src="../../dist/jmslip.js"></script>
```

组件本身零依赖；`demo/` 下的页面用本地极简助手 `demo/dom.js` 做自身 UI 代码，不再依赖任何外部库，根 `index.html` 同样不引入第三方依赖——这些都不是 jmSlip 的依赖。

## 快速开始

容器需要有一层**首个子元素**包住所有滑动项：

```html
<section id="banner" class="banner">
  <ul>
    <li>第 1 页</li>
    <li>第 2 页</li>
    <li>第 3 页</li>
  </ul>
</section>

<script src="dist/jmslip.js"></script>
<script>
  var slip = new jmSlip('banner', 'page', {
    direction: 'x',
    loop: true
  });

  window.addEventListener('resize', function () {
    slip.reset();
  });

  // 不再使用时：slip.destroy();
</script>
```

## TypeScript

已随包提供 `index.d.ts`，并在 `types` / `exports` 中声明。由于包使用 `module.exports = fn`，请用 `import = require`（或开启 `esModuleInterop` 后用默认导入）：

```ts
import jmSlip = require('jmslip');
// 开启 esModuleInterop 时：import jmSlip from 'jmslip';

const options: jmSlip.PageOptions = {
  mode: 'page',
  direction: 'x',
  loop: true,
  onPageEnd(oldPage, page) {
    console.log(oldPage, '->', page); // page 恒为数字
  }
};

const slip: jmSlip.Instance = new jmSlip('banner', options);
slip.go(1);
slip.reset();
slip.destroy();
```

导出类型：`Mode`、`ElementLike`、`Offset`、`GestureEvent`、`Callbacks`、`CommonOptions`，以及按模式区分的 `PageOptions` / `ItemOptions` / `ScrollOptions` / `ScrollItemOptions` / `DragOptions` / `ScaleOptions`（联合类型 `Options`）与 `Instance`。经典脚本用法下的 `window.jmSlip` 也有类型；回调里的 `this` 是模式实现对象。

## 构造函数

```js
new jmSlip(el, mode, option)
new jmSlip(el, option)          // 用 option.mode 作为模式
new jmSlip(el, null, option)    // 回退到 option.mode || 'page'
```

| 参数 | 说明 |
| --- | --- |
| `el` | **id 字符串**（只走 `getElementById`，不是 CSS 选择器）、原生 DOM 节点，或任何带 `length` 与 `[0]` 的类数组对象（jQuery / Zepto 对象、`NodeList`）。元素无效或容器没有首个子元素会抛 `TypeError`。 |
| `mode` | 下列 6 种模式之一，默认 `'page'`。源码中参数名叫 `mode`，旧文档称 `type`。未知值会抛出列出合法模式的 `TypeError`。 |
| `option` | 配置对象。构造函数会**先拷贝**再写默认值，因此不会修改调用方的对象，可安全复用。 |

### 模式

| 模式 | 行为 | 典型场景 |
| --- | --- | --- |
| `page`（默认） | 整页切换，可选 `loop` / `repeat` | 轮播图、整屏引导页 |
| `item` | 一排项滚动，居中项被选中 | 日期选择、居中选择器 |
| `scroll` | 类原生滚动条拖动，带边界回弹 | 可滚动面板 |
| `scrollItem` | 每个列表项可单独侧滑露出操作按钮 | 微信式左滑删除 |
| `drag` | 自由拖动元素，事件容器改为 `document` | 贴边悬浮按钮 |
| `scale` | 双指缩放、可选单指平移、滚轮缩放 | 图片查看器 |

## 参数

### 通用参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `direction` | 纵向 | 只有严格等于 `'x'` 才横向，其他任意值（含 `'y'`）都是纵向。对 `page`、`item`、`scroll`、`scrollItem` 均生效。 |
| `duration` | `500` | CSS transition 时长，单位 **ms**（内部换算成秒）；`0` 有效（无动画）。 |
| `minOffset` | `30` | 触发翻页 / 滚动的最小位移（px）。**每个实例独立**，支持数字或数字字符串；`0` 有效，表示关闭额外步长。 |
| `itemOffWidth`、`itemOffHeight` | `0` | 每项额外计入的宽 / 高，用于修正 margin 间距。 |
| `zIndex` | `10000` | `page` 模式下页层的 `z-index`；`0` 有效。 |
| `page` | `0` | 初始页 / 项索引。 |
| `changeTime` | 关闭 | 自动轮播间隔（ms），falsy 表示关闭。 |
| `mousewheel` | 关闭 | 在本实例元素上启用滚轮输入。库会检测支持情况并**只绑定一种** `wheel` / `mousewheel` / `DOMMouseScroll`，避免一次滚动被处理两次。 |
| `locked` | 关闭 | `page` 模式禁止越界拖拽。 |
| `animate` | `page` 模式下为 `'page'` | `item` 模式还可设 `'default'` / `'flip'` 控制选中动画。 |
| `width`、`height` | 实测值 | 覆盖 `page` 模式的页尺寸。 |
| `paddingRight`、`paddingBottom` | `0` | `scroll` 模式额外的可滚动空间。 |
| `mode` | `'page'` | 第二参数的替代写法。 |

数值参数会做校验，非有限值或越界值抛 `RangeError`，不会静默产生 `NaN`。

### 模式专属参数

| 参数 | 模式 | 说明 |
| --- | --- | --- |
| `loop` | `page` | 从最后一页绕回第一页；恰好 2 页时用 `cloneNode` 克隆 DOM。 |
| `repeat` | `page` | 把所有子页平铺成一条带整体位移。与 `loop` 是两套不同机制，不要同时使用。 |
| `selectHandler(curIndex, newIndex)` | `item` | 自定义选中：返回数字可覆盖目标索引，返回 `false` 保持当前项。 |
| `target` | `scale` | 被变换的元素（如容器内的 `<img>`）。 |
| `supportTranslate` | `scale` | 除双指缩放外允许单指平移。 |
| `maxScale`、`minScale` | `scale` | 缩放上下限；`0` 有效。 |
| `orientation` | `scrollItem` | 侧滑方向：`left`、`right`、`top`、`bottom`。 |
| `maxOffset` | `scrollItem` | 列表项最大滑出距离（px）。 |
| `itemSelector` | `scrollItem` | 在触摸到的行内查找可拖动子元素的选择器（真正的 `closest()` 语义）。 |

### 事件回调

所有触摸回调中的 `this` 都是**模式实现对象**（`slip.slipObj`），而不是 `new jmSlip(...)` 返回的实例。因此回调里可以用 `this.move(...)`、`this.offsetX`、`this.instance`，但 `slip.move(...)` 不存在。

| 回调 | 签名 | 触发时机 | `return false` 的效果 |
| --- | --- | --- | --- |
| `onTouchStart` | `(evt)` | 手势开始 | 跳过手势并复位 touched 状态。 |
| `onTouchMove` | `(evt, offset)` | 每次移动；`offset` 为 `{ offx, offy }`，是相对起点的**绝对位移**（不是增量） | 只跳过本次位移，不再伪造一次 touch-end。 |
| `onTouchEnd` | `(evt, offset)` | 手势结束 | 只取消最终动作；transition、touched 状态与自动轮播仍会恢复，组件不会卡住。 |
| `onPageStart` | `(page, oldPage, actionType)`（`page` 与 `item` 统一） | 换页前 | 取消换页且不会递归；返回**数字**可在两种模式下覆盖目标页。 |
| `onPageEnd` | `(oldPage, page, actionType)` | 换页后 | 被忽略；两种模式下 `page` 恒为数字。 |
| `onScrollEnd` | `scroll`：`(offsetX, offsetY, xdir, ydir, evt)`；`scrollItem`：`(tx, ty, xdir, ydir, evt, target)` | 滚动结束 | 被忽略；`tx` / `ty` 恒为数字。 |
| `onScaleStart`、`onScaleEnd` | `(per, evt)` | 缩放前 / 后 | `onScaleStart` 可取消本次缩放；`evt` 现在会传入，`this` 与其它回调一致为模式对象。 |
| `dragEnd` | `(offx, offy)` | 拖动结束 | 被忽略。可用 `this.offsetX` / `this.offsetY` / `this.move()`。 |
| `selectHandler` | `(curIndex, newIndex)` | `item` 选中时 | 数字覆盖目标；`false` 保持当前页。 |

## 实例方法

| 方法 | 说明 |
| --- | --- |
| `go(index)` | 跳到指定页 / 项。 |
| `reset()` | 重新计算尺寸并复位，窗口 resize 或容器由隐藏变可见后调用。它**不会**重绑事件，也不会重启自动轮播。 |
| `destroy()` | 解绑全部监听（含唯一绑定的滚轮事件）、清理轮播与滚轮定时器、释放上次触摸的行；返回实例。 |
| `destory()` | 已废弃的拼写错误别名，保留以兼容旧代码。 |
| `bindEvent(enable?)`、`transition(...)`、`setStyle(...)`、`auto()` | 恰好公开的内部方法，不建议依赖；`bindEvent()` 幂等。 |
| `slip.slipObj` | 模式实现对象，`move`、`offset`、`next`、`previous`、`scale` 等方法在它上面，**不在实例上**。 |

## 示例

### 翻页（`page`）

```js
var slip = new jmSlip('banner', 'page', {
  direction: 'x',
  loop: true,
  mousewheel: true,
  onPageStart: function (page) {
    console.log('准备翻到', page);
  },
  onPageEnd: function (oldPage, newPage) {
    console.log(oldPage, '->', newPage);
  }
});
```

`repeat: true` 改为平铺所有页而不是回绕索引。见 [demo/page/x.html](./demo/page/x.html)、[demo/page/y.html](./demo/page/y.html)。

### 居中选中（`item`）

```js
var slip = new jmSlip('banner', 'item', {
  direction: 'x',
  page: 0,
  duration: 800,
  itemOffWidth: 1,
  selectHandler: function (curIndex, newIndex) {
    if (newIndex > 2) return 2; // 限制在第三项
  },
  onPageEnd: function (oldPage, newPage) {
    console.log('选中', newPage);
  }
});
```

见 [demo/item/index.html](./demo/item/index.html)、[demo/calendar/index.html](./demo/calendar/index.html)。

### 滚动（`scroll`）

```js
var slip = new jmSlip('wrap', 'scroll', {
  minOffset: 0,
  itemOffWidth: 8,
  onScrollEnd: function (offsetX, offsetY) {
    console.log(offsetX, offsetY);
  }
});
```

见 [demo/scroll/index.html](./demo/scroll/index.html)。

### 列表项侧滑（`scrollItem`）

```js
var slip = new jmSlip('list', 'scrollItem', {
  orientation: 'left',
  maxOffset: 80,
  itemSelector: '.js-slip-item'
});
```

见 [demo/scroll/scroll_item.html](./demo/scroll/scroll_item.html)。

### 拖放（`drag`）

```js
var entry = document.getElementById('act-enter');
var slip = new jmSlip(entry, 'drag', {
  onTouchStart: function (e) {
    if (e && e.preventDefault) e.preventDefault();
  },
  dragEnd: function (offx, offy) {
    var rect = entry.getBoundingClientRect();
    var center = rect.left + rect.width / 2;
    var winw = window.innerWidth;
    if (center <= winw / 2) offx -= rect.left;      // 贴左边
    else offx += winw - center - rect.width / 2;   // 贴右边
    this.move(offx, offy); // 此处 this 是 drag 模式实现对象
  }
});
```

见 [demo/drag/index.html](./demo/drag/index.html)。

### 缩放（`scale`）

```js
var container = document.getElementById('viewer');
var slip = new jmSlip(container, 'scale', {
  target: container.querySelector('img'),
  supportTranslate: true,
  maxScale: 4,
  minScale: 0.1,
  mousewheel: true,
  onScaleStart: function (per) {
    console.log('缩放比例:', per);
  }
});
```

见 [demo/scale/index.html](./demo/scale/index.html)。

## 浏览器兼容与实现机制

- 事件源通过 `'ontouchstart' in window` **或** `navigator.maxTouchPoints > 0` 一次性二选一：要么触摸，要么鼠标，不会同时支持。没有 Pointer Events，混合设备无法同时使用两种输入；IE8 走 `attachEvent` 回退。
- 支持时以 `{ passive: false }` 注册监听，并给容器设置 `touch-action: none`，因此 Chrome / Android 上 `preventDefault()` 生效，不会拖元素时页面跟着滚。
- `touchstart` 绑在 target 上，`touchmove` / `touchend` / `touchcancel` 绑在容器上（`drag` 模式绑到 `document`）。桌面端 `mouseup` 绑在容器上，在容器外松手会丢失事件。
- 坐标优先取 `clientX/clientY`，但合法的 `0` 会被保留，不再错误回退到 `pageX/pageY`。
- 位移全部使用 CSS `transform: translate3d(...)`，带连字符的属性名通过 `setProperty` 写入；所需厂商前缀只探测一次，现代浏览器每次移动只写 **1 次**样式（原先 5 次）。缓动交给 CSS `transition`。
- 滚轮输入统一归一化 `wheelDelta` / `deltaY` / Firefox `detail`。Chrome 一次滚动会同时派发 `wheel` 与遗留的 `mousewheel`，因此只绑定一种受支持的事件名；监听绑在实例元素而非 `document`，多实例互不干扰。
- 初始化时会写入 `data-page`，`onPageEnd` 收到数值索引。

## 开发

```shell
npm test         # node test/index.js —— 19 项 DOM 桩断言
npm run build    # node scripts/build.js —— 由 src/ 重新生成 dist/ 的 4 个文件
npm i -D terser  # 可选：让 dist/*.min.js 真正被压缩
```

只需编辑 `src/jmSlip.js`，`npm run build` 会派生 UMD 与 ESM 产物，避免 `dist/` 与源码脱节。旧的 `build/` 目录（gulp）是历史构建链，不再作为主构建入口。

## 限制与已知问题

- **无 Pointer Events / 无真实惯性**。触摸与鼠标仍然互斥；`scroll` 模式只是额外加一个固定的 `minOffset` 步长，没有基于速度的惯性，也没有 `requestAnimationFrame` 节流。超长列表仍需自行虚拟化。全量切换到 Pointer Events + rAF 会改变 `scale` 模式的多指处理，需要先在真机上逐项验证再发布。
- **桌面边界情况**：`mouseup` 绑在容器上，容器外松手可能让手势保持未结束状态。
- **只接通了一半的辅助函数**：`pageSlip.pageEnd()`（懒加载图片 / 动画钩子）在 `page` 模式里的调用被注释，但 `item` 模式仍会调用它；`page` 模式的 demo 在 `onPageEnd` 里自行实现这部分逻辑。
- **实验性选项**：`animate: 'flip'`、`locked` 等模式专属参数由 demo 使用，但自动化测试未覆盖。
- **构建产物**：`dist/*.es6.js` 是 ES 模块（非经典脚本）；未安装 `terser` 时 `.min.js` 为带明确文件头的未压缩内容。
- **测试覆盖**：测试使用 DOM 桩而非真实浏览器，发布前请在目标设备上验证手势。

## 示例页面

| 示例 | 模式 |
| --- | --- |
| [demo/page/x.html](./demo/page/x.html)、[demo/page/y.html](./demo/page/y.html) | `page` |
| [demo/item/index.html](./demo/item/index.html)、[demo/calendar/index.html](./demo/calendar/index.html) | `item` |
| [demo/scroll/index.html](./demo/scroll/index.html)、[demo/scroll/scroll_item.html](./demo/scroll/scroll_item.html) | `scroll`、`scrollItem` |
| [demo/drag/index.html](./demo/drag/index.html) | `drag` |
| [demo/scale/index.html](./demo/scale/index.html) | `scale` |
| [demo/emoji/index.html](./demo/emoji/index.html)、[demo/cyzm/index.html](./demo/cyzm/index.html) | 整屏综合示例 |

## 许可证

[MIT](./LICENSE)
