const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const APP_PATH = path.join(__dirname, '..', 'app.js');

const CSS_VARS = {
    '--svg-width': '800',
    '--svg-height': '600',
    '--svg-center-x': '400',
    '--svg-center-y': '300',
    '--fit-padding': '50',
    '--fit-scale-ratio': '0.85',
    '--svg-bg': '#ffffff',
    '--svg-axis': '#d7dee4',
    '--svg-extension': '#78909c',
    '--svg-triangle-fill': 'rgba(23, 107, 135, 0.10)',
    '--svg-triangle-stroke': '#176b87',
    '--svg-altitude': '#c46a2d',
    '--svg-text': '#1f2933',
    '--svg-axis-stroke-width': '1',
    '--svg-extension-stroke-width': '2',
    '--svg-extension-dasharray': '8,6',
    '--svg-triangle-stroke-width': '2.5',
    '--svg-altitude-stroke-width': '2',
    '--svg-foot-radius': '5',
    '--svg-vertex-radius': '7',
    '--svg-altitude-number-offset-y': '-14',
    '--svg-segment-number-offset-y': '-10',
    '--svg-dimension-font-size': '20',
    '--svg-outside-dimension-font-size': '19',
    '--svg-foot-label-font-size': '20',
    '--svg-vertex-label-font-size': '20',
    '--svg-label-clearance': '4',
    '--svg-label-candidate-step': '9'
};

const ELEMENT_IDS = [
    'triangleSVG',
    'sssModeButton',
    'sasModeButton',
    'asaModeButton',
    'aasModeButton',
    'ssaModeButton',
    'sssInputPanel',
    'sasInputPanel',
    'asaInputPanel',
    'aasInputPanel',
    'ssaInputPanel',
    'sssSideA',
    'sssSideB',
    'sssSideC',
    'sasSideB',
    'sasSideC',
    'sasAngleA',
    'asaAngleA',
    'asaSideC',
    'asaAngleB',
    'aasAngleA',
    'aasAngleB',
    'aasSideA',
    'ssaAngleA',
    'ssaSideA',
    'ssaSideB',
    'solutionTabs',
    'showAxes',
    'showAltitudes',
    'showFootLabels',
    'showSegmentLengths',
    'showTriangleFill',
    'showVertexLabels',
    'showExtensionLines',
    'includeExportMetadata',
    'displayPreferencesStatus',
    'errorMessage',
    'results',
    'calculateButton',
    'resetViewButton',
    'fitToScreenButton',
    'downloadSvgButton',
    'downloadPngButton',
    'downloadTxtButton',
    'downloadCsvButton',
    'constructionPresetButton',
    'measurementPresetButton',
    'presentationPresetButton',
    'resetDisplayPreferencesButton',
    'zoomInButton',
    'zoomOutButton',
    'fitViewButton',
    'rotateLeftButton',
    'rotateRightButton'
];

