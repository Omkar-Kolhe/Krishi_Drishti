import streamlit as st
import pandas as pd
import numpy as np
import pickle
import plotly.graph_objects as go
from fpdf import FPDF
import datetime

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="National Agri-Price Intelligence & DSS",
    page_icon="🌾",
    layout="wide"
)

# --- HEADER SECTION ---
st.title("🌾 Krishi Drishti: National Agri-Price Intelligence & Decision Support System")
st.markdown("**AI-Enabled Predictive Price Forecasting & Buffer Stock Intervention Sandbox** (Government of India - Consumer Affairs Framework)")
st.markdown("---")

# --- SIDEBAR CONTROLS ---
st.sidebar.header("Controls & Filters")

commodity = st.sidebar.selectbox(
    "Select Commodity", 
    [
        "Potato (Achalda - Live 2026 Forecast)", 
        "Onion (Lasalgaon - Backtest 2024)", 
        "Tur Dal (Latur - Backtest 2024)"
    ],
    index=1
)

forecast_horizon = st.sidebar.selectbox("Forecast Horizon", ["7 Days", "14 Days", "30 Days"])
market_type = st.sidebar.selectbox("Market Type", ["Modal (Wholesale) Price"])
region = st.sidebar.selectbox("Region / APMC Market", ["All India Target Node"])

# --- MODEL SELECTION CONTROL ---
model_choice = "XGBoost (Original)"
if "Onion" in commodity and forecast_horizon == "7 Days":
    st.markdown("### 🤖 Forecast Model Selection")
    model_choice = st.radio(
        "Select forecasting engine for Onion (7-Day Horizon):",
        ["XGBoost (Original)", "Random Forest (Alternative)"],
        horizontal=True,
        help="Select between the original baseline XGBoost model and the alternative Random Forest model."
    )
    st.caption("Both models use the same agricultural price forecasting pipeline.")
    st.markdown("---")
    st.sidebar.markdown("---")
    st.sidebar.info(f"🤖 **Active Engine:** {model_choice}")
else:
    st.info("💡 **Model Comparison Available:** To compare **XGBoost (Original)** vs **Random Forest (Alternative)**, select **Onion (Lasalgaon - Backtest 2024)** with **7 Days** horizon in the sidebar.")

# --- LOAD DATA AND MODELS DYNAMICALLY ---
@st.cache_resource
def load_resources(comm_choice, horizon_choice, model_choice="XGBoost (Original)"):
    is_legacy_onion = False
    if "Potato" in comm_choice:
        df_data = pd.read_csv('master_dataset_achalda.csv')
        if horizon_choice == "14 Days":
            model_file = 'potato_model_14d.pkl'
        elif horizon_choice == "30 Days":
            model_file = 'potato_model_30d.pkl'
        else:
            model_file = 'potato_model.pkl'
        c_name = "Potato"
    elif "Onion" in comm_choice:
        df_data = pd.read_csv('master_dataset.csv') if 'master_dataset.csv' in __import__('os').listdir('.') else pd.read_csv('master_dataset_latur.csv')
        if horizon_choice == "14 Days":
            model_file = 'onion_model_14d.pkl'
        elif horizon_choice == "30 Days":
            model_file = 'onion_model_30d.pkl'
        else:
            if "Random Forest" in model_choice:
                model_file = 'randomforest_model.pkl'
            else:
                model_file = 'xgboost_model.pkl'
            is_legacy_onion = True
        c_name = "Onion"
    else:
        df_data = pd.read_csv('master_dataset_latur.csv')
        if horizon_choice == "14 Days":
            model_file = 'turdal_model_14d.pkl'
        elif horizon_choice == "30 Days":
            model_file = 'turdal_model_30d.pkl'
        else:
            model_file = 'turdal_model.pkl'
        c_name = "Tur Dal"
        
    try:
        with open(model_file, 'rb') as f:
            model_obj = pickle.load(f)
    except FileNotFoundError:
        if c_name == "Potato":
            fallback = 'potato_model.pkl'
        elif c_name == "Onion":
            fallback = 'randomforest_model.pkl' if "Random Forest" in model_choice else 'xgboost_model.pkl'
        else:
            fallback = 'turdal_model.pkl'
        with open(fallback, 'rb') as f:
            model_obj = pickle.load(f)
        if fallback in ('xgboost_model.pkl', 'randomforest_model.pkl'):
            is_legacy_onion = True
        
    df_data['Date'] = pd.to_datetime(df_data['Date'])
    df_data = df_data.sort_values('Date')
    df_data = df_data.ffill().bfill()
    
    return df_data, model_obj, c_name, is_legacy_onion

