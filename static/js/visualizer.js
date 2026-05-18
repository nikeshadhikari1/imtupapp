'use strict';

// ===== State =====
const State = {
    mode: 'function',
    currentExpr: 'x**2',
    currentType: 'linear',
    params: {},
    xMin: -10,
    xMax: 10,
    lastGraphJson: null,
    geoShape: 'circle',
    geoParams: {},
    calcExpr: 'x**3 - 3*x',
    crosshairOn: false,
    annotateMode: false,
    annotations: [],
    panelOpen: true,
};

// ===== DOM helpers =====
const $ = id => document.getElementById(id);
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// ===== Equation configs =====
const EQ_CONFIGS = {
    linear: {
        expr: (p) => `${p.m || 1}*x + ${p.c || 0}`,
        params: [
            { name: 'm', label: 'Slope (m)', min: -5, max: 5, default: 1, step: 0.1 },
            { name: 'c', label: 'Y-intercept (c)', min: -10, max: 10, default: 0, step: 0.5 },
        ]
    },
    quadratic: {
        expr: (p) => `${p.a || 1}*x**2 + ${p.b || 0}*x + ${p.c || 0}`,
        params: [
            { name: 'a', label: 'a (x² coef)', min: -5, max: 5, default: 1, step: 0.1 },
            { name: 'b', label: 'b (x coef)', min: -10, max: 10, default: 0, step: 0.5 },
            { name: 'c', label: 'c (constant)', min: -10, max: 10, default: 0, step: 0.5 },
        ]
    },
    cubic: {
        expr: (p) => `${p.a || 1}*x**3 + ${p.b || 0}*x**2 + ${p.c || 0}*x + ${p.d || 0}`,
        params: [
            { name: 'a', label: 'a (x³ coef)', min: -3, max: 3, default: 1, step: 0.1 },
            { name: 'b', label: 'b (x² coef)', min: -5, max: 5, default: 0, step: 0.5 },
            { name: 'c', label: 'c (x coef)', min: -10, max: 10, default: -3, step: 0.5 },
            { name: 'd', label: 'd (constant)', min: -10, max: 10, default: 0, step: 0.5 },
        ]
    },
    trigonometric: {
        expr: (p) => `${p.A || 1}*sin(${p.B || 1}*x + ${p.C || 0})`,
        params: [
            { name: 'A', label: 'Amplitude (A)', min: 0.1, max: 5, default: 1, step: 0.1 },
            { name: 'B', label: 'Frequency (B)', min: 0.1, max: 5, default: 1, step: 0.1 },
            { name: 'C', label: 'Phase Shift (C)', min: -6.28, max: 6.28, default: 0, step: 0.1 },
        ]
    },
    custom: { expr: null, params: [] }
};

const GEO_CONFIGS = {
    circle: [
        { name: 'radius', label: 'Radius', min: 0.5, max: 10, default: 5, step: 0.5 },
        { name: 'cx', label: 'Center X', min: -5, max: 5, default: 0, step: 0.5 },
        { name: 'cy', label: 'Center Y', min: -5, max: 5, default: 0, step: 0.5 },
    ],
    ellipse: [
        { name: 'a', label: 'Semi-major (a)', min: 0.5, max: 10, default: 5, step: 0.5 },
        { name: 'b', label: 'Semi-minor (b)', min: 0.5, max: 10, default: 3, step: 0.5 },
    ],
    parabola: [
        { name: 'a', label: 'a (width)', min: -5, max: 5, default: 1, step: 0.1 },
        { name: 'h', label: 'h (vertex X)', min: -5, max: 5, default: 0, step: 0.5 },
        { name: 'k', label: 'k (vertex Y)', min: -5, max: 5, default: 0, step: 0.5 },
    ],
    polygon: [
        { name: 'sides', label: 'Sides', min: 3, max: 12, default: 6, step: 1 },
        { name: 'radius', label: 'Radius', min: 0.5, max: 10, default: 5, step: 0.5 },
    ],
};

