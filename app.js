let currentTriangle = null;
let triangleSolutions = [];
let activeSolutionIndex = 0;
let activeInputMode = 'sss';
let showAxes = true;
let showAltitudes = true;
let showFootLabels = true;
let showSegmentLengths = true;
let showTriangleFill = true;
let showVertexLabels = true;
let showExtensionLines = true;
let includeExportMetadata = false;
let activeDisplayPreset = 'construction';
let initialScale = 1;
let rotationTargetIndex = 0;
let theme = null;
let displayPreferencesStatusTimer = null;

const viewTransform = {
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0
};

let isDragging = false;
const lastMousePos = { x: 0, y: 0 };

const MIN_RELATIVE_SIDE = 1e-8;
const RIGHT_TRIANGLE_EPS = 1e-10;
const ANGLE_EPS = 1e-10;
const SIDE_SOLUTION_EPS = 1e-9;
const SIDE_KEYS = ['a', 'b', 'c'];
const ANGLE_KEYS = ['A', 'B', 'C'];
const SIDE_TO_ANGLE = { a: 'A', b: 'B', c: 'C' };
const ANGLE_TO_SIDE = { A: 'a', B: 'b', C: 'c' };
const SIDE_LABELS = {
    a: 'Side a (BC)',
    b: 'Side b (AC)',
    c: 'Side c (AB)'
};
const ANGLE_LABELS = {
    A: 'Angle A (deg)',
    B: 'Angle B (deg)',
    C: 'Angle C (deg)'
};
const ROTATION_TARGETS = ['c', 'b', 'a'];
const LOCAL_STORAGE_DISPLAY_STATE_KEY = 'triangleResolver.displayState.v1';
const DISPLAY_PRESETS = {
    construction: {
        showAxes: true,
        showAltitudes: true,
        showFootLabels: true,
        showSegmentLengths: true,
        showTriangleFill: true,
        showVertexLabels: true,
        showExtensionLines: true
    },
    measurement: {
        showAxes: false,
        showAltitudes: true,
        showFootLabels: true,
        showSegmentLengths: true,
        showTriangleFill: false,
        showVertexLabels: true,
        showExtensionLines: true
    },
    presentation: {
        showAxes: false,
        showAltitudes: false,
        showFootLabels: false,
        showSegmentLengths: false,
        showTriangleFill: false,
        showVertexLabels: true,
        showExtensionLines: false
    }
};
const NUMERIC_THEME_KEYS = [
    'svgWidth',
    'svgHeight',
    'svgCenterX',
    'svgCenterY',
    'fitPadding',
    'fitScaleRatio',
    'svgAxisStrokeWidth',
    'svgExtensionStrokeWidth',
    'svgTriangleStrokeWidth',
    'svgAltitudeStrokeWidth',
    'svgFootRadius',
    'svgVertexRadius',
    'svgAltitudeNumberOffsetY',
    'svgSegmentNumberOffsetY',
    'svgDimensionFontSize',
    'svgOutsideDimensionFontSize',
    'svgFootLabelFontSize',
    'svgVertexLabelFontSize',
    'svgLabelClearance',
    'svgLabelCandidateStep'
];

const svg = document.getElementById('triangleSVG');
const elements = {
    sssModeButton: document.getElementById('sssModeButton'),
    sasModeButton: document.getElementById('sasModeButton'),
    asaModeButton: document.getElementById('asaModeButton'),
    aasModeButton: document.getElementById('aasModeButton'),
    ssaModeButton: document.getElementById('ssaModeButton'),
    sssInputPanel: document.getElementById('sssInputPanel'),
    sasInputPanel: document.getElementById('sasInputPanel'),
    asaInputPanel: document.getElementById('asaInputPanel'),
    aasInputPanel: document.getElementById('aasInputPanel'),
    ssaInputPanel: document.getElementById('ssaInputPanel'),
    sssSideA: document.getElementById('sssSideA'),
    sssSideB: document.getElementById('sssSideB'),
    sssSideC: document.getElementById('sssSideC'),
    sasSideB: document.getElementById('sasSideB'),
    sasSideC: document.getElementById('sasSideC'),
    sasAngleA: document.getElementById('sasAngleA'),
    asaAngleA: document.getElementById('asaAngleA'),
    asaSideC: document.getElementById('asaSideC'),
    asaAngleB: document.getElementById('asaAngleB'),
    aasAngleA: document.getElementById('aasAngleA'),
    aasAngleB: document.getElementById('aasAngleB'),
    aasSideA: document.getElementById('aasSideA'),
    ssaAngleA: document.getElementById('ssaAngleA'),
    ssaSideA: document.getElementById('ssaSideA'),
    ssaSideB: document.getElementById('ssaSideB'),
    solutionTabs: document.getElementById('solutionTabs'),
    showAxes: document.getElementById('showAxes'),
    showAltitudes: document.getElementById('showAltitudes'),
    showFootLabels: document.getElementById('showFootLabels'),
    showSegmentLengths: document.getElementById('showSegmentLengths'),
    showTriangleFill: document.getElementById('showTriangleFill'),
    showVertexLabels: document.getElementById('showVertexLabels'),
    showExtensionLines: document.getElementById('showExtensionLines'),
    includeExportMetadata: document.getElementById('includeExportMetadata'),
    displayPreferencesStatus: document.getElementById('displayPreferencesStatus'),
    errorMessage: document.getElementById('errorMessage'),
    results: document.getElementById('results'),
    calculateButton: document.getElementById('calculateButton'),
    resetViewButton: document.getElementById('resetViewButton'),
    fitToScreenButton: document.getElementById('fitToScreenButton'),
    downloadSvgButton: document.getElementById('downloadSvgButton'),
    downloadPngButton: document.getElementById('downloadPngButton'),
    downloadTxtButton: document.getElementById('downloadTxtButton'),
    downloadCsvButton: document.getElementById('downloadCsvButton'),
    constructionPresetButton: document.getElementById('constructionPresetButton'),
    measurementPresetButton: document.getElementById('measurementPresetButton'),
    presentationPresetButton: document.getElementById('presentationPresetButton'),
    resetDisplayPreferencesButton: document.getElementById('resetDisplayPreferencesButton'),
    zoomInButton: document.getElementById('zoomInButton'),
    zoomOutButton: document.getElementById('zoomOutButton'),
    fitViewButton: document.getElementById('fitViewButton'),
    rotateLeftButton: document.getElementById('rotateLeftButton'),
    rotateRightButton: document.getElementById('rotateRightButton')
};

function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function toThemeKey(name) {
    return name.replace(/^--/, '').replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}

function buildTheme() {
    const variableNames = [
        '--svg-width',
        '--svg-height',
        '--svg-center-x',
        '--svg-center-y',
        '--fit-padding',
        '--fit-scale-ratio',
        '--svg-bg',
        '--svg-axis',
        '--svg-extension',
        '--svg-triangle-fill',
        '--svg-triangle-stroke',
        '--svg-altitude',
        '--svg-text',
        '--svg-axis-stroke-width',
        '--svg-extension-stroke-width',
        '--svg-extension-dasharray',
        '--svg-triangle-stroke-width',
        '--svg-altitude-stroke-width',
        '--svg-foot-radius',
        '--svg-vertex-radius',
        '--svg-altitude-number-offset-y',
        '--svg-segment-number-offset-y',
        '--svg-dimension-font-size',
        '--svg-outside-dimension-font-size',
        '--svg-foot-label-font-size',
        '--svg-vertex-label-font-size',
        '--svg-label-clearance',
        '--svg-label-candidate-step'
    ];

    const nextTheme = {};
    variableNames.forEach((name) => {
        const key = toThemeKey(name);
        const value = cssVar(name);
        nextTheme[key] = NUMERIC_THEME_KEYS.includes(key) ? Number(value) : value;
    });

    return nextTheme;
}

function getTheme() {
    if (!theme) {
        theme = buildTheme();
    }

    return theme;
}

function formatNumber(value) {
    const normalized = Math.abs(value) < 1e-12 ? 0 : value;
    return normalized.toFixed(6);
}

