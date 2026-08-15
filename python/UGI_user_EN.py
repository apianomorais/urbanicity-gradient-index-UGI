#!/usr/bin/env python3
"""
Urbanicity Gradient Index (UGI) Calculator - Interactive Version

This program implements the Urbanicity Gradient Index methodology with
a user-friendly interface for adding new localities.

Based on: "Beyond Binary Urban-Rural Classifications: A Continuous Urbanicity Gradient Index"
Authors: X, Y and Z
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
import os
import json
from datetime import datetime
warnings.filterwarnings('ignore')

class UrbanicityGradientIndex:
    """
    Urbanicity Gradient Index Calculator with Interactive Interface
    """
    
    def __init__(self):
        """Initialize the UGI calculator with default parameters."""
        # UGI Parameters (from research paper)
        self.W_N = 40  # Population size weight
        self.W_D = 10  # Population density weight  
        self.W_L = 10  # Distance weight
        self.W_I = 40  # Infrastructure weight
        
        # Population size sigmoid parameters
        self.R_N = 2000    # Inflection point
        self.alpha = 2     # Curve steepness
        
        # Population density exponential parameter
        self.beta = 0.001  # Decay rate
        
        # Distance threshold (km)
        self.distance_threshold = 50
        
        # Infrastructure variables organized by category
        self.infrastructure_categories = {
            'Economic Infrastructure': {
                'Factory': 'Industrial facilities present',
                'Supermarket': 'Large retail stores',
                'Public Market': 'Municipal/public markets',
                'Street Market': 'Street vendors/periodic markets',
                'Grocery/Corner shop': 'Small local stores',
                'Bank': 'Banking services',
                'Drugstore': 'Pharmacies/drug stores'
            },
            'Health Services': {
                'Hospital': 'Hospital facilities',
                'ICU': 'Intensive Care Units',
                'Health Centre': 'Basic health centers',
                'Mobile Medical Service': 'Mobile health services',
                'Private Health Service': 'Private healthcare facilities'
            },
            'Transportation': {
                'Local Airport (<10 km)': 'Small airport within 10km',
                'Medium Airport (<20 km)': 'Medium airport within 20km',
                'Large Airport (< 30 km)': 'Major airport within 30km',
                'Public transportation': 'Buses, metro, public transit',
                'Private transportantion': 'Taxis, ride services',
                'Paved roads': 'Paved road access'
            },
            'Sanitation & Utilities': {
                'Treated Water': 'Treated water supply',
                'Sewage Treatment': 'Sewage treatment system',
                'Waste Collection': 'Garbage collection service',
                'Power grid': 'Electrical grid connection'
            },
            'Communication': {
                'Internet Service': 'Internet connectivity',
                'High-Speed Internet': 'High-speed internet (broadband)',
                'Mobile Service': 'Mobile phone coverage',
                'Postal Service': 'Postal/mail services'
            },
            'Social Infrastructure': {
                'Recreation Facilities': 'Parks, recreational areas',
                'Gastronomy Facilities': 'Restaurants, food services',
                'Sports Facilities': 'Sports complexes, gyms',
                'Religious Centres': 'Churches, religious facilities',
                'Security Infrastructure': 'Police, security services'
            },
            'Education': {
                'Elementary School': 'Primary education facilities',
                'Secondary School': 'Secondary education facilities',
                'University': 'Higher education institutions'
            }
        }
        
        # Flatten infrastructure variables list
        self.infrastructure_variables = []
        for category in self.infrastructure_categories.values():
            self.infrastructure_variables.extend(category.keys())
        
        # Storage for calibration data and weights
        self.calibration_data = None
        self.infrastructure_weights = None
        self.pca_model = None
        self.scaler = None
        self.is_calibrated = False
        
    def display_welcome(self):
        """Display welcome message and instructions."""
        print("\n" + "="*80)
        print("🏙️  URBANICITY GRADIENT INDEX (UGI) CALCULATOR")
        print("="*80)
        print("📄 Based on: 'Beyond Binary Urban-Rural Classifications:'")
        print("   'A Continuous Urbanicity Gradient Index'")
        print("👥 Authors: X, Y and Z")
        print("="*80)
        print("\n📊 This tool calculates urbanicity scores (0-100) using:")
        print("   • Population size and density")
        print("   • Distance to urban centers")  
        print("   • Infrastructure development (37 variables)")
        print("\n🎯 Scores > 50 = Urban characteristics")
        print("🎯 Scores ≤ 50 = Rural characteristics")
        print("="*80)

    def load_calibration_data(self, file_path='data/complete_data.csv'):
        """Load and prepare calibration dataset."""
        print("\n📂 LOADING CALIBRATION DATASET")
        print("-" * 50)
        
        if not os.path.exists(file_path):
            print(f"❌ Calibration file '{file_path}' not found.")
            print("Please ensure the calibration dataset is available.")
            return False
            
        try:
            # Load CSV with standard formatting (comma separator, dot decimal)
            if file_path.endswith('.csv'):
                self.calibration_data = pd.read_csv(file_path, sep=',', decimal='.', encoding='utf-8')
            else:
                self.calibration_data = pd.read_csv(file_path, sep='\t', encoding='utf-8')
            
            print(f"📋 Available columns: {list(self.calibration_data.columns)}")
            
            # Validate required columns - check for exact matches and alternatives
            required_cols = ['Localities', 'Population Size', 'Population Density', 'Distance to Town']
            missing_cols = []
            
            # Check each required column
            for col in required_cols:
                if col not in self.calibration_data.columns:
                    missing_cols.append(col)
            
            if missing_cols:
                print(f"❌ Missing required columns: {missing_cols}")
                print("📋 Please ensure your CSV has these exact column names:")
                for col in required_cols:
                    print(f"   • {col}")
                return False
            
            # Add missing infrastructure columns as zeros
            for var in self.infrastructure_variables:
                if var not in self.calibration_data.columns:
                    self.calibration_data[var] = 0
                    
            print(f"✅ Loaded {len(self.calibration_data)} localities for calibration")
            print(f"✅ Found {len([c for c in self.calibration_data.columns if c in self.infrastructure_variables])} infrastructure variables")
            
            print(f"Python - Linhas: {len(self.calibration_data)}")
            print(f"Python - Primeiras colunas: {list(self.calibration_data.columns[:5])}")
            print(f"Python - Soma primeira variável infraestrutura: {self.calibration_data[self.infrastructure_variables[0]].sum()}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error loading calibration data: {e}")
            return False

    def calibrate_model(self):
        """Calibrate the UGI model using PCA."""
        print("\n⚙️  CALIBRATING UGI MODEL")
        print("-" * 50)
        
        if self.calibration_data is None:
            print("❌ No calibration data loaded.")
            return False
            
        # Prepare data for PCA
        pca_variables = ['Population Size', 'Population Density', 'Distance to Town'] + self.infrastructure_variables
        pca_data = self.calibration_data[pca_variables].copy()
        
        # Standardize the data
        self.scaler = StandardScaler()
        pca_data_scaled = self.scaler.fit_transform(pca_data)
        
        # Perform PCA
        self.pca_model = PCA()
        self.pca_model.fit(pca_data_scaled)
        
        # Get loadings and explained variance
        pc1_loadings = self.pca_model.components_[0]
        pc2_loadings = self.pca_model.components_[1]
        explained_var = self.pca_model.explained_variance_ratio_
        sigma1, sigma2 = explained_var[0], explained_var[1]
        
        print(f"✅ PC1 explains {sigma1*100:.1f}% of variance")
        print(f"✅ PC2 explains {sigma2*100:.1f}% of variance")
        print(f"✅ Combined: {(sigma1+sigma2)*100:.1f}% of variance")
        
        # Calculate infrastructure weights
        self.infrastructure_weights = {}
        infra_importance = {}
        
        for i, var in enumerate(pca_variables):
            if var in self.infrastructure_variables:
                importance = sigma1 * abs(pc1_loadings[i]) + sigma2 * abs(pc2_loadings[i])
                infra_importance[var] = importance
        
        # Normalize weights to sum to W_I (40 points)
        total_importance = sum(infra_importance.values())
        for var in infra_importance:
            self.infrastructure_weights[var] = self.W_I * (infra_importance[var] / total_importance)
            
        self.is_calibrated = True
        print(f"✅ Model calibrated with {len(infra_importance)} infrastructure variables")
        
        return True

    def get_user_input_basic_info(self):
        """Get basic demographic information from user."""
        print("\n📝 ENTER LOCALITY INFORMATION")
        print("-" * 50)
        
        # Get locality name
        while True:
            locality_name = input("🏘️  Locality name: ").strip()
            if locality_name:
                break
            print("Please enter a valid locality name.")
        
        # Get population size
        while True:
            try:
                pop_size = input("👥 Population size: ").strip()
                pop_size = int(pop_size.replace(',', '').replace('.', ''))
                if pop_size > 0:
                    break
                print("Population size must be greater than 0.")
            except ValueError:
                print("Please enter a valid number for population size.")
        
        # Get population density
        while True:
            try:
                pop_density = input("🏠 Population density (people/km²): ").strip()
                pop_density = float(pop_density.replace(',', '.'))
                if pop_density > 0:
                    break
                print("Population density must be greater than 0.")
            except ValueError:
                print("Please enter a valid number for population density.")
        
        # Get distance to urban center
        while True:
            try:
                distance = input("📏 Distance to nearest urban center (km): ").strip()
                distance = float(distance.replace(',', '.'))
                if distance >= 0:
                    break
                print("Distance cannot be negative.")
            except ValueError:
                print("Please enter a valid number for distance.")
        
        return locality_name, pop_size, pop_density, distance

    def get_user_input_infrastructure(self):
        """Get infrastructure information from user with organized categories."""
        print("\n🏗️  INFRASTRUCTURE ASSESSMENT")
        print("-" * 50)
        print("For each infrastructure item, enter:")
        print("• '1' or 'yes' if present")
        print("• '0' or 'no' if absent")
        print("• Press Enter for 'no'")
        print("-" * 50)
        
        infrastructure_data = {}
        
        for category_name, variables in self.infrastructure_categories.items():
            print(f"\n📋 {category_name.upper()}")
            print("─" * 40)
            
            for var, description in variables.items():
                while True:
                    response = input(f"   {var} ({description}): ").strip().lower()
                    
                    if response in ['', '0', 'no', 'n']:
                        infrastructure_data[var] = 0
                        break
                    elif response in ['1', 'yes', 'y']:
                        infrastructure_data[var] = 1
                        break
                    else:
                        print("     Please enter '1'/'yes' for present or '0'/'no' for absent")
        
        return infrastructure_data

    def calculate_ugi_components(self, pop_size, pop_density, distance, infrastructure_data):
        """Calculate individual UGI components."""
        # Population score (sigmoid)
        if pop_size <= 0:
            pop_score = 0
        else:
            log_pop = np.log10(pop_size)
            log_ref = np.log10(self.R_N)
            pop_score = self.W_N / (1 + np.exp(-self.alpha * (log_pop - log_ref)))
            pop_score = min(pop_score, self.W_N)
        
        # Density score (exponential)
        if pop_density <= 0:
            density_score = 0
        else:
            density_score = self.W_D * (1 - np.exp(-self.beta * pop_density))
            density_score = min(density_score, self.W_D)
        
        # Distance score (linear decay)
        if distance >= self.distance_threshold:
            distance_score = 0
        else:
            distance_score = self.W_L * (self.distance_threshold - distance) / self.distance_threshold
            distance_score = max(0, min(distance_score, self.W_L))
        
        # Infrastructure score (weighted sum)
        infra_score = 0
        for var in self.infrastructure_variables:
            presence = infrastructure_data.get(var, 0)
            weight = self.infrastructure_weights.get(var, 0)
            infra_score += presence * weight
        
        infra_score = min(infra_score, self.W_I)
        
        return pop_score, density_score, distance_score, infra_score

    def display_detailed_results(self, locality_name, pop_size, pop_density, distance, 
                               infrastructure_data, pop_score, density_score, distance_score, 
                               infra_score, ugi_score):
        """Display detailed results with analysis."""
        classification = "Urban" if ugi_score > 50 else "Rural"
        
        print("\n" + "="*80)
        print(f"📊 UGI ANALYSIS RESULTS FOR: {locality_name.upper()}")
        print("="*80)
        
        print(f"\n🎯 FINAL UGI SCORE: {ugi_score:.2f}/100")
        print(f"🏷️  CLASSIFICATION: {classification}")
        
        print(f"\n📈 COMPONENT BREAKDOWN:")
        print("─" * 50)
        print(f"👥 Population Size Score:    {pop_score:6.2f}/{self.W_N} ({pop_score/self.W_N*100:.1f}%)")
        print(f"🏠 Population Density Score: {density_score:6.2f}/{self.W_D} ({density_score/self.W_D*100:.1f}%)")
        print(f"📏 Distance Score:          {distance_score:6.2f}/{self.W_L} ({distance_score/self.W_L*100:.1f}%)")
        print(f"🏗️  Infrastructure Score:    {infra_score:6.2f}/{self.W_I} ({infra_score/self.W_I*100:.1f}%)")
        print("─" * 50)
        print(f"🎯 TOTAL UGI SCORE:         {ugi_score:6.2f}/100")
        
        print(f"\n📋 INPUT DATA SUMMARY:")
        print("─" * 50)
        print(f"Population Size:      {pop_size:,} inhabitants")
        print(f"Population Density:   {pop_density:.1f} people/km²")
        print(f"Distance to Urban Center: {distance:.1f} km")
        
        # Show infrastructure summary by category
        print(f"\n🏗️  INFRASTRUCTURE SUMMARY:")
        print("─" * 50)
        for category_name, variables in self.infrastructure_categories.items():
            present_count = sum(infrastructure_data.get(var, 0) for var in variables.keys())
            total_count = len(variables)
            percentage = (present_count / total_count) * 100
            print(f"{category_name:<25}: {present_count:2d}/{total_count:2d} ({percentage:5.1f}%)")
        
        # Show interpretation
        print(f"\n💡 INTERPRETATION:")
        print("─" * 50)
        if ugi_score > 75:
            print("🏙️  High urbanicity - Major urban center characteristics")
        elif ugi_score > 50:
            print("🏘️  Moderate urbanicity - Urban/transitional characteristics") 
        elif ugi_score > 25:
            print("🏡 Low urbanicity - Semi-rural/peri-urban characteristics")
        else:
            print("🌾 Very low urbanicity - Rural characteristics")
            
        print("="*80)

    def save_results_to_file(self, locality_name, results_data):
        """Save results to a file."""
        filename = f"ugi_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(results_data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Results saved to: {filename}")
        except Exception as e:
            print(f"❌ Error saving results: {e}")

    def run_interactive_mode(self):
        """Run the interactive UGI calculator."""
        self.display_welcome()
        
        # Load calibration data
        if not self.load_calibration_data():
            print("\n❌ Cannot proceed without calibration data.")
            return
        
        # Calibrate model
        if not self.calibrate_model():
            print("\n❌ Model calibration failed.")
            return
        
        print("\n✅ UGI Calculator ready!")
        
        while True:
            print("\n" + "="*80)
            print("🎮 MAIN MENU")
            print("="*80)
            print("1. Calculate UGI for a new locality")
            print("2. View infrastructure variable weights")
            print("3. About the UGI methodology") 
            print("4. Exit")
            
            choice = input("\n🔢 Select an option (1-4): ").strip()
            
            if choice == '1':
                self.calculate_new_locality()
            elif choice == '2':
                self.display_weights()
            elif choice == '3':
                self.display_methodology_info()
            elif choice == '4':
                print("\n👋 Thank you for using the UGI Calculator!")
                break
            else:
                print("❌ Invalid option. Please choose 1-4.")

    def calculate_new_locality(self):
        """Calculate UGI for a new locality with full interaction."""
        print("\n" + "🔄"*80)
        print("CALCULATING UGI FOR NEW LOCALITY")
        print("🔄"*80)
        
        # Get basic information
        locality_name, pop_size, pop_density, distance = self.get_user_input_basic_info()
        
        # Get infrastructure information
        infrastructure_data = self.get_user_input_infrastructure()
        
        # Calculate UGI components
        pop_score, density_score, distance_score, infra_score = self.calculate_ugi_components(
            pop_size, pop_density, distance, infrastructure_data
        )
        
        # Calculate final UGI score
        ugi_score = pop_score + density_score + distance_score + infra_score
        
        # Display results
        self.display_detailed_results(
            locality_name, pop_size, pop_density, distance, infrastructure_data,
            pop_score, density_score, distance_score, infra_score, ugi_score
        )
        
        # Ask if user wants to save results
        save_choice = input("\n💾 Save results to file? (y/n): ").strip().lower()
        if save_choice in ['y', 'yes']:
            results_data = {
                'locality_name': locality_name,
                'calculation_date': datetime.now().isoformat(),
                'input_data': {
                    'population_size': pop_size,
                    'population_density': pop_density,
                    'distance_to_urban_center': distance,
                    'infrastructure': infrastructure_data
                },
                'results': {
                    'ugi_score': ugi_score,
                    'classification': "Urban" if ugi_score > 50 else "Rural",
                    'component_scores': {
                        'population': pop_score,
                        'density': density_score,
                        'distance': distance_score,
                        'infrastructure': infra_score
                    }
                }
            }
            self.save_results_to_file(locality_name, results_data)

    def display_weights(self):
        """Display infrastructure variable weights."""
        print("\n📊 INFRASTRUCTURE VARIABLE WEIGHTS")
        print("="*80)
        print("Weights are calculated using Principal Component Analysis")
        print("Higher weights = stronger indicators of urbanicity")
        print("="*80)
        
        # Sort weights by value
        sorted_weights = sorted(self.infrastructure_weights.items(), 
                              key=lambda x: x[1], reverse=True)
        
        print(f"\n{'Rank':<4} {'Variable':<35} {'Weight':<8} {'Category'}")
        print("-" * 80)
        
        for rank, (var, weight) in enumerate(sorted_weights, 1):
            # Find category for this variable
            category = "Unknown"
            for cat_name, variables in self.infrastructure_categories.items():
                if var in variables:
                    category = cat_name
                    break
            
            print(f"{rank:<4} {var:<35} {weight:<8.3f} {category}")

    def display_methodology_info(self):
        """Display information about the UGI methodology."""
        print("\n📚 ABOUT THE UGI METHODOLOGY")
        print("="*80)
        print("The Urbanicity Gradient Index (UGI) provides a continuous measure")
        print("of urbanicity from 0-100, overcoming limitations of binary")  
        print("urban-rural classifications.")
        print("\n🔬 SCIENTIFIC BASIS:")
        print("• Based on Principal Component Analysis of 37 infrastructure variables")
        print("• Validated on 100 localities spanning rural to major metropolitan areas")
        print("• Published research with Cohen's kappa = 1.00 (perfect classification)")
        print("\n📊 UGI COMPONENTS:")
        print(f"• Population Size (max {self.W_N} points): Sigmoid function")
        print(f"• Population Density (max {self.W_D} points): Exponential function")
        print(f"• Distance to Urban Center (max {self.W_L} points): Linear decay")
        print(f"• Infrastructure Development (max {self.W_I} points): Weighted sum")
        print("\n🎯 INTERPRETATION:")
        print("• Scores > 50: Urban characteristics")
        print("• Scores ≤ 50: Rural characteristics")
        print("• Continuous scale captures gradual transitions")
        print("\n📄 REFERENCE:")
        print("Rangel, J.M.L., Morais, A.F. & Ramos, M.A.2")
        print("Beyond binary urban-rural classifications: a continuous urbanicity gradient index.")
        print("Front. Urban Rural Plan. 4, 18 (2026)")
        print("https://doi.org/10.1007/s44243-026-00089-2")
        print("="*80)


def main():
    """Main function to run the UGI Calculator."""
    ugi_calculator = UrbanicityGradientIndex()
    ugi_calculator.run_interactive_mode()


if __name__ == "__main__":
    main()