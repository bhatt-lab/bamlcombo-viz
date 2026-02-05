// js/drug_response_plots.js - Final version with new colorscale and non-overlapping legend

/**
 * Initializes the drug response tab, creating the interactive synergy plot.
 */
function initializeDrugResponseTab(combinationIndexData, comboDssData) {
    const bubbleContainerId = 'hsa-bubble-plot-container';

    if (!Array.isArray(combinationIndexData) || combinationIndexData.length === 0) {
        console.error("Drug Response Error: Combination Index data is not a valid array or is empty.");
        document.getElementById(bubbleContainerId).innerHTML = `<p class="text-red-500 text-center p-4">Error: Combination Index data could not be loaded or is empty.</p>`;
        return;
    }

    createHsaBubblePlot(combinationIndexData, bubbleContainerId);
}

/**
 * Creates the interactive HSA Synergy bubble plot with a gradient for values 0-1
 * and a fixed color for values > 1, while preserving hover information.
 */
/*
function createHsaBubblePlot(data, containerId) {
    const plotDiv = document.getElementById(containerId);
    plotDiv.innerHTML = ''; // Clear loading message

    try {
        const plotData = data
            .filter(d => d.Drug1 && d.Drug2 && d.median_CI != null && d.median_CI !== "Inf" && d.Median_dss != null)
            .map(d => ({
                drug1: d.Drug1,
                drug2: d.Drug2,
                synergy: parseFloat(d.median_CI),
                median_dss: parseFloat(d.Median_dss),
                class1: d.Class1,
                class2: d.Class2,
                percentSample: d.percentSample,
                n: d.n
            }))
            .filter(d => !isNaN(d.synergy) && !isNaN(d.median_dss));

        if (plotData.length === 0) {
            throw new Error("No valid data for the bubble plot after cleaning.");
        }

        const allDrugs = [...new Set(data.flatMap(d => [d.Drug1, d.Drug2]).filter(d => d))].sort();

        // Use a size multiplier that scales better
        // Base size calculation: ensure minimum visible size and proper scaling
        const baseSize = 5; // Minimum size for smallest value
        const sizeMultiplier = 20; // Multiplier for size scaling (reduced from 40)
        const calculateSize = (dss) => baseSize + (dss * sizeMultiplier);

        // Main data trace
        const trace = {
            x: plotData.map(d => d.drug1),
            y: plotData.map(d => d.drug2),
            text: plotData.map(d => 
                `Combination: ${d.drug1} - ${d.drug2}\
                <br>Class: ${d.class1} - ${d.class2}\
                <br>Median CR: ${d.synergy.toFixed(2)}\
                <br>Median DSS: ${d.median_dss.toFixed(2)}\
                <br>% Sample (CR>1): ${d.percentSample}\
                <br>n: ${d.n}`
            ),
            mode: 'markers',
            marker: {
                color: plotData.map(d => d.synergy),
                size: plotData.map(d => calculateSize(d.median_dss)),
                sizemode: 'diameter',
                sizeref: 1, // Reference size for scaling
                sizemin: baseSize,
                showscale: true,
                colorscale: 'Viridis',
                cmin: 0,
                cmax: 3,
                colorbar: {
                    title: {
                        text: 'Median CR (HSA)',
                        font: {
                            size: 10
                        },
                        side: 'right'
                    },
                    thickness: 10, 
                    len: 0.5,
                    x: 1.08,
                    xanchor: 'left',
                    y: 0.5,
                    yanchor: 'middle'
                },
            },
            type: 'scatter',
            hoverinfo: 'text',
            name: 'Combinations',
            showlegend: false
        };

        // Create legend traces for Median DSS sizes - show actual marker sizes without toggle
        const legendDssValues = [1.0, 0.5, 0.1];
        
        // Create legend traces positioned off the main plot to show actual marker sizes
        // Use the exact same sizing parameters as the main trace to ensure legend matches plot
        const legendTraces = legendDssValues.map((dssValue) => {
            // Position at the last drug - they'll overlap but that's fine for legend purposes
            const positioningDrug = allDrugs[allDrugs.length - 1];
            const markerSize = calculateSize(dssValue);
            return {
                x: [positioningDrug],
                y: [positioningDrug],
                mode: 'markers',
                marker: {
                    size: [markerSize],
                    sizemode: 'diameter', // Must match main trace
                    sizeref: 1, // Must match main trace
                    sizemin: baseSize, // Must match main trace
                    color: 'rgba(100, 100, 100, 0.6)',
                    line: {
                        color: 'rgba(80, 80, 80, 0.8)',
                        width: 1.5
                    }
                },
                type: 'scatter',
                name: `Median DSS = ${dssValue}`,
                showlegend: true,
                legendgroup: 'dss_size',
                hoverinfo: 'skip',
                visible: 'legendonly' // Only show in legend, not on plot, to display actual marker sizes
            };
        });
        
        const plotLayout = {
            title: 'Drug Combinations Overview',
            font: {
                family: 'Inter, sans-serif',
                size: 12,
                color: '#34495e'
            },
            titlefont: {
                size: 18,
                color: '#2c3e50'
            },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#fff',
            margin: { l: 100, r: 200, b: 100, t: 60 },
            height: 800, // Increase vertical size
            xaxis: { 
                title: 'Drugs', 
                automargin: true, 
                tickangle: -45,
                categoryorder: 'array',
                categoryarray: allDrugs,
                showgrid: true
            },
            yaxis: { 
                title: 'Drugs', 
                automargin: true,
                categoryorder: 'array',
                categoryarray: allDrugs,
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(128, 128, 128, 0.2)',
                showticklabels: true,
                // For categorical axes, ensure all categories show gridlines
                tickmode: 'array',
                tickvals: allDrugs,
                ticktext: allDrugs
            },
            hovermode: 'closest',
            legend: {
                x: 1.02,
                y: 0.15,
                xanchor: 'left',
                yanchor: 'top',
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                bordercolor: 'rgba(0, 0, 0, 0.3)',
                borderwidth: 1,
                font: {
                    size: 11,
                    family: 'Inter, sans-serif'
                },
                title: {
                    text: 'Median DSS',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif'
                    }
                },
                itemclick: false, // Disable toggle effect
                itemdoubleclick: false // Disable double-click toggle
            }
        };

        // Combine main trace with legend traces
        const allTraces = [trace, ...legendTraces];

        Plotly.react(plotDiv, allTraces, plotLayout, { responsive: true });

    } catch (error) {
        console.error("Failed to create HSA Bubble Plot:", error);
        plotDiv.innerHTML = `<p class="text-red-500 text-center p-4">Could not draw the bubble plot. Please check the console and data files.</p>`;
    }
} */