// ===== Plotly layout base =====
const BASE_LAYOUT = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(15,15,35,0.9)',
    font: { color: '#e0e0e0', family: 'Inter, sans-serif', size: 12 },
    xaxis: {
        gridcolor: 'rgba(255,255,255,0.07)',
        zerolinecolor: 'rgba(255,255,255,0.25)',
        zerolinewidth: 1.5,
        title: 'x',
        title_font: { color: '#a0a0c0', size: 12 },
        tickfont: { color: '#a0a0c0', size: 11 },
        linecolor: 'rgba(255,255,255,0.1)',
        showspikes: true,
        spikecolor: 'rgba(108,99,255,0.6)',
        spikethickness: 1,
        spikedash: 'dot',
        spikemode: 'across',
    },
    yaxis: {
        gridcolor: 'rgba(255,255,255,0.07)',
        zerolinecolor: 'rgba(255,255,255,0.25)',
        zerolinewidth: 1.5,
        title: 'f(x)',
        title_font: { color: '#a0a0c0', size: 12 },
        tickfont: { color: '#a0a0c0', size: 11 },
        linecolor: 'rgba(255,255,255,0.1)',
        showspikes: true,
        spikecolor: 'rgba(108,99,255,0.6)',
        spikethickness: 1,
        spikedash: 'dot',
        spikemode: 'across',
    },
    margin: { l: 55, r: 20, t: 20, b: 50 },
    hovermode: 'closest',
    hoverlabel: {
        bgcolor: 'rgba(15,15,35,0.95)',
        bordercolor: '#6c63ff',
        font: { color: '#e0e0e0', family: 'JetBrains Mono, monospace', size: 12 },
    },
    showlegend: false,
    autosize: true,
    modebar: { bgcolor: 'rgba(0,0,0,0)', color: '#606080', activecolor: '#6c63ff' },
    dragmode: 'zoom',
    transition: { duration: 300, easing: 'cubic-in-out' },
    annotations: [],
};

const PLOTLY_CONFIG = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d', 'sendDataToCloud'],
    modeBarButtonsToAdd: ['drawline', 'eraseshape'],
    toImageButtonOptions: { format: 'png', filename: 'mathviz_graph', scale: 2, width: 1200, height: 800 },
    scrollZoom: true,
    doubleClick: 'reset',
};

// ===== Init =====
function init() {
    setupModeTabs();
    setupEqTypeSelector();
    setupPresetButtons();
    setupExprInput();
    setupXRange();
    setupPanelToggle();
    setupGeoMode();
    setupCalcMode();
    setupToolbarButtons();
    setupSaveButton();
    setupCoordinateTracker();
    setupAnnotationMode();
    setupResizeObserver();

    updateSliders();
    fetchAndPlot();

    if (window.LOADED_EQ) {
        $('exprInput').value = window.LOADED_EQ.expression;
        State.currentExpr = window.LOADED_EQ.expression;
        State.currentType = window.LOADED_EQ.type || 'custom';
        $('eqType').value = State.currentType;
        updateSliders();
        fetchAndPlot();
        if ($('saveSection')) $('saveSection').style.display = 'block';
    }
}

// ===== Panel Toggle =====
function setupPanelToggle() {
    const panel = $('vizPanel');
    const toggle = $('panelToggle');
    const fab = $('panelOpenFab');
    const chart = $('mainChart');
    const isMobile = () => window.innerWidth <= 768;

    function openPanel() {
        panel.classList.remove('collapsed');
        State.panelOpen = true;
        if (fab) fab.style.display = 'none';
        setTimeout(() => Plotly.Plots.resize(chart), 310);
    }

    function closePanel() {
        panel.classList.add('collapsed');
        State.panelOpen = false;
        if (isMobile() && fab) fab.style.display = 'flex';
        setTimeout(() => Plotly.Plots.resize(chart), 310);
    }

    toggle.addEventListener('click', () => {
        if (State.panelOpen) closePanel(); else openPanel();
    });

    if (fab) {
        fab.addEventListener('click', openPanel);
    }

    // On resize: if going mobile and panel is closed, show FAB
    window.addEventListener('resize', debounce(() => {
        if (!State.panelOpen && isMobile() && fab) {
            fab.style.display = 'flex';
        } else if (!State.panelOpen && !isMobile() && fab) {
            fab.style.display = 'none';
        }
        Plotly.Plots.resize(chart);
    }, 150));
}