function createElement(id, downloads) {
    const handlers = {};
    const defaults = {
        sssSideA: '3',
        sssSideB: '4',
        sssSideC: '5',
        sasSideB: '4',
        sasSideC: '3',
        sasAngleA: '90',
        asaAngleA: '30',
        asaSideC: '10',
        asaAngleB: '60',
        aasAngleA: '30',
        aasAngleB: '60',
        aasSideA: '10',
        ssaAngleA: '30',
        ssaSideA: '5',
        ssaSideB: '8'
    };

    const element = {
        id,
        value: defaults[id] || '',
        hidden: id === 'solutionTabs' ||
            id === 'sasInputPanel' ||
            id === 'asaInputPanel' ||
            id === 'aasInputPanel' ||
            id === 'ssaInputPanel',
        dataset: {},
        checked: id === 'showAxes' ||
            id === 'showAltitudes' ||
            id === 'showFootLabels' ||
            id === 'showSegmentLengths' ||
            id === 'showTriangleFill' ||
            id === 'showVertexLabels' ||
            id === 'showExtensionLines',
        innerHTML: '',
        textContent: '',
        style: {},
        attributes: {},
        classList: {
            values: new Set(),
            toggle(className, force) {
                if (force) {
                    this.values.add(className);
                } else if (force === false) {
                    this.values.delete(className);
                } else if (this.values.has(className)) {
                    this.values.delete(className);
                } else {
                    this.values.add(className);
                }
            },
            add(className) {
                this.values.add(className);
            },
            remove(className) {
                this.values.delete(className);
            },
            contains(className) {
                return this.values.has(className);
            }
        },
        href: '',
        download: '',
        handlers,
        click() {
            downloads.push(this.download || id);
        },
        addEventListener(type, handler) {
            handlers[type] = handler;
        },
        setAttribute(name, value) {
            this.attributes[name] = String(value);
        },
        getBoundingClientRect() {
            return { left: 0, top: 0, width: 800, height: 600 };
        },
        setPointerCapture() {},
        hasPointerCapture() {
            return false;
        },
        releasePointerCapture() {},
        getContext() {
            return { drawImage() {} };
        },
        toBlob(callback, type) {
            callback(new MockBlob(['png'], { type }));
        }
    };

    if (id === 'sssModeButton') {
        element.dataset.inputMode = 'sss';
        element.classList.add('active');
    } else if (id === 'sasModeButton') {
        element.dataset.inputMode = 'sas';
    } else if (id === 'asaModeButton') {
        element.dataset.inputMode = 'asa';
    } else if (id === 'aasModeButton') {
        element.dataset.inputMode = 'aas';
    } else if (id === 'ssaModeButton') {
        element.dataset.inputMode = 'ssa';
    }

    return element;
}

class MockBlob {
    constructor(parts, options = {}) {
        this.parts = parts;
        this.type = options.type || '';
    }
}

class MockImage {
    set src(value) {
        this._src = value;
        if (this.onload) {
            this.onload();
        }
    }

    get src() {
        return this._src;
    }
}

function createLocalStorage(initialValues = {}) {
    const store = { ...initialValues };

    return {
        store,
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key, value) {
            store[key] = String(value);
        },
        removeItem(key) {
            delete store[key];
        }
    };
}

function loadApp(options = {}) {
    const downloads = [];
    const elements = Object.fromEntries(ELEMENT_IDS.map(id => [id, createElement(id, downloads)]));
    const localStorage = createLocalStorage(options.localStorage);
    let urlCounter = 0;
    let timeoutCounter = 0;
    const timeouts = new Map();

    const document = {
        documentElement: {},
        getElementById(id) {
            return elements[id];
        },
        createElement(tag) {
            if (tag === 'canvas') {
                return createElement('canvas', downloads);
            }

            if (tag === 'a') {
                return {
                    href: '',
                    download: '',
                    click() {
                        downloads.push(this.download);
                    }
                };
            }

            return createElement(tag, downloads);
        }
    };

    const window = {
        addEventListener(type, handler) {
            if (type === 'load') {
                handler();
            }
        }
    };

    const context = {
        console,
        document,
        window,
        localStorage,
        Blob: MockBlob,
        Image: MockImage,
        URL: {
            createObjectURL() {
                urlCounter += 1;
                return `blob:mock-${urlCounter}`;
            },
            revokeObjectURL() {}
        },
        getComputedStyle() {
            return {
                getPropertyValue(name) {
                    return CSS_VARS[name] || '';
                }
            };
        },
        Math,
        Number,
        setTimeout(callback, delay) {
            timeoutCounter += 1;
            timeouts.set(timeoutCounter, { callback, delay });
            return timeoutCounter;
        },
        clearTimeout(id) {
            timeouts.delete(id);
        }
    };

    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(APP_PATH, 'utf8'), context);

    return { context, elements, downloads, localStorage };
}

function getRotation(context) {
    return vm.runInContext('viewTransform.rotation', context);
}

