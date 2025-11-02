// js/main.js - Updated to load all new data files for custom plotting

document.addEventListener('DOMContentLoaded', function() {
    // --- Central Data Loading ---
    const summaryContainer = document.getElementById('content-summary');
    summaryContainer.innerHTML = `<p class="text-center text-gray-500 p-8">Loading all datasets, please wait...</p>`;

    // js/main.js - Corrected paths with spaces removed

    const dataPaths = {
        clinical: d3.csv("data/suppTablesCsv/supptables_s2.clinical_summary.csv"),
        mutation: d3.csv("data/S3_Mutation.csv"),
        surfaceAntigen: d3.csv("data/S4_Surface_antigen.csv"),       // <-- CHANGED
        amlFusion: d3.csv("data/S5_Consensus_AML_fusion.csv"),      // <-- CHANGED
        rnaSeq: d3.csv("data/S6_RNA_sequencing_VST.csv"),         // <-- CHANGED
        dssMono: d3.csv("data/S10_DSS-Monotherapy.csv"),
        dssCombo: d3.csv("data/S11_DSS-Combination.csv"),
        proteomics: d3.csv("data/S12_GlobalProteomics.csv"),
        comboDss: d3.json("data/summary/baml_ida_predictions.json"),
        hsaSynergy: d3.json("data/summary/HSA_summary.json"),
    };

    Promise.all(Object.entries(dataPaths).map(([key, promise]) => promise.then(data => ({key, data}))))
        .then(function(results) {
            const appData = results.reduce((acc, {key, data}) => {
                acc[key] = data;
                return acc;
            }, {});

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
        
        // Initialize tab behavior first to ensure content is correctly shown/hidden
        initializeTabs(appData);
        createSummaryPlots(appData.clinical);
        initializeClinicalTab(appData.clinical);
        initCustomPlots(appData);

    }).catch(function(error) {
        console.error("Fatal Error: Could not load required dashboard data.", error);
        summaryContainer.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong class="font-bold">Failed to load critical data!</strong>
            <span class="block sm:inline">Please check that all required files are in the 'data' folder and the server is running correctly.</span>
        </div>`;
    });
});


// --- Tab Initialization and Switching Logic ---
function initializeTabs(appData) {
    let drugTabInitialized = false;
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    // On initial load, ensure only the 'Summary' tab and its content are active.
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    const initialTab = document.getElementById('tab-summary');
    const initialContent = document.getElementById('content-summary');
    initialTab.classList.add('active');
    initialContent.classList.add('active');

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


// --- Summary Plots Function ---
function createSummaryPlots(clinicalData) {
    const plotLayout = {
        height: 400,
        autosize: false,
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
        margin: { t: 50, b: 50, l: 50, r: 50 },
    };

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
        type: 'pie', 
        hole: 0.4,
        marker: { colors: ['#2c3e50', '#e74c3c', '#ecf0f1', '#3498db', '#9b59b6'] }
    }], { ...plotLayout, title: 'Gender Distribution' }, {responsive: true});

    const vitalCounts = getValueCounts(clinicalData, 'vitalStatus');
    Plotly.newPlot('vital-plot', [{
        values: Object.values(vitalCounts),
        labels: Object.keys(vitalCounts),
        type: 'pie', 
        hole: 0.4,
        marker: { colors: ['#2c3e50', '#e74c3c', '#ecf0f1', '#3498db', '#9b59b6'] }
    }], { ...plotLayout, title: 'Patient Vital Status' }, {responsive: true});

    const ages = clinicalData.map(row => parseFloat(row.ageAtDiagnosis)).filter(age => !isNaN(age));
    Plotly.newPlot('age-plot', [{
        x: ages,
        type: 'histogram', 
        nbinsx: 20,
        marker: { color: '#2c3e50' }
    }], {
        ...plotLayout,
        title: 'Distribution of Age at Diagnosis',
        xaxis: { title: 'Age' }, yaxis: { title: 'Count' }
    }, {responsive: true});

    const fabCounts = getValueCounts(clinicalData, 'AML_subtype');
    const sortedFab = Object.entries(fabCounts).sort(([,a],[,b]) => a-b);
    Plotly.newPlot('fab-plot', [{
        y: sortedFab.map(item => item[0]),
        x: sortedFab.map(item => item[1]),
        type: 'bar', 
        orientation: 'h',
        marker: { color: '#2c3e50' }
    }], {
        ...plotLayout,
        title: 'AML Subtype Distribution',
        xaxis: { title: 'Count' }, yaxis: { title: 'Subtype' }
    }, {responsive: true});
}