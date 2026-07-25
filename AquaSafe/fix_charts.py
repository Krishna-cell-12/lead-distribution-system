import re

with open(r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace draw_radar_chart
new_radar = """function draw_radar_chart(qi, passed, show_lim)
// Draw an 8-axis parametric radar/spider chart inside axes_radar.

    N = 8;
    h_ax = findobj('tag', 'axes_radar');
    if isempty(h_ax) then return; end
    sca(h_ax(1));   
    a = gca();
    if ~isempty(a.children) then delete(a.children); end

    r_vals = min(qi / 100, 1.5);
    angs = linspace(%pi/2, %pi/2 - 2*%pi, N + 1);
    angs = angs(1:N);
    t_c = linspace(0, 2*%pi, 200);

    // Inner grid (half safe limit)
    xg1 = 0.5 * cos(t_c); yg1 = 0.5 * sin(t_c);
    xpoly(xg1, yg1);
    try
        e1 = gce(); e1.foreground = color('gray'); e1.line_style = 3; e1.thickness = 1;
    catch; end

    // Outer grid (safe limit)
    if show_lim == 1 then
        xg2 = cos(t_c); yg2 = sin(t_c);
        xpoly(xg2, yg2);
        try
            e2 = gce(); e2.foreground = color('red'); e2.line_style = 2; e2.thickness = 1;
        catch; end
    end

    // Axis spokes
    for i = 1:N
        xpoly([0, cos(angs(i))], [0, sin(angs(i))]);
        try
            es = gce(); es.foreground = color('lightgray');
        catch; end
    end

    // Data polygon
    xd = zeros(1, N + 1); yd = zeros(1, N + 1);
    for i = 1:N
        xd(i) = r_vals(i) * cos(angs(i)); yd(i) = r_vals(i) * sin(angs(i));
    end
    xd(N + 1) = xd(1); yd(N + 1) = yd(1);

    xfpoly(xd(1:N), yd(1:N));
    try
        hf = gce(); hf.fill_mode = 'on'; hf.background = color(120, 168, 228); hf.foreground = color(25, 85, 195);
    catch; end

    xpoly(xd, yd);
    try
        ep = gce(); ep.foreground = color(25, 85, 195); ep.thickness = 2;
    catch; end

    // Data points (circles)
    for i = 1:N
        xarc(xd(i)-0.05, yd(i)+0.05, 0.1, 0.1, 0, 360*64);
        try
            ea = gce(); ea.background = color(180, 210, 245); ea.fill_mode = 'on'; ea.foreground = color(15, 60, 175);
        catch; end
    end

    // Labels
    short_labels = ['pH'; 'TDS'; 'Turb.'; 'BOD'; 'NO3'; 'Fluor.'; 'Hard.'; 'Coliform'];
    for i = 1:N
        xl = 1.25 * cos(angs(i)) - 0.15;
        yl = 1.25 * sin(angs(i)) - 0.05;
        xstring(xl, yl, short_labels(i));
        try
            et = gce(); et.font_size = 1;
            if passed(i) == 0 then et.font_foreground = color('red');
            else et.font_foreground = color('blue'); end
        catch; end
    end

    a.data_bounds = [-1.6, -1.6; 1.6, 1.6];
    a.isoview = 'on'; a.box = 'off';
    try; a.axes_visible = ['off', 'off', 'off']; catch; end
    xtitle('Quality Radar Chart');
    try; a.title.font_size = 2; a.title.foreground = color(25, 60, 145); catch; end
    drawnow();
endfunction"""

new_bar = """function draw_bar_chart(qi, passed)
// Draw a horizontal bar chart of 8 parameter quality scores.

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
        if qi(i) <= 25 then fc = color(45,  185, 65);
        elseif qi(i) <= 50 then fc = color(115, 210, 75);
        elseif qi(i) <= 75 then fc = color(228, 188, 25);
        elseif qi(i) <= 100 then fc = color(228, 112, 22);
        else fc = color(198, 30, 30); end

        xv = [0; val; val; 0]; yv = [yi_bar - 0.35; yi_bar - 0.35; yi_bar + 0.35; yi_bar + 0.35];
        xfpoly(xv, yv);
        try; hb = gce(); hb.fill_mode = 'on'; hb.background = fc; hb.foreground = color('lightgray'); catch; end

        // Score number
        xstring(val + 2, yi_bar - 0.15, string(round(qi(i))));
        try
            ht = gce(); ht.font_size = 1;
            if passed(i) == 0 then ht.font_foreground = color('red'); else ht.font_foreground = color('darkgreen'); end
        catch; end

        // Y-axis Parameter label
        xstring(-35, yi_bar - 0.15, short_names(i));
        try
            hn = gce(); hn.font_size = 1;
            if passed(i) == 0 then hn.font_foreground = color('red'); else hn.font_foreground = color('darkblue'); end
        catch; end
    end

    // Limit line
    xpoly([100, 100], [0.45, 8.55]);
    try; el = gce(); el.foreground = color('red'); el.line_style = 2; el.thickness = 2; catch; end

    xstring(101, 8.55, 'LIMIT');
    try; etl = gce(); etl.font_size = 1; etl.font_foreground = color('red'); catch; end

    a.data_bounds = [-40, 0.3; 165, 8.75];
    a.box = 'off'; a.tight_limits = ['on', 'on'];
    try
        a.axes_visible = ['on', 'off', 'off'];
        a.y_ticks = tlist(['ticks', 'locations', 'labels'], [], []);
        a.x_ticks.locations = [0, 25, 50, 75, 100, 125, 150];
        a.x_ticks.labels = ['0'; '25'; '50'; '75'; '100'; '125'; '150'];
    catch; end
    xtitle('Parameter Quality Scores', 'Score  (100 = at safe limit)', '');
    try; a.title.font_size = 2; a.title.foreground = color(25, 60, 145); a.x_label.font_size = 1; catch; end
    drawnow();
endfunction"""

# regex replace
content = re.sub(r'function draw_radar_chart\(.*?\nendfunction', new_radar, content, flags=re.DOTALL)
content = re.sub(r'function draw_bar_chart\(.*?\nendfunction', new_bar, content, flags=re.DOTALL)

# Also fix calculate_wqi to use h(1) just in case there are multiple windows
content = content.replace("h_edit  = findobj('tag', 'edit_' + p_names(i));\n        str_val = get(h_edit, 'string');", 
                          "h_edit  = findobj('tag', 'edit_' + p_names(i));\n        if isempty(h_edit) then continue; end\n        str_val = get(h_edit(1), 'string');")

content = content.replace("rb_is = findobj('tag', 'rb_is10500');\n    if get(rb_is, 'value') == 1 then",
                          "rb_is = findobj('tag', 'rb_is10500');\n    if ~isempty(rb_is) & get(rb_is(1), 'value') == 1 then")

content = content.replace("h_box = findobj('tag', 'status_' + p_names(i));\n        score",
                          "h_box = findobj('tag', 'status_' + p_names(i));\n        if isempty(h_box) then continue; end\n        h_box = h_box(1);\n        score")

content = content.replace("show_lim = get(findobj('tag', 'chk_limits'), 'value');",
                          "h_chk = findobj('tag', 'chk_limits');\n    if ~isempty(h_chk) then show_lim = get(h_chk(1), 'value'); else show_lim = 1; end")

with open(r'E:\My projects\Task\AquaSafe\aquasafe_engine.sci', 'w', encoding='utf-8') as f:
    f.write(content)

print("Charts updated.")