function getTransformedSideDy(context, side) {
    return vm.runInContext(`(() => {
        const vertices = currentTriangle.vertices;
        const endpoints = {
            a: [vertices.B, vertices.C],
            b: [vertices.A, vertices.C],
            c: [vertices.A, vertices.B]
        }['${side}'];
        const first = applyTransform(endpoints[0]);
        const second = applyTransform(endpoints[1]);
        return Math.abs(first.y - second.y);
    })()`, context);
}

function assertNearlyEqual(actual, expected, epsilon = 1e-12) {
    assert.ok(
        Math.abs(actual - expected) < epsilon,
        `expected ${actual} to be within ${epsilon} of ${expected}`
    );
}

test('calculates stable geometry for the default 3-4-5 triangle', () => {
    const { context, elements } = loadApp();
    const data = vm.runInContext('currentTriangle.triangleData', context);

    assert.equal(elements.errorMessage.style.display, 'none');
    assert.equal(data.area, 6);
    assert.equal(data.isRight, true);
    assert.equal(data.rightVertex, 'C');
    assert.equal(data.heights.ha, 4);
    assert.equal(data.heights.hb, 3);
    assert.equal(data.heights.hc, 2.4);
    assertNearlyEqual(data.segments.c.seg1, 3.2);
    assertNearlyEqual(data.segments.c.seg2, 1.8);
    assert.match(elements.results.innerHTML, /6\.000000/);
    assert.match(elements.results.innerHTML, /AH<sub>1<\/sub>/);
    assert.match(elements.results.innerHTML, /H<sub>1<\/sub>B/);
});

test('solves a triangle from fixed ASA inputs', () => {
    const { context, elements } = loadApp();

    elements.asaModeButton.handlers.click({ target: elements.asaModeButton });
    elements.asaAngleA.value = '30';
    elements.asaSideC.value = '10';
    elements.asaAngleB.value = '60';

    elements.calculateButton.handlers.click();

    const data = vm.runInContext('currentTriangle.triangleData', context);
    assert.equal(elements.errorMessage.style.display, 'none');
    assertNearlyEqual(data.sides.a, 5, 1e-9);
    assertNearlyEqual(data.sides.b, 8.660254037844386, 1e-9);
    assertNearlyEqual(data.sides.c, 10, 1e-9);
    assertNearlyEqual(data.angles.C, 90, 1e-9);
    assert.match(elements.results.innerHTML, /ASA/);
});

test('solves a triangle from fixed AAS inputs', () => {
    const { context, elements } = loadApp();

    elements.aasModeButton.handlers.click({ target: elements.aasModeButton });
    elements.aasAngleA.value = '30';
    elements.aasAngleB.value = '60';
    elements.aasSideA.value = '10';

    elements.calculateButton.handlers.click();

    const data = vm.runInContext('currentTriangle.triangleData', context);
    assert.equal(elements.errorMessage.style.display, 'none');
    assertNearlyEqual(data.sides.a, 10, 1e-9);
    assertNearlyEqual(data.sides.b, 17.32050807568877, 1e-9);
    assertNearlyEqual(data.angles.C, 90, 1e-9);
    assert.match(elements.results.innerHTML, /AAS/);
});

test('solves a triangle from two sides and the included angle', () => {
    const { context, elements } = loadApp();

    elements.sasModeButton.handlers.click({ target: elements.sasModeButton });
    elements.sasSideB.value = '7';
    elements.sasSideC.value = '5';
    elements.sasAngleA.value = '60';

    elements.calculateButton.handlers.click();

    const data = vm.runInContext('currentTriangle.triangleData', context);
    assert.equal(elements.errorMessage.style.display, 'none');
    assertNearlyEqual(data.sides.a, Math.sqrt(39), 1e-9);
    assertNearlyEqual(data.angles.A, 60, 1e-9);
    assert.match(elements.results.innerHTML, /SAS/);
});