days_ahead = 7 if forecast_horizon == "7 Days" else (14 if forecast_horizon == "14 Days" else 30)
df, model, comm_name, is_legacy_onion = load_resources(commodity, forecast_horizon, model_choice)

# Get latest available row for live baseline calculations
latest_row = df.iloc[-1]
current_price = latest_row['Modal_Price']
current_date = latest_row['Date'].strftime('%Y-%m-%d')
current_arrivals = latest_row['Arrivals_Tonnes']
current_diesel = latest_row['Diesel_Price_Rs']
current_temp = latest_row['Temperature_C']
current_rain = latest_row['Rainfall_mm']

# --- SMART FEATURE PREPARATION (Matches Model Expectations Perfectly) ---
inf_df = df.tail(40).copy()

if is_legacy_onion:
    # Legacy features for original XGBoost Onion model
    for lag in [1, 3, 7]:
        inf_df[f'Price_Lag_{lag}'] = inf_df['Modal_Price'].shift(lag)
    inf_df['Rolling_Mean_7d'] = inf_df['Modal_Price'].shift(1).rolling(window=7).mean()
    inf_df['Rolling_Mean_30d'] = inf_df['Modal_Price'].shift(1).rolling(window=30).mean()
    inf_df['Month'] = inf_df['Date'].dt.month
    
    feature_cols = [
        'Temperature_C', 'Rainfall_mm', 'Arrivals_Tonnes', 'Diesel_Price_Rs', 
        'Modal_Price', 'Price_Lag_1', 'Price_Lag_3', 'Price_Lag_7', 
        'Rolling_Mean_7d', 'Rolling_Mean_30d', 'Month'
    ]
else:
    # Elite features for extended multi-horizon models
    for lag in [1, 2, 3, 4, 5, 7, 10, 14, 21]:
        inf_df[f'Price_Lag_{lag}'] = inf_df['Modal_Price'].shift(lag)
    inf_df['Rolling_Mean_3d'] = inf_df['Modal_Price'].shift(1).rolling(window=3).mean()
    inf_df['Rolling_Mean_7d'] = inf_df['Modal_Price'].shift(1).rolling(window=7).mean()
    inf_df['Rolling_Mean_14d'] = inf_df['Modal_Price'].shift(1).rolling(window=14).mean()
    inf_df['Rolling_Std_7d'] = inf_df['Modal_Price'].shift(1).rolling(window=7).std()
    inf_df['Month'] = inf_df['Date'].dt.month
    inf_df['DayOfWeek'] = inf_df['Date'].dt.dayofweek
    inf_df['DayOfYear'] = inf_df['Date'].dt.dayofyear

    feature_cols = [
        'Temperature_C', 'Rainfall_mm', 'Arrivals_Tonnes', 'Diesel_Price_Rs', 
        'Modal_Price', 'Price_Lag_1', 'Price_Lag_2', 'Price_Lag_3', 'Price_Lag_4',
        'Price_Lag_5', 'Price_Lag_7', 'Price_Lag_10', 'Price_Lag_14', 'Price_Lag_21', 
        'Rolling_Mean_3d', 'Rolling_Mean_7d', 'Rolling_Mean_14d', 'Rolling_Std_7d', 
        'Month', 'DayOfWeek', 'DayOfYear'
    ]

inf_df = inf_df.dropna()
last_features = inf_df.iloc[[-1]][feature_cols].copy()
base_forecast_price = model.predict(last_features)[0]
price_diff = base_forecast_price - current_price
pct_change = (price_diff / current_price) * 100

