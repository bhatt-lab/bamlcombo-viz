import pandas as pd
import plotly.express as px
import numpy as np # Import numpy for scaling
import os

def create_static_plots():
    """
    Generates enhanced static SVG plots with better scaling and box plots.
    """
    print("--- Starting static plot generation (final aesthetic version) ---")

    # --- Configuration ---
    hsa_json_path = 'data/summary/HSA_summary.json'
    combo_dss_json_path = 'data/summary/baml_ida_predictions.json'
    output_dir = 'img'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # --- 1. Generate HSA Synergy Bubble Plot ---
    try:
        print(f"\nProcessing HSA Synergy data from: {hsa_json_path}")
        hsa_df = pd.read_json(hsa_json_path)
        hsa_df[['Drug1', 'Drug2']] = hsa_df['Combination'].str.split(' - ', expand=True)
        hsa_df = hsa_df.dropna(subset=['Drug1', 'Drug2', 'median_CI'])
        
        # --- ENHANCEMENT: Bubble Size Scaling ---
        # We use a square root scaling to make smaller bubbles more visible
        # without letting the largest bubbles become too dominant.
        abs_synergy = hsa_df['median_CI'].abs()
        hsa_df['synergy_size'] = np.sqrt(abs_synergy) * 25 + 5

        fig_bubble = px.scatter(
            hsa_df,
            x='Drug1',
            y='Drug2',
            size='synergy_size',
            color='median_CI',
            color_continuous_scale='RdBu',
            hover_name='Combination',
            hover_data={'synergy_size': False, 'median_CI': ':.2f'},
            title='HSA Synergy Scores for Drug Combinations'
        )
        
        fig_bubble.update_layout(
            xaxis_title="Drug 1",
            yaxis_title="Drug 2",
            xaxis={'tickangle': -45, 'automargin': True, 'showgrid': False},
            yaxis={'automargin': True, 'showgrid': False},
            coloraxis_colorbar={'title': 'Synergy Score'},
            plot_bgcolor='white',
            paper_bgcolor='white',
            font=dict(family="Arial, sans-serif", size=12),
            title=dict(x=0.5, font=dict(size=20))
        )

        bubble_plot_path = os.path.join(output_dir, 'hsa_synergy_bubble_plot.svg')
        fig_bubble.write_image(bubble_plot_path, width=1000, height=800)
        print(f"✅ Successfully created bubble plot at: {bubble_plot_path}")

    except Exception as e:
        print(f"❌ Error creating bubble plot: {e}")

    # --- 2. Generate Combination DSS Plot with Boxes ---
    try:
        print(f"\nProcessing Combination DSS data from: {combo_dss_json_path}")
        combo_df = pd.read_json(combo_dss_json_path)
        combo_df = combo_df.dropna(subset=['Combination', 'Mean_Combo_s_dss'])

        # --- ENHANCEMENT: Use a Box Plot with Jittered Points ---
        # This will render the box-and-whisker plot clearly, showing the
        # median, quartiles, and outliers, with individual points overlaid.
        fig_box = px.box(
            combo_df,
            x='Combination',
            y='Mean_Combo_s_dss',
            points='all', # This overlays the swarm of points on the box
            title='Predicted Combination DSS',
            labels={'Combination': 'Drug Combination', 'Mean_Combo_s_dss': 'Mean Combo DSS'}
        )

        fig_box.update_layout(
            xaxis={'tickangle': -60, 'automargin': True, 'showgrid': False},
            yaxis={'zeroline': False, 'showgrid': False},
            plot_bgcolor='white',
            paper_bgcolor='white',
            font=dict(family="Arial, sans-serif", size=12),
            title=dict(x=0.5, font=dict(size=20))
        )
        
        swarm_plot_path = os.path.join(output_dir, 'combo_dss_swarm_plot.svg')
        fig_box.write_image(swarm_plot_path, width=1200, height=700)
        print(f"✅ Successfully created swarm/box plot at: {swarm_plot_path}")

    except Exception as e:
        print(f"❌ Error creating swarm plot: {e}")

    print("\n--- Static plot generation complete! ---")


if __name__ == "__main__":
    create_static_plots()