test('solves ambiguous SSA input and switches between two solutions', () => {
    const { context, elements } = loadApp();

    elements.ssaModeButton.handlers.click({ target: elements.ssaModeButton });
    elements.ssaAngleA.value = '30';
    elements.ssaSideA.value = '5';
    elements.ssaSideB.value = '8';

    elements.calculateButton.handlers.click();

    assert.equal(vm.runInContext('triangleSolutions.length', context), 2);
    assert.equal(elements.solutionTabs.hidden, false);
    assert.match(elements.solutionTabs.innerHTML, /Solution 1/);
    assert.match(elements.solutionTabs.innerHTML, /Solution 2/);

    const first = vm.runInContext('currentTriangle.triangleData', context);
    assertNearlyEqual(first.angles.B, 53.13010235415599, 1e-9);
    assert.match(elements.results.innerHTML, /1 \/ 2/);

    elements.solutionTabs.handlers.click({ target: { dataset: { solutionIndex: '1' } } });

    const second = vm.runInContext('currentTriangle.triangleData', context);
    assert.equal(vm.runInContext('activeSolutionIndex', context), 1);
    assertNearlyEqual(second.angles.B, 126.86989764584402, 1e-9);
    assert.match(elements.results.innerHTML, /2 \/ 2/);
    assert.match(elements.solutionTabs.innerHTML, /solution-tab active" type="button" data-solution-index="1"/);
});

test('SSA tangent input produces one valid solution', () => {
    const { context, elements } = loadApp();

    elements.ssaModeButton.handlers.click({ target: elements.ssaModeButton });
    elements.ssaAngleA.value = '30';
    elements.ssaSideA.value = '5';
    elements.ssaSideB.value = '10';

    elements.calculateButton.handlers.click();

    const data = vm.runInContext('currentTriangle.triangleData', context);
    assert.equal(elements.errorMessage.style.display, 'none');
    assert.equal(vm.runInContext('triangleSolutions.length', context), 1);
    assert.equal(elements.solutionTabs.hidden, true);
    assertNearlyEqual(data.angles.B, 90, 1e-9);
});

test('impossible SSA input clears stale solution state', () => {
    const { context, elements } = loadApp();

    elements.ssaModeButton.handlers.click({ target: elements.ssaModeButton });
    assert.equal(vm.runInContext('triangleSolutions.length', context), 2);

    elements.ssaAngleA.value = '30';
    elements.ssaSideA.value = '5';
    elements.ssaSideB.value = '11';
    elements.calculateButton.handlers.click();

    assert.equal(elements.errorMessage.style.display, 'block');
    assert.match(elements.errorMessage.textContent, /cannot form a triangle/);
    assert.equal(vm.runInContext('currentTriangle', context), null);
    assert.equal(vm.runInContext('triangleSolutions.length', context), 0);
    assert.equal(elements.solutionTabs.hidden, true);
    assert.equal(elements.triangleSVG.innerHTML, '');
    assert.match(elements.results.innerHTML, /No valid triangle/);
    assert.equal(vm.runInContext('buildTextResults()', context), '');
    assert.equal(vm.runInContext('buildCsvResults()', context), '');
});

test('input mode tabs show only the selected calculation form', () => {
    const { context, elements } = loadApp();

    assert.equal(vm.runInContext('activeInputMode', context), 'sss');
    assert.equal(elements.sssModeButton.classList.contains('active'), true);
    assert.equal(elements.sssInputPanel.hidden, false);
    assert.equal(elements.sasInputPanel.hidden, true);

    elements.asaModeButton.handlers.click({ target: elements.asaModeButton });

    assert.equal(vm.runInContext('activeInputMode', context), 'asa');
    assert.equal(elements.asaModeButton.classList.contains('active'), true);
    assert.equal(elements.sssInputPanel.hidden, true);
    assert.equal(elements.asaInputPanel.hidden, false);
});

test('rejects invalid mode-specific input values', () => {
    let app = loadApp();
    app.elements.sssSideA.value = '';
    app.elements.calculateButton.handlers.click();
    assert.equal(app.elements.errorMessage.style.display, 'block');
    assert.match(app.elements.errorMessage.textContent, /Please enter Side a/);

    app = loadApp();
    app.elements.asaModeButton.handlers.click({ target: app.elements.asaModeButton });
    app.elements.asaAngleA.value = '120';
    app.elements.asaAngleB.value = '80';
    app.elements.calculateButton.handlers.click();
    assert.equal(app.elements.errorMessage.style.display, 'block');
    assert.match(app.elements.errorMessage.textContent, /sum to less than 180/);
});

test('rejects side ratios that are too extreme', () => {
    const { elements } = loadApp();
    elements.sssSideA.value = '1';
    elements.sssSideB.value = '1';
    elements.sssSideC.value = '1000000000';

    elements.calculateButton.handlers.click();

    assert.equal(elements.errorMessage.style.display, 'block');
    assert.match(elements.errorMessage.textContent, /differ too much/);
});

test('rotates side alignment through c, b, and a around the centroid model', () => {
    const { context, elements } = loadApp();

    assert.equal(getRotation(context), 0);
    assert.ok(getTransformedSideDy(context, 'c') < 1e-9);

    elements.rotateRightButton.handlers.click();
    assert.ok(getTransformedSideDy(context, 'b') < 1e-9);

    elements.rotateRightButton.handlers.click();
    assert.ok(getTransformedSideDy(context, 'a') < 1e-9);

    elements.rotateLeftButton.handlers.click();
    assert.ok(getTransformedSideDy(context, 'b') < 1e-9);
});

test('pressing Enter in a side input recalculates the triangle', () => {
    const { elements } = loadApp();
    let prevented = false;

    elements.sssSideA.value = '5';
    elements.sssSideB.value = '5';
    elements.sssSideC.value = '6';
    elements.sssSideA.handlers.keydown({
        key: 'Enter',
        preventDefault() {
            prevented = true;
        }
    });

    assert.equal(prevented, true);
    assert.match(elements.results.innerHTML, /12\.000000/);
});

test('pressing Enter in an angle input recalculates the triangle', () => {
    const { elements } = loadApp();
    let prevented = false;

    elements.aasModeButton.handlers.click({ target: elements.aasModeButton });
    elements.aasSideA.value = '10';
    elements.aasAngleA.value = '30';
    elements.aasAngleB.value = '60';
    elements.aasAngleB.handlers.keydown({
        key: 'Enter',
        preventDefault() {
            prevented = true;
        }
    });

    assert.equal(prevented, true);
    assert.match(elements.results.innerHTML, /90\.000000 deg/);
});

test('SVG labels use collision-aware placement and two-decimal numbers', () => {
    const { elements } = loadApp();

    assert.match(elements.triangleSVG.innerHTML, /text-anchor="/);
    assert.match(elements.triangleSVG.innerHTML, />3\.20</);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, /3\.200000/);
});

test('separate SVG display toggles control axes, altitudes, foot labels, and segment lengths', () => {
    const { elements } = loadApp();

    assert.match(elements.triangleSVG.innerHTML, /x2="800"/);
    assert.match(elements.triangleSVG.innerHTML, /stroke="#c46a2d"/);
    assert.match(elements.triangleSVG.innerHTML, />H₁</);
    assert.match(elements.triangleSVG.innerHTML, />3\.20</);

    elements.showAxes.checked = false;
    elements.showAltitudes.checked = false;
    elements.showFootLabels.checked = false;
    elements.showSegmentLengths.checked = false;
    elements.showAxes.handlers.change();

    assert.doesNotMatch(elements.triangleSVG.innerHTML, /x2="800"/);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, /stroke="#c46a2d"/);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, />H₁</);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, />3\.20</);
});

