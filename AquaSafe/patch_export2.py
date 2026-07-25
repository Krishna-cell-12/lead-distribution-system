import re

filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'

# Read current file
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old export_report function entirely and replace with clean version
# Find where it starts
start_marker = '\n// ----------------------------------------------------------------\n//  EXPORT HTML REPORT'
start_idx = content.find(start_marker)
if start_idx == -1:
    print("ERROR: Could not find export_report start marker!")
else:
    content = content[:start_idx]  # Strip old export section
    print(f"Stripped old export_report (was at char {start_idx})")

# New clean export_report with NO double quotes inside Scilab strings.
# HTML attributes use single quotes ('attr') which is valid HTML5.
export_fn = """

// ----------------------------------------------------------------
//  EXPORT HTML REPORT  (opens in browser; user presses Ctrl+P to Save as PDF)
// ----------------------------------------------------------------

function export_report()
// Generate a styled HTML report of the last WQI calculation.
// Opens in the default browser. Press Ctrl+P -> Save as PDF.

    global G_PNAMES G_UNITS G_IS10500 G_WHO G_LAST_RESULT;

    if ~G_LAST_RESULT.calculated then
        messagebox('Please click CALCULATE WQI first, then export.', 'AquaSafe', 'info');
        return;
    end

    wqi    = G_LAST_RESULT.wqi;
    qi     = G_LAST_RESULT.qi;
    passed = G_LAST_RESULT.passed;
    values = G_LAST_RESULT.values;
    std    = G_LAST_RESULT.std;

    [label, bg_col, rec_text] = classify_wqi(wqi);

    // RGB (0..1) to CSS hex
    function s = rgb2hex(r, g, b)
        hc = '0123456789ABCDEF';
        function h = b2h(v)
            v = round(v * 255);
            if v < 0 then v = 0; end
            if v > 255 then v = 255; end
            h = hc(floor(v/16)+1) + hc(modulo(v,16)+1);
        endfunction
        s = '#' + b2h(r) + b2h(g) + b2h(b);
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

    // CSS  -- Note: all attribute quotes use single quotes (valid HTML5)
    // to avoid Scilab heterogeneous string errors with double quotes.
    css = '<style>' + ..
        'body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background:#f0f4f8;color:#1a1a2e}' + ..
        '.hdr{background:linear-gradient(135deg,#0d2e6e,#1a6bbf);color:white;padding:30px 40px}' + ..
        '.hdr h1{margin:0;font-size:24px;letter-spacing:1px}' + ..
        '.hdr p{margin:6px 0 0;opacity:.8;font-size:12px}' + ..
        '.card{background:white;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);margin:20px 40px;padding:22px}' + ..
        '.sbox{border-radius:10px;padding:16px 24px;text-align:center;color:white;margin-bottom:14px}' + ..
        '.sbox h2{margin:0;font-size:30px}' + ..
        '.sbox p{margin:4px 0 0;font-size:15px}' + ..
        '.pbar-wrap{background:#ddd;border-radius:6px;height:22px;width:100%;margin-bottom:12px}' + ..
        '.pbar-fill{height:22px;border-radius:6px;text-align:center;color:white;font-weight:bold;line-height:22px;font-size:13px}' + ..
        'table{width:100%;border-collapse:collapse;font-size:13px}' + ..
        'th{background:#0d2e6e;color:white;padding:9px 11px;text-align:left}' + ..
        'td{padding:8px 11px;border-bottom:1px solid #e8ecf0}' + ..
        'tr:hover td{background:#f5f8ff}' + ..
        '.rec{background:#e8f4fd;border-left:4px solid #1a6bbf;padding:11px 15px;border-radius:4px;font-size:13px}' + ..
        '.pass{background:#d4edda;color:#155724;font-weight:bold;text-align:center}' + ..
        '.fail{background:#f8d7da;color:#721c24;font-weight:bold;text-align:center}' + ..
        '.bar-w{background:#eee;border-radius:4px;height:13px}' + ..
        '.bar-f{height:13px;border-radius:4px}' + ..
        '.ftr{text-align:center;padding:18px;font-size:11px;color:#999}' + ..
        '</style>';

    // WQI progress bar  (pct capped at 100%)
    pct    = string(min(round(wqi_rounded / 150 * 100), 100));
    pbar   = '<div class=''pbar-wrap''><div class=''pbar-fill'' style=''background:' + bg_hex + ..
             ';width:' + pct + '%''>' + string(wqi_rounded) + ' / 100</div></div>';

    // Parameter table rows
    rows = '';
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
            scell = '<td class=''pass''>PASS</td>';
        else
            scell = '<td class=''fail''>FAIL</td>';
        end

        if score <= 25 then bc = '#28a745';
        elseif score <= 50 then bc = '#5cb85c';
        elseif score <= 75 then bc = '#ffc107';
        elseif score <= 100 then bc = '#fd7e14';
        else bc = '#dc3545'; end

        spct = string(min(round(score / 150 * 100), 100));
        bar  = '<div class=''bar-w''><div class=''bar-f'' style=''background:' + bc + ..
               ';width:' + spct + '%''></div></div><small>' + string(score) + '</small>';

        rows = rows + '<tr>' + ..
            '<td><b>' + p_names(i) + '</b></td>' + ..
            '<td style=''text-align:center''>' + string(values(i)) + '</td>' + ..
            '<td style=''text-align:center''>' + p_units(i) + '</td>' + ..
            '<td style=''text-align:center''>' + lim_str + '</td>' + ..
            '<td>' + bar + '</td>' + scell + '</tr>';
    end

    // Assemble full HTML document
    html = '<!DOCTYPE html><html lang=''en''><head><meta charset=''UTF-8''>' + ..
        '<title>AquaSafe WQI Report</title>' + css + '</head><body>' + ..
        '<div class=''hdr''>' + ..
        '<h1>AquaSafe | Water Quality Index Report</h1>' + ..
        '<p>Generated: ' + ts + ' | Standard: ' + std_label + ..
        ' | Method: Brown et al. 1972 Weighted Arithmetic WQI</p></div>' + ..
        '<div class=''card''>' + ..
        '<div class=''sbox'' style=''background:' + bg_hex + '''>' + ..
        '<h2>WQI Score: ' + string(wqi_rounded) + ' / 100</h2>' + ..
        '<p>' + label + '</p></div>' + ..
        pbar + ..
        '<div class=''rec''>Recommendation: ' + rec_text + '</div></div>' + ..
        '<div class=''card''>' + ..
        '<h3 style=''margin-top:0;color:#0d2e6e''>Parameter-wise Analysis</h3>' + ..
        '<table><thead><tr>' + ..
        '<th>Parameter</th><th>Measured</th><th>Unit</th>' + ..
        '<th>Safe Limit</th><th>Quality Score</th><th>Status</th>' + ..
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' + ..
        '<div class=''card'' style=''font-size:12px;color:#666''>' + ..
        '<b>How to read:</b> WQI 0-25=Excellent | 25-50=Good | 50-75=Poor | ' + ..
        '75-100=Very Poor | above 100=Unsafe. ' + ..
        'Score of 100 means the parameter is exactly at its safe limit. ' + ..
        'Failing parameters (score above 100) are marked FAIL.</div>' + ..
        '<div class=''ftr''>Generated by AquaSafe v1.0 | FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay<br>' + ..
        'References: IS 10500:2012 | WHO 2017 Drinking Water Guidelines | Brown et al. (1972)<br>' + ..
        '<b>To save as PDF: Press Ctrl+P in your browser and choose Save as PDF.</b></div>' + ..
        '</body></html>';

    // Save HTML file to the AquaSafe project folder
    report_file = get_absolute_file_path('aquasafe_engine.sci') + 'AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    disp('AquaSafe Report saved to: ' + report_file);
    disp('TIP: Press Ctrl+P in browser, then Save as PDF.');

    // Open in default Windows browser
    unix_w('start "" "' + report_file + '"');

endfunction
"""

with open(filepath, 'a', encoding='utf-8') as f:
    f.write(export_fn)

print(f"Done! Clean export_report() written. File now {len(content)} chars.")
