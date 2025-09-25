// js/custom_plots.js - Final version with corrected Proteomics and Mutation logic

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
            // Explicitly identify the gene column and filter out any other non-sample ID columns like 'GeneID'
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
    // --- CHANGE 1: Correctly transpose Proteomics and RNA Seq data ---
    const proteomicsTransposed = transposeData(proteomics, 'Gene');
    const rnaSeqTransposed = transposeData(rnaSeq, 'Gene');

    const dataMap = {
        clinical,
        mutation,
        surfaceAntigen,
        amlFusion,
        dssMono,
        dssCombo,
        proteomics: proteomicsTransposed,
        rnaSeq: rnaSeqTransposed
    };

    // --- DYNAMIC UI CREATION (Unchanged) ---
    xFileSelect.on("change", function() { /* ... */ });
    yFileSelect.on("change", function() { /* ... */ });
    // UI Helper functions (createSimpleDropdown, createSearchableDropdown) remain the same

    // --- Main Plotting Logic ---
    const updatePlot = () => {
        const selectedXFile = xFileSelect.property("value");
        const selectedYFile = yFileSelect.property("value");
        let selectedXCol = '';
        if (xColumnContainer.select("select").node()) {
            selectedXCol = xColumnContainer.select("select").property("value");
        } else if (xColumnContainer.select("input[type=radio]:checked").node()) {
            selectedXCol = xColumnContainer.select("input[type=radio]:checked").property("value");
        }
        const selectedYCols = Array.from(yColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);

        if (!selectedXFile || !selectedYFile || !selectedXCol || selectedYCols.length === 0) {
            createBoxPlot([], null, []);
            return;
        }

        const xData = dataMap[selectedXFile];
        const yData = dataMap[selectedYFile];

        // --- CHANGE 2: Ensure all missing mutation values are explicitly mapped to 'NA' ---
        const plotData = clinical.map(cRow => {
            const sampleId = cRow.Sample_ID;
            const xRow = xData.find(x => x.Sample_ID === sampleId) || {};
            const yRow = yData.find(y => y.Sample_ID === sampleId) || {};
            
            const mergedRow = { ...cRow, ...xRow, ...yRow };

            // If the selected X variable is from the mutation file, clean it up.
            if (selectedXFile === 'mutation') {
                if (mergedRow[selectedXCol] === undefined || mergedRow[selectedXCol] === null) {
                    mergedRow[selectedXCol] = 'NA';
                }
            }
            return mergedRow;
        });

        createBoxPlot(plotData, selectedXCol, selectedYCols);
    };

    // Initialize UI
    // ...
}

function createBoxPlot(data, xVar, yVars) {
    const plotDiv = document.getElementById('custom-plot');
    plotDiv.innerHTML = '';

    if (!xVar || yVars.length === 0) {
        plotDiv.innerHTML = `<p class="text-gray-500 text-center p-4">Please select a column for both X and Y axes.</p>`;
        return;
    }

    const plotTraces = yVars.map(yVar => ({
        // Ensure the x-data passed to the plot is clean
        x: data.map(d => d[xVar] || 'NA'),
        y: data.map(d => (d[yVar] !== '' && d[yVar] != null) ? parseFloat(d[yVar]) : null),
        name: yVar,
        type: 'box',
        boxpoints: false
    }));

    const layout = {
        title: `Distribution of ${yVars.join(', ')} by ${xVar}`,
        xaxis: {
            title: xVar,
            automargin: true,
            // Re-enforce the category order to prevent extra columns
            categoryorder: 'array',
            categoryarray: ['Wild-Type', 'Mutated', 'NA']
        },
        yaxis: {
            title: 'Value',
            zeroline: false
        },
        boxmode: 'group',
        showlegend: yVars.length > 1
    };

    Plotly.newPlot('custom-plot', plotTraces, layout, { responsive: true });
}

// NOTE: The UI helper functions (createSimpleDropdown, createSearchableDropdown) and the initialization
// calls have been omitted for brevity but should remain in your file as they were in the previous version.
// The full, unchanged code for those functions is included in the complete script below.