// ===== Coordinate Tracker =====
function setupCoordinateTracker() {
    const chart = $('mainChart');
    const tracker = $('coordTracker');
    const xEl = $('coordX');
    const yEl = $('coordY');

    chart.addEventListener('mousemove', (e) => {
        if (!State.crosshairOn) return;
        try {
            const layout = chart._fullLayout;
            if (!layout) return;
            const rect = chart.getBoundingClientRect();
            const xaxis = layout.xaxis;
            const yaxis = layout.yaxis;
            if (!xaxis || !yaxis) return;
            const plotLeft = layout._offset.left;
            const plotTop = layout._offset.top;
            const plotW = xaxis._length;
            const plotH = yaxis._length;
            const px = e.clientX - rect.left - plotLeft;
            const py = e.clientY - rect.top - plotTop;
            if (px < 0 || px > plotW || py < 0 || py > plotH) return;
            const xVal = xaxis.l2r(px);
            const yVal = yaxis.l2r(py);
            xEl.textContent = `x: ${Number(xVal).toFixed(4)}`;
            yEl.textContent = `y: ${Number(yVal).toFixed(4)}`;
        } catch (_) {}
    });

    chart.addEventListener('mouseleave', () => {
        xEl.textContent = 'x: —';
        yEl.textContent = 'y: —';
    });
}

// ===== Annotation Mode =====
function setupAnnotationMode() {
    const chart = $('mainChart');
    const clearBtn = $('clearAnnotBtn');

    chart.addEventListener('click', (e) => {
        if (!State.annotateMode) return;
        try {
            const layout = chart._fullLayout;
            if (!layout) return;
            const rect = chart.getBoundingClientRect();
            const xaxis = layout.xaxis;
            const yaxis = layout.yaxis;
            const plotLeft = layout._offset.left;
            const plotTop = layout._offset.top;
            const px = e.clientX - rect.left - plotLeft;
            const py = e.clientY - rect.top - plotTop;
            const xVal = Number(xaxis.l2r(px)).toFixed(3);
            const yVal = Number(yaxis.l2r(py)).toFixed(3);

            const annotation = {
                x: parseFloat(xVal),
                y: parseFloat(yVal),
                xref: 'x', yref: 'y',
                text: `(${xVal}, ${yVal})`,
                showarrow: true,
                arrowhead: 2,
                arrowsize: 1,
                arrowwidth: 1.5,
                arrowcolor: '#ffd93d',
                font: { color: '#ffd93d', size: 11, family: 'JetBrains Mono, monospace' },
                bgcolor: 'rgba(10,10,26,0.85)',
                bordercolor: '#ffd93d',
                borderwidth: 1,
                borderpad: 4,
                ay: -40,
            };
            State.annotations.push(annotation);
            Plotly.relayout(chart, { annotations: [...State.annotations] });
            if (clearBtn) clearBtn.style.display = 'inline-flex';
        } catch (_) {}
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            State.annotations = [];
            Plotly.relayout(chart, { annotations: [] });
            clearBtn.style.display = 'none';
        });
    }
}

// ===== Responsive resize =====
function setupResizeObserver() {
    const chart = $('mainChart');
    const ro = new ResizeObserver(debounce(() => {
        if (chart.data) Plotly.Plots.resize(chart);
    }, 100));
    ro.observe(chart);
}

// ===== Mode Tabs =====
function setupModeTabs() {
    document.querySelectorAll('.mode-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.mode-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            State.mode = btn.dataset.mode;
            document.querySelectorAll('.mode-content').forEach(el => el.style.display = 'none');
            $(`mode-${State.mode}`).style.display = 'block';
            if (State.mode === 'geometry') drawGeoShape();
            else if (State.mode === 'calculus') fetchCalcPlot();
        });
    });
}

// ===== Equation Type =====
function setupEqTypeSelector() {
    $('eqType').addEventListener('change', (e) => {
        State.currentType = e.target.value;
        updateSliders();
        buildExprFromSliders();
        fetchAndPlot();
    });
}

