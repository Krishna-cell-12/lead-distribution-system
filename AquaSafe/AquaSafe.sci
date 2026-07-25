// ================================================================
// AquaSafe.sci
// Written by Krishna for FOSSEE Scilab GUIVerse Hackathon 2026
//
// This file builds the entire AquaSafe GUI window.
// I call AquaSafe() from run_aquasafe.sce to launch the app.
// All the layout positions are calculated from the bottom-left corner
// of the window (Scilab's default coordinate system).
// ================================================================

function AquaSafe()

    // Create the main application window (960 x 682 pixels)
    fig = figure( ..
        'figure_name',   'AquaSafe  |  Water Quality Index Dashboard  |  FOSSEE Scilab GUIVerse 2026', ..
        'position',      [35, 35, 960, 682], ..
        'backgroundcolor',[0.89, 0.93, 0.97], ..
        'resize',        'off');

    // ---- TITLE BAR ----
    uicontrol(fig, 'style', 'text', ..
        'string',             'AquaSafe  |  Water Quality Index Dashboard', ..
        'position',           [0, 642, 960, 40], ..
        'fontsize',           16, ..
        'fontweight',         'bold', ..
        'backgroundcolor',    [0.07, 0.22, 0.52], ..
        'foregroundcolor',    [1.00, 1.00, 1.00], ..
        'horizontalalignment','center');

    uicontrol(fig, 'style', 'text', ..
        'string',             'India IS 10500:2012  & WHO 2017 Drinking Water Standards  |  Weighted Arithmetic WQI Method', ..
        'position',           [0, 623, 960, 19], ..
        'fontsize',           8, ..
        'backgroundcolor',    [0.10, 0.35, 0.65], ..
        'foregroundcolor',    [0.84, 0.92, 1.00], ..
        'horizontalalignment','center');

    // ---- LEFT PANEL — input area background ----
    uicontrol(fig, 'style', 'frame', ..
        'position',        [3, 3, 296, 619], ..
        'backgroundcolor', [0.93, 0.96, 0.99]);

    uicontrol(fig, 'style', 'text', ..
        'string',             '  INPUT PARAMETERS', ..
        'position',           [3, 600, 296, 22], ..
        'fontsize',           9, ..
        'fontweight',         'bold', ..
        'backgroundcolor',    [0.13, 0.38, 0.72], ..
        'foregroundcolor',    [1.00, 1.00, 1.00], ..
        'horizontalalignment','left');

    // I show the standard as a fixed label since the app uses IS 10500:2012 only
    uicontrol(fig, 'style', 'text', ..
        'string',          'Standard:  IS 10500:2012  (India)', ..
        'position',        [8, 553, 280, 24], ..
        'fontsize',        9, 'fontweight', 'bold', ..
        'backgroundcolor', [0.78, 0.88, 0.96], ..
        'foregroundcolor', [0.07, 0.22, 0.52], ..
        'horizontalalignment', 'center');

    // ---- COLUMN HEADERS for the parameter table ----
    header_bg = [0.78, 0.88, 0.96];
    header_fg = [0.05, 0.18, 0.45];

    uicontrol(fig, 'style', 'text', 'string', 'Parameter', ..
        'position', [8, 535, 87, 19], 'fontsize', 8, 'fontweight', 'bold', ..
        'backgroundcolor', header_bg, 'foregroundcolor', header_fg);
    uicontrol(fig, 'style', 'text', 'string', 'Value', ..
        'position', [98, 535, 75, 19], 'fontsize', 8, 'fontweight', 'bold', ..
        'backgroundcolor', header_bg, 'foregroundcolor', header_fg, ..
        'horizontalalignment', 'center');
    uicontrol(fig, 'style', 'text', 'string', 'Unit', ..
        'position', [176, 535, 50, 19], 'fontsize', 8, 'fontweight', 'bold', ..
        'backgroundcolor', header_bg, 'foregroundcolor', header_fg);
    uicontrol(fig, 'style', 'text', 'string', 'Safe Limit', ..
        'position', [228, 535, 66, 19], 'fontsize', 8, 'fontweight', 'bold', ..
        'backgroundcolor', header_bg, 'foregroundcolor', header_fg);

    // ---- 8 PARAMETER INPUT ROWS ----
    // Each row has: label | edit box | unit | safe limit | slider
    // I use a loop with y_start and y_gap to position all 8 rows evenly.
    // The sliders let users drag values instead of typing — much faster for exploring.
    p_names   = ['pH'; 'TDS'; 'Turbidity'; 'BOD'; 'Nitrates'; 'Fluoride'; 'Hardness'; 'Coliform'];
    p_units   = ['-'; 'mg/L'; 'NTU'; 'mg/L'; 'mg/L'; 'mg/L'; 'mg/L'; 'MPN/100mL'];
    p_default = ['7.2'; '320'; '2.0'; '1.5'; '20.0'; '0.8'; '180'; '0'];
    p_limits  = ['6.5 - 8.5'; '< 500'; '< 5'; '< 5'; '< 45'; '< 1.5'; '< 300'; 'Absent (0)'];

    // Slider min, max and decimal rounding for each parameter
    sl_min = [0;    0;    0;    0;    0;    0;    0;    0];
    sl_max = [14;   2000; 20;   20;   100;  5;    700;  10];
    sl_dec = [1;    0;    1;    1;    1;    2;    0;    0];

    y_start = 514;
    y_gap   = 54;

    for i = 1:8
        yi = y_start - (i - 1) * y_gap;

        uicontrol(fig, 'style', 'text', ..
            'string',          p_names(i), ..
            'position',        [8, yi + 16, 87, 22], ..
            'fontsize',        9, 'fontweight', 'bold', ..
            'backgroundcolor', [0.93, 0.96, 0.99], ..
            'foregroundcolor', [0.10, 0.25, 0.52], ..
            'horizontalalignment', 'left');

        // The edit box changes color in real time via live_check()
        uicontrol(fig, 'style', 'edit', ..
            'tag',             'edit_' + p_names(i), ..
            'string',          p_default(i), ..
            'position',        [98, yi + 15, 74, 26], ..
            'fontsize',        10, ..
            'backgroundcolor', [1.00, 1.00, 1.00], ..
            'horizontalalignment', 'center', ..
            'callback',        'live_check()');

        uicontrol(fig, 'style', 'text', ..
            'string',          p_units(i), ..
            'position',        [176, yi + 17, 50, 20], ..
            'fontsize',        7.5, ..
            'backgroundcolor', [0.93, 0.96, 0.99], ..
            'foregroundcolor', [0.35, 0.40, 0.55]);

        // The limit label gets its text from update_limits()
        uicontrol(fig, 'style', 'text', ..
            'tag',             'lim_' + p_names(i), ..
            'string',          p_limits(i), ..
            'position',        [228, yi + 17, 66, 20], ..
            'fontsize',        7.5, ..
            'backgroundcolor', [0.93, 0.96, 0.99], ..
            'foregroundcolor', [0.08, 0.42, 0.14]);

        // Slider — dragging it updates the edit box and re-runs live_check()
        uicontrol(fig, 'style', 'slider', ..
            'tag',             'slider_' + p_names(i), ..
            'min',             sl_min(i), ..
            'max',             sl_max(i), ..
            'value',           strtod(p_default(i)), ..
            'position',        [8, yi, 284, 14], ..
            'backgroundcolor', [0.62, 0.80, 0.94], ..
            'callback',        'slider_update(''' + p_names(i) + ''', ' + string(sl_dec(i)) + ')');
    end

    // ---- CHECKBOX — toggles the safe-limit ring on the radar chart ----
    uicontrol(fig, 'style', 'checkbox', ..
        'tag',             'chk_limits', ..
        'string',          'Show safe-limit ring on radar chart', ..
        'position',        [8, 93, 280, 22], ..
        'value',           1, ..
        'fontsize',        8.5, ..
        'backgroundcolor', [0.93, 0.96, 0.99]);

    // ---- ACTION BUTTONS ----
    uicontrol(fig, 'style', 'pushbutton', ..
        'string',          'CALCULATE WQI', ..
        'position',        [6, 63, 288, 28], ..
        'fontsize',        11, 'fontweight', 'bold', ..
        'backgroundcolor', [0.06, 0.46, 0.16], ..
        'foregroundcolor', [1.00, 1.00, 1.00], ..
        'callback',        'calculate_wqi()');

    uicontrol(fig, 'style', 'pushbutton', ..
        'string',          'EXPORT REPORT (PDF)', ..
        'position',        [6, 34, 178, 26], ..
        'fontsize',        8.5, 'fontweight', 'bold', ..
        'backgroundcolor', [0.10, 0.36, 0.62], ..
        'foregroundcolor', [1.00, 1.00, 1.00], ..
        'callback',        'export_report()');

    uicontrol(fig, 'style', 'pushbutton', ..
        'string',          'RESET', ..
        'position',        [192, 34, 102, 26], ..
        'fontsize',        8.5, 'fontweight', 'bold', ..
        'backgroundcolor', [0.52, 0.13, 0.13], ..
        'foregroundcolor', [1.00, 1.00, 1.00], ..
        'callback',        'reset_form()');

    uicontrol(fig, 'style', 'text', ..
        'string',          'v1.0 | FOSSEE GUIVerse 2026', ..
        'position',        [6, 8, 288, 22], ..
        'fontsize',        7, ..
        'backgroundcolor', [0.93, 0.96, 0.99], ..
        'foregroundcolor', [0.50, 0.55, 0.65], ..
        'horizontalalignment', 'center');

    // ---- RIGHT PANEL — WQI result display ----
    uicontrol(fig, 'style', 'text', ..
        'string',             'Water Quality Index (WQI) Result', ..
        'position',           [302, 601, 652, 22], ..
        'fontsize',           10, 'fontweight', 'bold', ..
        'backgroundcolor',    [0.89, 0.93, 0.97], ..
        'foregroundcolor',    [0.07, 0.22, 0.52], ..
        'horizontalalignment','center');

    // Large colored score box — background color changes based on WQI category
    uicontrol(fig, 'style', 'text', ..
        'tag',                'txt_wqi_score', ..
        'string',             'Enter values and click  CALCULATE WQI', ..
        'position',           [302, 562, 652, 38], ..
        'fontsize',           12, 'fontweight', 'bold', ..
        'backgroundcolor',    [0.80, 0.90, 0.97], ..
        'foregroundcolor',    [0.22, 0.22, 0.38], ..
        'horizontalalignment','center');

    uicontrol(fig, 'style', 'text', ..
        'tag',                'txt_safety', ..
        'string',             '', ..
        'position',           [302, 524, 652, 36], ..
        'fontsize',           13, 'fontweight', 'bold', ..
        'backgroundcolor',    [0.80, 0.90, 0.97], ..
        'foregroundcolor',    [0.22, 0.22, 0.38], ..
        'horizontalalignment','center');

    uicontrol(fig, 'style', 'text', ..
        'tag',                'txt_recommendation', ..
        'string',             '', ..
        'position',           [302, 490, 652, 32], ..
        'fontsize',           8.5, ..
        'backgroundcolor',    [0.89, 0.93, 0.97], ..
        'foregroundcolor',    [0.12, 0.18, 0.42], ..
        'horizontalalignment','center');

    // ---- CHART AXES — I use newaxes() and set axes_bounds to position them ----
    h_axes_radar = newaxes();
    h_axes_radar.axes_bounds = [303/960, 196/682, 318/960, 234/682];
    h_axes_radar.tag = 'axes_radar';

    h_axes_bar = newaxes();
    h_axes_bar.axes_bounds = [634/960, 196/682, 318/960, 234/682];
    h_axes_bar.tag = 'axes_bar';

    // ---- 8 PARAMETER STATUS BOXES — 2 rows of 4, colored after calculation ----
    uicontrol(fig, 'style', 'text', ..
        'string',             'Individual Parameter Status (green = safe, red = exceeds limit)', ..
        'position',           [302, 234, 652, 18], ..
        'fontsize',           8.5, 'fontweight', 'bold', ..
        'backgroundcolor',    [0.89, 0.93, 0.97], ..
        'foregroundcolor',    [0.07, 0.22, 0.52], ..
        'horizontalalignment','center');

    for i = 1:8
        col = modulo(i - 1, 4);
        row = floor((i - 1) / 4);
        xi  = 304 + col * 163;
        yi  = 196 - row * 38;

        uicontrol(fig, 'style', 'text', ..
            'tag',                'status_' + p_names(i), ..
            'string',             p_names(i) + ':  --', ..
            'position',           [xi, yi, 160, 30], ..
            'fontsize',           8.5, ..
            'backgroundcolor',    [0.82, 0.85, 0.89], ..
            'foregroundcolor',    [0.25, 0.25, 0.35], ..
            'horizontalalignment','center');
    end

    // ---- FOOTER ----
    uicontrol(fig, 'style', 'text', ..
        'string',             'FOSSEE Scilab GUIVerse Hackathon 2026  |  IIT Bombay  |  AquaSafe v1.0  |  IS 10500 & WHO Standards', ..
        'position',           [302, 4, 652, 16], ..
        'fontsize',           7, ..
        'backgroundcolor',    [0.89, 0.93, 0.97], ..
        'foregroundcolor',    [0.40, 0.45, 0.58], ..
        'horizontalalignment','center');

    // ---- PLACEHOLDER TEXT in the chart areas before first calculation ----
    h_r = findobj('tag', 'axes_radar');
    sca(h_r);
    xtitle('Quality Radar Chart', '', '');
    try
        a_r = gca();
        a_r.data_bounds = [0, 0; 1, 1];
    catch
    end
    xstring(0.12, 0.48, 'Press CALCULATE to view');

    h_b = findobj('tag', 'axes_bar');
    sca(h_b);
    xtitle('Parameter Quality Scores', '', '');
    try
        a_b = gca();
        a_b.data_bounds = [0, 0; 1, 1];
    catch
    end
    xstring(0.12, 0.48, 'Press CALCULATE to view');

    // Run live_check on load so the edit boxes show colors right from the start
    live_check();

    disp('AquaSafe GUI loaded successfully. Enter water quality data and click CALCULATE WQI.');

endfunction