test('triangle fill, vertex labels, and extension lines have independent toggles', () => {
    const { elements } = loadApp();

    elements.sssSideA.value = '3';
    elements.sssSideB.value = '4';
    elements.sssSideC.value = '6';
    elements.calculateButton.handlers.click();

    assert.match(elements.triangleSVG.innerHTML, /fill="rgba\(23, 107, 135, 0\.10\)"/);
    assert.match(elements.triangleSVG.innerHTML, />A</);
    assert.match(elements.triangleSVG.innerHTML, /stroke-dasharray="8,6"/);

    elements.showTriangleFill.checked = false;
    elements.showVertexLabels.checked = false;
    elements.showExtensionLines.checked = false;
    elements.showTriangleFill.handlers.change();

    assert.match(elements.triangleSVG.innerHTML, /<polygon[^>]+fill="none"/);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, />A</);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, /stroke-dasharray="8,6"/);
});

test('display presets apply common SVG layer configurations', () => {
    const { context, elements, localStorage } = loadApp();

    assert.equal(vm.runInContext('activeDisplayPreset', context), 'construction');
    assert.equal(elements.constructionPresetButton.classList.contains('active'), true);

    elements.measurementPresetButton.handlers.click();
    assert.equal(vm.runInContext('activeDisplayPreset', context), 'measurement');
    assert.equal(elements.showAxes.checked, false);
    assert.equal(elements.showAltitudes.checked, true);
    assert.equal(elements.showSegmentLengths.checked, true);
    assert.equal(elements.showTriangleFill.checked, false);
    assert.equal(elements.measurementPresetButton.classList.contains('active'), true);
    assert.match(elements.triangleSVG.innerHTML, /<polygon[^>]+fill="none"/);
    assert.match(elements.triangleSVG.innerHTML, />3\.20</);

    elements.presentationPresetButton.handlers.click();
    assert.equal(vm.runInContext('activeDisplayPreset', context), 'presentation');
    assert.equal(elements.showAltitudes.checked, false);
    assert.equal(elements.showFootLabels.checked, false);
    assert.equal(elements.showSegmentLengths.checked, false);
    assert.equal(elements.showVertexLabels.checked, true);
    assert.equal(elements.presentationPresetButton.classList.contains('active'), true);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, />H₁</);
    assert.doesNotMatch(elements.triangleSVG.innerHTML, />3\.20</);

    elements.showAxes.checked = true;
    elements.showAxes.handlers.change();
    assert.equal(vm.runInContext('activeDisplayPreset', context), 'custom');
    assert.equal(elements.presentationPresetButton.classList.contains('active'), false);
    assert.match(localStorage.store['triangleResolver.displayState.v1'], /"preset":"custom"/);

    elements.showAxes.checked = false;
    elements.showAltitudes.checked = true;
    elements.showFootLabels.checked = true;
    elements.showSegmentLengths.checked = true;
    elements.showTriangleFill.checked = false;
    elements.showVertexLabels.checked = true;
    elements.showExtensionLines.checked = true;
    elements.showAxes.handlers.change();

    assert.equal(vm.runInContext('activeDisplayPreset', context), 'measurement');
    assert.equal(elements.measurementPresetButton.classList.contains('active'), true);
    assert.match(localStorage.store['triangleResolver.displayState.v1'], /"preset":"measurement"/);
});

