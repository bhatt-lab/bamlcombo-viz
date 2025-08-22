// js/main.js

// --- Main script to load data, create plots, and initialize tabs ---

document.addEventListener('DOMContentLoaded', function() {
    const csvFilePath = '../data/clinical_summary.csv';

    // Use Papa Parse to fetch and parse the CSV file ONCE for the whole app
    Papa.parse(csvFilePath, {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("CSV data loaded and parsed:", results.data);
            
            // --- Pass the loaded data to all relevant components ---
            createPlots(results.data);
            
            // Call the clinical tab initializer and pass the data to it
            if (typeof initializeClinicalTab === 'function') {
                initializeClinicalTab(results.data);
            } else {
                console.error("initializeClinicalTab function not found. Make sure clinical.js is loaded correctly before main.js.");
            }
        },
        error: function(error) {
            console.error("Error parsing CSV file:", error);
            document.getElementById('plots-container').innerHTML = `<p class="text-red-500 text-center col-span-2">Error: Could not load or parse ${csvFilePath}. Please ensure the file exists and you are using a local web server.</p>`;
        }
    });

    // --- Tab Switching Logic (now the single source of truth) ---
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Activate the clicked tab and its corresponding content
            tab.classList.add('active');
            const contentId = 'content-' + tab.id.split('-')[1];
            document.getElementById(contentId).classList.add('active');
        });
    });
});

// --- Data Processing and Plotting Function (Unchanged) ---
function createPlots(data) {
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

    // 1. Gender Distribution Plot
    const genderCounts = getValueCounts(data, 'gender');
    const genderData = [{
        values: Object.values(genderCounts),
        labels: Object.keys(genderCounts),
        type: 'pie',
        hole: 0.3,
        textinfo: 'percent+label',
        hoverinfo: 'label+value+percent',
        marker: { colors: ['#FEBFB3', '#E1BEE7', '#B3E5FC'] }
    }];
    const genderLayout = { title: 'Gender Distribution' };
    Plotly.newPlot('gender-plot', genderData, genderLayout, {responsive: true});

    // 2. Vital Status Plot
    const vitalCounts = getValueCounts(data, 'vitalStatus');
    const vitalData = [{
        values: Object.values(vitalCounts),
        labels: Object.keys(vitalCounts),
        type: 'pie',
        hole: 0.3,
        textinfo: 'percent+label',
        hoverinfo: 'label+value+percent',
        marker: { colors: ['#C8E6C9', '#FFECB3', '#D1C4E9'] }
    }];
    const vitalLayout = { title: 'Patient Vital Status' };
    Plotly.newPlot('vital-plot', vitalData, vitalLayout, {responsive: true});

    // 3. Age at Diagnosis Plot
    const ages = data.map(row => row.ageAtDiagnosis).filter(age => age !== null && !isNaN(age));
    const ageData = [{
        x: ages,
        type: 'histogram',
        nbinsx: 20,
        marker: { color: '#636EFA' }
    }];
    const ageLayout = {
        title: 'Distribution of Age at Diagnosis',
        xaxis: { title: 'Age at Diagnosis' },
        yaxis: { title: 'Number of Patients' },
        bargap: 0.1
    };
    Plotly.newPlot('age-plot', ageData, ageLayout, {responsive: true});

    // 4. FAB Subtype Plot
    const fabCounts = getValueCounts(data, 'FAB_subtype');
    const sortedFab = Object.entries(fabCounts).sort(([,a],[,b]) => a-b);
    const fabData = [{
        y: sortedFab.map(item => item[0]),
        x: sortedFab.map(item => item[1]),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: sortedFab.map(item => item[1]),
            colorscale: 'Viridis'
        }
    }];
    const fabLayout = {
        title: 'FAB Subtype Distribution',
        xaxis: { title: 'Number of Patients' },
        yaxis: { title: 'FAB Subtype' }
    };
    Plotly.newPlot('fab-plot', fabData, fabLayout, {responsive: true});
}