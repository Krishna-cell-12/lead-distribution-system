// ================================================================
// aquasafe_engine.sci
// Written by Krishna for FOSSEE Scilab GUIVerse Hackathon 2026
//
// This file contains everything that makes AquaSafe work:
//   - The WQI formula (Brown et al. 1972 weighted arithmetic method)
//   - All button/slider/checkbox callback functions
//   - Radar chart and bar chart drawing
//   - The HTML report export feature
// ================================================================


// I'm storing all the shared data as global variables so every
// callback function can access them without passing parameters around.

global G_PNAMES G_UNITS G_DEFAULTS G_IS10500 G_WHO G_WEIGHTS;
global G_CALC_DONE G_WQI_V G_QI_V G_PASSED_V G_VALUES_V G_STD_V;
G_CALC_DONE = 0;

G_PNAMES   = ['pH'; 'TDS'; 'Turbidity'; 'BOD'; 'Nitrates'; 'Fluoride'; 'Hardness'; 'Coliform'];
G_UNITS    = ['-'; 'mg/L'; 'NTU'; 'mg/L'; 'mg/L'; 'mg/L'; 'mg/L'; 'MPN/100mL'];
G_DEFAULTS = [7.2; 320; 2.0; 1.5; 20.0; 0.8; 180; 0];

// Safe limits as per IS 10500:2012 (Bureau of Indian Standards)
G_IS10500 = [8.5; 500; 5; 5; 45; 1.5; 300; 0];

// WHO 2017 guidelines kept for reference in the export report
G_WHO     = [8.5; 600; 4; 5; 50; 1.5; 500; 0];

// Weights reflect how much each parameter affects human health.
// I gave Coliform the highest weight because bacterial contamination
// is the most dangerous and has immediate health consequences.
// Turbidity and BOD are also weighted high as contamination indicators.
G_WEIGHTS = [0.117; 0.073; 0.150; 0.150; 0.073; 0.100; 0.073; 0.264];


// ================================================================
// WQI CORE FORMULA — Brown et al. 1972 Weighted Arithmetic Method
// ================================================================

function [wqi, qi, passed] = compute_wqi(values, standard)
// This is the heart of AquaSafe. I implemented the Brown et al. (1972)
// weighted arithmetic WQI method, which is widely used in India for
// drinking water quality assessment.
//
// Each parameter gets a quality score (qi) from 0 to 100+.
// Score of 0 means perfect, 100 means exactly at the safe limit,
// above 100 means it exceeds the safe limit.
// The final WQI is the weighted average of all 8 scores.

    global G_IS10500 G_WHO G_WEIGHTS;

    if standard == 'IS10500' then
        limits = G_IS10500;
    else
        limits = G_WHO;
    end

    N      = 8;
    qi     = zeros(N, 1);
    passed = ones(N, 1);

    for i = 1:N
        Ci = values(i);
        Si = limits(i);

        if i == 1 then
            // pH is special — it has both a lower limit (6.5) and upper limit (8.5).
            // I measure deviation from the ideal value of 7.0 to get the score.
            dev    = abs(Ci - 7.0);
            qi(i)  = dev / 1.5 * 100;
            if Ci < 6.5 | Ci > 8.5 then
                qi(i)    = qi(i) + 50;   // penalty for going outside the safe range
                passed(i) = 0;
            end

        elseif i == 8 then
            // Coliform is binary — if any bacteria are present at all, water fails.
            if Ci <= 0 then
                qi(i)    = 0;
                passed(i) = 1;
            else
                qi(i)    = 100 + min(Ci * 15, 100);
                passed(i) = 0;
            end

        else
            // All other parameters: simple ratio of measured value to safe limit.
            if Si > 0 then
                qi(i) = (Ci / Si) * 100;
            else
                qi(i) = 0;
            end
            if qi(i) < 0 then qi(i) = 0; end
            if Ci > Si  then passed(i) = 0; end
        end
    end

    // Final WQI: weighted sum of individual scores
    wqi = sum(G_WEIGHTS .* qi) / sum(G_WEIGHTS);