test('last display state is restored from localStorage on startup', () => {
    const savedState = JSON.stringify({
        preset: 'measurement',
        options: {
            showAxes: false,
            showAltitudes: true,
            showFootLabels: true,
            showSegmentLengths: true,
            showTriangleFill: false,
            showVertexLabels: true,
            showExtensionLines: true
        }
    });
    const { context, elements } = loadApp({
        localStorage: {
            'triangleResolver.displayState.v1': savedState
        }
    });

    assert.equal(vm.runInContext('activeDisplayPreset', context), 'measurement');
    assert.equal(elements.measurementPresetButton.classList.contains('active'), true);
    assert.equal(elements.showAxes.checked, false);
    assert.equal(elements.showTriangleFill.checked, false);
    assert.match(elements.triangleSVG.innerHTML, /<polygon[^>]+fill="none"/);
    assert.match(elements.triangleSVG.innerHTML, />3\.20</);
});

test('reset display preferences clears saved state and restores construction view', () => {
    const savedState = JSON.stringify({
        preset: 'measurement',
        options: {
            showAxes: false,
            showAltitudes: true,
            showFootLabels: true,
            showSegmentLengths: true,
            showTriangleFill: false,
            showVertexLabels: true,
            showExtensionLines: true
        }
    });
    const { context, elements, localStorage } = loadApp({
        localStorage: {
            'triangleResolver.displayState.v1': savedState
        }
    });

    elements.resetDisplayPreferencesButton.handlers.click();

    assert.equal(localStorage.store['triangleResolver.displayState.v1'], undefined);
    assert.equal(vm.runInContext('activeDisplayPreset', context), 'construction');
    assert.equal(elements.constructionPresetButton.classList.contains('active'), true);
    assert.equal(elements.showAxes.checked, true);
    assert.equal(elements.showTriangleFill.checked, true);
    assert.equal(elements.displayPreferencesStatus.textContent, 'Display preferences reset');
    assert.match(elements.triangleSVG.innerHTML, /fill="rgba\(23, 107, 135, 0\.10\)"/);
});