function formatSvgNumber(value) {
    const normalized = Math.abs(value) < 1e-12 ? 0 : value;
    return normalized.toFixed(2);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function assertFiniteSide(value, label) {
    if (!Number.isFinite(value)) {
        throw new Error(`Side ${label} must be a finite number`);
    }

    if (value <= 0) {
        throw new Error('Side lengths must be positive');
    }
}

function readMeasurement(element, label, kind) {
    const rawValue = element.value.trim();
    if (rawValue === '') {
        throw new Error(`Please enter ${label}`);
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
        throw new Error(`${label} must be a finite number`);
    }

    if (kind === 'side') {
        if (value <= 0) {
            throw new Error('Side lengths must be positive');
        }
    } else if (value <= 0 || value >= 180) {
        throw new Error('Angles must be greater than 0 and less than 180 degrees');
    }

    return value;
}

function createEmptyTriangleInput(mode) {
    return {
        mode,
        sides: { a: null, b: null, c: null },
        angles: { A: null, B: null, C: null },
        providedSides: [],
        providedAngles: []
    };
}

function finishTriangleInput(input) {
    input.providedSides = SIDE_KEYS.filter((key) => input.sides[key] !== null);
    input.providedAngles = ANGLE_KEYS.filter((key) => input.angles[key] !== null);
    return input;
}

function setModeValue(input, kind, key, value) {
    const values = kind === 'side' ? input.sides : input.angles;
    if (values[key] !== null) {
        throw new Error(`Duplicate ${kind} ${key} selection`);
    }

    values[key] = value;
}

function readSssInput() {
    const input = createEmptyTriangleInput('SSS');

    setModeValue(input, 'side', 'a', readMeasurement(elements.sssSideA, SIDE_LABELS.a, 'side'));
    setModeValue(input, 'side', 'b', readMeasurement(elements.sssSideB, SIDE_LABELS.b, 'side'));
    setModeValue(input, 'side', 'c', readMeasurement(elements.sssSideC, SIDE_LABELS.c, 'side'));

    return finishTriangleInput(input);
}

function readSasInput() {
    const input = createEmptyTriangleInput('SAS');

    setModeValue(input, 'side', 'b', readMeasurement(elements.sasSideB, SIDE_LABELS.b, 'side'));
    setModeValue(input, 'side', 'c', readMeasurement(elements.sasSideC, SIDE_LABELS.c, 'side'));
    setModeValue(input, 'angle', 'A', readMeasurement(elements.sasAngleA, ANGLE_LABELS.A, 'angle'));

    return finishTriangleInput(input);
}

function readAsaInput() {
    const input = createEmptyTriangleInput('ASA');

    setModeValue(input, 'angle', 'A', readMeasurement(elements.asaAngleA, ANGLE_LABELS.A, 'angle'));
    setModeValue(input, 'side', 'c', readMeasurement(elements.asaSideC, SIDE_LABELS.c, 'side'));
    setModeValue(input, 'angle', 'B', readMeasurement(elements.asaAngleB, ANGLE_LABELS.B, 'angle'));

    return finishTriangleInput(input);
}

function readAasInput() {
    const input = createEmptyTriangleInput('AAS');

    setModeValue(input, 'angle', 'A', readMeasurement(elements.aasAngleA, ANGLE_LABELS.A, 'angle'));
    setModeValue(input, 'angle', 'B', readMeasurement(elements.aasAngleB, ANGLE_LABELS.B, 'angle'));
    setModeValue(input, 'side', 'a', readMeasurement(elements.aasSideA, SIDE_LABELS.a, 'side'));

    return finishTriangleInput(input);
}

function readSsaInput() {
    const input = createEmptyTriangleInput('SSA');

    setModeValue(input, 'angle', 'A', readMeasurement(elements.ssaAngleA, ANGLE_LABELS.A, 'angle'));
    setModeValue(input, 'side', 'a', readMeasurement(elements.ssaSideA, SIDE_LABELS.a, 'side'));
    setModeValue(input, 'side', 'b', readMeasurement(elements.ssaSideB, SIDE_LABELS.b, 'side'));

    return finishTriangleInput(input);
}

function readTriangleInputs() {
    if (activeInputMode === 'sss') {
        return readSssInput();
    }

    if (activeInputMode === 'sas') {
        return readSasInput();
    }

    if (activeInputMode === 'asa') {
        return readAsaInput();
    }

    if (activeInputMode === 'aas') {
        return readAasInput();
    }

    return readSsaInput();
}

function getProvidedInputSummary(input) {
    const values = [];

    SIDE_KEYS.forEach((key) => {
        if (input.sides[key] !== null) {
            values.push(`${key}=${formatNumber(input.sides[key])}`);
        }
    });

    ANGLE_KEYS.forEach((key) => {
        if (input.angles[key] !== null) {
            values.push(`${key}=${formatNumber(input.angles[key])} deg`);
        }
    });

    return values.join(', ');
}

function updateInputModePanels() {
    elements.sssModeButton.classList.toggle('active', activeInputMode === 'sss');
    elements.sasModeButton.classList.toggle('active', activeInputMode === 'sas');
    elements.asaModeButton.classList.toggle('active', activeInputMode === 'asa');
    elements.aasModeButton.classList.toggle('active', activeInputMode === 'aas');
    elements.ssaModeButton.classList.toggle('active', activeInputMode === 'ssa');
    elements.sssInputPanel.hidden = activeInputMode !== 'sss';
    elements.sasInputPanel.hidden = activeInputMode !== 'sas';
    elements.asaInputPanel.hidden = activeInputMode !== 'asa';
    elements.aasInputPanel.hidden = activeInputMode !== 'aas';
    elements.ssaInputPanel.hidden = activeInputMode !== 'ssa';
}

function setInputMode(mode) {
    activeInputMode = mode;
    updateInputModePanels();
    calculateAndDraw();
}

function assertKnownAngleSum(angles) {
    const knownAngles = ANGLE_KEYS
        .map((key) => angles[key])
        .filter((value) => value !== null);
    const sum = knownAngles.reduce((total, value) => total + value, 0);

    if (knownAngles.length >= 2 && sum >= 180 - ANGLE_EPS) {
        throw new Error('Known angles must sum to less than 180 degrees');
    }
}

function completeAngles(angles) {
    assertKnownAngleSum(angles);

    const completed = { ...angles };
    const missingAngles = ANGLE_KEYS.filter((key) => completed[key] === null);

    if (missingAngles.length === 1) {
        completed[missingAngles[0]] = 180 - ANGLE_KEYS
            .filter((key) => key !== missingAngles[0])
            .reduce((total, key) => total + completed[key], 0);
    }

    if (ANGLE_KEYS.some((key) => completed[key] !== null && (completed[key] <= ANGLE_EPS || completed[key] >= 180 - ANGLE_EPS))) {
        throw new Error('Angles must form a valid triangle');
    }

    return completed;
}

function buildSolutionFromSides(sides, method, inputSummary) {
    const triangleData = calculateTriangle(sides.a, sides.b, sides.c);
    const vertices = getTriangleVertices(sides.a, sides.b, sides.c);

    return {
        vertices,
        triangleData,
        method,
        inputSummary
    };
}

function dedupeSideSolutions(solutions) {
    return solutions.filter((solution, index) => {
        const maxSide = Math.max(solution.a, solution.b, solution.c);
        return !solutions.slice(0, index).some((previous) => (
            Math.abs(solution.a - previous.a) <= SIDE_SOLUTION_EPS * maxSide &&
            Math.abs(solution.b - previous.b) <= SIDE_SOLUTION_EPS * maxSide &&
            Math.abs(solution.c - previous.c) <= SIDE_SOLUTION_EPS * maxSide
        ));
    });
}

function solveFromOneSideAndTwoAngles(input) {
    const angles = completeAngles(input.angles);
    const knownSideKey = input.providedSides[0];
    const knownAngleKey = SIDE_TO_ANGLE[knownSideKey];
    const knownAngle = angles[knownAngleKey];
    const knownSide = input.sides[knownSideKey];
    const sinKnownAngle = Math.sin(degreesToRadians(knownAngle));

    if (sinKnownAngle <= ANGLE_EPS) {
        throw new Error('Angles must form a valid triangle');
    }

    const sides = {};
    SIDE_KEYS.forEach((sideKey) => {
        const angleKey = SIDE_TO_ANGLE[sideKey];
        sides[sideKey] = knownSide * Math.sin(degreesToRadians(angles[angleKey])) / sinKnownAngle;
    });

    return [{ sides, method: input.mode }];
}

function solveFromSas(input, includedAngleKey) {
    const sides = { ...input.sides };
    const unknownSideKey = ANGLE_TO_SIDE[includedAngleKey];
    const knownSideKeys = input.providedSides;
    const side1 = sides[knownSideKeys[0]];
    const side2 = sides[knownSideKeys[1]];
    const includedAngle = input.angles[includedAngleKey];
    const cosIncludedAngle = Math.cos(degreesToRadians(includedAngle));
    const scale = Math.max(side1, side2);
    const normalizedSide1 = side1 / scale;
    const normalizedSide2 = side2 / scale;

    sides[unknownSideKey] = Math.sqrt(Math.max(
        0,
        normalizedSide1 * normalizedSide1 +
            normalizedSide2 * normalizedSide2 -
            2 * normalizedSide1 * normalizedSide2 * cosIncludedAngle
    )) * scale;

    return [{ sides, method: 'SAS' }];
}

function solveFromSsa(input, knownAngleKey) {
    const knownAngle = input.angles[knownAngleKey];
    const oppositeSideKey = ANGLE_TO_SIDE[knownAngleKey];
    const oppositeSide = input.sides[oppositeSideKey];
    const otherSideKey = input.providedSides.find((key) => key !== oppositeSideKey);
    const otherAngleKey = SIDE_TO_ANGLE[otherSideKey];
    const otherSide = input.sides[otherSideKey];
    const knownAngleSin = Math.sin(degreesToRadians(knownAngle));
    const otherAngleSin = otherSide * knownAngleSin / oppositeSide;

    if (otherAngleSin > 1 + ANGLE_EPS) {
        throw new Error('The provided side-angle combination cannot form a triangle');
    }

    const clampedSin = clamp(otherAngleSin, -1, 1);
    const isTangentSolution = Math.abs(1 - clampedSin) <= ANGLE_EPS;
    const primaryOtherAngle = isTangentSolution ? 90 : radiansToDegrees(Math.asin(clampedSin));
    const candidateAngles = [primaryOtherAngle];

    // SSA tangent cases have exactly one solution; treat sin ~= 1 as tangent to avoid float-noise duplicates.
    if (!isTangentSolution && primaryOtherAngle > ANGLE_EPS && primaryOtherAngle < 90 - ANGLE_EPS) {
        candidateAngles.push(180 - primaryOtherAngle);
    }

    const sideSolutions = [];
    candidateAngles.forEach((otherAngle) => {
        if (otherAngle <= ANGLE_EPS) return;

        const thirdAngle = 180 - knownAngle - otherAngle;
        if (thirdAngle <= ANGLE_EPS) return;

        const thirdAngleKey = ANGLE_KEYS.find((key) => key !== knownAngleKey && key !== otherAngleKey);
        const thirdSideKey = ANGLE_TO_SIDE[thirdAngleKey];
        const sides = { ...input.sides };

        sides[thirdSideKey] = oppositeSide * Math.sin(degreesToRadians(thirdAngle)) / knownAngleSin;
        sideSolutions.push(sides);
    });

    const deduped = dedupeSideSolutions(sideSolutions);
    if (deduped.length === 0) {
        throw new Error('The provided side-angle combination cannot form a triangle');
    }

    return deduped.map((sides) => ({ sides, method: 'SSA' }));
}

function solveFromTwoSidesAndOneAngle(input) {
    const angleKey = input.providedAngles[0];
    const includedSideKeys = SIDE_KEYS.filter((key) => key !== ANGLE_TO_SIDE[angleKey]);
    const isIncludedAngle = includedSideKeys.every((sideKey) => input.sides[sideKey] !== null);

    if (isIncludedAngle) {
        return solveFromSas(input, angleKey);
    }

    if (input.sides[ANGLE_TO_SIDE[angleKey]] === null) {
        throw new Error('A non-included angle must be paired with its opposite side');
    }

    return solveFromSsa(input, angleKey);
}

function solveTrianglesFromInputs(input) {
    assertKnownAngleSum(input.angles);

    if (input.providedSides.length === 3) {
        return [{ sides: { ...input.sides }, method: 'SSS' }];
    }

    if (input.providedSides.length === 1 && input.providedAngles.length === 2) {
        return solveFromOneSideAndTwoAngles(input);
    }

    if (input.providedSides.length === 2 && input.providedAngles.length === 1) {
        return solveFromTwoSidesAndOneAngle(input);
    }

    throw new Error('Unsupported input combination. Use SSS, SAS, ASA, AAS, or SSA mode.');
}

function calculateTriangle(a, b, c) {
    assertFiniteSide(a, 'a');
    assertFiniteSide(b, 'b');
    assertFiniteSide(c, 'c');

    const maxSide = Math.max(a, b, c);
    const minSide = Math.min(a, b, c);

    if (minSide / maxSide < MIN_RELATIVE_SIDE) {
        throw new Error(`Side lengths differ too much to calculate reliably. The smallest side must be at least ${MIN_RELATIVE_SIDE} of the largest side.`);
    }

    const na = a / maxSide;
    const nb = b / maxSide;
    const nc = c / maxSide;

    if (na + nb <= nc || na + nc <= nb || nb + nc <= na) {
        throw new Error('Cannot form a triangle');
    }

    const cosA = clamp((nb*nb + nc*nc - na*na) / (2 * nb * nc), -1, 1);
    const cosB = clamp((na*na + nc*nc - nb*nb) / (2 * na * nc), -1, 1);
    const cosC = clamp((na*na + nb*nb - nc*nc) / (2 * na * nb), -1, 1);

    const angleA = Math.acos(cosA) * 180 / Math.PI;
    const angleB = Math.acos(cosB) * 180 / Math.PI;
    const angleC = Math.acos(cosC) * 180 / Math.PI;

    const sorted = [na, nb, nc].sort((x, y) => y - x);
    const [x, y, z] = sorted;
    const normalizedArea = 0.25 * Math.sqrt(
        Math.max(0, (x + (y + z)) * (z - (x - y)) * (z + (x - y)) * (x + (y - z)))
    );
    const area = normalizedArea * maxSide * maxSide;
    if (!Number.isFinite(area)) {
        throw new Error('Side lengths are too large to calculate the area reliably');
    }

    if (normalizedArea > 0 && area === 0) {
        throw new Error('Side lengths are too small to calculate the area reliably');
    }

    const ha = (2 * normalizedArea / na) * maxSide;
    const hb = (2 * normalizedArea / nb) * maxSide;
    const hc = (2 * normalizedArea / nc) * maxSide;

    let isRight = false;
    let rightVertex = null;

    if (Math.abs(cosA) < RIGHT_TRIANGLE_EPS) {
        isRight = true;
        rightVertex = 'A';
    } else if (Math.abs(cosB) < RIGHT_TRIANGLE_EPS) {
        isRight = true;
        rightVertex = 'B';
    } else if (Math.abs(cosC) < RIGHT_TRIANGLE_EPS) {
        isRight = true;
        rightVertex = 'C';
    }

    const vertices = getTriangleVertices(a, b, c);
    const H1 = getFootPoint(vertices.A, vertices.B, vertices.C);
    const H2 = getFootPoint(vertices.B, vertices.A, vertices.C);
    const H3 = getFootPoint(vertices.C, vertices.A, vertices.B);

    const distance = (P, Q) => Math.hypot(P.x - Q.x, P.y - Q.y);
    const fixZeroLength = (val) => Math.abs(val) < 1e-10 * maxSide ? 0 : val;
    const fixZeroAngle = (val) => Math.abs(val) < 1e-10 ? 0 : val;

    return {
        sides: { a, b, c },
        angles: { A: fixZeroAngle(angleA), B: fixZeroAngle(angleB), C: fixZeroAngle(angleC) },
        heights: { ha: fixZeroLength(ha), hb: fixZeroLength(hb), hc: fixZeroLength(hc) },
        segments: {
            a: { seg1: fixZeroLength(distance(vertices.B, H1)), seg2: fixZeroLength(distance(H1, vertices.C)) },
            b: { seg1: fixZeroLength(distance(vertices.A, H2)), seg2: fixZeroLength(distance(H2, vertices.C)) },
            c: { seg1: fixZeroLength(distance(vertices.A, H3)), seg2: fixZeroLength(distance(H3, vertices.B)) }
        },
        area,
        isRight,
        rightVertex
    };
}

function getTriangleVertices(a, b, c) {
    const A = { x: 0, y: 0 };
    const B = { x: c, y: 0 };
    const maxSide = Math.max(a, b, c);
    const na = a / maxSide;
    const nb = b / maxSide;
    const nc = c / maxSide;
    const cosA = clamp((nb*nb + nc*nc - na*na) / (2 * nb * nc), -1, 1);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const C = { x: b * cosA, y: b * sinA };
    return { A, B, C };
}

function getFootPoint(P, Q, R) {
    const x1 = Q.x, y1 = Q.y;
    const x2 = R.x, y2 = R.y;
    const x0 = P.x, y0 = P.y;
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) < 1e-10 && Math.abs(dy) < 1e-10) return { x: x1, y: y1 };

    const t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
    return { x: x1 + t * dx, y: y1 + t * dy };
}

