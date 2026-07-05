// js/custom_plots.js - Refactored for multi-select and improved consistency

function initCustomPlots(appData) {
    const { clinical, mutation, surfaceAntigen, amlFusion, rnaSeq, dssMono, dssCombo, proteomics } = appData;

    if (!clinical) {
        console.error("Custom Plots Error: Clinical data is missing.");
        return;
    }

    const xFileSelect = d3.select("#x-axis-file-select");
    const xColumnContainer = d3.select("#x-axis-column-select-container");
    const yFileSelect = d3.select("#y-axis-file-select");
    const yColumnContainer = d3.select("#y-axis-column-select-container");
    const resetButton = d3.select("#custom-plot-reset");

    const colorFileSelect = d3.select("#color-file-select");
    const colorColumnContainer = d3.select("#color-column-select-container");
    const hasColorControls = !colorFileSelect.empty() && !colorColumnContainer.empty();

    // --- DATA PRE-PROCESSING ---
    const transposeData = (data, geneColumn = 'Gene') => {
        const transposed = [];
        if (data && data.length > 0) {
            // const idColumn = geneColumn;
            const sampleCols = data.columns.filter(c => c.toLowerCase() !== 'gene' && c.toLowerCase() !== 'geneid');
            
            sampleCols.forEach(sampleId => {
                const row = { Sample_ID: sampleId };
                data.forEach(d => {
                    if (d[geneColumn]) row[d[geneColumn]] = d[sampleId];
                });
                transposed.push(row);
            });
        }
        return transposed;
    };

    const dataMap = {
        clinical, // Keep clinical as is
        mutation, // Mutation data is already in the correct wide format
        surfaceAntigen,
        amlFusion,
        dssMono,
        dssCombo,
        proteomics: transposeData(proteomics, 'Gene'),
        rnaSeq: transposeData(rnaSeq, 'Gene')
    };

    // Plotly qualitative palette (with fallback cycling)
    const STANDARD_PALETTE = [
        '#636EFA', '#EF553B', '#00CC96', '#AB63FA', '#FFA15A',
        '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FECB52'
    ];
    const colors = d3.scaleOrdinal(STANDARD_PALETTE);
    const makeScopedKey = (fileKey, col) => `__${fileKey}__${col}`;

    let xSelectorApi = null;
    let ySelectorApi = null;
    let colorSelectorApi = null;

    const setupDropdown = (fileSelect, columnContainer, isMultiSelect, selectorKey) => {
        if (fileSelect.empty() || columnContainer.empty()) return;
        fileSelect.on("change", function() {
            const selected = d3.select(this).property("value");
            let columns = [];
            if (selected && dataMap[selected] && dataMap[selected].length > 0) {
                columns = Object.keys(dataMap[selected][0]).filter(c => c !== 'Sample_ID');
            }

            if (selectorKey === 'x' && xSelectorApi?.destroy) {
                xSelectorApi.destroy();
            }
            if (selectorKey === 'y' && ySelectorApi?.destroy) {
                ySelectorApi.destroy();
            }

            if (selectorKey === 'color' && colorSelectorApi?.destroy) {
                colorSelectorApi.destroy();
            }

            const selectorApi = window.DashboardUI?.renderSearchableSelect({
                container: columnContainer,
                options: columns,
                multiSelect: isMultiSelect,
                onChange: updatePlot
            });

            if (selectorKey === 'x') xSelectorApi = selectorApi;
            if (selectorKey === 'y') ySelectorApi = selectorApi;
            if (selectorKey === 'color') colorSelectorApi = selectorApi;
            updatePlot();
        });
    };

    setupDropdown(xFileSelect, xColumnContainer, true, 'x');
    setupDropdown(yFileSelect, yColumnContainer, true, 'y');
    if (hasColorControls) setupDropdown(colorFileSelect, colorColumnContainer, false, 'color');

    const normalizeSampleId = (id) => {
        if (!id) return null;
        const normalized = String(id).trim();
        return normalized || null;
    };

    const parseNumber = (v) => {
        if (v == null || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    const inferColumnType = (rows, key) => {
        const vals = rows.map(r => r[key]).filter(v => v != null && v !== '');
        if (!vals.length) return 'categorical';
        const numericCount = vals.filter(v => parseNumber(v) != null).length;
        return numericCount / vals.length >= 0.8 ? 'numeric' : 'categorical';
    };

    const normalizeCategoryKey = (value) => String(value ?? 'NA')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '');

    const categoryColor = (value) => {
        const key = normalizeCategoryKey(value);
        return FIXED_COLORS[key] || colors(key);
    };

    const basicStats = {
        mean: arr => arr.reduce((a, b) => a + b, 0) / arr.length,
        variance: arr => {
            const m = basicStats.mean(arr);
            return arr.length > 1 ? arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1) : 0;
        },
        normalCdfApprox: z => {
            const t = 1 / (1 + 0.2316419 * Math.abs(z));
            const d = 0.3989423 * Math.exp(-z * z / 2);
            const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
            return z > 0 ? 1 - p : p;
        },
        rank: arr => {
            const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
            const ranks = Array(arr.length);
            let idx = 0;
            while (idx < sorted.length) {
                let j = idx;
                while (j < sorted.length && sorted[j].v === sorted[idx].v) j++;
                const avgRank = (idx + 1 + j) / 2;
                for (let k = idx; k < j; k++) ranks[sorted[k].i] = avgRank;
                idx = j;
            }
            return ranks;
        },
        pearson: (x, y) => {
            if (x.length !== y.length || x.length < 3) return null;
            const mx = basicStats.mean(x);
            const my = basicStats.mean(y);
            const num = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0);
            const denx = Math.sqrt(x.reduce((s, xi) => s + (xi - mx) ** 2, 0));
            const deny = Math.sqrt(y.reduce((s, yi) => s + (yi - my) ** 2, 0));
            const den = denx * deny;
            if (!den) return null;
            return num / den;
        },
        spearman: (x, y) => {
            if (x.length !== y.length || x.length < 3) return null;
            const rx = basicStats.rank(x);
            const ry = basicStats.rank(y);
            const rho = basicStats.pearson(rx, ry);
            if (rho == null) return null;
            const n = x.length;
            const t = rho * Math.sqrt((n - 2) / (1 - rho * rho || Number.EPSILON));
            const pApprox = 2 * (1 - basicStats.normalCdfApprox(Math.abs(t)));
            return { rho, pApprox, n };
        },
        mannWhitneyU: (a, b) => {
            if (a.length < 2 || b.length < 2) return null;
            const combined = a.map(v => ({ v, g: 'a' })).concat(b.map(v => ({ v, g: 'b' })));
            const ranks = basicStats.rank(combined.map(d => d.v));
            let rankA = 0;
            ranks.forEach((r, i) => {
                if (combined[i].g === 'a') rankA += r;
            });
            const n1 = a.length;
            const n2 = b.length;
            const u1 = rankA - (n1 * (n1 + 1)) / 2;
            const mu = (n1 * n2) / 2;
            const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
            if (!sigma) return null;
            const z = (u1 - mu) / sigma;
            const pApprox = 2 * (1 - basicStats.normalCdfApprox(Math.abs(z)));
            return { u: u1, z, pApprox };
        },
        chiSquare2D: (table) => {
            const rows = table.length;
            const cols = table[0]?.length || 0;
            if (!rows || !cols) return null;
            const rSum = table.map(r => r.reduce((a, b) => a + b, 0));
            const cSum = Array.from({ length: cols }, (_, j) => table.reduce((s, r) => s + r[j], 0));
            const total = rSum.reduce((a, b) => a + b, 0);
            if (!total) return null;
            let chi2 = 0;
            for (let i = 0; i < rows; i++) {
                for (let j = 0; j < cols; j++) {
                    const expected = (rSum[i] * cSum[j]) / total;
                    if (expected > 0) chi2 += ((table[i][j] - expected) ** 2) / expected;
                }
            }
            return { chi2, dof: (rows - 1) * (cols - 1) };
        },
        chiSquarePApprox: (chi2, dof) => {
            if (!Number.isFinite(chi2) || !Number.isFinite(dof) || dof <= 0) return null;
            // Wilson-Hilferty normal approximation for chi-square survival function.
            const z = (Math.pow(chi2 / dof, 1 / 3) - (1 - 2 / (9 * dof))) / Math.sqrt(2 / (9 * dof));
            return 1 - basicStats.normalCdfApprox(z);
        }
    };

    const getAxisRange = (values, axisLabel = '') => {
        if (!values.length) return undefined;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const lowerLabel = String(axisLabel).toLowerCase();
        if (lowerLabel.includes('dss') || (min >= 0 && max <= 1)) {
            return [0, 1];
        }
        if (min === max) {
            const eps = min === 0 ? 1 : Math.abs(min) * 0.05;
            return [min - eps, max + eps];
        }
        return [min, max];
    };

    function hexToRgba(hex, alpha = 1) {
        hex = hex.replace('#', '');

        // Handle shorthand hex (#abc)
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }

        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    const updatePlot = () => {
        const selectedXFile = xFileSelect.property("value");
        const selectedYFile = yFileSelect.property("value");
        
        const selectedXCols = Array.from(xColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);
        const selectedYCols = Array.from(yColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);

        const selectedColorFile = hasColorControls ? colorFileSelect.property("value") : null;
        const selectedColorCol = hasColorControls ? colorColumnContainer.select("input:checked").node()?.value || null : null;

        const plotContainer = d3.select('#custom-plot');
        plotContainer.html(''); // Clear previous plots

        if (!selectedXFile || !selectedYFile || selectedXCols.length === 0 || selectedYCols.length === 0) {
            plotContainer.html(`<p class="text-gray-500 text-center p-4">Please select at least one column for both X and Y axes.</p>`);
            return;
        }

        const datasetsForMerge = [
            { fileKey: selectedXFile, rows: dataMap[selectedXFile] || [] },
            { fileKey: selectedYFile, rows: dataMap[selectedYFile] || [] },
            { fileKey: 'clinical', rows: clinical || [] }
        ];

        if (selectedColorFile && dataMap[selectedColorFile]) {
            datasetsForMerge.push({ fileKey: selectedColorFile, rows: dataMap[selectedColorFile] || [] });
        }

        const allSampleIds = [...new Set(datasetsForMerge.flatMap(ds => ds.rows.map(r => normalizeSampleId(r.Sample_ID)).filter(Boolean)))];

        const plotData = allSampleIds.map(sampleId => {
            const merged = { Sample_ID: sampleId };
            datasetsForMerge.forEach(ds => {
                const row = ds.rows.find(r => normalizeSampleId(r.Sample_ID) === sampleId);
                if (!row) return;
                Object.keys(row).forEach(key => {
                    if (key !== 'Sample_ID') merged[makeScopedKey(ds.fileKey, key)] = row[key];
                });
            });
            return merged;
        }).filter(row => {
            const hasX = selectedXCols.some(c => row[makeScopedKey(selectedXFile, c)] != null && row[makeScopedKey(selectedXFile, c)] !== '');
            const hasY = selectedYCols.some(c => row[makeScopedKey(selectedYFile, c)] != null && row[makeScopedKey(selectedYFile, c)] !== '');
            return hasX && hasY;
        });

        // Validate data exists
        if (!plotData.length) {
            plotContainer.html(`<p class="text-yellow-600 text-center p-4">No overlapping samples found between selected variables.</p>`);
            return;
        }

        let index = 0;
        selectedXCols.forEach(xCol => {
            selectedYCols.forEach(yCol => {
                const divId = `custom-plot-${index++}`;
                plotContainer.append('div').attr('id', divId).attr('class', 'mb-8').style('min-height', '520px');
                createAdaptivePlot(plotData, selectedXFile, xCol, selectedYFile, yCol, selectedColorFile, selectedColorCol, divId);
            });
        });
    };

    function createAdaptivePlot(data, xFile, xCol, yFile, yCol, colorFile, colorCol, plotDivId) {
        const xKey = makeScopedKey(xFile, xCol);
        const yKey = makeScopedKey(yFile, yCol);
        const colorKey = colorCol && colorFile ? makeScopedKey(colorFile, colorCol) : null;

        const xType = inferColumnType(data, xKey);
        const yType = inferColumnType(data, yKey);
        const colorType = colorKey ? inferColumnType(data, colorKey) : null;

        const clean = data.map(d => ({
            sample: d.Sample_ID,
            xRaw: d[xKey],
            yRaw: d[yKey],
            cRaw: colorKey ? d[colorKey] : null,
            xNum: parseNumber(d[xKey]),
            yNum: parseNumber(d[yKey])
        })).filter(d => d.xRaw != null && d.xRaw !== '' && d.yRaw != null && d.yRaw !== '');

        if (!clean.length) {
            document.getElementById(plotDivId).innerHTML = `<div class="text-center p-4 bg-gray-50 rounded-md">No valid rows for ${xCol} vs ${yCol}.</div>`;
            return;
        }

        const obsLines = [`N total=${clean.length}`];
        const appendGroupCounts = (rows, keyName, label) => {
            const counts = d3.rollup(rows, v => v.length, d => d[keyName] || 'NA');
            const sorted = Array.from(counts.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
            obsLines.push(`${label}: ${sorted.map(([k, n]) => `${k}=${n}`).join(', ')}`);
        };

        const layout = {
            ...professionalTheme,
            title: { ...professionalTheme.title, text: `${xCol} vs ${yCol}` },
            showlegend: true,
            legend: { ...professionalTheme.legend, title: { text: colorCol ? colorCol : 'Series' } },
            autosize: true,
            height: 520
        };

        let traces = [];
        let statText = '';

        if (xType === 'numeric' && yType === 'numeric') {
            const valid = clean.filter(d => d.xNum != null && d.yNum != null);
            if (colorCol && colorType === 'categorical') {
                const groups = d3.group(valid, d => d.cRaw || 'NA');
                traces = Array.from(groups.entries()).map(([grp, vals]) => ({
                    type: 'scatter',
                    mode: 'markers',
                    name: grp,
                    x: vals.map(v => v.xNum),
                    y: vals.map(v => v.yNum),
                    text: vals.map(v => `Sample: ${v.sample}`),
                    marker: { color: categoryColor(grp), size: 8, opacity: 0.75 }
                }));
                appendGroupCounts(valid.map(d => ({ group: d.cRaw || 'NA' })), 'group', `Color groups (${colorCol})`);
            } else {
                traces = [{
                    type: 'scatter', mode: 'markers', name: `${xCol}-${yCol}`,
                    x: valid.map(v => v.xNum), y: valid.map(v => v.yNum), text: valid.map(v => `Sample: ${v.sample}`),
                    marker: { color: '#636EFA', size: 8, opacity: 0.75 }
                }];
            }
            obsLines[0] = `N total=${valid.length}`;
            const xVals = valid.map(v => v.xNum);
            const yVals = valid.map(v => v.yNum);
            const xRange = getAxisRange(xVals, xCol);
            const yRange = getAxisRange(yVals, yCol);
            // Only lock a 1:1 aspect ratio when both axes share the same domain
            // (e.g. DSS vs DSS). Otherwise variables on different scales
            // (e.g. RNA expression vs DSS) get squashed and ranges fight.
            const sameScale = Array.isArray(xRange) && Array.isArray(yRange)
                && xRange[0] === yRange[0] && xRange[1] === yRange[1];
            layout.xaxis = {
                ...professionalTheme.xaxis,
                title: xCol,
                automargin: true,
                range: xRange,
                ...(sameScale ? { scaleanchor: 'y', scaleratio: 1 } : {})
            };
            layout.yaxis = {
                ...professionalTheme.yaxis,
                title: yCol,
                automargin: true,
                range: yRange
            };

            const spearman = basicStats.spearman(xVals, yVals);
            if (spearman) statText = `Spearman correlation: ρ=${spearman.rho.toFixed(3)}, p≈${spearman.pApprox.toExponential(2)}, n=${spearman.n}`;
        
        } else if (xType === 'categorical' && yType === 'numeric') {
            const valid = clean
                .filter(d => d.yNum != null)
                .map(d => ({ ...d, xCat: d.xRaw || 'NA', cCat: d.cRaw || 'NA' }));

            obsLines[0] = `N total=${valid.length}`;
            appendGroupCounts(valid.map(v => ({ xCat: v.xCat })), 'xCat', `${xCol} groups`);
            if (colorCol && colorType === 'categorical') {
                appendGroupCounts(valid.map(v => ({ group: v.cCat })), 'group', `Color groups (${colorCol})`);
            }

            const xCats = [...new Set(valid.map(v => v.xCat))];
            const xPos = new Map(xCats.map((c, i) => [c, i + 1]));

            // Deterministic jitter (so points don't jump every re-render)
            function hash01(str) {
                // simple stable hash -> [0,1)
                let h = 2166136261;
                for (let i = 0; i < str.length; i++) {
                    h ^= str.charCodeAt(i); 
                    h = Math.imul(h, 16777619);
                }
                return (h >>> 0) / 4294967296;
            }

            const jitterWidth = 0.18; // adjust: 0.12-0.25 is typical
            const scatterX = valid.map(v => {
                const base = xPos.get(v.xCat) ?? 0;
                const r = hash01(`${v.sample}|${xCol}|${yCol}`) - 0.5; // -0.5..0.5
                return base + r * (2 * jitterWidth);
            });

            // --- Box trace: neutral distribution only (no points) ---
            const boxTrace = xCats.map(cat => ({
                type: 'box',
                name: cat,
                x: valid.filter(v => v.xCat === cat).map(() => xPos.get(cat)),
                y: valid.filter(v => v.xCat === cat).map(v => v.yNum),
                boxpoints: false,         // ✅ IMPORTANT: no built-in points
                marker: { opacity: 0 },   // (redundant but harmless)
                line: { color: categoryColor(cat), width: 3 },
                fillcolor: hexToRgba(categoryColor(cat), 0.15)
            }));

            // --- Scatter trace: jitter points, color by selected color variable ---
            const pointColors = (colorCol && colorType === 'categorical')
                ? valid.map(v => categoryColor(v.cCat))
                : valid.map(() => '#3a3a3d');

            const jitterTrace = {
                type: 'scatter',
                mode: 'markers',
                name: colorCol ? `${colorCol}` : 'Samples',
                x: scatterX,
                y: valid.map(v => v.yNum),
                text: valid.map(v =>
                    `Sample: ${v.sample}` +
                    `<br>${xCol}: ${v.xCat}` +
                    `<br>${yCol}: ${v.yNum}` +
                    (colorCol ? `<br>${colorCol}: ${v.cCat}` : '')
                ),
                hoverinfo: 'text',
                marker: {
                    size: 6,
                    opacity: 0.7,
                    color: pointColors,
                    line: { width: 0.8, color: 'rgba(0,0,0,0.35)' }
                },
                showlegend: false // we’ll add legend proxies below for clean legend
            };

            traces = [...boxTrace, jitterTrace];

            // --- Legend proxies for color groups (so legend works even with per-point colors) ---
            if (colorCol && colorType === 'categorical') {
                const cats = [...new Set(valid.map(v => v.cCat))].sort((a, b) => String(a).localeCompare(String(b)));
                const colorLegendTraces = cats.map(cat => ({
                type: 'scatter',
                mode: 'markers',
                name: `${colorCol}: ${cat}`,
                x: [null],
                y: [null],
                marker: { color: categoryColor(cat), size: 9, opacity: 0.9, line: { width: 0.8, color: 'rgba(0,0,0,0.35)' } },
                hoverinfo: 'skip',
                showlegend: true
                }));
                traces = traces.concat(colorLegendTraces);
            }

            // --- Axes: numeric x with categorical tick labels ---
            layout.xaxis = {
                ...professionalTheme.xaxis,
                title: xCol,
                automargin: true,
                tickmode: 'array',
                tickvals: xCats.map(c => xPos.get(c)),
                ticktext: xCats,
                range: [0.5, xCats.length + 0.5]
            };

            layout.yaxis = {
                ...professionalTheme.yaxis,
                title: yCol,
                automargin: true,
                range: getAxisRange(valid.map(v => v.yNum), yCol)
            };

            // Keep your Wilcoxon logic exactly as before
            const categories = xCats;
            if (categories.length === 2) {
                const a = valid.filter(v => v.xCat === categories[0]).map(v => v.yNum);
                const b = valid.filter(v => v.xCat === categories[1]).map(v => v.yNum);
                const w = basicStats.mannWhitneyU(a, b);
                if (w) statText = `Wilcoxon rank-sum (${categories[0]} vs ${categories[1]}): U=${w.u.toFixed(2)}, z=${w.z.toFixed(2)}, p≈${w.pApprox.toExponential(2)}`;
            }
        } else if (xType === 'categorical' && yType === 'categorical') {
            const valid = clean.map(d => ({ xCat: d.xRaw || 'NA', yCat: d.yRaw || 'NA', cCat: d.cRaw || 'NA' }));
            const xCats = [...new Set(valid.map(v => v.xCat))];
            const yCats = [...new Set(valid.map(v => v.yCat))];

            if (colorCol && colorType === 'categorical') {
                const groups = d3.group(valid, d => d.cCat);
                traces = Array.from(groups.entries()).map(([grp, vals]) => {
                    const counts = new Map();
                    vals.forEach(v => counts.set(`${v.xCat}|${v.yCat}`, (counts.get(`${v.xCat}|${v.yCat}`) || 0) + 1));
                    return {
                        type: 'bar',
                        name: grp,
                        x: xCats.flatMap(x => yCats.map(y => `${x} · ${y}`)),
                        y: xCats.flatMap(x => yCats.map(y => counts.get(`${x}|${y}`) || 0)),
                        marker: { color: categoryColor(grp) }
                    };
                });
                layout.barmode = 'stack';
                layout.xaxis = { ...professionalTheme.xaxis, title: `${xCol} · ${yCol}`, automargin: true };
                appendGroupCounts(valid.map(v => ({ group: v.cCat })), 'group', `Color groups (${colorCol})`);
            } else {
                traces = yCats.map(yCat => ({
                    type: 'bar',
                    name: yCat,
                    x: xCats,
                    y: xCats.map(x => valid.filter(v => v.xCat === x && v.yCat === yCat).length),
                    marker: { color: categoryColor(yCat) }
                }));
                layout.barmode = 'group';
                layout.xaxis = { ...professionalTheme.xaxis, title: xCol, automargin: true };
            }
            obsLines[0] = `N total=${valid.length}`;
            appendGroupCounts(valid.map(v => ({ xCat: v.xCat })), 'xCat', `${xCol} groups`);
            appendGroupCounts(valid.map(v => ({ yCat: v.yCat })), 'yCat', `${yCol} groups`);
            layout.yaxis = { ...professionalTheme.yaxis, title: 'Count', automargin: true, rangemode: 'tozero' };

            const table = xCats.map(x => yCats.map(y => valid.filter(v => v.xCat === x && v.yCat === y).length));
            const chi = basicStats.chiSquare2D(table);
            if (chi) {
                const p = basicStats.chiSquarePApprox(chi.chi2, chi.dof);
                const pText = p == null ? 'NA' : p.toExponential(2);
                statText = `Chi-square independence test: χ²=${chi.chi2.toFixed(2)}, dof=${chi.dof}, p≈${pText}`;
            }
        } else {
            createAdaptivePlot(data, yFile, yCol, xFile, xCol, colorFile, colorCol, plotDivId);
            return;
        }

        const annotationLines = [];
        if (statText) annotationLines.push(statText);
        annotationLines.push(...obsLines);

        layout.annotations = [{
            xref: 'paper', yref: 'paper', x: 0, y: 1.15, showarrow: false,
            text: annotationLines.join('<br>'), align: 'left', font: { size: 11, color: '#4b5563' }
        }];

        Plotly.newPlot(plotDivId, traces, layout, { responsive: true, displaylogo: false });
    }

    const resetCustomPlotControls = () => {
        xFileSelect.property('value', '');
        yFileSelect.property('value', '');
        if (hasColorControls) colorFileSelect.property('value', '');

        xSelectorApi = window.DashboardUI?.renderSearchableSelect({ container: xColumnContainer, options: [], multiSelect: true, onChange: updatePlot });
        ySelectorApi = window.DashboardUI?.renderSearchableSelect({ container: yColumnContainer, options: [], multiSelect: true, onChange: updatePlot });
        if (hasColorControls) colorSelectorApi = window.DashboardUI?.renderSearchableSelect({ container: colorColumnContainer, options: [], multiSelect: false, onChange: updatePlot });

        d3.select('#custom-plot').html(`<p class="text-gray-500 text-center p-4">Please select at least one column for both X and Y axes.</p>`);
    }

    // Initial setup
    if (!resetButton.empty()) {
        resetButton.on('click', () => {
            resetCustomPlotControls();
        });
    }
    
    xSelectorApi = window.DashboardUI?.renderSearchableSelect({ container: xColumnContainer, options: [], multiSelect: true, onChange: updatePlot });
    ySelectorApi = window.DashboardUI?.renderSearchableSelect({ container: yColumnContainer, options: [], multiSelect: true, onChange: updatePlot });
    if (hasColorControls) colorSelectorApi = window.DashboardUI?.renderSearchableSelect({ container: colorColumnContainer, options: [], multiSelect: false, onChange: updatePlot });

    updatePlot();
}

const professionalTheme = {
    font: { family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 12, color: '#555' },
    title: { font: { size: 18, color: '#2c3e50', family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }, x: 0.5, xanchor: 'center' },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
    margin: { l: 60, r: 30, b: 100, t: 110 },
    xaxis: { titlefont: { size: 14, color: '#333' }, tickfont: { size: 11 }, showline: true, linecolor: '#ddd', gridcolor: 'transparent', zeroline: false },
    yaxis: { titlefont: { size: 14, color: '#333' }, tickfont: { size: 11 }, showline: true, linecolor: '#ddd', gridcolor: '#f0f0f0', zeroline: false },
    legend: { bgcolor: 'rgba(255, 255, 255, 0.8)', bordercolor: '#eee', borderwidth: 1 }
};