test('exports SVG, PNG, TXT, and CSV outputs', () => {
    const { context, elements, downloads } = loadApp();
    const text = vm.runInContext('buildTextResults()', context);
    const csv = vm.runInContext('buildCsvResults()', context);
    const svg = vm.runInContext('getSvgDocument()', context);

    assert.match(text, /Area: 6\.000000/);
    assert.match(text, /H3A: 3\.200000/);
    assert.doesNotMatch(text, /Metadata/);
    assert.match(csv, /Basic Information,Area,6\.000000/);
    assert.match(csv, /Foot Point Segments,H3A,3\.200000/);
    assert.doesNotMatch(csv, /Metadata/);
    assert.doesNotMatch(svg, /<metadata>/);

    elements.includeExportMetadata.checked = true;
    elements.includeExportMetadata.handlers.change();

    assert.match(vm.runInContext('buildTextResults()', context), /Metadata\nGenerated At:/);
    assert.match(vm.runInContext('buildCsvResults()', context), /Metadata,Generated At,/);
    assert.match(vm.runInContext('getSvgDocument()', context), /<metadata>/);
    assert.match(vm.runInContext('getSvgDocument()', context), /&quot;inputMode&quot;:&quot;sss&quot;/);
    assert.match(vm.runInContext('getSvgDocument()', context), /&quot;resolvedSides&quot;/);
    assert.match(vm.runInContext('buildCsvResults()', context), /Metadata,Display Preset,construction/);
    assert.match(vm.runInContext('buildCsvResults()', context), /Metadata,Show Triangle Fill,true/);

    vm.runInContext('downloadSVG(); downloadPNG(); downloadTXT(); downloadCSV();', context);

    assert.deepEqual(downloads.sort(), [
        'triangle_SSS_3_4_5.png',
        'triangle_SSS_3_4_5.svg',
        'triangle_SSS_3_4_5_results.csv',
        'triangle_SSS_3_4_5_results.txt'
    ].sort());
});

test('export filenames include mode and active SSA solution without unsafe raw numbers', () => {
    const { context, elements, downloads } = loadApp();

    elements.ssaModeButton.handlers.click({ target: elements.ssaModeButton });
    elements.ssaAngleA.value = '30';
    elements.ssaSideA.value = '5.000000000';
    elements.ssaSideB.value = '8.123456789';
    elements.calculateButton.handlers.click();
    elements.solutionTabs.handlers.click({ target: { dataset: { solutionIndex: '1' } } });

    vm.runInContext('downloadCSV();', context);

    assert.equal(downloads.length, 1);
    assert.match(downloads[0], /^triangle_SSA_[0-9._-]+_solution_2_results\.csv$/);
    assert.doesNotMatch(downloads[0], /000000000/);
});