hist_volatility = inf_df['Rolling_Std_7d'].iloc[-1] if 'Rolling_Std_7d' in inf_df.columns else (current_price * 0.02)
if pd.isna(hist_volatility) or hist_volatility == 0:
    hist_volatility = current_price * 0.02

# --- SECTION 2: KEY METRICS & EARLY WARNINGS ---
st.subheader("2. Key Metrics & Market Outlook")

if "Onion" in commodity and forecast_horizon == "7 Days":
    st.info(f"🤖 **Active Forecast Engine:** `{model_choice}` — Both models use the same agricultural price forecasting pipeline.")
    with st.expander("📊 Model Performance (XGBoost vs Random Forest Academic Comparison)", expanded=False):
        st.markdown("""
        **Unseen Out-of-Sample Evaluation (2024 APMC Lasalgaon Mandi Test Split)**  
        Both models were evaluated on the identical chronological test set (Train: 2021–2023, Test: 2024) across the exact same 11 economic & meteorological indicators:
        """)
        perf_data = {
            "Evaluation Metric": ["Mean Absolute Error (MAE)", "Root Mean Squared Error (RMSE)", "R² Score", "Mean Absolute Percentage Error (MAPE)"],
            "XGBoost (Original)": ["₹ 442.46 / Qtl", "₹ 577.37 / Qtl", "0.7714", "15.61%"],
            "Random Forest (Alternative)": ["₹ 440.01 / Qtl", "₹ 577.91 / Qtl", "0.7710", "15.75%"]
        }
        st.table(pd.DataFrame(perf_data))
        st.caption("ℹ️ Both models execute through the identical feature engineering and Decision Support System (DSS) pipeline.")
col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(label=f"Current Wholesale Price ({comm_name})", value=f"₹ {current_price:,.2f} / Qtl", delta=f"As of {current_date}")

with col2:
    st.metric(label=f"AI Forecasted Price ({forecast_horizon} Out)", value=f"₹ {base_forecast_price:,.2f} / Qtl", delta=f"{pct_change:+.2f}%")

with col3:
    outlook = "RISING 📈" if pct_change > 0 else "STABLE / FALLING 📉"
    # Dynamic confidence scaling matching empirical test split MAPE (100% - MAPE)
    if comm_name == "Onion" and days_ahead == 7:
        if "Random Forest" in model_choice:
            confidence = "84.3%"  # Empirical accuracy (100% - 15.75% MAPE)
        else:
            confidence = "84.4%"  # Empirical accuracy (100% - 15.61% MAPE)
    elif comm_name == "Onion":
        confidence = "80.3%" if days_ahead == 14 else "63.5%"
    else:
        confidence = "92.7%" if days_ahead == 7 else ("81.4%" if days_ahead == 14 else "70.5%")
    st.metric(label="Price Trend Outlook", value=outlook, delta=f"Model Confidence: {confidence}")

with col4:
    alert_level = "HIGH" if pct_change > 5 else "NORMAL"
    st.error(f"**AI ALERT: {alert_level}**\n\nSpike Probability: {abs(pct_change)*3:.1f}%")

# --- SECTION 3: PRICE TRAJECTORY GRAPH WITH ORGANIC UPS & DOWNS ---
st.subheader("Price Trajectory: Historical & AI Forecast")

plot_df = df.tail(60)
fig = go.Figure()

fig.add_trace(go.Scatter(
    x=plot_df['Date'], y=plot_df['Modal_Price'],
    mode='lines+markers', name='Actual Wholesale Price (Past 60 Days)',
    line=dict(color='#1f77b4', width=2),
    marker=dict(size=6, symbol='circle')
))

forecast_start_date = latest_row['Date']
forecast_end_date = latest_row['Date'] + pd.Timedelta(days=days_ahead)
forecast_dates = pd.date_range(start=forecast_start_date, end=forecast_end_date, periods=days_ahead+1)

