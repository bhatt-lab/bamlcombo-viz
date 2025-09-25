// js/drug_response_plots.js - Final version with a continuous colorscale

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
 * Creates the interactive HSA Synergy bubble plot with the final color logic.
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

        const effectiveData = plotData.filter(d => d.synergy >= 0);
        const ineffectiveData = plotData.filter(d => d.synergy < 0);

        const maxSynergy = Math.max(...effectiveData.map(d => d.synergy), 1);

        // --- Trace for effective combinations (synergy >= 0) ---
        const effectiveTrace = {
            x: effectiveData.map(d => d.drug1),
            y: effectiveData.map(d => d.drug2),
            text: effectiveData.map(d => `Combination Index: ${d.synergy.toFixed(2)}`),
            name: 'Effective',
            mode: 'markers',
            marker: {
                size: 15,
                color: effectiveData.map(d => d.synergy),
                // --- CHANGE 1: Use a continuous sequential colorscale ---
                colorscale: 'Viridis',
                reversescale: true, // Reverse so low values are brighter
                cmin: 0,
                cmax: maxSynergy,
                showscale: true,
                colorbar: {
                    title: 'Combination Index',
                    // --- CHANGE 2: Update tick labels for the new scale ---
                    tickvals: [0, 1, maxSynergy],
                    ticktext: ['Low (0)', 'Medium (1)', `High (${maxSynergy.toFixed(1)})`]
                }
            },
            type: 'scatter'
        };

        // --- Trace for ineffective combinations (synergy < 0) ---
        const ineffectiveTrace = {
            x: ineffectiveData.map(d => d.drug1),
            y: ineffectiveData.map(d => d.drug2),
            text: ineffectiveData.map(d => `Combination Index: ${d.synergy.toFixed(2)} (Not Effective)`),
            name: 'Not Effective',
            mode: 'markers',
            marker: {
                size: 15,
                color: 'tomato',
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
            showlegend: false,
            margin: { l: 120, r: 150, b: 120, t: 80 }
        };

        Plotly.newPlot(containerId, [effectiveTrace, ineffectiveTrace], layout, {responsive: true});

    } catch (error) {
        console.error("Failed to create HSA Bubble Plot:", error);
        container.innerHTML = `<p class="text-red-500 text-center p-4">Could not draw the bubble plot. Please check the console and data files.</p>`;
    }
}