function isPointOnSegment(point, Q, R) {
    const eps = 1e-6;
    const cross = (point.x - Q.x) * (R.y - Q.y) - (point.y - Q.y) * (R.x - Q.x);
    if (Math.abs(cross) > eps) return false;

    const dot = (point.x - Q.x) * (R.x - Q.x) + (point.y - Q.y) * (R.y - Q.y);
    if (dot < -eps) return false;

    const squaredLength = (R.x - Q.x) * (R.x - Q.x) + (R.y - Q.y) * (R.y - Q.y);
    if (dot > squaredLength + eps) return false;

    return true;
}

function getBoundingBox(vertices) {
    const points = [vertices.A, vertices.B, vertices.C];
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
}

function getCentroid(vertices) {
    return {
        x: (vertices.A.x + vertices.B.x + vertices.C.x) / 3,
        y: (vertices.A.y + vertices.B.y + vertices.C.y) / 3
    };
}

function applyTransform(point) {
    const origin = currentTriangle ? getCentroid(currentTriangle.vertices) : { x: 0, y: 0 };
    const cos = Math.cos(viewTransform.rotation);
    const sin = Math.sin(viewTransform.rotation);
    const translatedX = point.x - origin.x;
    const translatedY = point.y - origin.y;
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;

    return {
        x: rotatedX * viewTransform.scale + viewTransform.offsetX,
        y: rotatedY * viewTransform.scale + viewTransform.offsetY
    };
}

function screenToWorld(point) {
    const origin = currentTriangle ? getCentroid(currentTriangle.vertices) : { x: 0, y: 0 };
    const scaledX = (point.x - viewTransform.offsetX) / viewTransform.scale;
    const scaledY = (point.y - viewTransform.offsetY) / viewTransform.scale;
    const cos = Math.cos(viewTransform.rotation);
    const sin = Math.sin(viewTransform.rotation);

    return {
        x: scaledX * cos + scaledY * sin + origin.x,
        y: -scaledX * sin + scaledY * cos + origin.y
    };
}

function getSideVector(vertices, side) {
    if (side === 'a') {
        return { x: vertices.C.x - vertices.B.x, y: vertices.C.y - vertices.B.y };
    }

    if (side === 'b') {
        return { x: vertices.C.x - vertices.A.x, y: vertices.C.y - vertices.A.y };
    }

    return { x: vertices.B.x - vertices.A.x, y: vertices.B.y - vertices.A.y };
}

function alignSideWithXAxis(side) {
    if (!currentTriangle) return;

    const vector = getSideVector(currentTriangle.vertices, side);
    viewTransform.rotation = -Math.atan2(vector.y, vector.x);
    drawTriangle();
}

function rotateLeft() {
    if (!currentTriangle) return;

    rotationTargetIndex = (rotationTargetIndex - 1 + ROTATION_TARGETS.length) % ROTATION_TARGETS.length;
    alignSideWithXAxis(ROTATION_TARGETS[rotationTargetIndex]);
}

function rotateRight() {
    if (!currentTriangle) return;

    rotationTargetIndex = (rotationTargetIndex + 1) % ROTATION_TARGETS.length;
    alignSideWithXAxis(ROTATION_TARGETS[rotationTargetIndex]);
}