function createHsaBubblePlot(data, containerId) {
    const plotDiv = document.getElementById(containerId);
    plotDiv.innerHTML = ''; // Clear loading message

    try {
        const plotData = data
            .filter(d => d.Drug1 && d.Drug2 && d.median_CI != null && d.median_CI !== "Inf" && d.Median_dss != null)
            .map(d => ({
                drug1: d.Drug1,
                drug2: d.Drug2,
                medianCI: parseFloat(d.median_CI),
                medianDSS: parseFloat(d.Median_dss),
                yPlot: Math.min(d.median_CI, 3.1), // Cap y-axis values at 3 for plotting
                class1: d.Class1,
                class2: d.Class2,
                percentSample: parseFloat(d.percentSample),
                n: d.n
            }))
            .filter(d => !isNaN(d.medianCI) && !isNaN(d.medianDSS));

        if (plotData.length === 0) {
            throw new Error("No valid data for the scatter plot after cleaning.");
        }

        // Main scatter plot trace
        const trace = {
            x: plotData.map(d => d.medianDSS),
            y: plotData.map(d => d.yPlot),
            text: plotData.map(d => 
                `Combination: ${d.drug1} - ${d.drug2}\
                <br>Class: ${d.class1} - ${d.class2}\
                <br>Median DSS: ${d.medianDSS.toFixed(2)}\
                <br>Median CI: ${d.medianCI.toFixed(2)}\
                <br>% Sample (CI>1): ${d.percentSample.toFixed(2)}%\
                <br>n: ${d.n}`
            ),
            mode: 'markers',
            marker: {
                size: plotData.map(d => Math.max(5, Math.sqrt(d.n))), // Size scaled by n with a base size of 5
                color: plotData.map(d => d.percentSample),
                colorscale: 'Portland',
                cmin: 0,
                cmax: 100,
                showscale: true,
                colorbar: {
                    title: {
                        text: '% Sample (CI>1)',
                        font: { size: 12 }
                    },
                    thickness: 12,
                    len: 150,
                    lenmode: 'pixels',
                    x: 1.02,
                    y: 0.5
                },
                line: {
                    width: 1.5,
                    color: 'rgba(30, 30, 30, 0.9)'
                },
                opacity: 0.7
            },
            type: 'scatter',
            hoverinfo: 'text',
            name: 'Drug Combinations',
            showlegend: false
        };

        const plotLayout = {
            title: 'Drug Combination Synergy: CR vs DSS',
            font: {
                family: 'Inter, sans-serif',
                size: 12,
                color: '#34495e'
            },
            //paper_bgcolor: '#fff',
            plot_bgcolor: '#f9f9f9',
            margin: { l: 100, r: 150, b: 70, t: 80 },
            autosize: true,
            xaxis: { 
                title: 'Median DSS (Drug Sensitivity Score)',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(94, 94, 94, 0.1)',
                griddash: 'dot',
                zeroline: false,
                range: [0, 1]
            },
            yaxis: { 
                title: 'Median CR (Combination Ratio)',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(94, 94, 94, 0.1)',
                griddash: 'dot',
                zeroline: true,
                zerolinewidth: 2,
                zerolinecolor: 'rgba(255, 0, 0, 0.3)',

                type: 'log',
                range: [Math.log10(0.2), Math.log10(3.5)],
                tickvals: [0.2, 0.5, 1, 1.5, 2, 3],
                ticktext: ['0.2', '0.5', '1', '1.5', '2', '3'],
                tickfont: { size: 11 }
            },
            hovermode: 'closest',
            shapes: [{
                type: 'line',
                x0: 0, x1: 1,
                y0: 1, y1: 1,  // ← CI=1 is y=0 on log scale (log10(1)=0)
                xref: 'paper', yref: 'y',
                line: {
                    color: 'orange',
                    width: 2,
                    dash: 'dash'
                }
            }, {
                type: 'line',
                x0: 0, x1: 1,
                y0: 3, y1: 3,  // ← Cutoff line at CI=3
                xref: 'paper', yref: 'y',
                line: {
                    color: 'red',
                    width: 2,
                    dash: 'dash'
                }
            }],
            annotations: [{
                x: 0.9, y: Math.log10(3),
                xref: 'paper', yref: 'y',
                text: 'values are capped (CR>3)',
                showarrow: false,
                xanchor: 'center',
                yanchor: 'bottom',
                font: { size: 11, color: 'red' }
            }],

            legend: {
                title: {
                    text: 'Sample Size (n)',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                        color: 'black'
                    }
                },
                y: 0.8,
                itemclick: false,
                itemdoubleclick: false
            }
        };

        const nValues = plotData.map(d => d.n);
        const sizeLegendTraces = [Math.min(...nValues), 100, 200, Math.max(...nValues)].map(n => ({
            x: [null],
            y: [null],
            mode: 'markers',
            marker: {
                size:  Math.max(5, Math.sqrt(n)),
                color: '#000',
                opacity: 1
            },
            name: `n = ${n}`,
            showlegend: true,
            hoverinfo: 'skip'
        }));

        Plotly.react(plotDiv, [trace, ...sizeLegendTraces], plotLayout, { responsive: true });

    } catch (error) {
        console.error("Failed to create scatter plot:", error);
        plotDiv.innerHTML = `<p class="text-red-500 text-center p-4">Could not draw the scatter plot. Please check the console and data files.</p>`;
    }
}