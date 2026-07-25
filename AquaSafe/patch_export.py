import re

filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add G_LAST_RESULT to global declaration
content = content.replace(
    'global G_PNAMES G_UNITS G_DEFAULTS G_IS10500 G_WHO G_WEIGHTS;',
    'global G_PNAMES G_UNITS G_DEFAULTS G_IS10500 G_WHO G_WEIGHTS G_LAST_RESULT;'
)

# 2. Initialize G_LAST_RESULT after G_WEIGHTS
content = content.replace(
    'G_WEIGHTS = [0.117; 0.073; 0.150; 0.150; 0.073; 0.100; 0.073; 0.264];',
    'G_WEIGHTS = [0.117; 0.073; 0.150; 0.150; 0.073; 0.100; 0.073; 0.264];\n\n// Storage for last result (used by export_report)\nG_LAST_RESULT = struct();\nG_LAST_RESULT.calculated = %F;'
)

# 3. Add G_LAST_RESULT to calculate_wqi global line
content = content.replace(
    '    global G_PNAMES G_WEIGHTS;\n\n    p_names = G_PNAMES;\n    values  = zeros(8, 1);',
    '    global G_PNAMES G_WEIGHTS G_LAST_RESULT;\n\n    p_names = G_PNAMES;\n    values  = zeros(8, 1);'
)

# 4. Store results after compute_wqi
content = content.replace(
    '    // Compute WQI\n    [wqi, qi, passed] = compute_wqi(values, std);\n\n    // Classify',
    '    // Compute WQI\n    [wqi, qi, passed] = compute_wqi(values, std);\n\n    // Store results globally for export\n    G_LAST_RESULT.wqi        = wqi;\n    G_LAST_RESULT.qi         = qi;\n    G_LAST_RESULT.passed     = passed;\n    G_LAST_RESULT.values     = values;\n    G_LAST_RESULT.std        = std;\n    G_LAST_RESULT.calculated = %T;\n\n    // Classify'
)

print("Main patches done.")

