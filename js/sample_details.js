// js/sample_details.js
// This script controls the behavior of the sample_details.html page.
// It depends on 'js/color_config.js' being loaded first.

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Get the Sample ID from the URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    const header = document.getElementById('details-header');
    const backButton = document.getElementById('back-to-dashboard-btn');

    // Add a click listener to the button
    backButton.addEventListener('click', () => {
        // This command tells the browser to go back one step in its history,
        // preserving the state of the previous page.
        window.history.back();
    });

    if (!sampleId) {
        header.textContent = 'Error: No Sample ID provided';
        console.error("No 'sample' parameter found in the URL.");
        return; // Stop execution if no sample ID is present
    }
    
    header.textContent = `Details for Sample: ${sampleId}`;

    // --- 2. Lazy Loading Configuration for Tabs ---
    // This object maps tab IDs to their data sources and initialization functions.
    // It's designed to be easily extended for the other tabs in the future.
    const tabConfig = {
        'tab-clinical': {
            // The path is now dynamic and will be constructed when needed.
            initFunction: initializeClinicalDataTab,
            dataLoaded: false // Flag to prevent re-loading data
        },
        'tab-mutations': {
            // Placeholder for future development
            // initFunction: initializeMutationsTab,
            dataLoaded: false
        },
        'tab-drug': {
            // Placeholder for future development
            // initFunction: initializeDrugResponseTab,
            dataLoaded: false
        }
    };

    // --- 3. Tab Switching Logic ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Part A: Handle the visual switching of tabs
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');
            
            // Part B: Handle lazy-loading the data for the clicked tab
            const config = tabConfig[tab.id];
            if (config && !config.dataLoaded) {
                // This is a simple way to route to the correct data loading function
                if (tab.id === 'tab-clinical') {
                    loadClinicalData(config);
                }
                // Add 'else if' blocks here for other tabs like 'tab-mutations'
            }
        });
    });

    // --- 4. Specific Data Loader for the Clinical Tab ---
    // This function fetches the pre-processed JSON for the current sample.
    function loadClinicalData(config) {
        const dataPath = `data/dss_by_sample/${sampleId}.json`;
        console.log(`Loading pre-processed data from: ${dataPath}`);
        const plotContainer = document.getElementById('dss-waterfall-plot-container');

        fetch(dataPath)
            .then(response => {
                if (!response.ok) {
                    // This handles cases where a sample ID has no corresponding data file
                    throw new Error(`No DSS data file found for sample '${sampleId}'.`);
                }
                return response.json(); // The response is already JSON, no parsing needed
            })
            .then(data => {
                // The data is already filtered, so we pass it directly to the plotting function
                config.initFunction(data);
                config.dataLoaded = true; // Mark as loaded to prevent future fetches
            })
            .catch(error => {
                console.error("Error loading clinical data:", error);
                plotContainer.innerHTML = `<p class="text-gray-600 text-center">${error.message}</p>`;
            });
    }

    // --- 5. Function to Initialize the Clinical Data Tab Content ---
    // This function receives the pre-filtered data and renders the plot.
    function initializeClinicalDataTab(sampleDssData) {
        const plotContainer = document.getElementById('dss-waterfall-plot-container');

        // Step 1: Use the pre-loaded global config from 'color_config.js'
        const compoundToClassMap = COLOR_CONFIG.compoundToClass;
        const classColorMap = COLOR_CONFIG.classColors;

        // Step 2: The data is already filtered, so we just need to sort it
        if (!sampleDssData || sampleDssData.length === 0) {
            plotContainer.innerHTML = `<p class="text-gray-600 text-center">The data file for this sample is empty.</p>`;
            return;
        }
        sampleDssData.sort((a, b) => b.DSS - a.DSS); // Sort descending

        // Step 3: Prepare data arrays for Plotly
        const plotData = { x: [], y: [], hovertext: [], marker: { color: [] } };
        console.log("--- Starting Final Color Debugging ---");

        sampleDssData.forEach(row => {
            plotData.x.push(row.Combination);
            plotData.y.push(row.DSS);
            // 1. Normalize the combination name from the DSS file.
            const normalizedCompoundName = String(row.Combination).toLowerCase().replace(/\s/g, '');
            
            // 2. Use the normalized name to find the combo class.
            const comboClass = compoundToClassMap[normalizedCompoundName];
            
            // 3. Use the combo class to find the color.
            const barColor = classColorMap[comboClass] || '#cccccc'; // Fallback grey
        
            // Definitive log to see if the lookup is working
            if (barColor === '#cccccc') {
                console.log({
                    status: "Lookup FAILED",
                    original: `"${originalCombinationName}"`,
                    normalized_lookup_key: `"${normalizedCombinationName}"`,
                    found_class: comboClass // Will be undefined
                });
            }
          plotData.marker.color.push(barColor);

            // Create rich hover text
            plotData.hovertext.push(
                `<b>Combination:</b> ${row.Combination}<br>` +
                `<b>DSS:</b> ${row.DSS.toFixed(3)}<br>` +
                `<b>Class:</b> ${comboClass || 'N/A'}`
            );
        });

        // Step 4: Define the layout and create the plot
        const layout = {
            title: `Drug Sensitivity Score (DSS) for Sample ${sampleId}`,
            yaxis: { title: 'DSS (Drug Sensitivity Score)' },
            xaxis: { 
                title: 'Drug Combination',
                type: 'category', // Treat x-axis labels as distinct categories
                tickangle: -45    // Angle the labels if they are long
            },
            margin: { b: 150 } // Add bottom margin to prevent labels from being cut off
        };

        Plotly.newPlot(plotContainer, [{
            ...plotData,
            type: 'bar',
            hoverinfo: 'text' // Use the custom hovertext we created
        }], layout, { responsive: true });

        Plotly.Plots.resize(plotContainer);
    }

    // --- 6. Auto-load the data for the default active tab ---
    // This makes the page feel responsive by loading the first tab's content immediately.
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        activeTab.click();
    }
});