// js/sample_details.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. Get the Sample ID from the URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    
    const header = document.getElementById('details-header');

    if (!sampleId) {
        header.textContent = 'Error: No Sample ID provided';
        return; // Stop if no sample ID
    }
    
    header.textContent = `Details for Sample: ${sampleId}`;

    // --- 2. Lazy Loading Configuration for Tabs ---
    const tabConfig = {
        'tab-clinical': {
            // This tab needs two data files.
            paths: ['data/suppTablesCsv/supptables_s8.combination_details.csv', 'data/suppTablesCsv/supptables_s11.dss_combination.csv'],
            initFunction: initializeClinicalDataTab,
            dataLoaded: false
        },
        'tab-mutations': {
            // Placeholder for future development
            // paths: ['data/mutations.csv'],
            // initFunction: initializeMutationsTab,
            dataLoaded: false
        },
        'tab-drug': {
            // Placeholder for future development
            // paths: ['data/drug_response_curves.csv'],
            // initFunction: initializeDrugResponseTab,
            dataLoaded: false
        }
    };

    // --- 3. Tab Switching Logic ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Visual tab switching
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');
            
            // Lazy-loading data logic
            const config = tabConfig[tab.id];
            if (config && !config.dataLoaded) {
                loadDataForTab(config);
            }
        });
    });

    // --- 4. Data Loading Function ---
    function loadDataForTab(config) {
        console.log(`First time clicking tab. Loading data from:`, config.paths);
        
        // Create an array of promises, one for each file path
        const promises = config.paths.map(path => 
            fetch(path).then(response => {
                if (!response.ok) throw new Error(`Failed to load ${path}`);
                return new Promise((resolve, reject) => {
                    Papa.parse(path, {
                        download: true, header: true, dynamicTyping: true, skipEmptyLines: true,
                        complete: resolve,
                        error: reject
                    });
                });
            })
        );

        // Use Promise.all to wait for all files to be loaded
        Promise.all(promises)
            .then(results => {
                // PapaParse wraps the result, so we extract the data array from each
                const datasets = results.map(res => res.data);
                config.initFunction(datasets); // Call the tab's specific function
                config.dataLoaded = true;      // Mark as loaded
            })
            .catch(error => {
                console.error("Error loading data for tab:", error);
                // You can add error display logic here
            });
    }

    // --- 5. Function to Initialize the Clinical Data Tab ---
    function initializeClinicalDataTab(datasets) {
        const [combinationDetails, dssData] = datasets; // Unpack the two datasets
        const plotContainer = document.getElementById('dss-waterfall-plot-container');

        // --- Step 1: Create the Color Map ---
        const comboToClassMap = {};
        combinationDetails.forEach(row => {
            comboToClassMap[row.Combination] = row.combo_class;
        });

        const uniqueClasses = [...new Set(Object.values(comboToClassMap))];
        const colorScale = Plotly.d3.scale.category10(); // A standard D3 color scale
        const classColorMap = {};
        uniqueClasses.forEach((className, i) => {
            classColorMap[className] = colorScale(i);
        });
        console.log("Generated Color Map:", classColorMap);

        // --- Step 2: Filter and Sort DSS Data ---
        const sampleDssData = dssData.filter(row => row.Sample_ID === sampleId);

        if (sampleDssData.length === 0) {
            plotContainer.innerHTML = `<p class="text-gray-600">No DSS data found for sample '${sampleId}'.</p>`;
            return;
        }

        // Sort in descending order of DSS value
        sampleDssData.sort((a, b) => b.DSS - a.DSS);

        // --- Step 3: Prepare Data for Plotly ---
        const plotData = {
            x: [], // Combination names
            y: [], // DSS values
            hovertext: [], // Custom hover text
            marker: {
                color: [] // Bar colors
            }
        };

        sampleDssData.forEach(row => {
            plotData.x.push(row.Combination);
            plotData.y.push(row.DSS);
            
            const comboClass = comboToClassMap[row.Combination];
            const barColor = classColorMap[comboClass] || '#cccccc'; // Default to grey if class not found
            plotData.marker.color.push(barColor);

            // Create rich hover text
            plotData.hovertext.push(
                `<b>Combination:</b> ${row.Combination}<br>` +
                `<b>DSS:</b> ${row.DSS.toFixed(3)}<br>` +
                `<b>Class:</b> ${comboClass || 'N/A'}`
            );
        });

        // --- Step 4: Create the Plot ---
        const layout = {
            title: `Drug Sensitivity Score (DSS) for Sample ${sampleId}`,
            yaxis: { title: 'DSS (Drug Sensitivity Score)' },
            xaxis: { 
                title: 'Drug Combination',
                type: 'category', // Treat x-axis labels as distinct categories
                tickangle: -45 // Angle the labels if they are long
            },
            margin: { b: 150 } // Add bottom margin to prevent labels from being cut off
        };

        const config = { responsive: true };

        Plotly.newPlot(plotContainer, [{
            ...plotData,
            type: 'bar',
            hoverinfo: 'text' // Use the custom hovertext we created
        }], layout, config);
    }

    // --- 6. Auto-load the default active tab ---
    document.querySelector('.tab.active').click();
});