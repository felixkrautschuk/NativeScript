import * as TKUnit from '../../tk-unit';
import { StyleScope } from '@nativescript/core/ui/styling/style-scope';
import * as keyframeAnimation from '@nativescript/core/ui/animation/keyframe-animation';
import { Application, CoreTypes, Screen } from '@nativescript/core';
import * as helper from '../../ui-helper';
import * as stackModule from '@nativescript/core/ui/layouts/stack-layout';
import * as labelModule from '@nativescript/core/ui/label';
import * as color from '@nativescript/core/color';

import { SelectorCore } from '@nativescript/core/ui/styling/css-selector';

const DELTA = 1;
const SCALE_DELTA = 0.001;

function createAnimationFromCSS(css: string, name: string): keyframeAnimation.KeyframeAnimationInfo {
	const scope = new StyleScope();
	scope.css = css;
	const selector = findSelectorInScope(scope, name);
	if (selector) {
		const animation = scope.getAnimations(selector.ruleset)[0];
		return animation;
	}
}

function findSelectorInScope(scope: StyleScope, cssClass: string): SelectorCore {
	let selectors = scope.query({ cssClasses: new Set([cssClass]) });

	return selectors[0];
}

export function test_ReadAnimationProperties() {
	let animation = createAnimationFromCSS(
		`.test {
			animation-name: first;
			animation-duration: 4s;
			animation-timing-function: ease-in;
			animation-delay: 1.5;
			animation-iteration-count: 10;
			animation-direction: reverse;
			animation-fill-mode: forwards;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.name, 'first');
	TKUnit.assertEqual(animation.duration, 4000);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.easeIn);
	TKUnit.assertEqual(animation.delay, 1500);
	TKUnit.assertEqual(animation.iterations, 10);
	TKUnit.assertTrue(animation.isForwards);
	TKUnit.assertTrue(animation.isReverse);
}

export function test_ReadTheAnimationProperty() {
	let animation = createAnimationFromCSS(
		`.test {
			animation: second 0.2s ease-out 1s 2;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.name, 'second');
	TKUnit.assertEqual(animation.duration, 200);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.easeOut);
	TKUnit.assertEqual(animation.delay, 1000);
	TKUnit.assertEqual(animation.iterations, 2);
}

export function test_ReadAnimationCurve() {
	let animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: ease-in;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.easeIn);
	animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: ease-out;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.easeOut);
	animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: linear;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.linear);
	animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: ease-in-out;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.easeInOut);
	animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: spring;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.curve, CoreTypes.AnimationCurve.spring);
	animation = createAnimationFromCSS(
		`.test {
			animation-timing-function: cubic-bezier(0.1, 1.0, 0.5, 0.5);
		}`,
		'test',
	);
	let curve = animation.curve;
	TKUnit.assert(curve.x1 === 0.1 && curve.y1 === 1.0 && curve.x2 === 0.5 && curve.y2 === 0.5);
}

