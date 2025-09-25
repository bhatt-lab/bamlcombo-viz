// js/drug_response_plots.js - Final version with gradient (0-1) and fixed color (>1)

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
    const container = document.getElementById(containerId);
    container.innerHTML = ''; // Clear loading message

    try {
        const plotData = data
            .filter(d => d.Combination && d.median_CI != null && d.Combination.includes(' - '))
            .map(d => ({
                drug1: d.Combination.split(' - ')[0].trim(),
                drug2: d.Combination.split(' - ')[1].trim(),
                synergy: parseFloat(d.median_CI)
            }))
            .filter(d => !isNaN(d.synergy));

        if (plotData.length === 0) {
            throw new Error("No valid data for the bubble plot after cleaning.");
        }

        // --- CHANGE: Separate data into THREE groups for plotting ---
        const synergisticData = plotData.filter(d => d.synergy >= 0 && d.synergy <= 1);
        const antagonisticData = plotData.filter(d => d.synergy > 1);
        const ineffectiveData = plotData.filter(d => d.synergy < 0);

        // --- Trace 1: Gradient for Synergistic values (0 to 1) ---
        const synergisticTrace = {
            x: synergisticData.map(d => d.drug1),
            y: synergisticData.map(d => d.drug2),
            text: synergisticData.map(d => `Combination Index: ${d.synergy.toFixed(2)}`),
            name: 'Synergistic (0-1)',
            mode: 'markers',
            marker: {
                size: 15,
                color: synergisticData.map(d => d.synergy),
                colorscale: 'YlGnBu', // A nice Yellow-Green-Blue gradient
                reversescale: true,   // Reversing makes lower (better) values brighter
                cmin: 0,
                cmax: 1,
                showscale: true,
                colorbar: {
                    title: 'Combination Index',
                    tickvals: [0, 1],
                    ticktext: ['Low (0)', 'Medium (1)']
                }
            },
            type: 'scatter'
        };

        // --- Trace 2: Fixed color for Antagonistic values (> 1) ---
        const antagonisticTrace = {
            x: antagonisticData.map(d => d.drug1),
            y: antagonisticData.map(d => d.drug2),
            text: antagonisticData.map(d => `Combination Index: ${d.synergy.toFixed(2)}`),
            name: 'High (>1)', // This will appear in the legend
            mode: 'markers',
            marker: {
                size: 15,
                color: 'purple', // A single, fixed color for all points in this trace
            },
            type: 'scatter'
        };

        // --- Trace 3: Fixed color for Ineffective values (< 0) ---
        const ineffectiveTrace = {
            x: ineffectiveData.map(d => d.drug1),
            y: ineffectiveData.map(d => d.drug2),
            text: ineffectiveData.map(d => `Combination Index: ${d.synergy.toFixed(2)} (Not Effective)`),
            name: 'Not Effective (<0)',
            mode: 'markers',
            marker: {
                size: 15,
                color: 'grey',
                symbol: 'x'
            },
            type: 'scatter'
        };

        const layout = {
            title: 'Drug Combination Synergy Overview',
            height: 800,
            xaxis: { title: 'Drug 1', automargin: true, tickangle: -45 },
            yaxis: { title: 'Drug 2', automargin: true },
            hovermode: 'closest',
            showlegend: true, // Use a legend to identify the fixed-color groups
            margin: { l: 120, r: 150, b: 120, t: 80 }
        };

        Plotly.newPlot(containerId, [synergisticTrace, antagonisticTrace, ineffectiveTrace], layout, {responsive: true});

    } catch (error) {
        console.error("Failed to create HSA Bubble Plot:", error);
        container.innerHTML = `<p class="text-red-500 text-center p-4">Could not draw the bubble plot. Please check the console and data files.</p>`;
    }
}