function fitToScreen() {
    if (!currentTriangle) return;

    const currentTheme = getTheme();
    const bbox = getBoundingBox(currentTriangle.vertices);
    const padding = currentTheme.fitPadding;
    const safeWidth = Math.max(bbox.width, Number.EPSILON);
    const safeHeight = Math.max(bbox.height, Number.EPSILON);

    const scaleX = (currentTheme.svgWidth - padding * 2) / safeWidth;
    const scaleY = (currentTheme.svgHeight - padding * 2) / safeHeight;
    const newScale = Math.min(scaleX, scaleY) * currentTheme.fitScaleRatio;

    viewTransform.scale = newScale;
    viewTransform.offsetX = currentTheme.svgCenterX;
    viewTransform.offsetY = currentTheme.svgCenterY;
    viewTransform.rotation = 0;
    rotationTargetIndex = 0;

    initialScale = newScale;

    drawTriangle();
}

function resetView() {
    if (!currentTriangle) return;
    fitToScreen();
}

function zoomIn() {
    const maxScale = initialScale * 4;
    const newScale = Math.min(viewTransform.scale * 1.2, maxScale);
    if (newScale !== viewTransform.scale) {
        viewTransform.scale = newScale;
        drawTriangle();
    }
}

function zoomOut() {
    const minScale = initialScale * 0.5;
    const newScale = Math.max(viewTransform.scale / 1.2, minScale);
    if (newScale !== viewTransform.scale) {
        viewTransform.scale = newScale;
        drawTriangle();
    }
}

function drawExtensionLine(lineStart, lineEnd, footPoint) {
    const currentTheme = getTheme();
    const distToStart = Math.hypot(footPoint.x - lineStart.x, footPoint.y - lineStart.y);
    const distToEnd = Math.hypot(footPoint.x - lineEnd.x, footPoint.y - lineEnd.y);

    let extensionEnd;
    if (distToStart < distToEnd) {
        extensionEnd = lineStart;
    } else {
        extensionEnd = lineEnd;
    }

    const tFoot = applyTransform(footPoint);
    const tEnd = applyTransform(extensionEnd);

    return `<line x1="${tFoot.x}" y1="${tFoot.y}" x2="${tEnd.x}" y2="${tEnd.y}" stroke="${currentTheme.svgExtension}" stroke-width="${currentTheme.svgExtensionStrokeWidth}" stroke-dasharray="${currentTheme.svgExtensionDasharray}"/>`;
}

function escapeSvgText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getTextGlyphCount(text) {
    return Array.from(String(text)).length;
}

function estimateTextBox(x, y, text, fontSize, anchor = 'start') {
    const width = Math.max(fontSize * 0.62 * getTextGlyphCount(text), fontSize * 0.8);
    let left = x;

    if (anchor === 'middle') {
        left = x - width / 2;
    } else if (anchor === 'end') {
        left = x - width;
    }

    return {
        left,
        right: left + width,
        top: y - fontSize * 0.86,
        bottom: y + fontSize * 0.28
    };
}

function unionBoxes(boxes) {
    return {
        left: Math.min(...boxes.map(box => box.left)),
        right: Math.max(...boxes.map(box => box.right)),
        top: Math.min(...boxes.map(box => box.top)),
        bottom: Math.max(...boxes.map(box => box.bottom))
    };
}

function pointCollisionBox(point, radius) {
    return {
        left: point.x - radius,
        right: point.x + radius,
        top: point.y - radius,
        bottom: point.y + radius
    };
}

function getBoxOverflow(box, currentTheme) {
    return Math.max(0, -box.left) +
        Math.max(0, box.right - currentTheme.svgWidth) +
        Math.max(0, -box.top) +
        Math.max(0, box.bottom - currentTheme.svgHeight);
}

function getOverlapArea(a, b, clearance) {
    const horizontal = Math.min(a.right, b.right + clearance) - Math.max(a.left, b.left - clearance);
    const vertical = Math.min(a.bottom, b.bottom + clearance) - Math.max(a.top, b.top - clearance);
    return horizontal > 0 && vertical > 0 ? horizontal * vertical : 0;
}

function scoreLabelBox(box, labelBoxes, candidateIndex) {
    const currentTheme = getTheme();
    const clearance = currentTheme.svgLabelClearance;
    const overlapScore = labelBoxes.reduce((score, existingBox) => {
        const overlapArea = getOverlapArea(box, existingBox, clearance);
        return score + (overlapArea > 0 ? 1 + overlapArea : 0);
    }, 0);

    return overlapScore * 100000 + getBoxOverflow(box, currentTheme) * 1000 + candidateIndex;
}

function normalizeVector(vector, fallback = { x: 1, y: -1 }) {
    const length = Math.hypot(vector.x, vector.y);
    if (length < 1e-9) return fallback;

    return {
        x: vector.x / length,
        y: vector.y / length
    };
}

function getPointLabelCandidates(point, reference, fontSize, radius) {
    const currentTheme = getTheme();
    const direction = normalizeVector({
        x: point.x - reference.x,
        y: point.y - reference.y
    });
    const horizontalSign = direction.x >= 0 ? 1 : -1;
    const verticalSign = direction.y >= 0 ? 1 : -1;
    const horizontalNear = radius + currentTheme.svgLabelClearance + 4;
    const horizontalFar = horizontalNear + currentTheme.svgLabelCandidateStep;
    const above = -(radius + currentTheme.svgLabelClearance + fontSize * 0.3);
    const below = radius + currentTheme.svgLabelClearance + fontSize;
    const primaryY = verticalSign >= 0 ? below : above;
    const secondaryY = verticalSign >= 0 ? above : below;
    const primaryAnchor = horizontalSign >= 0 ? 'start' : 'end';
    const secondaryAnchor = horizontalSign >= 0 ? 'end' : 'start';

    return [
        { x: horizontalSign * horizontalNear, y: primaryY, anchor: primaryAnchor },
        { x: horizontalSign * horizontalFar, y: primaryY, anchor: primaryAnchor },
        { x: horizontalSign * horizontalNear, y: secondaryY, anchor: primaryAnchor },
        { x: -horizontalSign * horizontalNear, y: primaryY, anchor: secondaryAnchor },
        { x: -horizontalSign * horizontalFar, y: secondaryY, anchor: secondaryAnchor },
        { x: 0, y: primaryY, anchor: 'middle' },
        { x: 0, y: secondaryY, anchor: 'middle' }
    ];
}

function getLineLabelCandidates(start, end, mid, reference, fontSize, preferredOffset) {
    const currentTheme = getTheme();
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    let normal = length < 1e-9
        ? { x: 0, y: preferredOffset < 0 ? -1 : 1 }
        : { x: -dy / length, y: dx / length };
    const awayFromReference = {
        x: mid.x - reference.x,
        y: mid.y - reference.y
    };

    if (normal.x * awayFromReference.x + normal.y * awayFromReference.y < 0) {
        normal = { x: -normal.x, y: -normal.y };
    }

    const distance = Math.max(Math.abs(preferredOffset), currentTheme.svgLabelClearance + fontSize * 0.65);
    const step = currentTheme.svgLabelCandidateStep;

    return [
        { x: normal.x * distance, y: normal.y * distance, anchor: 'middle' },
        { x: normal.x * (distance + step), y: normal.y * (distance + step), anchor: 'middle' },
        { x: -normal.x * distance, y: -normal.y * distance, anchor: 'middle' },
        { x: -normal.x * (distance + step), y: -normal.y * (distance + step), anchor: 'middle' },
        { x: 0, y: preferredOffset, anchor: 'middle' }
    ];
}

function createTextElement(x, y, text, fontSize, fill, anchor, fontWeight) {
    return `<text x="${x}" y="${y}" font-size="${fontSize}" fill="${fill}" text-anchor="${anchor}" font-weight="${fontWeight}">${escapeSvgText(text)}</text>`;
}

function placeTextLabel(labelBoxes, text, basePoint, candidates, options) {
    const fontSize = options.fontSize;
    const anchor = options.anchor || 'start';
    const choices = candidates.length ? candidates : [{ x: 0, y: 0, anchor }];
    let best = null;

    choices.forEach((candidate, index) => {
        const candidateAnchor = candidate.anchor || anchor;
        const x = basePoint.x + candidate.x;
        const y = basePoint.y + candidate.y;
        const box = estimateTextBox(x, y, text, fontSize, candidateAnchor);
        const score = scoreLabelBox(box, labelBoxes, index);

        if (!best || score < best.score) {
            best = { x, y, anchor: candidateAnchor, box, score };
        }
    });

    labelBoxes.push(best.box);

    return createTextElement(
        best.x,
        best.y,
        text,
        fontSize,
        options.fill,
        best.anchor,
        options.fontWeight || 'bold'
    );
}

function estimateTextStackBox(x, y, lines, fontSize, anchor, lineHeight) {
    return unionBoxes(lines.map((line, index) => (
        estimateTextBox(x, y + index * lineHeight, line, fontSize, anchor)
    )));
}

function placeTextStack(labelBoxes, lines, basePoint, candidates, options) {
    const fontSize = options.fontSize;
    const lineHeight = options.lineHeight || fontSize + 4;
    const anchor = options.anchor || 'start';
    const choices = candidates.length ? candidates : [{ x: 0, y: 0, anchor }];
    let best = null;

    choices.forEach((candidate, index) => {
        const candidateAnchor = candidate.anchor || anchor;
        const x = basePoint.x + candidate.x;
        const y = basePoint.y + candidate.y;
        const box = estimateTextStackBox(x, y, lines, fontSize, candidateAnchor, lineHeight);
        const score = scoreLabelBox(box, labelBoxes, index);

        if (!best || score < best.score) {
            best = { x, y, anchor: candidateAnchor, box, score };
        }
    });

    labelBoxes.push(best.box);

    return lines.map((line, index) => (
        createTextElement(
            best.x,
            best.y + index * lineHeight,
            line,
            fontSize,
            options.fill,
            best.anchor,
            options.fontWeight || 'bold'
        )
    )).join('');
}

