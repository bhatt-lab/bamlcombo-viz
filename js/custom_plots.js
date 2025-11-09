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

    // --- DATA PRE-PROCESSING ---
    const transposeData = (data, geneColumn = 'Gene') => {
        const transposed = [];
        if (data && data.length > 0) {
            const idColumn = geneColumn;
            const sampleCols = data.columns.filter(c => c.toLowerCase() !== 'gene' && c.toLowerCase() !== 'geneid');
            
            sampleCols.forEach(sampleId => {
                const row = { Sample_ID: sampleId };
                data.forEach(d => {
                    if (d[idColumn]) {
                        row[d[idColumn]] = d[sampleId];
                    }
                });
                transposed.push(row);
            });
        }
        return transposed;
    };
    
    const proteomicsTransposed = transposeData(proteomics, 'Gene');
    const rnaSeqTransposed = transposeData(rnaSeq, 'Gene');

    const dataMap = {
        clinical, // Keep clinical as is
        mutation, // Mutation data is already in the correct wide format
        surfaceAntigen,
        amlFusion,
        dssMono,
        dssCombo,
        proteomics: proteomicsTransposed,
        rnaSeq: rnaSeqTransposed
    };

    const setupDropdown = (fileSelect, columnContainer, isMultiSelect) => {
        fileSelect.on("change", function() {
            const selected = d3.select(this).property("value");
            let columns = [];
            if (selected && dataMap[selected] && dataMap[selected].length > 0) {
                columns = Object.keys(dataMap[selected][0]).filter(c => c !== 'Sample_ID');
            }
            createSearchableDropdown(columnContainer, columns, isMultiSelect, updatePlot);
            updatePlot();
        });
    };

    setupDropdown(xFileSelect, xColumnContainer, true); // Allow multi-select for X-axis
    setupDropdown(yFileSelect, yColumnContainer, true); // Allow multi-select for Y-axis

    function createSearchableDropdown(container, columns, isMultiSelect, changeCallback) {
        container.html("");
        const dropdown = container.append("div").attr("class", "relative");
        const button = dropdown.append("button")
            .attr("class", "w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left truncate")
            .text(`Select Column${isMultiSelect ? 's' : ''}...`);
        
        const listContainer = dropdown.append("div").attr("class", "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto hidden");
        const searchInput = listContainer.append("input")
            .attr("type", "text")
            .attr("placeholder", "Search...")
            .attr("class", "w-full px-3 py-2 border-b sticky top-0 z-10")
            .on("input", filterList);
        
        const list = listContainer.append("div");

        button.on("click", () => listContainer.classed("hidden", !listContainer.classed("hidden")));
        
        const inputType = isMultiSelect ? "checkbox" : "radio";
        const inputName = container.attr('id') || 'searchable-dropdown';

        columns.forEach(col => {
            const listItem = list.append("div").attr("class", "px-3 py-2 hover:bg-gray-100 flex items-center");
            
            listItem.append("input")
                .attr("type", inputType)
                .attr("value", col)
                .attr("id", `input-${inputName}-${col}`)
                .attr("name", inputName)
                .attr("class", "mr-2")
                .on("change", () => {
                    const selected = Array.from(container.selectAll("input:checked").nodes()).map(n => n.value);
                    let buttonText = `Select Column${isMultiSelect ? 's' : ''}...`;
                    if (selected.length > 0) {
                        buttonText = selected.join(', ');
                        if (buttonText.length > 40) {
                            buttonText = `${selected.length} column${selected.length > 1 ? 's' : ''} selected`;
                        }
                    }
                    button.text(buttonText);
                    if (changeCallback) changeCallback();
                });
            
            listItem.append("label").attr("for", `input-${inputName}-${col}`).text(col).attr("class", "w-full");
        });

        function filterList() {
            const term = searchInput.property("value").toLowerCase();
            list.selectAll("div").style("display", function() {
                return d3.select(this).select("label").text().toLowerCase().includes(term) ? "" : "none";
            });
        }
        
        // Close dropdown if clicking outside
        d3.select("body").on("click", function(event) {
            if (!dropdown.node().contains(event.target)) {
                listContainer.classed("hidden", true);
            }
        });
    }

    const updatePlot = () => {
        const selectedXFile = xFileSelect.property("value");
        const selectedYFile = yFileSelect.property("value");
        
        const selectedXCols = Array.from(xColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);
        const selectedYCols = Array.from(yColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);

        const plotContainer = d3.select('#custom-plot');
        plotContainer.html(''); // Clear previous plots

        if (!selectedXFile || !selectedYFile || selectedXCols.length === 0 || selectedYCols.length === 0) {
            plotContainer.html(`<p class="text-gray-500 text-center p-4">Please select at least one column for both X and Y axes.</p>`);
            return;
        }

        const xData = dataMap[selectedXFile];
        const yData = dataMap[selectedYFile];

        // --- ROBUST MERGING LOGIC ---
        // 1. Get all unique Sample_IDs from the selected X and Y datasets.
        const xSampleIds = xData ? xData.map(d => d.Sample_ID) : [];
        const ySampleIds = yData ? yData.map(d => d.Sample_ID) : [];
        const allSampleIds = [...new Set([...xSampleIds, ...ySampleIds])];

        // 2. Build the merged dataset from this comprehensive list of IDs.
        const plotData = allSampleIds.map(sampleId => {
            // Find the corresponding row in each dataset.
            const cRow = clinical.find(c => c.Sample_ID === sampleId) || {};
            const xRow = xData.find(x => x.Sample_ID === sampleId) || {};
            const yRow = yData.find(y => y.Sample_ID === sampleId) || {};
            
            // Merge them, ensuring the primary Sample_ID is correct.
            return { Sample_ID: sampleId, ...cRow, ...xRow, ...yRow };
        });
        // --- END OF MERGING LOGIC ---

        selectedXCols.forEach((xCol, i) => {
            const plotDivId = `custom-plot-${i}`;
            plotContainer.append('div').attr('id', plotDivId).attr('class', 'mb-8');
            createDistributionPlot(plotData, xCol, selectedYCols, plotDivId);
        });
    };

    // Initial setup
    createSearchableDropdown(xColumnContainer, [], true, updatePlot);
    createSearchableDropdown(yColumnContainer, [], true, updatePlot);
    updatePlot();
}