// ===== Sliders =====
function updateSliders() {
    const type = State.currentType;
    const config = EQ_CONFIGS[type];
    const container = $('slidersContainer');
    const section = $('paramSliders');

    if (!config || !config.params || config.params.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';
    container.innerHTML = '';
    State.params = {};

    config.params.forEach(p => {
        State.params[p.name] = p.default;
        const row = document.createElement('div');
        row.className = 'slider-row';
        row.innerHTML = `
            <div class="slider-label-row">
                <span class="slider-name">${p.name}</span>
                <span class="slider-value" id="val_${p.name}">${p.default}</span>
            </div>
            <input type="range" id="slider_${p.name}"
                   min="${p.min}" max="${p.max}" value="${p.default}" step="${p.step}">
            <div style="display:flex;justify-content:space-between;font-size:.7rem;color:#606080;margin-top:2px">
                <span>${p.min}</span><span style="color:#a0a0c0;font-size:.72rem">${p.label}</span><span>${p.max}</span>
            </div>`;
        container.appendChild(row);

        const slider = row.querySelector('input[type="range"]');
        const valDisplay = row.querySelector(`#val_${p.name}`);
        slider.addEventListener('input', () => {
            const v = parseFloat(slider.value);
            State.params[p.name] = v;
            valDisplay.textContent = v.toFixed(2);
            buildExprFromSliders();
            debouncedFetch();
        });
    });
}

function buildExprFromSliders() {
    const type = State.currentType;
    const config = EQ_CONFIGS[type];
    if (!config || !config.expr) return;
    const expr = config.expr(State.params);
    State.currentExpr = expr;
    $('exprInput').value = expr;
    updateGraphTitle(expr);
}

const debouncedFetch = debounce(() => fetchAndPlot(), 80);

// ===== Preset Buttons =====
function setupPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const expr = btn.dataset.expr;
            State.currentExpr = expr;
            State.currentType = 'custom';
            $('eqType').value = 'custom';
            $('exprInput').value = expr;
            $('paramSliders').style.display = 'none';
            updateGraphTitle(expr);
            fetchAndPlot();
        });
    });
}

// ===== Expression Input =====
function setupExprInput() {
    const input = $('exprInput');
    const plotBtn = $('plotBtn');

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            State.currentExpr = input.value.trim();
            updateGraphTitle(State.currentExpr);
            fetchAndPlot();
        }
    });
    input.addEventListener('input', () => {
        State.currentExpr = input.value.trim();
        updateGraphTitle(State.currentExpr);
        debouncedFetch();
    });
    plotBtn.addEventListener('click', () => {
        State.currentExpr = input.value.trim();
        updateGraphTitle(State.currentExpr);
        fetchAndPlot();
    });
}

// ===== X Range =====
function setupXRange() {
    [$('xMin'), $('xMax')].forEach(el => {
        el.addEventListener('change', () => {
            State.xMin = parseFloat($('xMin').value) || -10;
            State.xMax = parseFloat($('xMax').value) || 10;
            fetchAndPlot();
        });
    });
}

// ===== Fetch & Plot =====
function showLoading(show) {
    $('loadingOverlay').style.display = show ? 'flex' : 'none';
}

async function fetchAndPlot() {
    if (!State.currentExpr) return;
    const params = JSON.stringify(State.params);
    const url = `/api/plot/?expr=${encodeURIComponent(State.currentExpr)}&type=${State.currentType}&params=${encodeURIComponent(params)}&x_min=${State.xMin}&x_max=${State.xMax}`;

    showLoading(true);
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.success) { showError(data.error); return; }

        State.lastGraphJson = data.graph;
        renderPlot(data.graph);
        updateMathInfo(data);
        if ($('saveSection')) $('saveSection').style.display = 'block';
    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        showLoading(false);
    }
}

function getLayout(extra = {}) {
    return {
        ...BASE_LAYOUT,
        ...extra,
        annotations: [...State.annotations, ...(extra.annotations || [])],
        xaxis: { ...BASE_LAYOUT.xaxis, ...(extra.xaxis || {}) },
        yaxis: { ...BASE_LAYOUT.yaxis, ...(extra.yaxis || {}) },
    };
}

