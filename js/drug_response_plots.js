// js/drug_response_plots.js - Final version with new colorscale and non-overlapping legend

/**
 * Initializes the drug response tab, creating the interactive synergy plot.
 */
function initializeDrugResponseTab(hsaData, comboDssData) {
    const bubbleContainerId = 'hsa-bubble-plot-container';

    if (!Array.isArray(hsaData) || hsaData.length === 0) {
        console.error("Drug Response Error: HSA data is not a valid array or is empty.");
        document.getElementById(bubbleContainerId).innerHTML = `<p class="text-red-500 text-center p-4">Error: HSA data could not be loaded or is empty.</p>`;
        return;
    }

    createHsaBubblePlot(hsaData, bubbleContainerId);
}

/**
 * Creates the interactive HSA Synergy bubble plot with a gradient for values 0-1
 * and a fixed color for values > 1, while preserving hover information.
 */
function createHsaBubblePlot(data, containerId) {
    const plotDiv = document.getElementById(containerId);
    plotDiv.innerHTML = ''; // Clear loading message

    try {
        const plotData = data
            .filter(d => d.Combination && d.median_CI != null && d.Combination.includes(' - '))
            .map(d => ({
                // Ensure consistent ordering for the symmetric plot
                drug1: d.Combination.split(' - ').map(name => name.trim()).sort()[0],
                drug2: d.Combination.split(' - ').map(name => name.trim()).sort()[1],
                synergy: parseFloat(d.median_CI)
            }))
            .filter(d => !isNaN(d.synergy));

        if (plotData.length === 0) {
            throw new Error("No valid data for the bubble plot after cleaning.");
        }

        // Dynamically get unique, sorted drug names for axes
        const allDrugs = [...new Set(plotData.flatMap(d => [d.drug1, d.drug2]))].sort();

        // Helper to process data for each trace in a single loop
        const processTraceData = (filterFn) => {
            const trace = { x: [], y: [], text: [], synergy: [], size: [] };
            plotData.filter(filterFn).forEach(d => {
                trace.x.push(d.drug1);
                trace.y.push(d.drug2);
                trace.text.push(`Combination: ${d.drug1} - ${d.drug2}<br>Synergy (CI): ${d.synergy.toFixed(2)}`);
                trace.synergy.push(d.synergy);
                // Scale marker size: higher synergy (lower CI) = larger marker
                trace.size.push(d.synergy <= 1 ? 25 * (1 - d.synergy) + 5 : 15);
            });
            return trace;
        };

        const synergisticData = processTraceData(d => d.synergy >= 0 && d.synergy <= 1);
        const antagonisticData = processTraceData(d => d.synergy > 1);
        const ineffectiveData = processTraceData(d => d.synergy < 0);

        const synergisticTrace = {
            ...synergisticData,
            hoverinfo: 'text',
            mode: 'markers',
            marker: {
                size: synergisticData.size,
                color: synergisticData.synergy,
                // == START MODIFICATION: Changed colorscale ==
                colorscale: [[0, '#fde725'], [1, '#440154']], // High-contrast Viridis (Yellow-to-Dark Purple)
                // == END MODIFICATION ==
                cmin: 0,
                cmax: 1,
                showscale: true,
                colorbar: {
                    title: 'Combination Index',
                    tickvals: [0, 1],
                    ticktext: ['High Synergy (0)', 'Low Synergy (1)']
                }
            },
            type: 'scatter',
            name: 'Synergistic (0-1)',
            showlegend: false 
        };

        const antagonisticTrace = {
            ...antagonisticData,
            hoverinfo: 'text',
            name: 'Antagonistic (>1)',
            mode: 'markers',
            marker: {
                size: antagonisticData.size,
                color: '#d62728', // Use a brighter red for better contrast
            },
            type: 'scatter'
        };

        const ineffectiveTrace = {
            ...ineffectiveData,
            hoverinfo: 'text',
            name: 'Not Effective (<0)',
            mode: 'markers',
            marker: {
                size: ineffectiveData.size,
                color: '#7f7f7f', // Darker gray
                symbol: 'x'
            },
            type: 'scatter'
        };

        const plotLayout = {
            title: 'Drug Combination Synergy Overview',
            font: {
                family: 'Inter, sans-serif',
                size: 12,
                color: '#34495e'
            },
            titlefont: {
                size: 16,
                color: '#2c3e50'
            },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#fff',
            margin: { l: 120, r: 150, b: 150, t: 80 }, // Increased bottom margin for legend
            height: 800,
            xaxis: { 
                title: 'Drug 1', 
                automargin: true, 
                tickangle: -45,
                categoryorder: 'array',
                categoryarray: allDrugs
            },
            yaxis: { 
                title: 'Drug 2', 
                automargin: true,
                categoryorder: 'array',
                categoryarray: allDrugs
            },
            hovermode: 'closest',
            // == START MODIFICATION: Moved legend to be horizontal and below plot ==
            showlegend: true,
            legend: {
                orientation: "h", // Horizontal legend
                yanchor: "bottom",
                y: -0.4,          // Position below the X-axis labels
                xanchor: "center",
                x: 0.5            // Center the legend
            }
            // == END MODIFICATION ==
        };

        Plotly.react(plotDiv, [synergisticTrace, antagonisticTrace, ineffectiveTrace], plotLayout, {responsive: true});

    } catch (error) {
        console.error("Failed to create HSA Bubble Plot:", error);
        plotDiv.innerHTML = `<p class="text-red-500 text-center p-4">Could not draw the bubble plot. Please check the console and data files.</p>`;
    }
}