endfunction


function [label, bg_col, rec_text] = classify_wqi(wqi)
// I map the WQI score to a category with a color and a practical
// recommendation. The thresholds follow standard WQI classification
// used in Indian water quality studies.

    if wqi < 25 then
        label    = 'EXCELLENT  —  Safe for Drinking';
        bg_col   = [0.07, 0.55, 0.18];
        rec_text = 'Excellent quality. Safe for all uses including drinking without any treatment. Monitor every 6 months.';

    elseif wqi < 50 then
        label    = 'GOOD  —  Safe for Drinking';
        bg_col   = [0.20, 0.68, 0.28];
        rec_text = 'Good quality water. Safe for drinking. Regular testing recommended every 3 months.';

    elseif wqi < 75 then
        label    = 'POOR  —  Treatment Required';
        bg_col   = [0.75, 0.50, 0.04];
        rec_text = 'Poor quality. Boiling and/or basic filtration (candle filter) required before drinking. Check failing parameters.';

    elseif wqi < 100 then
        label    = 'VERY POOR  —  Urgent Treatment Needed';
        bg_col   = [0.78, 0.25, 0.05];
        rec_text = 'Very poor. Advanced treatment (RO / UV) required. Not safe for children, elderly or pregnant women.';

    else
        label    = 'UNSAFE  —  DO NOT DRINK THIS WATER';
        bg_col   = [0.62, 0.06, 0.06];
        rec_text = 'UNSAFE FOR DRINKING. Do not consume. Use an alternative source. Report to local authorities immediately.';
    end

endfunction


// ================================================================
// CALLBACK FUNCTIONS — triggered by buttons, sliders and checkboxes
// ================================================================

function calculate_wqi()
// This runs when the user clicks CALCULATE WQI.
// I first validate all 8 input fields, then run the WQI formula,
// then update every result widget and redraw both charts.

    global G_PNAMES G_WEIGHTS;
    global G_CALC_DONE G_WQI_V G_QI_V G_PASSED_V G_VALUES_V G_STD_V;

    p_names = G_PNAMES;
    values  = zeros(8, 1);
    all_ok  = %T;

    // Read each edit box and validate. Empty or negative values turn the
    // box red so the user knows exactly which field needs fixing.
    for i = 1:8
        h_edit  = findobj('tag', 'edit_' + p_names(i));
        if isempty(h_edit) then continue; end
        str_val = get(h_edit(1), 'string');

        if str_val == '' then
            set(h_edit, 'backgroundcolor', [1.0, 0.78, 0.78]);
            all_ok = %F;
        else
            num_val = strtod(str_val);
            if isnan(num_val) | num_val < 0 then
                set(h_edit, 'backgroundcolor', [1.0, 0.78, 0.78]);
                all_ok = %F;
            else
                values(i) = num_val;
                set(h_edit, 'backgroundcolor', [1.0, 1.0, 1.0]);
            end
        end
    end

    if ~all_ok then
        set(findobj('tag', 'txt_wqi_score'), ..
            'string', 'Please correct the highlighted fields (red = invalid input)', ..
            'backgroundcolor', [0.95, 0.80, 0.80], ..
            'foregroundcolor', [0.55, 0.05, 0.05]);
        return;
    end

    std = 'IS10500';
    [wqi, qi, passed] = compute_wqi(values, std);
    [label, bg_col, rec_text] = classify_wqi(wqi);

    // Show the WQI score with the classification color as background
    wqi_rounded = round(wqi * 10) / 10;
    set(findobj('tag', 'txt_wqi_score'), ..
        'string',          'WQI Score:  ' + string(wqi_rounded) + '  / 100', ..
        'backgroundcolor', bg_col, ..
        'foregroundcolor', [1.0, 1.0, 1.0], ..
        'fontsize',        15);

    set(findobj('tag', 'txt_safety'), ..
        'string',          '  ' + label + '  ', ..
        'backgroundcolor', bg_col, ..
        'foregroundcolor', [1.0, 1.0, 1.0]);

    set(findobj('tag', 'txt_recommendation'), ..
        'string',          rec_text, ..
        'backgroundcolor', [0.92, 0.96, 1.00], ..
        'foregroundcolor', [0.10, 0.18, 0.40]);

    // Color each parameter status box green (safe) or red (exceeds limit)
    for i = 1:8
        h_box = findobj('tag', 'status_' + p_names(i));
        if isempty(h_box) then continue; end
        h_box = h_box(1);
        score = round(qi(i) * 10) / 10;

        if passed(i) == 1 then
            set(h_box, ..
                'string',          p_names(i) + ':  OK  (' + string(score) + ')', ..
                'backgroundcolor', [0.70, 0.95, 0.72], ..
                'foregroundcolor', [0.04, 0.38, 0.10]);
        else
            set(h_box, ..
                'string',          p_names(i) + ':  FAIL  (' + string(score) + ')', ..
                'backgroundcolor', [1.00, 0.70, 0.70], ..
                'foregroundcolor', [0.50, 0.04, 0.04]);
        end
    end

    // Check if the user wants the safe-limit ring drawn on the radar
    h_chk = findobj('tag', 'chk_limits');
    if ~isempty(h_chk) then show_lim = get(h_chk(1), 'value'); else show_lim = 1; end

    draw_radar_chart(qi, passed, show_lim);
    draw_bar_chart(qi, passed);

    // Save results so export_report() can use them later
    G_CALC_DONE = 1;
    G_WQI_V     = wqi;
    G_QI_V      = qi;
    G_PASSED_V  = passed;
    G_VALUES_V  = values;
    G_STD_V     = std;