function renderPlot(graphJson) {
    const el = $('mainChart');
    const traces = graphJson.data.map(t => ({
        ...t,
        hovertemplate: 'x: <b>%{x:.4f}</b><br>y: <b>%{y:.4f}</b><extra></extra>',
        line: { ...(t.line || {}), width: t.line?.width || 2.5 },
    }));
    Plotly.react(el, traces, getLayout(graphJson.layout), PLOTLY_CONFIG);
}

function updateMathInfo(data) {
    const panel = $('mathInfoPanel');
    panel.style.display = 'flex';
    $('infoExpr').textContent = `f(x) = ${State.currentExpr}`;

    if (data.derivative_latex) {
        $('infoDerivative').innerHTML = `\\(${data.derivative_latex}\\)`;
    } else {
        $('infoDerivative').textContent = data.derivative || '';
    }
    if (data.integral_latex) {
        $('infoIntegral').innerHTML = `\\(${data.integral_latex}\\)`;
    } else {
        $('infoIntegral').textContent = data.integral || '';
    }
    if (window.MathJax) MathJax.typesetPromise([panel]);
}

function updateGraphTitle(expr) {
    $('graphTitle').textContent = `f(x) = ${expr}`;
}

function showError(msg) {
    console.warn('Plot error:', msg);
    Plotly.react($('mainChart'), [], {
        ...getLayout(),
        annotations: [{
            text: `⚠ ${msg}`,
            x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
            showarrow: false, font: { size: 14, color: '#ff6b6b' }
        }]
    }, PLOTLY_CONFIG);
}

// ===== Geometry Mode =====
function setupGeoMode() {
    buildGeoParams('circle');
    $('shapeType').addEventListener('change', (e) => {
        State.geoShape = e.target.value;
        buildGeoParams(e.target.value);
        drawGeoShape();
    });
    $('geoPlotBtn').addEventListener('click', drawGeoShape);
}

function buildGeoParams(shape) {
    const container = $('geoParamsContainer');
    container.innerHTML = '';
    State.geoParams = {};
    const params = GEO_CONFIGS[shape] || [];

    params.forEach(p => {
        State.geoParams[p.name] = p.default;
        const row = document.createElement('div');
        row.className = 'geo-param-row slider-row';
        row.innerHTML = `
            <div class="slider-label-row">
                <label>${p.label}</label>
                <span class="slider-value" id="geo_val_${p.name}">${p.default}</span>
            </div>
            <input type="range" min="${p.min}" max="${p.max}" value="${p.default}" step="${p.step}" id="geo_${p.name}">`;
        container.appendChild(row);

        row.querySelector('input').addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            State.geoParams[p.name] = v;
            document.getElementById(`geo_val_${p.name}`).textContent = v.toFixed(p.step < 1 ? 1 : 0);
            debouncedGeo();
        });
    });
}

const debouncedGeo = debounce(() => drawGeoShape(), 100);

async function drawGeoShape() {
    const url = `/api/geometry/?shape=${State.geoShape}&params=${encodeURIComponent(JSON.stringify(State.geoParams))}`;
    showLoading(true);
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.success) { showError(data.error); return; }

        State.lastGraphJson = data.graph;
        const traces = data.graph.data.map(t => ({
            ...t,
            hovertemplate: 'x: <b>%{x:.3f}</b><br>y: <b>%{y:.3f}</b><extra></extra>',
        }));
        const layout = getLayout({ ...data.graph.layout, yaxis: { ...BASE_LAYOUT.yaxis, scaleanchor: 'x' } });
        Plotly.react($('mainChart'), traces, layout, PLOTLY_CONFIG);

        const geoInfo = $('geoInfo');
        if (data.info) { geoInfo.style.display = 'block'; geoInfo.textContent = data.info; }
        $('graphTitle').textContent = `Geometry: ${State.geoShape}`;
        $('mathInfoPanel').style.display = 'none';
    } catch (err) {
        showError('Network error: ' + err.message);
    } finally {
        showLoading(false);
    }
}

// ===== Calculus Mode =====
function setupCalcMode() {
    $('calcPlotBtn').addEventListener('click', fetchCalcPlot);
    $('calcExprInput').addEventListener('input', debounce(fetchCalcPlot, 400));
    ['showDerivative', 'showIntegral'].forEach(id => $(id).addEventListener('change', fetchCalcPlot));
    [$('intA'), $('intB')].forEach(el => el.addEventListener('change', fetchCalcPlot));
}