const professionalTheme = {
    font: { family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', size: 12, color: '#555' },
    title: { font: { size: 18, color: '#2c3e50', family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }, x: 0.5, xanchor: 'center' },
    paper_bgcolor: '#fff',
    plot_bgcolor: '#fff',
    margin: { l: 60, r: 30, b: 100, t: 80 },
    xaxis: { titlefont: { size: 14, color: '#333' }, tickfont: { size: 11 }, showline: true, linecolor: '#ddd', gridcolor: 'transparent', zeroline: false },
    yaxis: { titlefont: { size: 14, color: '#333' }, tickfont: { size: 11 }, showline: true, linecolor: '#ddd', gridcolor: '#f0f0f0', zeroline: false },
    legend: { bgcolor: 'rgba(255, 255, 255, 0.8)', bordercolor: '#eee', borderwidth: 1 }
};

function createDistributionPlot(data, xVar, yVars, plotDivId) {
    const plotDiv = document.getElementById(plotDivId);
    if (!plotDiv) return;

    if (!xVar || yVars.length === 0) {
        return; // Should be handled by updatePlot, but as a safeguard.
    }

    const colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Map empty/null x-values to 'NA' upfront.
    const preppedData = data.map(d => ({ ...d, [xVar]: d[xVar] || 'NA' }));

    const plotTraces = yVars.map((yVar, i) => {
        // For each trace, create a complete set of points, explicitly handling invalid Y values.
        const points = preppedData.map(d => {
            const yVal = d[yVar];
            // Check for valid, non-empty, numeric-parsable values.
            if (yVal !== '' && yVal != null && !isNaN(parseFloat(yVal))) {
                return {
                    x: d[xVar],
                    y: parseFloat(yVal),
                    text: `Sample: ${d.Sample_ID}`
                };
            }
            return null; // Mark invalid points for removal
        }).filter(p => p !== null); // Filter out the invalid points

        if (points.length === 0) return null; // If no valid points, this trace will be skipped.

        return {
            x: points.map(p => p.x),
            y: points.map(p => p.y),
            text: points.map(p => p.text),
            hoverinfo: 'y+text+name',
            name: yVar,
            type: 'box',
            boxpoints: 'all',
            jitter: 0.3,
            pointpos: 0,
            marker: { color: colors(i), size: 3, opacity: 0.5 },
            line: { color: colors(i) }
        };
    }).filter(t => t !== null); // Remove traces that had no valid data

    if (plotTraces.length === 0) {
        plotDiv.innerHTML = `<div class="text-center p-4 bg-gray-50 rounded-md">
            <p class="font-semibold">No Data Available</p>
            <p class="text-sm text-gray-600">No samples with valid data for both '${xVar}' and '${yVars.join(', ')}' were found.</p>
        </div>`;
        return;
    }
    
    const annotations = [];
    // Get all unique categories from the final, valid traces
    // We need the sample ID to count unique samples per category
    const allPointsWithId = plotTraces.flatMap(trace => trace.x.map((xVal, i) => ({ 
        x: xVal, 
        sampleId: trace.text[i].replace('Sample: ', '') // Extract Sample_ID from text
    })));
    const categories = [...new Set(allPointsWithId.map(p => p.x))];

    categories.forEach(cat => {
        // Count unique samples in this category.
        const uniqueSamples = new Set(allPointsWithId.filter(p => p.x === cat).map(p => p.sampleId));
        annotations.push({
            x: cat,
            y: 0,
            yref: 'paper',
            yanchor: 'bottom',
            yshift: -40,
            text: `n=${uniqueSamples.size}`,
            showarrow: false,
            font: { size: 10 }
        });
    });

    const plotLayout = {
        ...professionalTheme,
        title: { ...professionalTheme.title, text: `Distribution of ${yVars.join(', ')} by ${xVar}` },
        xaxis: { 
            ...professionalTheme.xaxis, 
            title: xVar, 
            automargin: true, 
            categoryorder: 'array', // Enforce a specific order
            categoryarray: ['Mutated', 'Wild-Type', 'NA'] // Desired order
        },
        yaxis: { ...professionalTheme.yaxis, title: 'Value' },
        showlegend: yVars.length > 1,
        legend: { ...professionalTheme.legend, title: { text: 'Y-Variables' } },
        annotations: annotations
    };

    Plotly.newPlot(plotDivId, plotTraces, plotLayout, { responsive: true });
}