export function test_ReadIterations() {
	let animation = createAnimationFromCSS(
		`.test {
			animation-iteration-count: 5;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.iterations, 5);
	animation = createAnimationFromCSS(
		`.test {
			animation-iteration-count: infinite;
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.iterations, Number.POSITIVE_INFINITY);
}

export function test_ReadFillMode() {
	let animation = createAnimationFromCSS(
		`.test {
			animation-iteration-count: 5;
		}`,
		'test',
	);
	TKUnit.assertFalse(animation.isForwards);
	animation = createAnimationFromCSS(
		`.test {
			animation-fill-mode: forwards;
		}`,
		'test',
	);
	TKUnit.assertTrue(animation.isForwards);
	animation = createAnimationFromCSS(
		`.test {
			animation-fill-mode: backwards;
		}`,
		'test',
	);
	TKUnit.assertFalse(animation.isForwards);
}

export function test_ReadDirection() {
	let animation = createAnimationFromCSS(
		`.test {
			animation-iteration-count: 5;
		}`,
		'test',
	);
	TKUnit.assertFalse(animation.isReverse);
	animation = createAnimationFromCSS(
		`.test {
			animation-direction: reverse;
		}`,
		'test',
	);
	TKUnit.assertTrue(animation.isReverse);
	animation = createAnimationFromCSS(
		`.test {
			animation-direction: normal;
		}`,
		'test',
	);
	TKUnit.assertFalse(animation.isReverse);
}

export function test_ReadKeyframe() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			from { background-color: red; }
			to { background-color: blue; }
		}`,
		'test',
	);
	TKUnit.assert(animation !== undefined, 'CSS selector was not created!');
	TKUnit.assertEqual(animation.name, 'test', 'Wrong animation name!');
	TKUnit.assertEqual(animation.keyframes.length, 2, 'Keyframes not parsed correctly!');
	TKUnit.assertEqual(animation.keyframes[0].duration, 0, 'First keyframe duration should be 0');
	TKUnit.assertEqual(animation.keyframes[1].duration, 1, 'Second keyframe duration should be 1');
	TKUnit.assertEqual(animation.keyframes[0].declarations.length, 1, 'Keyframe declarations are not correct');
	TKUnit.assertEqual(animation.keyframes[0].declarations[0].property, 'backgroundColor', 'Keyframe declarations are not correct');
}

export function test_ReadTransformAllSet() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: rotate(10) scaleX(5) translate(100, 200); }
		}`,
		'test',
	);
	const { rotate, scale, translate } = getTransformsValues(animation.keyframes[0].declarations);

	TKUnit.assertAreClose(rotate.z, 10, DELTA);

	TKUnit.assertAreClose(scale.x, 5, SCALE_DELTA);
	TKUnit.assertAreClose(scale.y, 1, SCALE_DELTA);

	TKUnit.assertAreClose(translate.x, 100, DELTA);
	TKUnit.assertAreClose(translate.y, 200, DELTA);
}

export function test_ReadTransformNone() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: none; }
		}`,
		'test',
	);
	const { rotate, scale, translate } = getTransformsValues(animation.keyframes[0].declarations);

	TKUnit.assertEqual(rotate.z, 0);

	TKUnit.assertEqual(scale.x, 1);
	TKUnit.assertEqual(scale.y, 1);

	TKUnit.assert(translate.x === 0);
	TKUnit.assert(translate.y === 0);
}

export function test_ReadScale() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: scale(-5, 12.3pt); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.x, -5, DELTA);
	TKUnit.assertAreClose(scale.value.y, 12.3, DELTA);
}

export function test_ReadScaleSingle() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: scale(2); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.x, 2, DELTA);
	TKUnit.assertAreClose(scale.value.y, 2, DELTA);
}

export function test_ReadScaleXY() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: scaleX(5) scaleY(10); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.x, 5, SCALE_DELTA);
	TKUnit.assertAreClose(scale.value.y, 10, SCALE_DELTA);
}

export function test_ReadScaleX() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
	 	@keyframes test {
			to { transform: scaleX(12.5); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.x, 12.5, SCALE_DELTA);
	// y defaults to 1
	TKUnit.assertAreClose(scale.value.y, 1, SCALE_DELTA);
}

export function test_ReadScaleY() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: scaleY(10); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.y, 10, SCALE_DELTA);
	// x defaults to 1
	TKUnit.assertAreClose(scale.value.x, 1, SCALE_DELTA);
}

export function test_ReadScale3d() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: scale3d(10, 20, 30); }
		}`,
		'test',
	);
	const { scale } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(scale.property, 'scale');
	TKUnit.assertAreClose(scale.value.x, 10, SCALE_DELTA);
	TKUnit.assertAreClose(scale.value.y, 20, SCALE_DELTA);
}