async function fetchCalcPlot() {
    const expr = $('calcExprInput').value.trim();
    if (!expr) return;
    State.calcExpr = expr;

    const url = `/api/plot/?expr=${encodeURIComponent(expr)}&type=calculus&params={}&x_min=${State.xMin}&x_max=${State.xMax}`;
    showLoading(true);
    try {
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.success) { showError(data.error); return; }

        const baseTrace = {
            ...data.graph.data[0],
            name: 'f(x)',
            line: { color: '#6c63ff', width: 2.5 },
            hovertemplate: 'f(x): <b>%{y:.4f}</b><extra>f(x)</extra>',
        };
        const traces = [baseTrace];
        const fetches = [];

        if ($('showDerivative').checked && data.derivative) {
            fetches.push(
                fetch(`/api/plot/?expr=${encodeURIComponent(data.derivative)}&x_min=${State.xMin}&x_max=${State.xMax}&params={}`)
                    .then(r => r.json())
                    .then(dd => {
                        if (dd.success && dd.graph.data[0]) {
                            traces.push({
                                ...dd.graph.data[0],
                                name: "f'(x)",
                                line: { color: '#ff6b6b', width: 2, dash: 'dash' },
                                hovertemplate: "f'(x): <b>%{y:.4f}</b><extra>f'(x)</extra>",
                            });
                        }
                    })
            );
        }

        if ($('showIntegral').checked && data.integral) {
            fetches.push(
                fetch(`/api/plot/?expr=${encodeURIComponent(data.integral)}&x_min=${State.xMin}&x_max=${State.xMax}&params={}`)
                    .then(r => r.json())
                    .then(id2 => {
                        if (id2.success && id2.graph.data[0]) {
                            traces.push({
                                ...id2.graph.data[0],
                                name: '∫f(x)dx',
                                line: { color: '#4ecdc4', width: 2, dash: 'dot' },
                                hovertemplate: '∫f(x)dx: <b>%{y:.4f}</b><extra>∫f(x)dx</extra>',
                            });
                        }
                    })
            );
        }

        await Promise.all(fetches);

        // Area under curve
        const intA = parseFloat($('intA').value);
        const intB = parseFloat($('intB').value);
        if (!isNaN(intA) && !isNaN(intB) && intA < intB) {
            const orig = data.graph.data[0];
            if (orig && orig.x) {
                const x = orig.x.filter(v => v >= intA && v <= intB);
                const y = orig.y.filter((_, i) => orig.x[i] >= intA && orig.x[i] <= intB);
                traces.push({
                    x: [intA, ...x, intB, intA],
                    y: [0, ...y, 0, 0],
                    type: 'scatter', fill: 'toself', mode: 'none',
                    fillcolor: 'rgba(108,99,255,0.15)',
                    name: `Area [${intA}, ${intB}]`,
                    hoverinfo: 'skip',
                });
            }
        }

        const layout = getLayout({
            ...data.graph.layout,
            showlegend: true,
            legend: {
                font: { color: '#a0a0c0', size: 11 },
                bgcolor: 'rgba(0,0,0,0.4)',
                bordercolor: 'rgba(255,255,255,0.1)',
                borderwidth: 1,
            },
        });
        Plotly.react($('mainChart'), traces, layout, PLOTLY_CONFIG);
        updateMathInfo(data);
        $('graphTitle').textContent = `Calculus: f(x) = ${expr}`;
    } catch (err) {
        showError('Error: ' + err.message);
    } finally {
        showLoading(false);
    }
}