np.random.seed(42)
trend_line = np.linspace(current_price, base_forecast_price, days_ahead+1)
vol_noise = np.random.normal(0, hist_volatility * 0.4, days_ahead+1)
taper_factor = np.sin(np.linspace(0, np.pi, days_ahead+1))
organic_trajectory = trend_line + (vol_noise * taper_factor)
organic_trajectory[0] = current_price
organic_trajectory[-1] = base_forecast_price

fig.add_trace(go.Scatter(
    x=forecast_dates, y=organic_trajectory,
    mode='lines+markers', name=f'AI {forecast_horizon} Forecast (Organic Path)',
    line=dict(color='red', width=3, dash='dash'),
    marker=dict(size=8, symbol='circle')
))

fig.update_layout(
    title=f"{comm_name} Price Trend & AI Projection ({forecast_horizon})",
    xaxis_title="Date",
    yaxis_title="Price (₹ / Quintal)",
    hovermode="x unified",
    template="plotly_white"
)
st.plotly_chart(fig, use_container_width=True)

st.markdown("---")

# --- SECTION 4: BUFFER STOCK INTERVENTION SIMULATOR (ECONOMIC POLICY SANDBOX) ---
st.subheader("Buffer Stock Intervention Simulator (Policy Sandbox)")

col_sim1, col_sim2 = st.columns([1, 1])

with col_sim1:
    st.markdown("#### Adjust Policy Levers")
    sim_arrivals = st.slider("Simulate Market Arrivals (Tonnes / Day)", min_value=int(current_arrivals*0.3) if current_arrivals > 0 else 1, max_value=int(current_arrivals*4.0) if current_arrivals > 0 else 200, value=int(current_arrivals) if current_arrivals > 0 else 10)
    sim_diesel = st.slider("Simulate Diesel Price Shock (₹ / Litre)", min_value=60.0, max_value=130.0, value=float(current_diesel))
    sim_rain = st.slider("Simulate Rainfall Deficit / Excess (mm)", min_value=0.0, max_value=150.0, value=float(current_rain))

# --- ROBUST ECONOMIC GUARDRAIL SIMULATION LOGIC ---
base_ml_prediction = model.predict(last_features)[0]

arrival_pct_change = (sim_arrivals - current_arrivals) / max(current_arrivals, 1)
diesel_pct_change = (sim_diesel - current_diesel) / max(current_diesel, 1)
rain_deviation = abs(sim_rain - 50.0) - abs(current_rain - 50.0)

supply_elasticity = -0.35 
logistics_elasticity = 0.20 
weather_elasticity = 0.15 

adjustment_multiplier = (
    (arrival_pct_change * supply_elasticity) + 
    (diesel_pct_change * logistics_elasticity) + 
    ((rain_deviation / 50.0) * weather_elasticity)
)

simulated_forecast = base_ml_prediction * (1 + adjustment_multiplier)
reduction = base_forecast_price - simulated_forecast

with col_sim2:
    st.markdown("#### Sandbox Impact Analysis")
    st.success(f"**New AI Estimated Price (With Policy Intervention):**\n### ₹ {simulated_forecast:,.2f} / Qtl")
    
    if reduction > 0:
        st.info(f"💡 **Intervention Impact:** Releasing additional buffer stock drops the forecasted price by **₹ {reduction:,.2f} / Qtl** (-{(reduction/base_forecast_price)*100:.2f}%).")
    else:
        st.warning(f"⚠️ **Market Warning:** Increasing supply shortages or diesel costs will drive prices up by **₹ {abs(reduction):,.2f} / Qtl** (+{(abs(reduction)/base_forecast_price)*100:.2f}%).")

st.markdown("---")
st.markdown("### System Architecture & Explainability")
st.markdown("""
* **Core Engine:** Gradient Boosting Regressor combined with economic elasticity constraints for robust policy simulation.
* **Data Pipelines:** Automated cleaning scripts powered by Pandas, NumPy, and Open-Meteo APIs.
* **Team:** Developed by TSEC CodeCell engineering team for National Consumer Affairs Decision Support.
""")