endfunction


function reset_form()
// Resets everything back to the default sample values
// so the user can start a fresh calculation.

    global G_PNAMES G_DEFAULTS;

    p_names   = G_PNAMES;
    p_default = G_DEFAULTS;

    for i = 1:8
        set(findobj('tag', 'edit_' + p_names(i)), ..
            'string',          string(p_default(i)), ..
            'backgroundcolor', [1.0, 1.0, 1.0]);

        set(findobj('tag', 'status_' + p_names(i)), ..
            'string',          p_names(i) + ':  --', ..
            'backgroundcolor', [0.82, 0.85, 0.89], ..
            'foregroundcolor', [0.25, 0.25, 0.35]);
    end

    // Put all sliders back to their default positions
    for i = 1:8
        h_sl = findobj('tag', 'slider_' + p_names(i));
        if ~isempty(h_sl) then
            set(h_sl(1), 'value', p_default(i));
        end
    end

    set(findobj('tag', 'txt_wqi_score'), ..
        'string',          'Enter values and click  CALCULATE WQI', ..
        'backgroundcolor', [0.82, 0.90, 0.97], ..
        'foregroundcolor', [0.22, 0.22, 0.38], ..
        'fontsize',        12);
    set(findobj('tag', 'txt_safety'), ..
        'string',          '', ..
        'backgroundcolor', [0.82, 0.90, 0.97]);
    set(findobj('tag', 'txt_recommendation'), ..
        'string',          '', ..
        'backgroundcolor', [0.90, 0.94, 0.98]);

    h_r = findobj('tag', 'axes_radar');
    sca(h_r);
    ar = gca();
    if ~isempty(ar.children) then delete(ar.children); end
    xtitle('Radar Chart', '', '');

    h_b = findobj('tag', 'axes_bar');
    sca(h_b);
    ab = gca();
    if ~isempty(ab.children) then delete(ab.children); end
    xtitle('Parameter Scores', '', '');

    live_check();

    global G_CALC_DONE;
    G_CALC_DONE = 0;