// --- Complete js/custom_plots.js for copy-pasting ---
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
        clinical, mutation, surfaceAntigen, amlFusion, dssMono, dssCombo,
        proteomics: proteomicsTransposed,
        rnaSeq: rnaSeqTransposed
    };

    xFileSelect.on("change", function() {
        const selected = d3.select(this).property("value");
        let columns = [];
        if (selected && dataMap[selected]) columns = dataMap[selected].length > 0 ? Object.keys(dataMap[selected][0]).filter(c => c !== 'Sample_ID') : [];
        
        if (selected === 'mutation') {
            createSearchableDropdown(xColumnContainer, columns, false);
        } else {
            createSimpleDropdown(xColumnContainer, columns);
        }
        updatePlot();
    });
    
    yFileSelect.on("change", function() {
        const selected = d3.select(this).property("value");
        let columns = [];
        if (selected && dataMap[selected]) columns = dataMap[selected].length > 0 ? Object.keys(dataMap[selected][0]).filter(c => c !== 'Sample_ID') : [];
        
        createSearchableDropdown(yColumnContainer, columns, true);
        updatePlot();
    });

    function createSimpleDropdown(container, columns) {
        container.html("");
        const select = container.append("select")
            .attr("class", "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 sm:text-sm rounded-md");
        
        select.selectAll("option").data(['', ...columns]).enter().append("option").text(d => d);
        select.on("change", updatePlot);
    }

    function createSearchableDropdown(container, columns, isMultiSelect) {
        container.html("");
        const dropdown = container.append("div").attr("class", "relative");
        const button = dropdown.append("button").attr("class", "w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left").text(`Select Column${isMultiSelect ? 's' : ''}...`);
        const listContainer = dropdown.append("div").attr("class", "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 overflow-auto hidden");
        const searchInput = listContainer.append("input").attr("type", "text").attr("placeholder", "Search...").attr("class", "w-full px-3 py-2 border-b sticky top-0").on("input", filterList);
        const list = listContainer.append("div");

        button.on("click", () => listContainer.classed("hidden", !listContainer.classed("hidden")));
        
        columns.forEach(col => {
            const listItem = list.append("div").attr("class", "px-3 py-2 hover:bg-gray-100 flex items-center");
            const inputType = isMultiSelect ? "checkbox" : "radio";
            const inputName = isMultiSelect ? `checkbox-${col}` : "x-axis-radio";
            
            listItem.append("input").attr("type", inputType).attr("value", col).attr("id", `input-${col}`).attr("name", inputName).attr("class", "mr-2").on("change", updatePlot);
            listItem.append("label").attr("for", `input-${col}`).text(col);
        });

        function filterList() {
            const term = searchInput.property("value").toLowerCase();
            list.selectAll("div").style("display", function() {
                return d3.select(this).select("label").text().toLowerCase().includes(term) ? "" : "none";
            });
        }
    }

    const updatePlot = () => {
        const selectedXFile = xFileSelect.property("value");
        const selectedYFile = yFileSelect.property("value");
        let selectedXCol = '';
        if (xColumnContainer.select("select").node()) {
            selectedXCol = xColumnContainer.select("select").property("value");
        } else if (xColumnContainer.select("input[type=radio]:checked").node()) {
            selectedXCol = xColumnContainer.select("input[type=radio]:checked").property("value");
        }
        const selectedYCols = Array.from(yColumnContainer.selectAll("input[type=checkbox]:checked").nodes()).map(n => n.value);

        if (!selectedXFile || !selectedYFile || !selectedXCol || selectedYCols.length === 0) {
            createBoxPlot([], null, []);
            return;
        }

        const xData = dataMap[selectedXFile];
        const yData = dataMap[selectedYFile];

        const plotData = clinical.map(cRow => {
            const sampleId = cRow.Sample_ID;
            const xRow = xData.find(x => x.Sample_ID === sampleId) || {};
            const yRow = yData.find(y => y.Sample_ID === sampleId) || {};
            
            const mergedRow = { ...cRow, ...xRow, ...yRow };

            if (selectedXFile === 'mutation') {
                if (mergedRow[selectedXCol] === undefined || mergedRow[selectedXCol] === null) {
                    mergedRow[selectedXCol] = 'NA';
                }
            }
            return mergedRow;
        });

        createBoxPlot(plotData, selectedXCol, selectedYCols);
    };

    createSimpleDropdown(xColumnContainer, []);
    createSearchableDropdown(yColumnContainer, [], true);
    createBoxPlot([], null, []);
}

function createBoxPlot(data, xVar, yVars) {
    const plotDiv = document.getElementById('custom-plot');
    plotDiv.innerHTML = '';

    if (!xVar || yVars.length === 0) {
        plotDiv.innerHTML = `<p class="text-gray-500 text-center p-4">Please select a column for both X and Y axes.</p>`;
        return;
    }

    const plotTraces = yVars.map(yVar => ({
        x: data.map(d => d[xVar] || 'NA'),
        y: data.map(d => (d[yVar] !== '' && d[yVar] != null) ? parseFloat(d[yVar]) : null),
        name: yVar,
        type: 'box',
        boxpoints: false
    }));

    const layout = {
        title: `Distribution of ${yVars.join(', ')} by ${xVar}`,
        xaxis: {
            title: xVar,
            automargin: true,
            categoryorder: 'array',
            categoryarray: ['Wild-Type', 'Mutated', 'NA']
        },
        yaxis: {
            title: 'Value',
            zeroline: false
        },
        boxmode: 'group',
        showlegend: yVars.length > 1
    };

    Plotly.newPlot('custom-plot', plotTraces, layout, { responsive: true });
}