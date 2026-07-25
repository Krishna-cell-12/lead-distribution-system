// ----------------------------------------------------------------
//  EXPORT HTML REPORT
//  Saves to temp folder and opens in browser.
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

    t_vec = getdate();
    ts = string(t_vec(3)) + '/' + string(t_vec(2)) + '/' + string(t_vec(1)) + ..
         ' ' + string(t_vec(7)) + ':' + msprintf('%02d', t_vec(8));

    // CSS - single quotes for HTML attributes (valid HTML5, avoids Scilab parser errors)
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

    // Dynamic inline style for score box color (using separate variable to avoid triple-quote)
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

    report_file = tempdir() + 'AquaSafe_WQI_Report.html';
    fid = mopen(report_file, 'wt');
    mfprintf(fid, '%s', html);
    mclose(fid);

    // Open browser via batch file (ascii(34) avoids double-quote in Scilab strings)
    q   = ascii(34);
    bat = tempdir() + 'open_aquasafe.bat';
    fb  = mopen(bat, 'wt');
    mfprintf(fb, '@echo off\r\nstart /B %s%s %s%s%s\r\n', q, q, q, report_file, q);
    mclose(fb);
    shell(bat);

    disp('Report saved to: ' + report_file);
    messagebox('Report saved and browser opening!' + ascii(10) + ..
               report_file + ascii(10) + ..
               'Press Ctrl+P -> Save as PDF', 'AquaSafe Export', 'info');
endfunction
