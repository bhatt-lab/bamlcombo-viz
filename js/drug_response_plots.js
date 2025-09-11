// js/drug_response_plots.js - Corrected to handle JSON data keys correctly

function initializeDrugResponseTab(hsaData, comboDssData) {
    const bubbleContainerId = 'hsa-bubble-plot-container';
    const swarmContainerId = 'drug-swarm-plot-container';

    if (!hsaData || !comboDssData) {
        console.error("Drug Response Error: One or more required datasets are missing.");
        document.getElementById(bubbleContainerId).innerHTML = `<p class="text-red-500">Error: HSA data not loaded.</p>`;
        document.getElementById(swarmContainerId).innerHTML = `<p class="text-red-500">Error: Combo DSS data not loaded.</p>`;
        return;
    }

    createHsaBubblePlot(hsaData, bubbleContainerId);
    createSwarmPlot(comboDssData, swarmContainerId);
}

function createHsaBubblePlot(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = ''; 

    try {
        const trace = {
            x: data.map(d => d.Drug1),
            y: data.map(d => d.Drug2),
            // FIX: Use "HSA Synergy" (with a space) as the key. JSON keys with spaces must be accessed with bracket notation.
            text: data.map(d => `Synergy: ${d["HSA Synergy"].toFixed(2)}`),
            mode: 'markers',
            marker: {
                size: data.map(d => Math.abs(d["HSA Synergy"]) * 20),
                color: data.map(d => d["HSA Synergy"]),
                colorscale: 'RdBu',
                cmin: -10,
                cmax: 10,
                showscale: true
            }
        };

        const layout = {
            title: 'HSA Synergy Scores for Drug Combinations',
            xaxis: { title: 'Drug 1', automargin: true },
            yaxis: { title: 'Drug 2', automargin: true },
            hovermode: 'closest'
        };

        Plotly.newPlot(containerId, [trace], layout, {responsive: true});
    } catch (error) {
        console.error("Failed to create HSA Bubble Plot. Check data structure:", error);
        container.innerHTML = `<p class="text-red-500 text-center">Could not draw bubble plot. The 'HSA_summary.json' file may have an unexpected format.</p>`;
    }
}

function createSwarmPlot(data, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    try {
        const trace = {
            // FIX: Use "Predicted DSS" (with a space) as the key.
            y: data.map(d => d["Predicted DSS"]),
            x: data.map(d => d.Drug),
            mode: 'markers',
            type: 'box',
            boxpoints: 'all',
            jitter: 0.5,
            pointpos: 0,
            marker: { color: '#1f77b4', size: 8 },
            box: { visible: true },
            meanline: { visible: true }
        };

        const layout = {
            title: 'Predicted Combination DSS by Drug',
            yaxis: { title: 'Predicted Combination DSS', zeroline: false },
            xaxis: { title: 'Drug', automargin: true },
            showlegend: false
        };

        Plotly.newPlot(containerId, [trace], layout, {responsive: true});
    } catch(error) {
        console.error("Failed to create Swarm Plot. Check data structure:", error);
        container.innerHTML = `<p class="text-red-500 text-center">Could not draw swarm plot. The 'baml_ida_predictions.json' file may have an unexpected format.</p>`;
    }
}