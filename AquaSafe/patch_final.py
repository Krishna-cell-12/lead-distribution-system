filepath = r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci'

# ── Read current file ──────────────────────────────────────────────────────────
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Change global declaration line ─────────────────────────────────────────
# Old (struct-based):
content = content.replace(
    'global G_PNAMES G_UNITS G_DEFAULTS G_IS10500 G_WHO G_WEIGHTS G_LAST_RESULT;',
    'global G_PNAMES G_UNITS G_DEFAULTS G_IS10500 G_WHO G_WEIGHTS G_CALC_DONE G_WQI_V G_QI_V G_PASSED_V G_VALUES_V G_STD_V;'
)

# ── 2. Replace struct initialization ──────────────────────────────────────────
content = content.replace(
    '// Storage for last result (used by export_report)\nG_LAST_RESULT = struct();\nG_LAST_RESULT.calculated = %F;',
    '// Scalars/vectors storing last result (used by export_report)\nG_CALC_DONE = 0;\nG_WQI_V = 0;\nG_QI_V = zeros(8,1);\nG_PASSED_V = zeros(8,1);\nG_VALUES_V = zeros(8,1);\nG_STD_V = \'\';'
)

# ── 3. Change global line inside calculate_wqi ────────────────────────────────
content = content.replace(
    '    global G_PNAMES G_WEIGHTS G_LAST_RESULT;',
    '    global G_PNAMES G_WEIGHTS G_CALC_DONE G_WQI_V G_QI_V G_PASSED_V G_VALUES_V G_STD_V;'
)

# ── 4. Replace store-to-struct block after compute_wqi ───────────────────────
content = content.replace(
    '    // Store results globally for export\n    G_LAST_RESULT.wqi        = wqi;\n    G_LAST_RESULT.qi         = qi;\n    G_LAST_RESULT.passed     = passed;\n    G_LAST_RESULT.values     = values;\n    G_LAST_RESULT.std        = std;\n    G_LAST_RESULT.calculated = %T;',
    '    // Store results globally for export (simple scalars avoid Scilab struct globals bug)\n    G_CALC_DONE = 1;\n    G_WQI_V    = wqi;\n    G_QI_V     = qi;\n    G_PASSED_V = passed;\n    G_VALUES_V = values;\n    G_STD_V    = std;'
)

print("Main engine patches applied.")

# ── 5. Strip old export_report and append clean version ───────────────────────
marker = '\n// ----------------------------------------------------------------\n//  EXPORT HTML REPORT'
start_idx = content.find(marker)
if start_idx != -1:
    content = content[:start_idx]
    print(f"Stripped old export_report at char {start_idx}.")
else:
    print("NOTE: No old export section found, appending fresh.")