endfunction


function update_limits()
// Refreshes the safe-limit labels shown next to each parameter.
// Currently always uses IS 10500:2012 values.

    global G_PNAMES G_IS10500;

    limits  = G_IS10500;
    p_names = G_PNAMES;

    for i = 1:8
        h_lim = findobj('tag', 'lim_' + p_names(i));
        if i == 1 then
            set(h_lim, 'string', '6.5 - 8.5');
        elseif i == 8 then
            set(h_lim, 'string', 'Absent (0)');
        else
            set(h_lim, 'string', '< ' + string(limits(i)));
        end
    end

endfunction


function slider_update(pname, dec)
// Called whenever the user drags any of the 8 parameter sliders.
// I read the slider value, round it to the right number of decimal
// places for that parameter, and mirror it in the edit box.
// Then I call live_check() so the color updates immediately.

    h_sl = findobj('tag', 'slider_' + pname);
    if isempty(h_sl) then return; end
    val  = get(h_sl(1), 'value');

    if dec == 0 then
        val = round(val);
    elseif dec == 1 then
        val = round(val * 10) / 10;
    elseif dec == 2 then
        val = round(val * 100) / 100;
    end

    set(findobj('tag', 'edit_' + pname), 'string', string(val));
    live_check();

endfunction


function live_check()
// This runs every time any edit box value changes.
// I compare each value to the IS 10500 safe limit and color the
// box green (within limit) or red (exceeds limit) in real time.
// This gives immediate visual feedback without needing to click Calculate.

    global G_PNAMES G_IS10500;

    limits  = G_IS10500;
    p_names = G_PNAMES;

    for i = 1:8
        h_edit  = findobj('tag', 'edit_' + p_names(i));
        if isempty(h_edit) then continue; end
        str_val = get(h_edit(1), 'string');

        if str_val == '' then
            set(h_edit, 'backgroundcolor', [0.96, 0.90, 0.90]);
        else
            val = strtod(str_val);
            if isnan(val) | val < 0 then
                set(h_edit, 'backgroundcolor', [1.00, 0.78, 0.78]);
            elseif i == 1 then
                if val >= 6.5 & val <= 8.5 then
                    set(h_edit, 'backgroundcolor', [0.88, 1.00, 0.88]);
                else
                    set(h_edit, 'backgroundcolor', [1.00, 0.82, 0.82]);
                end
            elseif i == 8 then
                if val == 0 then
                    set(h_edit, 'backgroundcolor', [0.88, 1.00, 0.88]);
                else
                    set(h_edit, 'backgroundcolor', [1.00, 0.72, 0.72]);
                end
            else
                if val <= limits(i) then
                    set(h_edit, 'backgroundcolor', [0.88, 1.00, 0.88]);
                else
                    set(h_edit, 'backgroundcolor', [1.00, 0.82, 0.82]);
                end
            end
        end
    end

endfunction


// ================================================================
// CHART DRAWING — Radar Chart and Bar Chart
// ================================================================