function drawTriangle() {
    if (!currentTriangle) return;

    const currentTheme = getTheme();
    const vertices = currentTriangle.vertices;
    const triangleData = currentTriangle.triangleData;

    const tA = applyTransform(vertices.A);
    const tB = applyTransform(vertices.B);
    const tC = applyTransform(vertices.C);

    const H1 = getFootPoint(vertices.A, vertices.B, vertices.C);
    const H2 = getFootPoint(vertices.B, vertices.A, vertices.C);
    const H3 = getFootPoint(vertices.C, vertices.A, vertices.B);

    const onSegment1 = isPointOnSegment(H1, vertices.B, vertices.C);
    const onSegment2 = isPointOnSegment(H2, vertices.A, vertices.C);
    const onSegment3 = isPointOnSegment(H3, vertices.A, vertices.B);

    const tH1 = applyTransform(H1);
    const tH2 = applyTransform(H2);
    const tH3 = applyTransform(H3);
    const centroidScreen = {
        x: (tA.x + tB.x + tC.x) / 3,
        y: (tA.y + tB.y + tC.y) / 3
    };
    const labelBoxes = [
        pointCollisionBox(tA, currentTheme.svgVertexRadius + currentTheme.svgLabelClearance),
        pointCollisionBox(tB, currentTheme.svgVertexRadius + currentTheme.svgLabelClearance),
        pointCollisionBox(tC, currentTheme.svgVertexRadius + currentTheme.svgLabelClearance),
        pointCollisionBox(tH1, currentTheme.svgFootRadius + currentTheme.svgLabelClearance),
        pointCollisionBox(tH2, currentTheme.svgFootRadius + currentTheme.svgLabelClearance),
        pointCollisionBox(tH3, currentTheme.svgFootRadius + currentTheme.svgLabelClearance)
    ];
    const showFootPoints = showAltitudes || showFootLabels || showSegmentLengths;

    let svgContent = `<rect width="${currentTheme.svgWidth}" height="${currentTheme.svgHeight}" fill="${currentTheme.svgBg}"/>`;

    if (showAxes) {
        svgContent += `<line x1="0" y1="${currentTheme.svgCenterY}" x2="${currentTheme.svgWidth}" y2="${currentTheme.svgCenterY}" stroke="${currentTheme.svgAxis}" stroke-width="${currentTheme.svgAxisStrokeWidth}"/>`;
        svgContent += `<line x1="${currentTheme.svgCenterX}" y1="0" x2="${currentTheme.svgCenterX}" y2="${currentTheme.svgHeight}" stroke="${currentTheme.svgAxis}" stroke-width="${currentTheme.svgAxisStrokeWidth}"/>`;
    }

    if (showExtensionLines && (showAltitudes || showSegmentLengths) && !onSegment1) {
        svgContent += drawExtensionLine(vertices.B, vertices.C, H1);
    }
    if (showExtensionLines && (showAltitudes || showSegmentLengths) && !onSegment2) {
        svgContent += drawExtensionLine(vertices.A, vertices.C, H2);
    }
    if (showExtensionLines && (showAltitudes || showSegmentLengths) && !onSegment3) {
        svgContent += drawExtensionLine(vertices.A, vertices.B, H3);
    }

    svgContent += `<polygon points="${tA.x},${tA.y} ${tB.x},${tB.y} ${tC.x},${tC.y}" fill="${showTriangleFill ? currentTheme.svgTriangleFill : 'none'}" stroke="${currentTheme.svgTriangleStroke}" stroke-width="${currentTheme.svgTriangleStrokeWidth}"/>`;

    const altitudeInfo = [
        { vertex: vertices.A, foot: H1, screenVertex: tA, screenFoot: tH1, label: 'H₁', altitude: triangleData.heights.ha },
        { vertex: vertices.B, foot: H2, screenVertex: tB, screenFoot: tH2, label: 'H₂', altitude: triangleData.heights.hb },
        { vertex: vertices.C, foot: H3, screenVertex: tC, screenFoot: tH3, label: 'H₃', altitude: triangleData.heights.hc }
    ];

    if (showFootPoints) {
        altitudeInfo.forEach(info => {
            if (showAltitudes) {
                svgContent += `<line x1="${info.screenVertex.x}" y1="${info.screenVertex.y}" x2="${info.screenFoot.x}" y2="${info.screenFoot.y}" stroke="${currentTheme.svgAltitude}" stroke-width="${currentTheme.svgAltitudeStrokeWidth}"/>`;
            }

            svgContent += `<circle cx="${info.screenFoot.x}" cy="${info.screenFoot.y}" r="${currentTheme.svgFootRadius}" fill="${currentTheme.svgAltitude}"/>`;

            if (showFootLabels) {
                svgContent += placeTextLabel(
                    labelBoxes,
                    info.label,
                    info.screenFoot,
                    getPointLabelCandidates(info.screenFoot, centroidScreen, currentTheme.svgFootLabelFontSize, currentTheme.svgFootRadius),
                    {
                        fontSize: currentTheme.svgFootLabelFontSize,
                        fill: currentTheme.svgText
                    }
                );
            }
        });
    }

    svgContent += `<circle cx="${tA.x}" cy="${tA.y}" r="${currentTheme.svgVertexRadius}" fill="${currentTheme.svgText}"/>`;
    if (showVertexLabels) {
        svgContent += placeTextLabel(
            labelBoxes,
            'A',
            tA,
            getPointLabelCandidates(tA, centroidScreen, currentTheme.svgVertexLabelFontSize, currentTheme.svgVertexRadius),
            {
                fontSize: currentTheme.svgVertexLabelFontSize,
                fill: currentTheme.svgText
            }
        );
    }
    svgContent += `<circle cx="${tB.x}" cy="${tB.y}" r="${currentTheme.svgVertexRadius}" fill="${currentTheme.svgText}"/>`;
    if (showVertexLabels) {
        svgContent += placeTextLabel(
            labelBoxes,
            'B',
            tB,
            getPointLabelCandidates(tB, centroidScreen, currentTheme.svgVertexLabelFontSize, currentTheme.svgVertexRadius),
            {
                fontSize: currentTheme.svgVertexLabelFontSize,
                fill: currentTheme.svgText
            }
        );
    }
    svgContent += `<circle cx="${tC.x}" cy="${tC.y}" r="${currentTheme.svgVertexRadius}" fill="${currentTheme.svgText}"/>`;
    if (showVertexLabels) {
        svgContent += placeTextLabel(
            labelBoxes,
            'C',
            tC,
            getPointLabelCandidates(tC, centroidScreen, currentTheme.svgVertexLabelFontSize, currentTheme.svgVertexRadius),
            {
                fontSize: currentTheme.svgVertexLabelFontSize,
                fill: currentTheme.svgText
            }
        );
    }

    if (showSegmentLengths) {
        const midAH1 = { x: (tA.x + tH1.x) / 2, y: (tA.y + tH1.y) / 2 };
        const midBH2 = { x: (tB.x + tH2.x) / 2, y: (tB.y + tH2.y) / 2 };
        const midCH3 = { x: (tC.x + tH3.x) / 2, y: (tC.y + tH3.y) / 2 };

        svgContent += placeTextLabel(
            labelBoxes,
            formatSvgNumber(triangleData.heights.ha),
            midAH1,
            getLineLabelCandidates(tA, tH1, midAH1, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgAltitudeNumberOffsetY),
            {
                fontSize: currentTheme.svgDimensionFontSize,
                fill: currentTheme.svgAltitude,
                anchor: 'middle'
            }
        );
        svgContent += placeTextLabel(
            labelBoxes,
            formatSvgNumber(triangleData.heights.hb),
            midBH2,
            getLineLabelCandidates(tB, tH2, midBH2, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgAltitudeNumberOffsetY),
            {
                fontSize: currentTheme.svgDimensionFontSize,
                fill: currentTheme.svgAltitude,
                anchor: 'middle'
            }
        );
        svgContent += placeTextLabel(
            labelBoxes,
            formatSvgNumber(triangleData.heights.hc),
            midCH3,
            getLineLabelCandidates(tC, tH3, midCH3, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgAltitudeNumberOffsetY),
            {
                fontSize: currentTheme.svgDimensionFontSize,
                fill: currentTheme.svgAltitude,
                anchor: 'middle'
            }
        );

        const tB_vertex = applyTransform(vertices.B);
        const tC_vertex = applyTransform(vertices.C);
        const tA_vertex = applyTransform(vertices.A);

        if (onSegment1) {
            const midBH1 = { x: (tB_vertex.x + tH1.x) / 2, y: (tB_vertex.y + tH1.y) / 2 };
            const midH1C = { x: (tH1.x + tC_vertex.x) / 2, y: (tH1.y + tC_vertex.y) / 2 };
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.a.seg1),
                midBH1,
                getLineLabelCandidates(tB_vertex, tH1, midBH1, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.a.seg2),
                midH1C,
                getLineLabelCandidates(tH1, tC_vertex, midH1C, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
        } else {
            const distToB = Math.hypot(H1.x - vertices.B.x, H1.y - vertices.B.y);
            const distToC = Math.hypot(H1.x - vertices.C.x, H1.y - vertices.C.y);
            svgContent += placeTextStack(
                labelBoxes,
                [`H₁B: ${formatSvgNumber(distToB)}`, `H₁C: ${formatSvgNumber(distToC)}`],
                tH1,
                getPointLabelCandidates(tH1, centroidScreen, currentTheme.svgOutsideDimensionFontSize, currentTheme.svgFootRadius),
                {
                    fontSize: currentTheme.svgOutsideDimensionFontSize,
                    fill: currentTheme.svgAltitude,
                    lineHeight: currentTheme.svgOutsideDimensionFontSize + currentTheme.svgLabelClearance + 2
                }
            );
        }

        if (onSegment2) {
            const midAH2 = { x: (tA_vertex.x + tH2.x) / 2, y: (tA_vertex.y + tH2.y) / 2 };
            const midH2C = { x: (tH2.x + tC_vertex.x) / 2, y: (tH2.y + tC_vertex.y) / 2 };
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.b.seg1),
                midAH2,
                getLineLabelCandidates(tA_vertex, tH2, midAH2, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.b.seg2),
                midH2C,
                getLineLabelCandidates(tH2, tC_vertex, midH2C, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
        } else {
            const distToA = Math.hypot(H2.x - vertices.A.x, H2.y - vertices.A.y);
            const distToC = Math.hypot(H2.x - vertices.C.x, H2.y - vertices.C.y);
            svgContent += placeTextStack(
                labelBoxes,
                [`H₂A: ${formatSvgNumber(distToA)}`, `H₂C: ${formatSvgNumber(distToC)}`],
                tH2,
                getPointLabelCandidates(tH2, centroidScreen, currentTheme.svgOutsideDimensionFontSize, currentTheme.svgFootRadius),
                {
                    fontSize: currentTheme.svgOutsideDimensionFontSize,
                    fill: currentTheme.svgAltitude,
                    lineHeight: currentTheme.svgOutsideDimensionFontSize + currentTheme.svgLabelClearance + 2
                }
            );
        }

        if (onSegment3) {
            const midAH3 = { x: (tA_vertex.x + tH3.x) / 2, y: (tA_vertex.y + tH3.y) / 2 };
            const midH3B = { x: (tH3.x + tB_vertex.x) / 2, y: (tH3.y + tB_vertex.y) / 2 };
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.c.seg1),
                midAH3,
                getLineLabelCandidates(tA_vertex, tH3, midAH3, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
            svgContent += placeTextLabel(
                labelBoxes,
                formatSvgNumber(triangleData.segments.c.seg2),
                midH3B,
                getLineLabelCandidates(tH3, tB_vertex, midH3B, centroidScreen, currentTheme.svgDimensionFontSize, currentTheme.svgSegmentNumberOffsetY),
                {
                    fontSize: currentTheme.svgDimensionFontSize,
                    fill: currentTheme.svgText,
                    anchor: 'middle'
                }
            );
        } else {
            const distToA = Math.hypot(H3.x - vertices.A.x, H3.y - vertices.A.y);
            const distToB = Math.hypot(H3.x - vertices.B.x, H3.y - vertices.B.y);
            svgContent += placeTextStack(
                labelBoxes,
                [`H₃A: ${formatSvgNumber(distToA)}`, `H₃B: ${formatSvgNumber(distToB)}`],
                tH3,
                getPointLabelCandidates(tH3, centroidScreen, currentTheme.svgOutsideDimensionFontSize, currentTheme.svgFootRadius),
                {
                    fontSize: currentTheme.svgOutsideDimensionFontSize,
                    fill: currentTheme.svgAltitude,
                    lineHeight: currentTheme.svgOutsideDimensionFontSize + currentTheme.svgLabelClearance + 2
                }
            );
        }
    }

    svg.innerHTML = svgContent;
}