# New clean export_report:
# - Uses simple global scalars (no struct)
# - Saves to tempdir() to avoid path-with-spaces issue
# - Opens browser via a small batch file (no double-quote issue)
# - ALL HTML attributes use single quotes (valid HTML5, no Scilab heterogeneous string errors)
export_fn = """

// ----------------------------------------------------------------
//  EXPORT HTML REPORT
//  Saves styled HTML to temp folder, opens in browser.
//  Press Ctrl+P -> Save as PDF in the browser.
// ----------------------------------------------------------------

function export_report()
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

    // RGB (0..1 floats) -> CSS hex
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

    // ---- CSS (no double-quote chars - all attrs use single quotes, valid HTML5) ----
    css = '<style>' + ..
        'body{font-family:Segoe UI,Arial,sans-serif;margin:0;padding:0;background:#f0f4f8}' + ..
        '.hdr{background:linear-gradient(135deg,#0d2e6e,#1a6bbf);color:white;padding:28px 36px}' + ..
        '.hdr h1{margin:0;font-size:22px}' + ..
        '.hdr p{margin:5px 0 0;opacity:.8;font-size:11px}' + ..
        '.card{background:white;border-radius:10px;margin:16px 36px;padding:20px;' + ..
        'box-shadow:0 2px 10px rgba(0,0,0,.08)}' + ..
        '.sbox{border-radius:10px;padding:14px 20px;text-align:center;color:white;margin-bottom:10px}' + ..
        '.sbox h2{margin:0;font-size:26px}' + ..
        '.sbox p{margin:4px 0 0;font-size:13px}' + ..
        '.pw{background:#ddd;border-radius:5px;height:20px;width:100%;margin-bottom:10px}' + ..
        '.pf{height:20px;border-radius:5px;text-align:center;color:white;font-weight:bold;' + ..
        'line-height:20px;font-size:12px}' + ..
        '.rec{background:#e8f4fd;border-left:4px solid #1a6bbf;padding:10px 14px;' + ..
        'border-radius:4px;font-size:13px;color:#0d2e6e;margin-top:10px}' + ..
        'table{width:100%;border-collapse:collapse;font-size:13px}' + ..
        'th{background:#0d2e6e;color:white;padding:9px 11px;text-align:left}' + ..
        'td{padding:8px 11px;border-bottom:1px solid #e8ecf0;color:#333}' + ..
        'tr:hover td{background:#f5f8ff}' + ..
        '.pass{background:#d4edda;color:#155724;font-weight:bold;text-align:center}' + ..
        '.fail{background:#f8d7da;color:#721c24;font-weight:bold;text-align:center}' + ..
        '.bw{background:#eee;border-radius:4px;height:12px;display:inline-block;width:120px;vertical-align:middle}' + ..
        '.bf{height:12px;border-radius:4px}' + ..
        '.ftr{text-align:center;padding:16px;font-size:11px;color:#999}' + ..
        '</style>';

    // ---- WQI progress bar ----
    pct  = string(min(round(wqi_rounded / 150 * 100), 100));
    pbar = '<div class=''pw''><div class=''pf'' style=''background:' + bg_hex + ..
           ';width:' + pct + '%''>' + string(wqi_rounded) + ' / 100</div></div>';

    // ---- Parameter table rows ----
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
        bar  = '<div class=''bw''><div class=''bf'' style=''background:' + bc + ..
               ';width:' + spct + '%''></div></div> ' + string(sc);

        rows = rows + '<tr>' + ..
            '<td><b>' + p_names(i) + '</b></td>' + ..
            '<td style=''text-align:center''>' + string(values(i)) + '</td>' + ..
            '<td style=''text-align:center''>' + p_units(i) + '</td>' + ..
            '<td style=''text-align:center''>' + lstr + '</td>' + ..
            '<td>' + bar + '</td>' + stcell + '</tr>';
    end

    // ---- Full HTML document ----
    html = '<!DOCTYPE html><html lang=''en''><head><meta charset=''UTF-8''>' + ..
        '<title>AquaSafe WQI Report</title>' + css + '</head><body>' + ..
        '<div class=''hdr''>' + ..
        '<h1>AquaSafe - Water Quality Index Report</h1>' + ..
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
        '75-100=Very Poor | above 100=Unsafe. Score 100 = parameter exactly at safe limit.' + ..
        '</div>' + ..
        '<div class=''ftr''>AquaSafe v1.0 | FOSSEE Scilab GUIVerse Hackathon 2026 | IIT Bombay<br>' + ..
        'IS 10500:2012 | WHO 2017 Drinking Water Guidelines | Brown et al. (1972)<br>' + ..
        '<b>Press Ctrl+P then Save as PDF to download this report.</b>' + ..
        '</div></body></html>';

    // ---- Save HTML to temp folder (avoids path-with-spaces issue) ----
    report_file = tempdir() + 'AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    // ---- Write a tiny batch file to open the HTML (no quoting issues) ----
    bat_file = tempdir() + 'open_aquasafe_report.bat';
    fid2 = mopen(bat_file, 'wt');
    mfprintf(fid2, '@echo off\r\nstart /B "" "%s"\r\n', report_file);
    mclose(fid2);

    shell('cmd /c ' + bat_file);

    disp('=== AquaSafe Report Exported! ===');
    disp('Saved to: ' + report_file);
    disp('If browser did not open automatically, open the file manually:');
    disp(report_file);
    disp('Then press Ctrl+P -> Save as PDF.');

    messagebox('Report saved! Browser opening...' + ascii(10) + ..
               'File: ' + report_file + ascii(10) + ..
               'Press Ctrl+P in the browser to Save as PDF.', ..
               'AquaSafe - Export Done', 'info');
endfunction
"""

with open(filepath, 'a', encoding='utf-8') as f:
    f.write(export_fn)

print("Done! Final clean export_report() written.")

# Quick verification - no double-quotes in export section
with open(filepath, 'r', encoding='utf-8') as f:
    all_lines = f.readlines()

exp_start_line = None
for i, l in enumerate(all_lines):
    if 'function export_report' in l:
        exp_start_line = i
        break

if exp_start_line:
    dq_lines = [(i+1, l.rstrip()) for i, l in enumerate(all_lines[exp_start_line:], exp_start_line) if '"' in l]
    print(f"Lines with double-quotes in export_report: {len(dq_lines)}")
    for ln, txt in dq_lines:
        print(f"  Line {ln}: {txt}")
    if not dq_lines:
        print("PERFECT: Zero double-quotes found in export_report. Scilab will parse without errors.")