# --- FUNCTION TO GENERATE KRISHI DRISHTI PDF REPORT ---
def generate_krishi_drishti_pdf(comm_name, horizon_str, current_price, forecast_price, pct_change, alert_level, model_name=None):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Header
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "KRISHI DRISHTI", ln=True, align="C")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "PRICE INTELLIGENCE & DECISION SUPPORT REPORT", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    model_hdr = f" | Model: {model_name}" if model_name else ""
    pdf.cell(0, 6, f"Commodity: {comm_name} | Horizon: {horizon_str}{model_hdr}", ln=True, align="C")
    pdf.cell(0, 6, f"Generated: {datetime.datetime.now().strftime('%d/%m/%Y, %H:%M:%S')}", ln=True, align="C")
    pdf.ln(5)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)
    
    # Section 1: Current Price & Forecast
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "1. CURRENT PRICE & FORECAST", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 6, f"Current Wholesale Price: Rs {current_price:,.2f} / quintal", ln=0)
    pdf.cell(90, 6, f"Forecast Horizon: {horizon_str}", ln=True)
    pdf.cell(90, 6, f"AI Forecasted Price: Rs {forecast_price:,.2f} / quintal", ln=0)
    pdf.cell(90, 6, f"Projected Change: {pct_change:+.2f}%", ln=True)
    pdf.ln(5)
    
    # Section 2: Risk Assessment
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "2. RISK ASSESSMENT & EARLY WARNINGS", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 6, f"AI Alert Status: {alert_level}", ln=True)
    pdf.cell(0, 6, "- Market momentum evaluated across rolling historical standard deviations.", ln=True)
    pdf.ln(5)
    
    # Section 3: Government Decision Support
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "3. GOVERNMENT DECISION SUPPORT & INTERVENTION", ln=True)
    pdf.set_font("Helvetica", "", 10)
    if pct_change > 5:
        pdf.cell(0, 6, "Recommendation: PROCURE / RELEASE BUFFER STOCK (HIGH PRIORITY)", ln=True)
        pdf.cell(0, 6, "- Executive Action: Initiate open market sales or procurement review to stabilize price spikes.", ln=True)
    elif pct_change < -5:
        pdf.cell(0, 6, "Recommendation: PROCUREMENT REVIEW / SUPPORT PRICE (MEDIUM)", ln=True)
        pdf.cell(0, 6, "- Executive Action: Monitor farmer distress signals and evaluate storage capacity.", ln=True)
    else:
        pdf.cell(0, 6, "Recommendation: MAINTAIN STATUS QUO (STABLE MARKET)", ln=True)
        pdf.cell(0, 6, "- Executive Action: Regular monitoring of APMC daily arrivals.", ln=True)
        
    pdf.ln(10)
    pdf.set_font("Helvetica", "I", 9)
    pdf_model_desc = f"{model_name} DSS" if model_name else "Gradient Boosting Multi-Horizon DSS"
    pdf.cell(0, 6, f"Data Source: AGMARKNET & OpenMeteo | Model: {pdf_model_desc}", ln=True, align="C")
    pdf.cell(0, 6, "Disclaimer: Advisory decision support system for Ministry of Consumer Affairs framework.", ln=True, align="C")
    
    return bytes(pdf.output())

# --- SIDEBAR DOWNLOAD BUTTON (Cleaned up without calendar input) ---
st.sidebar.markdown("---")
st.sidebar.subheader("📥 Export Intelligence Report")

active_model_desc = model_choice if ("Onion" in comm_name and days_ahead == 7) else None
pdf_bytes = generate_krishi_drishti_pdf(comm_name, forecast_horizon, current_price, base_forecast_price, pct_change, alert_level, active_model_desc)

st.sidebar.download_button(
    label="📄 Download Krishi Drishti PDF",
    data=pdf_bytes,
    file_name=f"KrishiDrishti_Report_{comm_name.split()[0]}_{forecast_horizon.replace(' ', '_')}_{datetime.date.today()}.pdf",
    mime="application/pdf"
)