export function test_ReadTranslate() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translate(100, 20); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.x, 100, DELTA);
	TKUnit.assertAreClose(translate.value.y, 20, DELTA);
}

export function test_ReadTranslateSingle() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translate(30); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.x, 30, DELTA);
	TKUnit.assertAreClose(translate.value.y, 0, DELTA);
}

export function test_ReadTranslateXY() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translateX(5) translateY(10); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.x, 5, DELTA);
	TKUnit.assertAreClose(translate.value.y, 10, DELTA);
}

export function test_ReadTranslateX() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translateX(12.5); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.x, 12.5, DELTA);
	// y defaults to 0
	TKUnit.assertAreClose(translate.value.y, 0, DELTA);
}

export function test_ReadTranslateY() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translateY(10); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.y, 10, DELTA);
	// x defaults to 0
	TKUnit.assertAreClose(translate.value.x, 0, DELTA);
}

export function test_ReadTranslate3d() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: translate3d(10, 20, 30); }
		}`,
		'test',
	);
	const { translate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(translate.property, 'translate');
	TKUnit.assertAreClose(translate.value.x, 10, DELTA);
	TKUnit.assertAreClose(translate.value.y, 20, DELTA);
}

export function test_ReadRotate() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: rotate(5); }
		}`,
		'test',
	);
	const { rotate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(rotate.property, 'rotate');
	TKUnit.assertAreClose(rotate.value.z, 5, DELTA);
}

export function test_ReadRotateDeg() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: rotate(45deg); }
		}`,
		'test',
	);
	const { rotate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(rotate.property, 'rotate');
	TKUnit.assertAreClose(rotate.value.z, 45, DELTA);
}

export function test_ReadRotateRad() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			to { transform: rotate(0.7853981634rad); }
		}`,
		'test',
	);
	const { rotate } = getTransforms(animation.keyframes[0].declarations);

	TKUnit.assertEqual(rotate.property, 'rotate');
	TKUnit.assertAreClose(rotate.value.z, 45, DELTA);
}

export function test_ReadAnimationWithUnsortedKeyframes() {
	let animation = createAnimationFromCSS(
		`.test { animation-name: test; }
		@keyframes test {
			from { opacity: 0; }
			20%, 60% { opacity: 0.5; }
			40%, 80% { opacity: 0.3; }
			to { opacity: 1; }
		}`,
		'test',
	);
	TKUnit.assertEqual(animation.keyframes.length, 6);
	TKUnit.assertEqual(animation.keyframes[0].declarations[0].value, 0);
	TKUnit.assertEqual(animation.keyframes[1].declarations[0].value, 0.5);
	TKUnit.assertEqual(animation.keyframes[2].declarations[0].value, 0.3);
	TKUnit.assertEqual(animation.keyframes[3].declarations[0].value, 0.5);
	TKUnit.assertEqual(animation.keyframes[4].declarations[0].value, 0.3);
	TKUnit.assertEqual(animation.keyframes[5].declarations[0].value, 1);
	TKUnit.assertEqual(animation.keyframes[0].duration, 0);
	TKUnit.assertEqual(animation.keyframes[1].duration, 0.2);
	TKUnit.assertEqual(animation.keyframes[2].duration, 0.4);
	TKUnit.assertEqual(animation.keyframes[3].duration, 0.6);
	TKUnit.assertEqual(animation.keyframes[4].duration, 0.8);
	TKUnit.assertEqual(animation.keyframes[5].duration, 1);
}

export function test_ReadAnimationsWithCSSImport() {
	let css = "@import 'ui/animation/test-page.css'; .test { animation-name: test-page-keyframes; }";
	let animation = createAnimationFromCSS(css, 'test');
	TKUnit.assertEqual(animation.keyframes.length, 3);
	TKUnit.assertEqual(animation.keyframes[1].declarations[0].property, 'backgroundColor');
}

