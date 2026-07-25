filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the FIRST occurrence of the export section marker
marker = '\n// ----------------------------------------------------------------\n//  EXPORT HTML REPORT'
first_idx = content.find(marker)
if first_idx == -1:
    print("ERROR: Could not find export section!")
else:
    # Keep only everything before the first export block
    clean_content = content[:first_idx]
    print(f"Stripped from char {first_idx}. Remaining: {len(clean_content)} chars")

# Now append the CLEAN version (no double-quotes inside Scilab single-quoted strings)
export_fn = """

// ----------------------------------------------------------------
//  EXPORT HTML REPORT
//  Opens styled HTML report in browser. Press Ctrl+P -> Save as PDF.
//  NOTE: All HTML attribute quotes use single quotes (valid HTML5)
//  to avoid Scilab "Heterogeneous string" parser errors.
// ----------------------------------------------------------------

function export_report()
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

    // RGB (0..1 floats) to CSS hex color string
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
        std_label = 'IS 10500:2012 (India)';
    else
        limits    = G_WHO;
        std_label = 'WHO 2017 (Global)';
    end

    // Timestamp
    t_vec = getdate();
    ts = string(t_vec(3)) + '/' + string(t_vec(2)) + '/' + string(t_vec(1)) + ..
         '  ' + string(t_vec(7)) + ':' + msprintf('%02d', t_vec(8));

    // ----- CSS block (all using single-quote HTML attributes) -----
    css = '<style>' + ..
        'body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background:#f0f4f8}' + ..
        '.hdr{background:linear-gradient(135deg,#0d2e6e,#1a6bbf);color:white;padding:28px 38px}' + ..
        '.hdr h1{margin:0;font-size:23px;letter-spacing:1px}' + ..
        '.hdr p{margin:5px 0 0;opacity:.8;font-size:12px}' + ..
        '.card{background:white;border-radius:10px;margin:18px 38px;padding:20px;' + ..
        'box-shadow:0 2px 10px rgba(0,0,0,.08)}' + ..
        '.sbox{border-radius:10px;padding:14px 22px;text-align:center;color:white;margin-bottom:12px}' + ..
        '.sbox h2{margin:0;font-size:28px}' + ..
        '.sbox p{margin:4px 0 0;font-size:14px}' + ..
        '.pw{background:#ddd;border-radius:5px;height:20px;width:100%;margin-bottom:10px}' + ..
        '.pf{height:20px;border-radius:5px;text-align:center;color:white;font-weight:bold;' + ..
        'line-height:20px;font-size:12px}' + ..
        '.rec{background:#e8f4fd;border-left:4px solid #1a6bbf;padding:10px 14px;' + ..
        'border-radius:4px;font-size:13px;color:#0d2e6e}' + ..
        'table{width:100%;border-collapse:collapse;font-size:13px}' + ..
        'th{background:#0d2e6e;color:white;padding:9px 11px;text-align:left}' + ..
        'td{padding:8px 11px;border-bottom:1px solid #e8ecf0;color:#333}' + ..
        'tr:hover td{background:#f5f8ff}' + ..
        '.pass{background:#d4edda;color:#155724;font-weight:bold;text-align:center}' + ..
        '.fail{background:#f8d7da;color:#721c24;font-weight:bold;text-align:center}' + ..
        '.bw{background:#eee;border-radius:4px;height:12px}' + ..
        '.bf{height:12px;border-radius:4px}' + ..
        '.ftr{text-align:center;padding:16px;font-size:11px;color:#999}' + ..
        '</style>';

    // ----- WQI progress bar -----
    pct  = string(min(round(wqi_rounded / 150 * 100), 100));
    pbar = '<div class=''pw''><div class=''pf'' style=''background:' + bg_hex + ..
           ';width:' + pct + '%''>' + string(wqi_rounded) + ' / 100</div></div>';

    // ----- Parameter rows -----
    rows = '';
    for i = 1:8
        sc = round(qi(i) * 10) / 10;
        if i == 1 then lstr = '6.5 - 8.5';
        elseif i == 8 then lstr = 'Absent (0)';
        else lstr = '< ' + string(limits(i));
        end

        if passed(i) == 1 then
            stcell = '<td class=''pass''>PASS</td>';
        else
            stcell = '<td class=''fail''>FAIL</td>';
        end

        if sc <= 25 then bc = '#28a745';
        elseif sc <= 50 then bc = '#5cb85c';
        elseif sc <= 75 then bc = '#ffc107';
        elseif sc <= 100 then bc = '#fd7e14';
        else bc = '#dc3545'; end

        spct = string(min(round(sc / 150 * 100), 100));
        bar  = '<div class=''bw''><div class=''bf'' style=''background:' + bc + ..
               ';width:' + spct + '%''></div></div> ' + string(sc);

        rows = rows + '<tr>' + ..
            '<td><b>' + p_names(i) + '</b></td>' + ..
            '<td style=''text-align:center''>' + string(values(i)) + '</td>' + ..
            '<td style=''text-align:center''>' + p_units(i) + '</td>' + ..
            '<td style=''text-align:center''>' + lstr + '</td>' + ..
            '<td>' + bar + '</td>' + stcell + '</tr>';
    end

    // ----- Full HTML document -----
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
        '<b>How to read:</b> WQI 0-25 = Excellent, 25-50 = Good, 50-75 = Poor, ' + ..
        '75-100 = Very Poor, above 100 = Unsafe. Score 100 = exactly at safe limit.' + ..
        '</div>' + ..
        '<div class=''ftr''>AquaSafe v1.0 | FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay<br>' + ..
        'IS 10500:2012 | WHO 2017 Drinking Water Guidelines | Brown et al. (1972)<br>' + ..
        '<b>Press Ctrl+P in browser then choose Save as PDF</b></div>' + ..
        '</body></html>';

    // Save to project folder
    report_file = get_absolute_file_path('aquasafe_engine.sci') + 'AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    disp('=== AquaSafe: Report saved! ===');
    disp('File: ' + report_file);
    disp('TIP: Press Ctrl+P in browser then Save as PDF.');

    // Open in default Windows browser
    unix_w('start "" "' + report_file + '"');

endfunction
"""

final_content = clean_content + export_fn

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(final_content)

print("Done! File rewritten cleanly.")
total_lines = final_content.count('\n')
print(f"Total lines: {total_lines}")

# Quick check: count double-quote occurrences in export section
exp_start = final_content.find('\nfunction export_report()')
exp_section = final_content[exp_start:]
dq_count = exp_section.count('"')
print(f"Double-quote chars in export_report section: {dq_count}")
print("(Should be 0 for clean Scilab parsing)")