function draw_radar_chart(qi, passed, show_lim)
// I draw a spider/radar chart with 8 axes — one per parameter.
// The shape of the polygon shows which parameters are problematic
// at a glance. I used parametric math (r*cos(t), r*sin(t)) to
// place each axis at equal angles around the circle.

    N = 8;
    h_ax = findobj('tag', 'axes_radar');
    if isempty(h_ax) then return; end
    sca(h_ax(1));
    a = gca();
    if ~isempty(a.children) then delete(a.children); end

    r_vals = min(qi / 100, 1.5);

    // Calculate the angle for each of the 8 axes, starting from top (pi/2)
    angs = linspace(%pi/2, %pi/2 - 2*%pi, N + 1);
    angs = angs(1:N);
    t_c = linspace(0, 2*%pi, 200);

    // Draw the inner dashed ring at 50% of the safe limit
    xg1 = 0.5 * cos(t_c); yg1 = 0.5 * sin(t_c);
    xpoly(xg1, yg1);
    try
        e1 = gce(); e1.foreground = color('gray'); e1.line_style = 3; e1.thickness = 1;
    catch
    end

    // Draw the outer red ring marking the safe limit boundary
    if show_lim == 1 then
        xg2 = cos(t_c); yg2 = sin(t_c);
        xpoly(xg2, yg2);
        try
            e2 = gce(); e2.foreground = color('red'); e2.line_style = 2; e2.thickness = 1;
        catch
        end
    end

    // Draw the spoke lines from center to each axis tip
    for i = 1:N
        xpoly([0, cos(angs(i))], [0, sin(angs(i))]);
        try
            es = gce(); es.foreground = color('lightgray');
        catch
        end
    end

    // Build the data polygon by placing each parameter score on its axis
    xd = zeros(1, N + 1); yd = zeros(1, N + 1);
    for i = 1:N
        xd(i) = r_vals(i) * cos(angs(i)); yd(i) = r_vals(i) * sin(angs(i));
    end
    xd(N + 1) = xd(1); yd(N + 1) = yd(1);

    // Filled polygon showing the water quality footprint
    xfpoly(xd(1:N), yd(1:N));
    try
        hf = gce(); hf.fill_mode = 'on'; hf.background = color(120, 168, 228); hf.foreground = color(25, 85, 195);
    catch
    end

    xpoly(xd, yd);
    try
        ep = gce(); ep.foreground = color(25, 85, 195); ep.thickness = 2;
    catch
    end

    // Small circle markers at each data point
    for i = 1:N
        xarc(xd(i)-0.05, yd(i)+0.05, 0.1, 0.1, 0, 360*64);
        try
            ea = gce(); ea.background = color(180, 210, 245); ea.fill_mode = 'on'; ea.foreground = color(15, 60, 175);
        catch
        end
    end

    // Parameter labels — red if failing, blue if passing
    short_labels = ['pH'; 'TDS'; 'Turb.'; 'BOD'; 'NO3'; 'Fluor.'; 'Hard.'; 'Coliform'];
    for i = 1:N
        xl = 1.25 * cos(angs(i)) - 0.15;
        yl = 1.25 * sin(angs(i)) - 0.05;
        xstring(xl, yl, short_labels(i));
        try
            et = gce(); et.font_size = 1;
            if passed(i) == 0 then et.font_foreground = color('red');
            else et.font_foreground = color('blue'); end
        catch
        end
    end

    a.data_bounds = [-1.6, -1.6; 1.6, 1.6];
    a.isoview = 'on'; a.box = 'off';
    try
        a.axes_visible = ['off', 'off', 'off'];
    catch
    end
    xtitle('Quality Radar Chart');
    try; a.title.font_size = 2; a.title.foreground = color(25, 60, 145); catch
    end
    drawnow();
endfunction