# 5. Append export_report() at end of file
export_fn = r"""

// ----------------------------------------------------------------
//  EXPORT HTML REPORT  (opens in browser; user clicks Ctrl+P -> Save as PDF)
// ----------------------------------------------------------------

function export_report()
// Generate a styled HTML report of the last WQI calculation.
// Opens it in the default browser. Press Ctrl+P in browser to Save as PDF.

    global G_PNAMES G_UNITS G_IS10500 G_WHO G_LAST_RESULT;

    if ~G_LAST_RESULT.calculated then
        disp('AquaSafe: Please click CALCULATE WQI first before exporting.');
        return;
    end

    wqi    = G_LAST_RESULT.wqi;
    qi     = G_LAST_RESULT.qi;
    passed = G_LAST_RESULT.passed;
    values = G_LAST_RESULT.values;
    std    = G_LAST_RESULT.std;

    [label, bg_col, rec_text] = classify_wqi(wqi);

    // Convert RGB (0-1 floats) to CSS hex string
    function s = rgb2hex(r, g, b)
        hex_chars = '0123456789ABCDEF';
        function h = byte2hex(v)
            v = round(v * 255);
            if v < 0 then v = 0; end
            if v > 255 then v = 255; end
            h = hex_chars(floor(v/16)+1) + hex_chars(modulo(v,16)+1);
        endfunction
        s = '#' + byte2hex(r) + byte2hex(g) + byte2hex(b);
    endfunction

    bg_hex      = rgb2hex(bg_col(1), bg_col(2), bg_col(3));
    wqi_rounded = round(wqi * 10) / 10;
    p_names     = G_PNAMES;
    p_units     = G_UNITS;

    if std == 'IS10500' then
        limits    = G_IS10500;
        std_label = 'IS 10500:2012  (India)';
    else
        limits    = G_WHO;
        std_label = 'WHO 2017  (Global)';
    end

    // Timestamp
    t_vec = getdate();
    ts = string(t_vec(3)) + '/' + string(t_vec(2)) + '/' + string(t_vec(1)) + ..
         '  ' + string(t_vec(7)) + ':' + msprintf('%02d', t_vec(8));

    // WQI progress bar HTML
    pct = min(wqi_rounded / 150 * 100, 100);
    progress_bar = '<div style="background:#ddd;border-radius:6px;height:24px;width:100%">' + ..
        '<div style="background:' + bg_hex + ';width:' + string(pct) + '%' + ..
        ';height:24px;border-radius:6px;text-align:center;color:white;font-weight:bold;line-height:24px">' + ..
        string(wqi_rounded) + ' / 100</div></div>';

    // Build parameter rows HTML
    rows_html = '';
    for i = 1:8
        score = round(qi(i) * 10) / 10;
        if i == 1 then
            lim_str = '6.5 - 8.5';
        elseif i == 8 then
            lim_str = 'Absent (0)';
        else
            lim_str = '< ' + string(limits(i));
        end

        if passed(i) == 1 then
            status_cell = '<td style="background:#d4edda;color:#155724;font-weight:bold;text-align:center">PASS</td>';
        else
            status_cell = '<td style="background:#f8d7da;color:#721c24;font-weight:bold;text-align:center">FAIL</td>';
        end

        if score <= 25 then bar_col = '#28a745';
        elseif score <= 50 then bar_col = '#5cb85c';
        elseif score <= 75 then bar_col = '#ffc107';
        elseif score <= 100 then bar_col = '#fd7e14';
        else bar_col = '#dc3545'; end

        s_pct = min(score / 150 * 100, 100);
        bar_html = '<div style="background:#eee;border-radius:4px;height:14px">' + ..
            '<div style="background:' + bar_col + ';width:' + string(s_pct) + '%' + ..
            ';height:14px;border-radius:4px"></div></div>';

        rows_html = rows_html + '<tr>' + ..
            '<td style="font-weight:bold">' + p_names(i) + '</td>' + ..
            '<td style="text-align:center">' + string(values(i)) + '</td>' + ..
            '<td style="text-align:center">' + p_units(i) + '</td>' + ..
            '<td style="text-align:center">' + lim_str + '</td>' + ..
            '<td>' + bar_html + ' <small>' + string(score) + '</small></td>' + ..
            status_cell + ..
            '</tr>';
    end

    // CSS styles
    css = '<style>' + ..
        'body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background:#f0f4f8;color:#1a1a2e}' + ..
        '.header{background:linear-gradient(135deg,#0d2e6e,#1a6bbf);color:white;padding:30px 40px}' + ..
        '.header h1{margin:0;font-size:26px}' + ..
        '.header p{margin:6px 0 0;opacity:.8;font-size:13px}' + ..
        '.card{background:white;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.1);margin:20px 40px;padding:24px}' + ..
        '.score-box{border-radius:10px;padding:16px 24px;text-align:center;color:white;margin-bottom:16px}' + ..
        '.score-box h2{margin:0;font-size:32px}' + ..
        '.score-box p{margin:4px 0 0;font-size:16px}' + ..
        'table{width:100%;border-collapse:collapse;font-size:14px}' + ..
        'th{background:#0d2e6e;color:white;padding:10px 12px;text-align:left}' + ..
        'td{padding:9px 12px;border-bottom:1px solid #e8ecf0}' + ..
        '.rec{background:#e8f4fd;border-left:4px solid #1a6bbf;padding:12px 16px;border-radius:4px;font-size:14px}' + ..
        '.footer{text-align:center;padding:20px;font-size:12px;color:#888}' + ..
        '</style>';

    // Assemble full HTML
    html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' + ..
        '<title>AquaSafe WQI Report</title>' + css + '</head><body>' + ..
        '<div class="header">' + ..
        '<h1>AquaSafe | Water Quality Index Report</h1>' + ..
        '<p>Generated: ' + ts + '  |  Standard: ' + std_label + '  |  Method: Brown et al. 1972 Weighted Arithmetic WQI</p>' + ..
        '</div>' + ..
        '<div class="card">' + ..
        '<div class="score-box" style="background:' + bg_hex + '">' + ..
        '<h2>WQI Score: ' + string(wqi_rounded) + ' / 100</h2>' + ..
        '<p>' + label + '</p>' + ..
        '</div>' + ..
        progress_bar + ..
        '<br><div class="rec">Recommendation: ' + rec_text + '</div>' + ..
        '</div>' + ..
        '<div class="card">' + ..
        '<h3 style="margin-top:0;color:#0d2e6e">Parameter-wise Analysis</h3>' + ..
        '<table><thead><tr>' + ..
        '<th>Parameter</th><th>Measured Value</th><th>Unit</th><th>Safe Limit</th><th>Quality Score</th><th>Status</th>' + ..
        '</tr></thead><tbody>' + ..
        rows_html + ..
        '</tbody></table></div>' + ..
        '<div class="card" style="font-size:13px;color:#555">' + ..
        '<strong>How to read:</strong> WQI 0-25 = Excellent, 25-50 = Good, 50-75 = Poor, ' + ..
        '75-100 = Very Poor, above 100 = Unsafe. A quality score of 100 means the parameter is exactly at its safe limit.' + ..
        '</div>' + ..
        '<div class="footer">Generated by AquaSafe v1.0 | FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay<br>' + ..
        'References: IS 10500:2012 | WHO 2017 Drinking Water Guidelines | Brown et al. (1972)</div>' + ..
        '</body></html>';

    // Save HTML file
    report_file = pwd() + '\AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    disp('AquaSafe: Report saved to ' + report_file);
    disp('AquaSafe: TIP -> In browser press Ctrl+P, then choose Save as PDF.');

    // Open in default Windows browser
    unix_w('start "" "' + report_file + '"');

endfunction
"""

with open(filepath, 'a', encoding='utf-8') as f:
    f.write(export_fn)

print("export_report() appended successfully.")