export function test_LoadTwoAnimationsWithTheSameName() {
	const animation = createAnimationFromCSS(
		`.a { animation-name: a1; }
		@keyframes a1 {
			from { opacity: 0; }
			to { opacity: 1; }
		}
		@keyframes a1 {
			from { opacity: 0; }
			to { opacity: 0.5; } /* this should override the previous one */
		}`,
		'a',
	);
	TKUnit.assertEqual(animation.keyframes.length, 2);
	TKUnit.assertEqual(animation.keyframes[1].declarations[0].value, 0.5);

	const animation2 = createAnimationFromCSS(
		`.a {
			animation-name: k;
			animation-duration: 2;
		}
		.a {
			animation-name: k;
			animation-duration: 3;
		}
		@keyframes k {
			from { opacity: 0; }
			to { opacity: 1; }
		}`,
		'a',
	);

	TKUnit.assertEqual(animation2.keyframes.length, 2);
	TKUnit.assertEqual(animation2.keyframes.length, 2);
}

export function test_LoadAnimationProgrammatically() {
	let stack = new stackModule.StackLayout();
	helper.buildUIAndRunTest(stack, function (views) {
		let page = views[1];
		page.css = `@keyframes a {
			from { opacity: 1; }
			to { opacity: 0; }
		}`;
		let animation = page.getKeyframeAnimationWithName('a');
		TKUnit.assertEqual(animation.keyframes.length, 2);
		TKUnit.assertEqual(animation.keyframes[1].declarations[0].property, 'opacity');
		TKUnit.assertEqual(animation.keyframes[1].declarations[0].value, 0);
	});
}

export function test_LoadMatchingMediaQueryKeyframeAnimation() {
	const animation = createAnimationFromCSS(
		`.a { animation-name: mq1; }
		@media only screen and (max-width: ${Screen.mainScreen.widthDIPs}) {
			@keyframes mq1 {
				from { opacity: 0; }
				to { opacity: 1; }
			}
		}`,
		'a',
	);
	TKUnit.assertEqual(animation.keyframes.length, 2);
	TKUnit.assertEqual(animation.keyframes[1].declarations[0].value, 1);
}

export function test_IgnoreNonMatchingMediaQueryKeyframe() {
	const animation = createAnimationFromCSS(
		`.a { animation-name: mq1; }
		@media only screen and (max-width: ${Screen.mainScreen.widthDIPs - 1}) {
			@keyframes mq1 {
				from { opacity: 0; }
				to { opacity: 1; }
			}
		}`,
		'a',
	);
	TKUnit.assertEqual(animation.keyframes, null);
}

export function test_LoadMatchingNestedMediaQueryKeyframeAnimation() {
	const animation = createAnimationFromCSS(
		`.a { animation-name: mq1; }
		@media only screen and (orientation: ${Application.orientation()}) {
			@media only screen and (max-width: ${Screen.mainScreen.widthDIPs}) {
				@keyframes mq1 {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			}
		}`,
		'a',
	);
	TKUnit.assertEqual(animation.keyframes.length, 2);
	TKUnit.assertEqual(animation.keyframes[1].declarations[0].value, 1);
}

export function test_IgnoreNonMatchingNestedMediaQueryKeyframe() {
	const animation = createAnimationFromCSS(
		`.a { animation-name: mq1; }
		@media only screen and (orientation: ${Application.orientation()}) {
			@media only screen and (max-width: ${Screen.mainScreen.widthDIPs - 1}) {
				@keyframes mq1 {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			}
		}`,
		'a',
	);
	TKUnit.assertEqual(animation.keyframes, null);
}