function draw_bar_chart(qi, passed)
// Horizontal bar chart showing each parameter's quality score.
// I color each bar from green (safe) to red (unsafe) based on
// how far the score is from 100. The dashed red line at 100
// marks the safe limit boundary — bars crossing it are failing.

    N = 8;
    short_names = ['pH'; 'TDS'; 'Turbidity'; 'BOD'; 'Nitrates'; 'Fluoride'; 'Hardness'; 'Coliform'];
    h_ax = findobj('tag', 'axes_bar');
    if isempty(h_ax) then return; end
    sca(h_ax(1));
    a = gca();
    if ~isempty(a.children) then delete(a.children); end

    disp_qi = min(qi, 155);

    for i = 1:N
        yi_bar = N - i + 1;
        val = disp_qi(i);

        // Pick bar color based on score range
        if qi(i) <= 25 then fc = color(45,  185, 65);
        elseif qi(i) <= 50 then fc = color(115, 210, 75);
        elseif qi(i) <= 75 then fc = color(228, 188, 25);
        elseif qi(i) <= 100 then fc = color(228, 112, 22);
        else fc = color(198, 30, 30); end

        xv = [0; val; val; 0]; yv = [yi_bar - 0.35; yi_bar - 0.35; yi_bar + 0.35; yi_bar + 0.35];
        xfpoly(xv, yv);
        try; hb = gce(); hb.fill_mode = 'on'; hb.background = fc; hb.foreground = color('lightgray'); catch
        end

        xstring(val + 2, yi_bar - 0.15, string(round(qi(i))));
        try
            ht = gce(); ht.font_size = 1;
            if passed(i) == 0 then ht.font_foreground = color('red'); else ht.font_foreground = color('darkgreen'); end
        catch
        end

        xstring(-35, yi_bar - 0.15, short_names(i));
        try
            hn = gce(); hn.font_size = 1;
            if passed(i) == 0 then hn.font_foreground = color('red'); else hn.font_foreground = color('darkblue'); end
        catch
        end
    end

    // Vertical dashed red line at score=100 (the safe limit boundary)
    xpoly([100, 100], [0.45, 8.55]);
    try; el = gce(); el.foreground = color('red'); el.line_style = 2; el.thickness = 2; catch
    end

    xstring(101, 8.55, 'LIMIT');
    try; etl = gce(); etl.font_size = 1; etl.font_foreground = color('red'); catch
    end

    a.data_bounds = [-40, 0.3; 165, 8.75];
    a.box = 'off'; a.tight_limits = ['on', 'on'];
    try
        a.axes_visible = ['on', 'off', 'off'];
        a.y_ticks = tlist(['ticks', 'locations', 'labels'], [], []);
        a.x_ticks.locations = [0, 25, 50, 75, 100, 125, 150];
        a.x_ticks.labels = ['0'; '25'; '50'; '75'; '100'; '125'; '150'];
    catch
    end
    xtitle('Parameter Quality Scores', 'Score  (100 = at safe limit)', '');
    try; a.title.font_size = 2; a.title.foreground = color(25, 60, 145); a.x_label.font_size = 1; catch
    end
    drawnow();
endfunction


// ================================================================
// EXPORT REPORT — Generates a styled HTML report and opens it
// in the browser so the user can save it as PDF with Ctrl+P.
// ================================================================