function displayResults(triangleData) {
    const data = triangleData;
    const sides = data.sides;
    const angles = data.angles;
    const seg = data.segments;
    const solutionHeading = triangleSolutions.length > 1
        ? `<div class="result-item"><span class="label">Solution:</span><span class="value">${activeSolutionIndex + 1} / ${triangleSolutions.length}</span></div>`
        : '';
    const methodHeading = currentTriangle && currentTriangle.method
        ? `<div class="result-item"><span class="label">Input type:</span><span class="value">${currentTriangle.method}</span></div>`
        : '';

    let html = `
        <div class="results-grid">
            <div class="result-section">
                <h3>Basic Information</h3>
                ${solutionHeading}
                ${methodHeading}
                <div class="result-item"><span class="label">Side a (BC):</span><span class="value">${formatNumber(sides.a)}</span></div>
                <div class="result-item"><span class="label">Side b (AC):</span><span class="value">${formatNumber(sides.b)}</span></div>
                <div class="result-item"><span class="label">Side c (AB):</span><span class="value">${formatNumber(sides.c)}</span></div>
                <div class="result-item"><span class="label">Area:</span><span class="value">${formatNumber(data.area)}</span></div>
            </div>

            <div class="result-section">
                <h3>Angles</h3>
                <div class="result-item"><span class="label">A:</span><span class="value">${formatNumber(angles.A)} deg</span></div>
                <div class="result-item"><span class="label">B:</span><span class="value">${formatNumber(angles.B)} deg</span></div>
                <div class="result-item"><span class="label">C:</span><span class="value">${formatNumber(angles.C)} deg</span></div>
            </div>

            <div class="result-section">
                <h3>Altitudes</h3>
                <div class="result-item"><span class="label">AH<sub>1</sub> (to BC):</span><span class="value">${formatNumber(data.heights.ha)}</span></div>
                <div class="result-item"><span class="label">BH<sub>2</sub> (to AC):</span><span class="value">${formatNumber(data.heights.hb)}</span></div>
                <div class="result-item"><span class="label">CH<sub>3</sub> (to AB):</span><span class="value">${formatNumber(data.heights.hc)}</span></div>
            </div>

            <div class="result-section">
                <h3>Foot Point Segments</h3>
                <div class="result-item"><span class="label">H<sub>1</sub>B:</span><span class="value">${formatNumber(seg.a.seg1)}</span></div>
                <div class="result-item"><span class="label">H<sub>1</sub>C:</span><span class="value">${formatNumber(seg.a.seg2)}</span></div>
                <div class="result-item"><span class="label">H<sub>2</sub>A:</span><span class="value">${formatNumber(seg.b.seg1)}</span></div>
                <div class="result-item"><span class="label">H<sub>2</sub>C:</span><span class="value">${formatNumber(seg.b.seg2)}</span></div>
                <div class="result-item"><span class="label">H<sub>3</sub>A:</span><span class="value">${formatNumber(seg.c.seg1)}</span></div>
                <div class="result-item"><span class="label">H<sub>3</sub>B:</span><span class="value">${formatNumber(seg.c.seg2)}</span></div>
    `;

    if (data.isRight) {
        html += `<div class="special-note">Right Triangle: Right angle at vertex ${data.rightVertex}</div>`;
    }

    html += '</div></div>';
    elements.results.innerHTML = html;
}

function updateSolutionTabs() {
    if (!elements.solutionTabs) return;

    if (triangleSolutions.length <= 1) {
        elements.solutionTabs.hidden = true;
        elements.solutionTabs.innerHTML = '';
        return;
    }

    elements.solutionTabs.hidden = false;
    elements.solutionTabs.innerHTML = triangleSolutions.map((solution, index) => (
        `<button class="solution-tab${index === activeSolutionIndex ? ' active' : ''}" type="button" data-solution-index="${index}">Solution ${index + 1}</button>`
    )).join('');
}

function setActiveSolution(index) {
    if (index < 0 || index >= triangleSolutions.length) return;

    activeSolutionIndex = index;
    currentTriangle = triangleSolutions[activeSolutionIndex];
    // Keep solution switches auto-fitted so an alternate SSA shape never starts clipped.
    fitToScreen();
    displayResults(currentTriangle.triangleData);
    updateSolutionTabs();
}

function clearTriangleState() {
    // Invalid recalculations must invalidate exports and visible results instead of leaving stale geometry active.
    currentTriangle = null;
    triangleSolutions = [];
    activeSolutionIndex = 0;
    svg.innerHTML = '';
    elements.results.innerHTML = '<div class="loading-state">No valid triangle</div>';
    updateSolutionTabs();
}

function getResultRows() {
    if (!currentTriangle) return [];

    const data = currentTriangle.triangleData;
    const rows = [
        ['Section', 'Name', 'Value'],
        ['Basic Information', 'Side a (BC)', formatNumber(data.sides.a)],
        ['Basic Information', 'Side b (AC)', formatNumber(data.sides.b)],
        ['Basic Information', 'Side c (AB)', formatNumber(data.sides.c)],
        ['Basic Information', 'Area', formatNumber(data.area)],
        ['Angles', 'A (deg)', formatNumber(data.angles.A)],
        ['Angles', 'B (deg)', formatNumber(data.angles.B)],
        ['Angles', 'C (deg)', formatNumber(data.angles.C)],
        ['Altitudes', 'AH1 (to BC)', formatNumber(data.heights.ha)],
        ['Altitudes', 'BH2 (to AC)', formatNumber(data.heights.hb)],
        ['Altitudes', 'CH3 (to AB)', formatNumber(data.heights.hc)],
        ['Foot Point Segments', 'H1B', formatNumber(data.segments.a.seg1)],
        ['Foot Point Segments', 'H1C', formatNumber(data.segments.a.seg2)],
        ['Foot Point Segments', 'H2A', formatNumber(data.segments.b.seg1)],
        ['Foot Point Segments', 'H2C', formatNumber(data.segments.b.seg2)],
        ['Foot Point Segments', 'H3A', formatNumber(data.segments.c.seg1)],
        ['Foot Point Segments', 'H3B', formatNumber(data.segments.c.seg2)]
    ];

    if (triangleSolutions.length > 1) {
        rows.splice(1, 0, ['Basic Information', 'Solution', `${activeSolutionIndex + 1} / ${triangleSolutions.length}`]);
    }

    if (currentTriangle.method) {
        rows.splice(1, 0, ['Basic Information', 'Input Type', currentTriangle.method]);
    }

    return rows;
}

