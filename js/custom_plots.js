// js/custom_plots.js - Refactored to remove individual points from Box Plots

function initCustomPlots(appData) {
    const { clinical, mutation, dss, proteomics } = appData;

    if (!clinical || !mutation || !dss || !proteomics) {
        console.error("Custom Plots Error: Required datasets are missing.");
        return;
    }

    // --- DOM Element Selections ---
    const xFileSelect = d3.select("#x-axis-file-select");
    const xColumnSelect = d3.select("#x-axis-column-select");
    const yFileSelect = d3.select("#y-axis-file-select");
    const yColumnContainer = d3.select("#y-axis-column-select-container");

    // --- Data Pre-processing ---
    const clinicalDataSubset = clinical.slice(0, 10);
    const proteomicsTransposed = [];
    if (proteomics.length > 0) {
        const headers = proteomics.columns.slice(1);
        headers.forEach(sampleId => {
            const row = { Sample_ID: sampleId };
            proteomics.forEach(d => { row[d.Gene] = d[sampleId]; });
            proteomicsTransposed.push(row);
        });
    }

    const mergedData = clinicalDataSubset.map(clinicalRow => {
        const mutationRow = mutation.find(m => m.Sample_ID === clinicalRow.Sample_ID);
        const dssRow = dss.find(d => d.Sample_ID === clinicalRow.Sample_ID);
        const proteomicsRow = proteomicsTransposed.find(p => p.Sample_ID === clinicalRow.Sample_ID);
        return { ...clinicalRow, ...mutationRow, ...dssRow, ...proteomicsRow };
    });

    // --- Populate X-Axis ---
    xFileSelect.on("change", function() {
        const selectedFile = d3.select(this).property("value");
        let columns = [];
        if (selectedFile === 'clinical') {
            columns = clinical.columns.filter(col => isNaN(clinicalDataSubset[0][col]));
        } else if (selectedFile === 'mutation') {
            columns = mutation.columns.filter(col => col !== 'Sample_ID');
        }
        xColumnSelect.selectAll("option").remove();
        xColumnSelect.selectAll("option")
            .data(['', ...columns])
            .enter()
            .append("option")
            .text(d => d);
        updatePlot();
    });
    
    // --- Populate Y-Axis ---
    yFileSelect.on("change", function() {
        const selectedFile = d3.select(this).property("value");
        let columns = [];
        if (selectedFile === 'dss') {
            columns = dss.columns.filter(col => col !== 'Sample_ID');
        } else if (selectedFile === 'proteomics') {
            columns = proteomics.map(d => d.Gene);
        }
        populateYColumnSelector(columns);
        updatePlot();
    });
    
    function populateYColumnSelector(columns) {
        yColumnContainer.html(""); 
        const dropdown = yColumnContainer.append("div").attr("class", "relative");
        const button = dropdown.append("button")
            .attr("class", "w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm")
            .text("Select Columns...");
        
        const list = dropdown.append("div")
            .attr("class", "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm")
            .style("display", "none");

        button.on("click", () => {
            const isHidden = list.style("display") === "none";
            list.style("display", isHidden ? "block" : "none");
        });

        columns.forEach(col => {
            const listItem = list.append("div").attr("class", "px-3 py-2 hover:bg-gray-100");
            listItem.append("input")
                .attr("type", "checkbox")
                .attr("value", col)
                .attr("id", `checkbox-${col}`)
                .attr("class", "mr-2")
                .on("change", updatePlot);
            listItem.append("label")
                .attr("for", `checkbox-${col}`)
                .text(col);
        });
    }

    // --- Main Update and Plotting Logic ---
    const updatePlot = () => {
        const selectedX = xColumnSelect.property("value");
        const selectedY = [];
        yColumnContainer.selectAll("input[type=checkbox]:checked").each(function() {
            selectedY.push(d3.select(this).property("value"));
        });

        if (!selectedX || selectedY.length === 0) {
            createBoxPlot([], null, []);
            return;
        }
        createBoxPlot(mergedData, selectedX, selectedY);
    };

    xColumnSelect.on("change", updatePlot);
    createBoxPlot([], null, []);
}

function createBoxPlot(data, xVar, yVars) {
    const plotDiv = document.getElementById('custom-plot');
    plotDiv.innerHTML = '';

    if (!xVar || yVars.length === 0) {
        plotDiv.innerHTML = `<p class="text-gray-500 text-center p-4">Please select a column for both X and Y axes.</p>`;
        return;
    }

    const plotTraces = yVars.map(yVar => {
        return {
            x: data.map(d => d[xVar]),
            y: data.map(d => d[yVar]),
            name: yVar,
            type: 'box',
            // FIX: Set boxpoints to false to hide the individual data points.
            boxpoints: false 
        };
    });

    const layout = {
        title: `Distribution of ${yVars.join(', ')} by ${xVar}`,
        xaxis: { title: xVar, automargin: true },
        yaxis: { title: 'Value', zeroline: false },
        boxmode: 'group',
        showlegend: yVars.length > 1
    };

    Plotly.newPlot('custom-plot', plotTraces, layout, { responsive: true });
}