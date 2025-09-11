// js/custom_plots.js - Refactored for Box Plots and Multi-Select Y-Axis

function initCustomPlots(appData) {
    const { clinical, mutation, dss, proteomics } = appData;

    if (!clinical || !mutation || !dss || !proteomics) {
        console.error("Custom Plots Error: Required datasets are missing.");
        return;
    }

    const xSelect = d3.select("#x-axis-select");
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

    // --- Populate X-Axis Dropdown ---
    const clinicalCols = clinical.columns.filter(col => isNaN(clinicalDataSubset[0][col]));
    const mutationCols = mutation.columns.filter(col => col !== 'Sample_ID');
    xSelect.selectAll("option")
           .data(['', ...clinicalCols, ...mutationCols])
           .enter()
           .append("option")
           .text(d => d);

    // --- Handle Y-Axis File Selection ---
    yFileSelect.on("change", function() {
        const selectedFile = d3.select(this).property("value");
        let columns = [];
        if (selectedFile === 'dss') {
            columns = dss.columns.filter(col => col !== 'Sample_ID');
        } else if (selectedFile === 'proteomics') {
            columns = proteomics.map(d => d.Gene);
        }
        populateYColumnSelector(columns);
    });
    
    // --- Create Custom Multi-Select Dropdown ---
    function populateYColumnSelector(columns) {
        yColumnContainer.html(""); // Clear previous dropdown

        const dropdown = yColumnContainer.append("div").attr("class", "relative");
        const button = dropdown.append("button")
            .attr("class", "w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm")
            .text("Select Columns...");
        
        const list = dropdown.append("div")
            .attr("class", "absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm hidden")
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
        const selectedX = xSelect.property("value");
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

    xSelect.on("change", updatePlot);
    createBoxPlot([], null, []); // Initial empty plot
}

function createBoxPlot(data, xVar, yVars) {
    const plotDiv = document.getElementById('custom-plot');
    plotDiv.innerHTML = '';

    if (!xVar || yVars.length === 0) {
        plotDiv.innerHTML = `<p class="text-gray-500 text-center p-4">Please select variables for both X and Y axes.</p>`;
        return;
    }

    const plotTraces = yVars.map(yVar => {
        return {
            x: data.map(d => d[xVar]),
            y: data.map(d => d[yVar]),
            name: yVar,
            type: 'box',
            boxpoints: 'all', // Show individual data points
            jitter: 0.3,
            pointpos: -1.8
        };
    });

    const layout = {
        title: `Distribution of ${yVars.join(', ')} by ${xVar}`,
        xaxis: { title: xVar },
        yaxis: { title: 'Value', zeroline: false },
        boxmode: 'group' // Group boxes for different y-vars side-by-side
    };

    Plotly.newPlot('custom-plot', plotTraces, layout, { responsive: true });
}