export function test_ExecuteCSSAnimation() {
	let mainPage = helper.getCurrentPage();
	mainPage.css = null;
	let label = new labelModule.Label();
	label.text = 'label';
	let stackLayout = new stackModule.StackLayout();
	stackLayout.addChild(label);

	mainPage.css = `@keyframes k {
		from { background-color: red; }
		to { background-color: green; } }
		.l {
			animation-name: k;
			animation-duration: 0.1s;
			animation-fill-mode: forwards;
	}`;
	mainPage.content = stackLayout;

	TKUnit.waitUntilReady(() => label.isLoaded);
	label.className = 'l';
	let green = new color.Color('green');
	TKUnit.waitUntilReady(() => green.equals(<color.Color>label.backgroundColor), 1);
	TKUnit.assertEqual(label.backgroundColor, green);
}

//export function test_ExecuteFillMode() {
//    let mainPage = helper.getCurrentPage();
//    mainPage.style.backgroundColor = unsetValue;
//    mainpage.style.color = unsetValue;
//    mainPage.bindingContext = unsetValue;
//    mainPage.cssClass = unsetValue;
//    mainPage.id = unsetValue;
//    mainPage.css = null;

//    let label = new labelModule.Label({ text: "label" });
//    let stackLayout = new stackModule.StackLayout();
//    stackLayout.addChild(label);
//    mainPage.css = "@keyframes k { from { background-color: red; } to { background-color: green; } } " +
//        ".l { animation-name: k; animation-duration: 0.5s; animation-fill-mode: none; } " +
//        ".l2 { animation-name: k; animation-duration: 0.5s; animation-fill-mode: forwards; }";
//    mainPage.content = stackLayout;

//    TKUnit.waitUntilReady(() => label.isLoaded);

//    TKUnit.assertEqual(label.backgroundColor, undefined, "label.backgroundColor should be undefind");

//    label.className = "l";
//    TKUnit.assertEqual(label.backgroundColor, undefined, "label.backgroundColor should be undefind");

//    label.className = "l2";
//    TKUnit.assertEqual(label.backgroundColor, new color.Color("green"));
//}

export function test_ReadTwoAnimations() {
	let scope = new StyleScope();
	scope.css = '.test { animation: one 0.2s ease-out 1 2, two 2s ease-in; }';
	scope.ensureSelectors();
	let selector = findSelectorInScope(scope, 'test');
	TKUnit.assertEqual(scope.getAnimations(selector.ruleset).length, 2);
	TKUnit.assertEqual(scope.getAnimations(selector.ruleset)[0].curve, CoreTypes.AnimationCurve.easeOut);
	TKUnit.assertEqual(scope.getAnimations(selector.ruleset)[1].curve, CoreTypes.AnimationCurve.easeIn);
	TKUnit.assertEqual(scope.getAnimations(selector.ruleset)[1].name, 'two');
	TKUnit.assertEqual(scope.getAnimations(selector.ruleset)[1].duration, 2000);
}

export function test_AnimationCurveInKeyframes() {
	const animation = createAnimationFromCSS(
		`.test { animation-name: an; animation-timing-function: ease-in; }
		@keyframes an {
			from { animation-timing-function: linear; background-color: red; }
			50% { background-color: green; }
			to { background-color: black; }
		}`,
		'test',
	);

	TKUnit.assertEqual(animation.keyframes[0].curve, CoreTypes.AnimationCurve.linear);
	TKUnit.assertEqual(animation.keyframes[1].curve, undefined);
	TKUnit.assertEqual(animation.keyframes[1].curve, undefined);
	let realAnimation = keyframeAnimation.KeyframeAnimation.keyframeAnimationFromInfo(animation);
	TKUnit.assertEqual(realAnimation.animations[1].curve, CoreTypes.AnimationCurve.linear);
	TKUnit.assertEqual(realAnimation.animations[2].curve, CoreTypes.AnimationCurve.easeIn);
}

function getTransformsValues(declarations) {
	return Object.assign({}, ...(<any>Object).entries(getTransforms(declarations)).map(([k, v]) => ({ [k]: v.value })));
}

function getTransforms(declarations) {
	const [translate, rotate, scale] = [...declarations];

	return { translate, rotate, scale };
}