// ===== Toolbar Buttons =====
function setupToolbarButtons() {
    // Download PNG
    $('downloadBtn').addEventListener('click', () => {
        Plotly.downloadImage($('mainChart'), { format: 'png', filename: 'mathviz', scale: 2 });
    });

    // Reset zoom
    $('resetZoomBtn').addEventListener('click', () => {
        Plotly.relayout($('mainChart'), { 'xaxis.autorange': true, 'yaxis.autorange': true });
    });

    // Zoom in / out
    $('zoomInBtn').addEventListener('click', () => {
        const el = $('mainChart');
        const layout = el._fullLayout;
        if (!layout) return;
        const xa = layout.xaxis, ya = layout.yaxis;
        const xc = (xa.range[0] + xa.range[1]) / 2, xh = (xa.range[1] - xa.range[0]) / 4;
        const yc = (ya.range[0] + ya.range[1]) / 2, yh = (ya.range[1] - ya.range[0]) / 4;
        Plotly.relayout(el, {
            'xaxis.range': [xc - xh, xc + xh],
            'yaxis.range': [yc - yh, yc + yh],
        });
    });
    $('zoomOutBtn').addEventListener('click', () => {
        const el = $('mainChart');
        const layout = el._fullLayout;
        if (!layout) return;
        const xa = layout.xaxis, ya = layout.yaxis;
        const xc = (xa.range[0] + xa.range[1]) / 2, xh = (xa.range[1] - xa.range[0]);
        const yc = (ya.range[0] + ya.range[1]) / 2, yh = (ya.range[1] - ya.range[0]);
        Plotly.relayout(el, {
            'xaxis.range': [xc - xh, xc + xh],
            'yaxis.range': [yc - yh, yc + yh],
        });
    });

    // Crosshair toggle
    const crosshairBtn = $('crosshairBtn');
    const tracker = $('coordTracker');
    crosshairBtn.addEventListener('click', () => {
        State.crosshairOn = !State.crosshairOn;
        crosshairBtn.classList.toggle('active', State.crosshairOn);
        tracker.style.display = State.crosshairOn ? 'flex' : 'none';
        // Enable Plotly spikelines
        Plotly.relayout($('mainChart'), {
            'xaxis.showspikes': State.crosshairOn,
            'yaxis.showspikes': State.crosshairOn,
        });
    });

    // Annotate toggle
    const annotateBtn = $('annotateBtn');
    const chart = $('mainChart');
    annotateBtn.addEventListener('click', () => {
        State.annotateMode = !State.annotateMode;
        annotateBtn.classList.toggle('active', State.annotateMode);
        chart.style.cursor = State.annotateMode ? 'crosshair' : '';
        if (State.annotateMode) {
            Plotly.relayout(chart, { dragmode: 'pan' });
        } else {
            Plotly.relayout(chart, { dragmode: 'zoom' });
        }
    });

    // Export JSON (teacher only)
    const exportBtn = $('exportJsonBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!State.lastGraphJson) return;
            const blob = new Blob([JSON.stringify(State.lastGraphJson, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'mathviz_graph.json';
            a.click();
        });
    }
}

// ===== Save Button =====
function setupSaveButton() {
    const saveBtn = $('saveBtn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async () => {
        const title = $('saveTitle').value.trim() || 'Untitled';
        const desc = $('saveDesc') ? $('saveDesc').value.trim() : '';
        const isPublic = $('savePublic') ? $('savePublic').checked : false;
        const classIdEl = $('saveClassId');
        const classroomId = classIdEl ? classIdEl.value || null : null;
        const expr = State.mode === 'calculus' ? State.calcExpr : State.currentExpr;
        const eqType = State.mode === 'geometry' ? State.geoShape : State.currentType;
        const msg = $('saveMsg');

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving…';
        try {
            const resp = await fetch('/api/save-equation/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrf() },
                body: JSON.stringify({
                    title, description: desc, expression: expr,
                    equation_type: eqType, is_public: isPublic,
                    classroom_id: classroomId,
                }),
            });
            const data = await resp.json();
            if (data.success) {
                msg.className = 'save-msg success';
                msg.textContent = data.class_name ? `✓ Saved to "${data.class_name}"!` : '✓ Saved to personal collection!';
                $('saveTitle').value = '';
            } else {
                msg.className = 'save-msg error';
                msg.textContent = data.error || 'Error saving';
            }
        } catch (err) {
            msg.className = 'save-msg error';
            msg.textContent = 'Network error';
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 Save Equation';
            setTimeout(() => { msg.textContent = ''; }, 4000);
        }
    });
}

function getCsrf() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
    const c = document.cookie.split(';').find(c => c.trim().startsWith('csrftoken='));
    return c ? c.trim().split('=')[1] : '';
}

// ===== Boot =====
document.addEventListener('DOMContentLoaded', init);