function export_report()
// I build a complete HTML page with the WQI results and open it
// in the user's default browser. To save as PDF, just press Ctrl+P.
// I store the HTML in the system temp folder to avoid path issues.

    global G_PNAMES G_UNITS G_IS10500 G_WHO;
    global G_CALC_DONE G_WQI_V G_QI_V G_PASSED_V G_VALUES_V G_STD_V;

    if G_CALC_DONE ~= 1 then
        messagebox('Please click CALCULATE WQI first, then export.', 'AquaSafe', 'info');
        return;
    end

    wqi    = G_WQI_V;
    qi     = G_QI_V;
    passed = G_PASSED_V;
    values = G_VALUES_V;
    std    = G_STD_V;

    [label, bg_col, rec_text] = classify_wqi(wqi);

    // Convert the RGB color (0-1 float) to a CSS hex string like #1A6BBF
    function s = rgb2hex(r, g, b)
        hc = '0123456789ABCDEF';
        function h = b2h(v)
            v = round(v * 255);
            if v < 0 then v = 0; end
            if v > 255 then v = 255; end
            h = part(hc, floor(v/16)+1) + part(hc, modulo(v,16)+1);
        endfunction
        s = '#' + b2h(r) + b2h(g) + b2h(b);
    endfunction

    bg_hex      = rgb2hex(bg_col(1), bg_col(2), bg_col(3));
    wqi_rounded = round(wqi * 10) / 10;
    p_names     = G_PNAMES;
    p_units     = G_UNITS;

    if std == 'IS10500' then
        limits    = G_IS10500;
        std_label = 'IS 10500:2012 (India)';
    else
        limits    = G_WHO;
        std_label = 'WHO 2017 (Global)';
    end

    t_vec = getdate();
    ts = string(t_vec(3)) + '/' + string(t_vec(2)) + '/' + string(t_vec(1)) + ..
         ' ' + string(t_vec(7)) + ':' + msprintf('%02d', t_vec(8));

    // All HTML attributes use single quotes (valid HTML5) because Scilab
    // treats double quotes as string delimiters — mixing them causes errors.
    css = '<style>' + ..
        'body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background:#f0f4f8}' + ..
        '.hdr{background:linear-gradient(135deg,#0d2e6e,#1a6bbf);color:white;padding:26px 34px}' + ..
        '.hdr h1{margin:0;font-size:21px}' + ..
        '.hdr p{margin:5px 0 0;opacity:.8;font-size:11px}' + ..
        '.card{background:white;border-radius:10px;margin:14px 34px;padding:18px;' + ..
        'box-shadow:0 2px 10px rgba(0,0,0,.08)}' + ..
        '.sbox{border-radius:10px;padding:12px 18px;text-align:center;color:white;margin-bottom:10px}' + ..
        '.sbox h2{margin:0;font-size:24px}' + ..
        '.sbox p{margin:4px 0 0;font-size:13px}' + ..
        '.pw{background:#ddd;border-radius:5px;height:18px;width:100%;margin-bottom:8px}' + ..
        '.pf{height:18px;border-radius:5px;text-align:center;color:white;font-weight:bold;' + ..
        'line-height:18px;font-size:12px}' + ..
        '.rec{background:#e8f4fd;border-left:4px solid #1a6bbf;padding:9px 13px;' + ..
        'border-radius:4px;font-size:13px;color:#0d2e6e;margin-top:8px}' + ..
        'table{width:100%;border-collapse:collapse;font-size:13px}' + ..
        'th{background:#0d2e6e;color:white;padding:8px 10px;text-align:left}' + ..
        'td{padding:7px 10px;border-bottom:1px solid #e8ecf0;color:#333}' + ..
        'tr:hover td{background:#f5f8ff}' + ..
        '.pass{background:#d4edda;color:#155724;font-weight:bold;text-align:center}' + ..
        '.fail{background:#f8d7da;color:#721c24;font-weight:bold;text-align:center}' + ..
        '.bw{background:#eee;border-radius:3px;height:11px;width:100px;' + ..
        'display:inline-block;vertical-align:middle}' + ..
        '.bf{height:11px;border-radius:3px}' + ..
        '.ftr{text-align:center;padding:14px;font-size:11px;color:#999}' + ..
        '</style>';

    pct  = string(min(round(wqi_rounded / 150 * 100), 100));
    pbar = '<div class=''pw''><div class=''pf'' style=''background:' + bg_hex + ..
           ';width:' + pct + '%''>' + string(wqi_rounded) + ' / 100</div></div>';

    // Build one HTML table row per parameter
    rows = '';
    for i = 1:8
        sc = round(qi(i) * 10) / 10;
        if i == 1 then lstr = '6.5-8.5';
        elseif i == 8 then lstr = 'Absent(0)';
        else lstr = '< ' + string(limits(i));
        end

        if passed(i) == 1 then stcell = '<td class=''pass''>PASS</td>';
        else stcell = '<td class=''fail''>FAIL</td>'; end

        if sc <= 25 then bc = '#28a745';
        elseif sc <= 50 then bc = '#5cb85c';
        elseif sc <= 75 then bc = '#ffc107';
        elseif sc <= 100 then bc = '#fd7e14';
        else bc = '#dc3545'; end

        spct = string(min(round(sc / 150 * 100), 100));
        bar = '<div class=''bw''><div class=''bf'' style=''background:' + bc + ..
              ';width:' + spct + '%''></div></div> ' + string(sc);

        rows = rows + '<tr>' + ..
            '<td><b>' + p_names(i) + '</b></td>' + ..
            '<td style=''text-align:center''>' + string(values(i)) + '</td>' + ..
            '<td style=''text-align:center''>' + p_units(i) + '</td>' + ..
            '<td style=''text-align:center''>' + lstr + '</td>' + ..
            '<td>' + bar + '</td>' + stcell + '</tr>';
    end

    // I build the sbox background color as a separate variable to avoid
    // three consecutive single quotes which Python/editors misread.
    sbox_style = 'style=''background:' + bg_hex + '''';

    html = '<!DOCTYPE html><html lang=''en''><head><meta charset=''UTF-8''>' + ..
        '<title>AquaSafe WQI Report</title>' + css + '</head><body>' + ..
        '<div class=''hdr''>' + ..
        '<h1>AquaSafe - Water Quality Index Report</h1>' + ..
        '<p>Generated: ' + ts + ' | Standard: ' + std_label + ..
        ' | Brown et al. 1972 Weighted Arithmetic WQI</p></div>' + ..
        '<div class=''card''>' + ..
        '<div class=''sbox'' ' + sbox_style + '>' + ..
        '<h2>WQI Score: ' + string(wqi_rounded) + ' / 100</h2>' + ..
        '<p>' + label + '</p></div>' + pbar + ..
        '<div class=''rec''>Recommendation: ' + rec_text + '</div></div>' + ..
        '<div class=''card''>' + ..
        '<h3 style=''margin-top:0;color:#0d2e6e''>Parameter-wise Analysis</h3>' + ..
        '<table><thead><tr>' + ..
        '<th>Parameter</th><th>Measured</th><th>Unit</th>' + ..
        '<th>Safe Limit</th><th>Quality Score</th><th>Status</th>' + ..
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' + ..
        '<div class=''card'' style=''font-size:12px;color:#666''>' + ..
        '<b>How to read:</b> WQI 0-25=Excellent | 25-50=Good | 50-75=Poor | ' + ..
        '75-100=Very Poor | above 100=Unsafe. Score 100 = exactly at safe limit.' + ..
        '</div>' + ..
        '<div class=''ftr''>AquaSafe v1.0 | FOSSEE Scilab GUIVerse 2026 | IIT Bombay<br>' + ..
        'IS 10500:2012 | WHO 2017 | Brown et al. (1972)<br>' + ..
        '<b>Press Ctrl+P in browser then Save as PDF</b>' + ..
        '</div></body></html>';

    // Save the HTML file to the system temp directory (avoids spaces-in-path issues)
    report_file = TMPDIR + filesep() + 'AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    // I use ascii(34) to build the double-quote character without writing
    // it directly in the Scilab string (which would cause a parser error).
    q   = ascii(34);
    cmd = 'cmd /c start ' + q + q + ' ' + q + report_file + q;
    opened = %F;
    try
        host(cmd);
        opened = %T;
    catch
    end
    if ~opened then
        try
            unix_w(cmd);
            opened = %T;
        catch
        end
    end
    if ~opened then
        try
            winopen(report_file);
            opened = %T;
        catch
        end
    end

    disp('=== AquaSafe: Report exported! ===');
    disp('File: ' + report_file);

    if opened then
        msg = 'Report saved! Browser opening...' + ascii(10) + ..
              'File: ' + report_file + ascii(10) + ..
              'Press Ctrl+P -> Save as PDF';
    else
        msg = 'Report saved! Open the file below manually in your browser:' + ascii(10) + ..
              report_file + ascii(10) + ..
              'Then press Ctrl+P -> Save as PDF';
    end
    messagebox(msg, 'AquaSafe Export', 'info');
endfunction