function getExportMetadataRows() {
    if (!currentTriangle) return [];

    const data = currentTriangle.triangleData;
    return [
        ['Metadata', 'Generated At', new Date().toISOString()],
        ['Metadata', 'Application', 'Triangle Resolver'],
        ['Metadata', 'Provided Inputs', currentTriangle.inputSummary || `a=${formatNumber(data.sides.a)}, b=${formatNumber(data.sides.b)}, c=${formatNumber(data.sides.c)}`],
        ['Metadata', 'Resolved Sides', `a=${formatNumber(data.sides.a)}, b=${formatNumber(data.sides.b)}, c=${formatNumber(data.sides.c)}`],
        ['Metadata', 'Input Type', currentTriangle.method || activeInputMode],
        ['Metadata', 'Solution Index', String(activeSolutionIndex + 1)],
        ['Metadata', 'Solution Count', String(triangleSolutions.length || 1)],
        ['Metadata', 'Display Preset', activeDisplayPreset],
        ['Metadata', 'Show Axes', String(showAxes)],
        ['Metadata', 'Show Altitudes', String(showAltitudes)],
        ['Metadata', 'Show Foot Point Labels', String(showFootLabels)],
        ['Metadata', 'Show Segment Lengths', String(showSegmentLengths)],
        ['Metadata', 'Show Triangle Fill', String(showTriangleFill)],
        ['Metadata', 'Show Vertex Labels', String(showVertexLabels)],
        ['Metadata', 'Show Extension Lines', String(showExtensionLines)],
        ['Metadata', 'Rotation Target', ROTATION_TARGETS[rotationTargetIndex]],
        ['Metadata', 'Scale', formatNumber(viewTransform.scale)],
        ['Metadata', 'Rotation Radians', formatNumber(viewTransform.rotation)]
    ];
}

function buildSvgMetadata() {
    if (!includeExportMetadata || !currentTriangle) return '';

    const data = currentTriangle.triangleData;
    const metadata = {
        generatedAt: new Date().toISOString(),
        application: 'Triangle Resolver',
        providedInputs: currentTriangle.inputSummary,
        inputMode: activeInputMode,
        inputType: currentTriangle.method,
        solution: {
            index: activeSolutionIndex + 1,
            count: triangleSolutions.length || 1
        },
        resolvedSides: {
            a: formatNumber(data.sides.a),
            b: formatNumber(data.sides.b),
            c: formatNumber(data.sides.c)
        },
        display: {
            preset: activeDisplayPreset,
            axes: showAxes,
            altitudes: showAltitudes,
            footPointLabels: showFootLabels,
            segmentLengths: showSegmentLengths,
            triangleFill: showTriangleFill,
            vertexLabels: showVertexLabels,
            extensionLines: showExtensionLines
        },
        view: {
            rotationTarget: ROTATION_TARGETS[rotationTargetIndex],
            scale: formatNumber(viewTransform.scale),
            rotationRadians: formatNumber(viewTransform.rotation)
        }
    };

    return `<metadata>${escapeSvgText(JSON.stringify(metadata))}</metadata>`;
}

function buildTextResults() {
    if (!currentTriangle) return '';

    const data = currentTriangle.triangleData;
    const lines = [
        'Triangle Resolver Results',
        ''
    ];

    if (triangleSolutions.length > 1) {
        lines.push(`Solution: ${activeSolutionIndex + 1} / ${triangleSolutions.length}`);
    }

    if (currentTriangle.method) {
        lines.push(`Input Type: ${currentTriangle.method}`);
    }

    lines.push(
        `Side a (BC): ${formatNumber(data.sides.a)}`,
        `Side b (AC): ${formatNumber(data.sides.b)}`,
        `Side c (AB): ${formatNumber(data.sides.c)}`,
        `Area: ${formatNumber(data.area)}`,
        '',
        'Angles',
        `A: ${formatNumber(data.angles.A)} deg`,
        `B: ${formatNumber(data.angles.B)} deg`,
        `C: ${formatNumber(data.angles.C)} deg`,
        '',
        'Altitudes',
        `AH1 (to BC): ${formatNumber(data.heights.ha)}`,
        `BH2 (to AC): ${formatNumber(data.heights.hb)}`,
        `CH3 (to AB): ${formatNumber(data.heights.hc)}`,
        '',
        'Foot Point Segments',
        `H1B: ${formatNumber(data.segments.a.seg1)}`,
        `H1C: ${formatNumber(data.segments.a.seg2)}`,
        `H2A: ${formatNumber(data.segments.b.seg1)}`,
        `H2C: ${formatNumber(data.segments.b.seg2)}`,
        `H3A: ${formatNumber(data.segments.c.seg1)}`,
        `H3B: ${formatNumber(data.segments.c.seg2)}`
    );

    if (data.isRight) {
        lines.push('', `Right Triangle: right angle at vertex ${data.rightVertex}`);
    }

    if (includeExportMetadata) {
        lines.push('', 'Metadata');
        getExportMetadataRows().forEach((row) => {
            lines.push(`${row[1]}: ${row[2]}`);
        });
    }

    return `${lines.join('\n')}\n`;
}

function escapeCsvValue(value) {
    const text = String(value);
    if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
}

function buildCsvResults() {
    if (!currentTriangle) return '';

    const rows = getResultRows();

    if (includeExportMetadata) {
        rows.push(...getExportMetadataRows());
    }

    return rows
        .map(row => row.map(escapeCsvValue).join(','))
        .join('\n') + '\n';
}

function getFileBaseName() {
    if (!currentTriangle) return 'triangle';

    const sides = currentTriangle.triangleData.sides;
    const mode = sanitizeFilenamePart(currentTriangle.method || activeInputMode || 'triangle');
    const solutionSuffix = triangleSolutions.length > 1 ? `_solution_${activeSolutionIndex + 1}` : '';

    // Export names use normalized result data, not raw inputs, to stay readable and filesystem-safe.
    return [
        'triangle',
        mode,
        formatFilenameNumber(sides.a),
        formatFilenameNumber(sides.b),
        formatFilenameNumber(sides.c)
    ].map(sanitizeFilenamePart).filter(Boolean).join('_') + solutionSuffix;
}

