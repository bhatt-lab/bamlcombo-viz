// js/main.js - Corrected to load JSON files for the Drug Response tab

document.addEventListener('DOMContentLoaded', function() {
    // --- Central Data Loading ---
    const summaryContainer = document.getElementById('content-summary');
    summaryContainer.innerHTML = `<p class="text-center text-gray-500 p-8">Loading all datasets, please wait...</p>`;

    // Define all data file paths, now using .json for the drug data
    const dataPaths = [
        d3.csv("data/S2.Clinical summary.csv"),
        d3.csv("data/S3.Mutation.csv"),
        d3.csv("data/S10&11.DSS.csv"),
        d3.csv("data/S12.GlobalProteomics.csv"),
        d3.json("data/summary/baml_ida_predictions.json"), // CORRECTED PATH AND METHOD
        d3.json("data/summary/HSA_summary.json")           // CORRECTED PATH AND METHOD
    ];

    Promise.all(dataPaths).then(function(data) {
        // Assign all loaded data to a structured object
        const appData = {
            clinical: data[0],
            mutation: data[1],
            dss: data[2],
            proteomics: data[3],
            comboDss: data[4],   // This is now from baml_ida_predictions.json
            hsaSynergy: data[5]  // This is now from HSA_summary.json
        };

        // --- Initialize Dashboard Components ---
        summaryContainer.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-2xl font-semibold text-center mb-6 text-gray-700">Dataset Summary</h3>
                <div id="plots-container" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div id="gender-plot" class="plot-container border rounded-lg p-2"></div>
                    <div id="vital-plot" class="plot-container border rounded-lg p-2"></div>
                    <div id="age-plot" class="plot-container border rounded-lg p-2"></div>
                    <div id="fab-plot" class="plot-container border rounded-lg p-2"></div>
                </div>
            </div>`;
        
        createSummaryPlots(appData.clinical);
        initializeClinicalTab(appData.clinical);
        initCustomPlots(appData); 
        initializeTabs(appData);

    }).catch(function(error) {
        console.error("Fatal Error: Could not load required dashboard data.", error);
        summaryContainer.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Failed to load critical data!</strong>
            <span class="block sm:inline">Please check that all required files are in the 'data' folder and the server is running correctly.</span>
        </div>`;
    });
});

// --- Tab Initialization Logic (Unchanged) ---
function initializeTabs(appData) {
    let drugTabInitialized = false;
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');

            if (tab.id === 'tab-drug' && !drugTabInitialized) {
                if (typeof initializeDrugResponseTab === 'function') {
                    initializeDrugResponseTab(appData.hsaSynergy, appData.comboDss);
                    drugTabInitialized = true;
                } else {
                    console.error("initializeDrugResponseTab function not found.");
                }
            }
        });
    });
}

// --- Summary Plots Function (Unchanged) ---
function createSummaryPlots(clinicalData) {
    const getValueCounts = (data, column) => {
        const counts = {};
        for (const row of data) {
            const value = row[column];
            if (value !== null && value !== undefined && value !== '') {
                counts[value] = (counts[value] || 0) + 1;
            }
        }
        return counts;
    };

    const genderCounts = getValueCounts(clinicalData, 'gender');
    Plotly.newPlot('gender-plot', [{
        values: Object.values(genderCounts),
        labels: Object.keys(genderCounts),
        type: 'pie', hole: 0.3
    }], { title: 'Gender Distribution' }, {responsive: true});

    const vitalCounts = getValueCounts(clinicalData, 'vitalStatus');
    Plotly.newPlot('vital-plot', [{
        values: Object.values(vitalCounts),
        labels: Object.keys(vitalCounts),
        type: 'pie', hole: 0.3
    }], { title: 'Patient Vital Status' }, {responsive: true});

    const ages = clinicalData.map(row => row.ageAtDiagnosis).filter(age => age !== null && !isNaN(age));
    Plotly.newPlot('age-plot', [{
        x: ages,
        type: 'histogram', nbinsx: 20
    }], {
        title: 'Distribution of Age at Diagnosis',
        xaxis: { title: 'Age' }, yaxis: { title: 'Count' }
    }, {responsive: true});

    const fabCounts = getValueCounts(clinicalData, 'FAB_subtype');
    const sortedFab = Object.entries(fabCounts).sort(([,a],[,b]) => a-b);
    Plotly.newPlot('fab-plot', [{
        y: sortedFab.map(item => item[0]),
        x: sortedFab.map(item => item[1]),
        type: 'bar', orientation: 'h'
    }], {
        title: 'FAB Subtype Distribution',
        xaxis: { title: 'Count' }, yaxis: { title: 'Subtype' }
    }, {responsive: true});
}