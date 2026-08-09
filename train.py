import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
import joblib

def train_binary_maternal_model():
    print("Loading data...")
    try:
        df = pd.read_csv('Maternal_Health_Risk_Augmented.csv')
    except FileNotFoundError:
        print("Error: Could not find 'Maternal_Health_Risk_Augmented.csv'.")
        return

    # 1. Clean and Map the Target Variable
    # Strip whitespace and make lowercase to avoid formatting errors
    df['RiskLevel'] = df['RiskLevel'].astype(str).str.strip().str.lower()
    
    # We account for both "low" and "low risk" just in case the CSV is formatted differently
    risk_mapping = {'low risk': 0, 'low': 0, 'high risk': 1, 'high': 1}
    
    # Drop any rows that aren't Low or High (just in case there is stray data)
    df = df[df['RiskLevel'].isin(risk_mapping.keys())]
    
    # Map to 0 (Low Risk) and 1 (High Risk)
    df['RiskLevel'] = df['RiskLevel'].map(risk_mapping)

    # 2. Split Features (X) and Target (y)
    X = df.drop('RiskLevel', axis=1)
    y = df['RiskLevel']

    # 3. Train/Test Split (80% training, 20% testing)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Train the Random Forest
    print("Training Binary Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=100, 
        max_depth=10, 
        random_state=42
    )
    rf_model.fit(X_train, y_train)

    # 5. Evaluate the Model
    predictions = rf_model.predict(X_test)
    prediction_probs = rf_model.predict_proba(X_test)[:, 1] # Get probabilities for ROC-AUC
    
    accuracy = accuracy_score(y_test, predictions)
    roc_auc = roc_auc_score(y_test, prediction_probs)
    
    print(f"\n--- Model Evaluation ---")
    print(f"Accuracy:  {accuracy * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f} (Closer to 1.0 is better)")
    print("\nDetailed Report (0 = Low Risk, 1 = High Risk):")
    print(classification_report(y_test, predictions))

    # 6. Save the Model
    model_filename = 'binary_maternal_rf_model.pkl'
    joblib.dump(rf_model, model_filename)
    print(f"Model successfully saved to {model_filename}")

if __name__ == "__main__":
    train_binary_maternal_model()