function sanitizeFilenamePart(value) {
    return String(value)
        .replace(/[^a-z0-9._-]+/gi, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function formatFilenameNumber(value) {
    return formatNumber(value)
        .replace(/(\.\d*?)0+$/u, '$1')
        .replace(/\.$/u, '');
}

function downloadBlob(content, type, filename) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function getSvgDocument() {
    const currentTheme = getTheme();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${currentTheme.svgWidth} ${currentTheme.svgHeight}" width="${currentTheme.svgWidth}" height="${currentTheme.svgHeight}" font-family="Ubuntu, sans-serif">${buildSvgMetadata()}${svg.innerHTML}</svg>`;
}

function downloadSVG() {
    if (!currentTriangle) return;
    downloadBlob(getSvgDocument(), 'image/svg+xml', `${getFileBaseName()}.svg`);
}

function downloadPNG() {
    if (!currentTriangle) return;

    const currentTheme = getTheme();
    const image = new Image();
    const svgBlob = new Blob([getSvgDocument()], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = currentTheme.svgWidth;
        canvas.height = currentTheme.svgHeight;

        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, currentTheme.svgWidth, currentTheme.svgHeight);
        URL.revokeObjectURL(url);

        canvas.toBlob((blob) => {
            if (!blob) {
                elements.errorMessage.textContent = 'Could not export PNG';
                elements.errorMessage.style.display = 'block';
                return;
            }

            downloadBlob(blob, 'image/png', `${getFileBaseName()}.png`);
        }, 'image/png');
    };

    image.onerror = () => {
        URL.revokeObjectURL(url);
        elements.errorMessage.textContent = 'Could not render SVG as PNG';
        elements.errorMessage.style.display = 'block';
    };

    image.src = url;
}

function downloadTXT() {
    if (!currentTriangle) return;
    downloadBlob(buildTextResults(), 'text/plain;charset=utf-8', `${getFileBaseName()}_results.txt`);
}

function downloadCSV() {
    if (!currentTriangle) return;
    downloadBlob(buildCsvResults(), 'text/csv;charset=utf-8', `${getFileBaseName()}_results.csv`);
}

function getPointerPos(e) {
    const currentTheme = getTheme();
    const rect = svg.getBoundingClientRect();
    const scaleX = currentTheme.svgWidth / rect.width;
    const scaleY = currentTheme.svgHeight / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function onPointerDown(e) {
    isDragging = true;
    const pos = getPointerPos(e);
    lastMousePos.x = pos.x;
    lastMousePos.y = pos.y;
    svg.style.cursor = 'grabbing';
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
}

function onPointerMove(e) {
    if (!isDragging) return;

    const pos = getPointerPos(e);
    const dx = pos.x - lastMousePos.x;
    const dy = pos.y - lastMousePos.y;

    viewTransform.offsetX += dx;
    viewTransform.offsetY += dy;

    lastMousePos.x = pos.x;
    lastMousePos.y = pos.y;

    drawTriangle();
}

function onPointerUp(e) {
    isDragging = false;
    svg.style.cursor = 'grab';
    if (svg.hasPointerCapture(e.pointerId)) {
        svg.releasePointerCapture(e.pointerId);
    }
}

function zoomAtScreenPoint(point, newScale) {
    const world = screenToWorld(point);

    viewTransform.scale = newScale;
    const transformed = applyTransform(world);
    viewTransform.offsetX += point.x - transformed.x;
    viewTransform.offsetY += point.y - transformed.y;

    drawTriangle();
}

function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = viewTransform.scale * delta;

    const minScale = initialScale * 0.5;
    const maxScale = initialScale * 4;

    if (newScale >= minScale && newScale <= maxScale) {
        zoomAtScreenPoint(getPointerPos(e), newScale);
    }
}

function getDisplayOptionState() {
    return {
        showAxes,
        showAltitudes,
        showFootLabels,
        showSegmentLengths,
        showTriangleFill,
        showVertexLabels,
        showExtensionLines
    };
}

function isValidDisplayOptions(options) {
    return Boolean(options) &&
        Object.keys(DISPLAY_PRESETS.construction).every((key) => typeof options[key] === 'boolean');
}

function setDisplayOptionInputs(options) {
    elements.showAxes.checked = options.showAxes;
    elements.showAltitudes.checked = options.showAltitudes;
    elements.showFootLabels.checked = options.showFootLabels;
    elements.showSegmentLengths.checked = options.showSegmentLengths;
    elements.showTriangleFill.checked = options.showTriangleFill;
    elements.showVertexLabels.checked = options.showVertexLabels;
    elements.showExtensionLines.checked = options.showExtensionLines;
}

function getMatchingPresetName(options) {
    return Object.keys(DISPLAY_PRESETS).find((name) => {
        const preset = DISPLAY_PRESETS[name];
        return Object.keys(preset).every((key) => preset[key] === options[key]);
    }) || 'custom';
}

function updatePresetButtons() {
    elements.constructionPresetButton.classList.toggle('active', activeDisplayPreset === 'construction');
    elements.measurementPresetButton.classList.toggle('active', activeDisplayPreset === 'measurement');
    elements.presentationPresetButton.classList.toggle('active', activeDisplayPreset === 'presentation');
}

function saveDisplayState() {
    try {
        localStorage.setItem(LOCAL_STORAGE_DISPLAY_STATE_KEY, JSON.stringify({
            preset: activeDisplayPreset,
            options: getDisplayOptionState()
        }));
    } catch (error) {
        return;
    }
}

function loadDisplayState() {
    try {
        const rawState = localStorage.getItem(LOCAL_STORAGE_DISPLAY_STATE_KEY);
        if (!rawState) return null;

        const state = JSON.parse(rawState);
        if (!isValidDisplayOptions(state.options)) return null;

        return {
            preset: typeof state.preset === 'string' ? state.preset : 'custom',
            options: state.options
        };
    } catch (error) {
        return null;
    }
}

function restoreDisplayState() {
    const savedState = loadDisplayState();
    if (!savedState) {
        setDisplayOptionInputs(DISPLAY_PRESETS.construction);
        activeDisplayPreset = 'construction';
        updatePresetButtons();
        return;
    }

    setDisplayOptionInputs(savedState.options);
    syncDisplayOptions(savedState.preset, false);
}

function syncDisplayOptions(presetName = null, shouldSave = true) {
    showAxes = elements.showAxes.checked;
    showAltitudes = elements.showAltitudes.checked;
    showFootLabels = elements.showFootLabels.checked;
    showSegmentLengths = elements.showSegmentLengths.checked;
    showTriangleFill = elements.showTriangleFill.checked;
    showVertexLabels = elements.showVertexLabels.checked;
    showExtensionLines = elements.showExtensionLines.checked;
    includeExportMetadata = elements.includeExportMetadata.checked;
    activeDisplayPreset = typeof presetName === 'string'
        ? presetName
        : getMatchingPresetName(getDisplayOptionState());
    updatePresetButtons();
    if (shouldSave) {
        saveDisplayState();
    }
    drawTriangle();
}

function applyDisplayPreset(presetName) {
    setDisplayOptionInputs(DISPLAY_PRESETS[presetName]);
    syncDisplayOptions(presetName);
}

function showDisplayPreferencesStatus(message) {
    if (displayPreferencesStatusTimer) {
        clearTimeout(displayPreferencesStatusTimer);
    }

    elements.displayPreferencesStatus.textContent = message;
    displayPreferencesStatusTimer = setTimeout(() => {
        elements.displayPreferencesStatus.textContent = '';
        displayPreferencesStatusTimer = null;
    }, 3000);
}

function resetDisplayPreferences() {
    try {
        localStorage.removeItem(LOCAL_STORAGE_DISPLAY_STATE_KEY);
    } catch (error) {
        return;
    }

    setDisplayOptionInputs(DISPLAY_PRESETS.construction);
    syncDisplayOptions('construction', false);
    showDisplayPreferencesStatus('Display preferences reset');
}

function onSideInputKeyDown(e) {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    calculateAndDraw();
}

function onInputModeButtonClick(e) {
    const mode = e.target.dataset.inputMode;
    if (!mode || mode === activeInputMode) return;

    setInputMode(mode);
}

function calculateAndDraw() {
    try {
        const input = readTriangleInputs();
        const sideSolutions = solveTrianglesFromInputs(input);
        const inputSummary = getProvidedInputSummary(input);
        const nextSolutions = sideSolutions.map((solution) => (
            buildSolutionFromSides(solution.sides, solution.method, inputSummary)
        ));

        if (nextSolutions.length === 0) {
            throw new Error('The provided values cannot form a triangle');
        }

        triangleSolutions = nextSolutions;
        activeSolutionIndex = 0;
        currentTriangle = triangleSolutions[activeSolutionIndex];

        fitToScreen();
        displayResults(currentTriangle.triangleData);
        updateSolutionTabs();

        elements.errorMessage.style.display = 'none';
    } catch (error) {
        clearTriangleState();
        elements.errorMessage.textContent = error.message;
        elements.errorMessage.style.display = 'block';
    }
}

function onSolutionTabsClick(e) {
    const target = e.target;
    if (!target || !target.dataset || target.dataset.solutionIndex === undefined) return;

    setActiveSolution(Number(target.dataset.solutionIndex));
}

function initializeSvg() {
    const currentTheme = getTheme();
    svg.setAttribute('width', currentTheme.svgWidth);
    svg.setAttribute('height', currentTheme.svgHeight);
    svg.setAttribute('viewBox', `0 0 ${currentTheme.svgWidth} ${currentTheme.svgHeight}`);
}

function bindEvents() {
    elements.calculateButton.addEventListener('click', calculateAndDraw);
    elements.resetViewButton.addEventListener('click', resetView);
    elements.fitToScreenButton.addEventListener('click', fitToScreen);
    elements.downloadSvgButton.addEventListener('click', downloadSVG);
    elements.downloadPngButton.addEventListener('click', downloadPNG);
    elements.downloadTxtButton.addEventListener('click', downloadTXT);
    elements.downloadCsvButton.addEventListener('click', downloadCSV);
    elements.sssModeButton.addEventListener('click', onInputModeButtonClick);
    elements.constructionPresetButton.addEventListener('click', () => applyDisplayPreset('construction'));
    elements.measurementPresetButton.addEventListener('click', () => applyDisplayPreset('measurement'));
    elements.presentationPresetButton.addEventListener('click', () => applyDisplayPreset('presentation'));
    elements.resetDisplayPreferencesButton.addEventListener('click', resetDisplayPreferences);
    elements.zoomInButton.addEventListener('click', zoomIn);
    elements.zoomOutButton.addEventListener('click', zoomOut);
    elements.fitViewButton.addEventListener('click', resetView);
    elements.rotateLeftButton.addEventListener('click', rotateLeft);
    elements.rotateRightButton.addEventListener('click', rotateRight);
    elements.showAxes.addEventListener('change', syncDisplayOptions);
    elements.showAltitudes.addEventListener('change', syncDisplayOptions);
    elements.showFootLabels.addEventListener('change', syncDisplayOptions);
    elements.showSegmentLengths.addEventListener('change', syncDisplayOptions);
    elements.showTriangleFill.addEventListener('change', syncDisplayOptions);
    elements.showVertexLabels.addEventListener('change', syncDisplayOptions);
    elements.showExtensionLines.addEventListener('change', syncDisplayOptions);
    elements.includeExportMetadata.addEventListener('change', syncDisplayOptions);
    elements.sasModeButton.addEventListener('click', onInputModeButtonClick);
    elements.asaModeButton.addEventListener('click', onInputModeButtonClick);
    elements.aasModeButton.addEventListener('click', onInputModeButtonClick);
    elements.ssaModeButton.addEventListener('click', onInputModeButtonClick);
    [
        elements.sssSideA,
        elements.sssSideB,
        elements.sssSideC,
        elements.sasSideB,
        elements.sasSideC,
        elements.sasAngleA,
        elements.asaAngleA,
        elements.asaSideC,
        elements.asaAngleB,
        elements.aasAngleA,
        elements.aasAngleB,
        elements.aasSideA,
        elements.ssaAngleA,
        elements.ssaSideA,
        elements.ssaSideB
    ].forEach((element) => {
        element.addEventListener('keydown', onSideInputKeyDown);
    });
    elements.solutionTabs.addEventListener('click', onSolutionTabsClick);

    svg.addEventListener('pointerdown', onPointerDown);
    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', onPointerUp);
    svg.addEventListener('pointercancel', onPointerUp);
    svg.addEventListener('wheel', onWheel, { passive: false });
    svg.style.cursor = 'grab';
    updatePresetButtons();
}

function init() {
    initializeSvg();
    bindEvents();
    updateInputModePanels();
    restoreDisplayState();
    calculateAndDraw();
}

window.addEventListener('load', init);
