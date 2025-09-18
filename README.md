# bamlcombo-viz
Comprehensive Biological Data Dashboard
This is an interactive, web-based dashboard for exploring clinical biological datasets, inspired by cBioPortal. It is built with HTML, Tailwind CSS, and Plotly.js.

## 🚀 Features
- Interactive Plots: Visualizations for key clinical metrics.

- Tabbed Navigation: Easily switch between different views of the data.

- Client-Side Processing: Reads and processes CSV data directly in the browser.

- Responsive Design: Works on various screen sizes.

## 📁 Repository Structure
```
.
├── data/
│   └── clinical_summary.csv
├── css/
│   └── style.css
├── js/
│   └── main.js
└── index.html
```

## 🛠️ Setup and Local Development

To run this dashboard locally, you need a simple web server to handle file requests due to browser security policies.

### Clone the repository:

```
git clone <your-repo-url>
cd <your-repo-directory>
```

### Place your data:

- Make sure your clinical_summary.csv file is inside the data/ directory.

### Start a local web server:

If you have Python 3, run the following command in the project's root directory:

```
python3 -m http.server
```

### View the dashboard:

- Open your web browser and navigate to `http://localhost:8000`.
