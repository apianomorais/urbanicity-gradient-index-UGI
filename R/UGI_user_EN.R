# Urbanicity Gradient Index (UGI) Calculator - Shiny App
# Based on: Rangel, J.M.L., Morais, A.F. & Ramos, M.A. 
# Beyond binary urban-rural classifications: a continuous urbanicity gradient index. 
# Front. Urban Rural Plan. 4, 18 (2026). https://doi.org/10.1007/s44243-026-00089-2

# Install and load required packages
required_packages <- c(
  "shiny", "shinydashboard", "DT", "plotly", "shinycssloaders", 
  "shinyWidgets", "readr", "dplyr", "ggplot2", "jsonlite", "R6"
)

for(pkg in required_packages) {
  if(!require(pkg, character.only = TRUE)) {
    install.packages(pkg)
    library(pkg, character.only = TRUE)
  }
}

# UGI Calculator Class - Without synthetic data generation
UrbanicityGradientIndex <- R6Class("UrbanicityGradientIndex",
                                   public = list(
                                     # UGI Parameters
                                     W_N = 40,           # Population size weight
                                     W_D = 10,           # Population density weight  
                                     W_L = 10,           # Distance weight
                                     W_I = 40,           # Infrastructure weight
                                     R_N = 2000,         # Population sigmoid inflection point
                                     alpha = 2,          # Population sigmoid steepness
                                     beta = 0.001,       # Density exponential decay rate
                                     distance_threshold = 50,  # Distance threshold (km)
                                     
                                     # Infrastructure categories
                                     infrastructure_categories = list(
                                       "Economic Infrastructure" = list(
                                         "Factory" = "Industrial facilities present",
                                         "Supermarket" = "Large retail stores",
                                         "Public Market" = "Municipal/public markets",
                                         "Street Market" = "Street vendors/periodic markets",
                                         "Grocery/Corner shop" = "Small local stores",
                                         "Bank" = "Banking services",
                                         "Drugstore" = "Pharmacies/drug stores"
                                       ),
                                       "Health Services" = list(
                                         "Hospital" = "Hospital facilities",
                                         "ICU" = "Intensive Care Units",
                                         "Health Centre" = "Basic health centers",
                                         "Mobile Medical Service" = "Mobile health services",
                                         "Private Health Service" = "Private healthcare facilities"
                                       ),
                                       "Transportation" = list(
                                         "Local Airport (<10 km)" = "Small airport within 10km",
                                         "Medium Airport (<20 km)" = "Medium airport within 20km",
                                         "Large Airport (< 30 km)" = "Major airport within 30km",
                                         "Public transportation" = "Buses, metro, public transit",
                                         "Private transportantion" = "Taxis, ride services",
                                         "Paved roads" = "Paved road access"
                                       ),
                                       "Sanitation & Utilities" = list(
                                         "Treated Water" = "Treated water supply",
                                         "Sewage Treatment" = "Sewage treatment system",
                                         "Waste Collection" = "Garbage collection service",
                                         "Power grid" = "Electrical grid connection"
                                       ),
                                       "Communication" = list(
                                         "Internet Service" = "Internet connectivity",
                                         "High-Speed Internet" = "High-speed internet (broadband)",
                                         "Mobile Service" = "Mobile phone coverage",
                                         "Postal Service" = "Postal/mail services"
                                       ),
                                       "Social Infrastructure" = list(
                                         "Recreation Facilities" = "Parks, recreational areas",
                                         "Gastronomy Facilities" = "Restaurants, food services",
                                         "Sports Facilities" = "Sports complexes, gyms",
                                         "Religious Centres" = "Churches, religious facilities",
                                         "Security Infrastructure" = "Police, security services"
                                       ),
                                       "Education" = list(
                                         "Elementary School" = "Primary education facilities",
                                         "Secondary School" = "Secondary education facilities",
                                         "University" = "Higher education institutions"
                                       )
                                     ),
                                     
                                     # Storage variables
                                     calibration_data = NULL,
                                     infrastructure_weights = NULL,
                                     scaler_means = NULL,
                                     scaler_stds = NULL,
                                     pca_components = NULL,
                                     explained_variance_ratio = NULL,
                                     is_calibrated = FALSE,
                                     infrastructure_variables = NULL,
                                     data_loaded = FALSE,
                                     error_message = NULL,
                                     
                                     initialize = function() {
                                       # Flatten infrastructure variables list
                                       self$infrastructure_variables <- c()
                                       for(category in self$infrastructure_categories) {
                                         self$infrastructure_variables <- c(self$infrastructure_variables, names(category))
                                       }
                                     },
                                     
                                     load_calibration_data = function(file_path = NULL, data = NULL) {
                                       if (!is.null(data)) {
                                         self$calibration_data <- data
                                         self$data_loaded <- TRUE
                                         cat("Data loaded from the 'data' parameter\n")
                                       } else if (!is.null(file_path) && file.exists(file_path)) {
                                         # Try to read the file
                                         tryCatch({
                                           self$calibration_data <- read_csv(file_path, locale = locale(encoding = "UTF-8"), show_col_types = FALSE)
                                           self$data_loaded <- TRUE
                                           cat("File", file_path, "uploaded successfully\n")
                                         }, error = function(e) {
                                           self$error_message <- paste("Error reading file:", e$message)
                                           self$data_loaded <- FALSE
                                           cat(self$error_message, "\n")
                                         })
                                       } else {
                                         self$error_message <- paste("File not found:", file_path, "- Please provide a valid data file.")
                                         self$data_loaded <- FALSE
                                         cat(self$error_message, "\n")
                                       }
                                       
                                       # Only proceed if data was successfully loaded
                                       if (self$data_loaded) {
                                         # Add missing infrastructure columns as zeros
                                         for(var in self$infrastructure_variables) {
                                           if(!(var %in% names(self$calibration_data))) {
                                             self$calibration_data[[var]] <- 0
                                           }
                                         }
                                       }
                                       
                                       return(self$data_loaded)
                                     },
                                     
                                     calibrate_model = function() {
                                       if(!self$data_loaded || is.null(self$calibration_data)) {
                                         self$error_message <- "Unable to calibrate model: Calibration data not loaded."
                                         return(FALSE)
                                       }
                                       
                                       # Prepare data
                                       pca_variables <- c("Population Size", "Population Density", "Distance to Town", 
                                                          self$infrastructure_variables)
                                       available_vars <- pca_variables[pca_variables %in% names(self$calibration_data)]
                                       pca_data <- self$calibration_data[available_vars]
                                       pca_data <- na.omit(pca_data)
                                       
                                       # Convert to matrix
                                       X <- as.matrix(pca_data)
                                       
                                       # sklearn StandardScaler exact replication
                                       # fit: calculate mean and std
                                       means <- colMeans(X)
                                       # sklearn uses N denominator for std, not N-1
                                       stds <- sqrt(colMeans(sweep(X, 2, means, "-")^2))
                                       
                                       # transform: standardize
                                       X_scaled <- sweep(X, 2, means, "-")
                                       X_scaled <- sweep(X_scaled, 2, stds, "/")
                                       
                                       # sklearn PCA: uses SVD on mean-centered data
                                       X_centered <- scale(X_scaled, center = TRUE, scale = FALSE)
                                       
                                       # SVD exactly like sklearn
                                       n <- nrow(X_centered)
                                       svd_result <- svd(X_centered / sqrt(n - 1))
                                       
                                       # Components (loadings) - sklearn format
                                       components <- t(svd_result$v)
                                       colnames(components) <- colnames(X_scaled)
                                       
                                       # Explained variance ratio
                                       explained_variance <- svd_result$d^2
                                       explained_variance_ratio <- explained_variance / sum(explained_variance)
                                       
                                       # Extract PC1 and PC2
                                       pc1_loadings <- components[1, ]
                                       pc2_loadings <- components[2, ]
                                       sigma1 <- explained_variance_ratio[1]
                                       sigma2 <- explained_variance_ratio[2]
                                       
                                       # Calculate weights only for infrastructure variables
                                       infra_importance <- list()
                                       
                                       for(var in self$infrastructure_variables) {
                                         if(var %in% names(pc1_loadings)) {
                                           importance <- sigma1 * abs(pc1_loadings[var]) + sigma2 * abs(pc2_loadings[var])
                                           infra_importance[[var]] <- importance
                                         }
                                       }
                                       
                                       # Normalize to W_I (40)
                                       total_importance <- sum(unlist(infra_importance))
                                       
                                       self$infrastructure_weights <- list()
                                       for(var in self$infrastructure_variables) {
                                         if(var %in% names(infra_importance)) {
                                           self$infrastructure_weights[[var]] <- self$W_I * (infra_importance[[var]] / total_importance)
                                         } else {
                                           self$infrastructure_weights[[var]] <- 0
                                         }
                                       }
                                       
                                       self$is_calibrated <- TRUE
                                       return(TRUE)
                                     },
                                     
                                     calculate_ugi_components = function(pop_size, pop_density, distance, infrastructure_data) {
                                       # Population score (sigmoid) 
                                       if(pop_size <= 0) {
                                         pop_score <- 0
                                       } else {
                                         log_pop <- log10(pop_size)
                                         log_ref <- log10(self$R_N)
                                         pop_score <- self$W_N / (1 + exp(-self$alpha * (log_pop - log_ref)))
                                         pop_score <- min(pop_score, self$W_N)
                                       }
                                       
                                       # Density score (exponential)
                                       if(pop_density <= 0) {
                                         density_score <- 0
                                       } else {
                                         density_score <- self$W_D * (1 - exp(-self$beta * pop_density))
                                         density_score <- min(density_score, self$W_D)
                                       }
                                       
                                       # Distance score (linear decay)
                                       if(distance >= self$distance_threshold) {
                                         distance_score <- 0
                                       } else {
                                         distance_score <- self$W_L * (self$distance_threshold - distance) / self$distance_threshold
                                         distance_score <- max(0, min(distance_score, self$W_L))
                                       }
                                       
                                       # Infrastructure score (weighted sum)
                                       infra_score <- 0
                                       for(var in self$infrastructure_variables) {
                                         presence <- ifelse(var %in% names(infrastructure_data), infrastructure_data[[var]], 0)
                                         weight <- ifelse(var %in% names(self$infrastructure_weights), 
                                                          self$infrastructure_weights[[var]], 0)
                                         infra_score <- infra_score + presence * weight
                                       }
                                       infra_score <- min(infra_score, self$W_I)
                                       
                                       return(list(
                                         population = pop_score,
                                         density = density_score,
                                         distance = distance_score,
                                         infrastructure = infra_score,
                                         total = pop_score + density_score + distance_score + infra_score
                                       ))
                                     },
                                     
                                     get_classification = function(ugi_score) {
                                       if(ugi_score > 75) return("Highly Urban")
                                       if(ugi_score > 50) return("Urban")
                                       if(ugi_score > 25) return("Semi-Rural")
                                       return("Rural")
                                     },
                                     
                                     get_infrastructure_summary = function(infrastructure_data) {
                                       summary_data <- data.frame()
                                       
                                       for(category_name in names(self$infrastructure_categories)) {
                                         category_vars <- names(self$infrastructure_categories[[category_name]])
                                         present_count <- sum(sapply(category_vars, function(var) {
                                           ifelse(var %in% names(infrastructure_data), infrastructure_data[[var]], 0)
                                         }))
                                         total_count <- length(category_vars)
                                         percentage <- round((present_count / total_count) * 100, 1)
                                         
                                         summary_data <- rbind(summary_data, data.frame(
                                           Category = category_name,
                                           Present = present_count,
                                           Total = total_count,
                                           Percentage = percentage
                                         ))
                                       }
                                       
                                       return(summary_data)
                                     },
                                     
                                     get_weights_table = function() {
                                       if(!self$is_calibrated) return(NULL)
                                       
                                       weights_data <- data.frame(
                                         Variable = names(self$infrastructure_weights),
                                         Weight = round(unlist(self$infrastructure_weights), 3),
                                         stringsAsFactors = FALSE
                                       )
                                       
                                       # Add categories
                                       weights_data$Category <- sapply(weights_data$Variable, function(var) {
                                         for(cat_name in names(self$infrastructure_categories)) {
                                           if(var %in% names(self$infrastructure_categories[[cat_name]])) {
                                             return(cat_name)
                                           }
                                         }
                                         return("Unknown")
                                       })
                                       
                                       # Sort by weight and add rank
                                       weights_data <- weights_data[order(-weights_data$Weight), ]
                                       weights_data$Rank <- 1:nrow(weights_data)
                                       weights_data <- weights_data[, c("Rank", "Variable", "Category", "Weight")]
                                       
                                       return(weights_data)
                                     }
                                   )
)

# Initialize UGI Calculator
ugi_calc <- UrbanicityGradientIndex$new()

# Try to load calibration data - will fail if file doesn't exist
data_load_success <- ugi_calc$load_calibration_data(file_path = "data/complete_data.csv")

# Only calibrate if data was successfully loaded
if (data_load_success) {
  ugi_calc$calibrate_model()
} else {
  cat("ERROR: Could not load calibration data.\n")
  cat("Error message:", ugi_calc$error_message, "\n")
}

# Create helper function to convert variable names to input IDs
var_to_id <- function(var_name) {
  return(paste0("infra_", gsub("[^A-Za-z0-9]", "_", var_name)))
}

# Define UI
ui <- dashboardPage(
  dashboardHeader(title = "UGI Calculator"),
  
  dashboardSidebar(
    sidebarMenu(
      menuItem("Home", tabName = "home", icon = icon("home")),
      menuItem("Calculate UGI", tabName = "calculator", icon = icon("calculator")),
      menuItem("Results", tabName = "results", icon = icon("chart-line")),
      menuItem("Methodology", tabName = "methodology", icon = icon("book")),
      menuItem("Weights", tabName = "weights", icon = icon("table"))
    )
  ),
  
  dashboardBody(
    tags$head(
      tags$style(HTML("
        .score-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          margin: 10px 0;
        }
        .component-box {
          background: white;
          border-left: 4px solid #3c8dbc;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error-box {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 15px;
          border-radius: 5px;
          margin: 10px 0;
        }
      "))
    ),
    
    tabItems(
      # Home Tab
      tabItem(tabName = "home",
              fluidRow(
                # Show error message if data couldn't be loaded
                if (!data_load_success) {
                  box(width = 12, status = "danger", solidHeader = TRUE,
                      title = "ERROR: Data File Not Found",
                      div(class = "error-box",
                          h4("Calibration file not found!"),
                          p("The application requires the 'complete_data.csv' file to function properly."),
                          p("Specific error:", ugi_calc$error_message),
                          p("Please:"),
                          tags$ul(
                            tags$li("Verify that the 'complete_data.csv' file is in the correct directory"),
                            tags$li("Confirm that the file has the required columns"),
                            tags$li("Check file read permissions")
                          ),
                          p("The application will not work without this data file.")
                      )
                  )
                },
                
                box(width = 12, status = if(data_load_success) "primary" else "warning", 
                    solidHeader = TRUE,
                    title = "Urbanicity Gradient Index (UGI) Calculator",
                    
                    h3("Welcome to the UGI Calculator!"),
                    
                    if (!data_load_success) {
                      div(
                        p(style = "color: red; font-weight: bold;", 
                          "ATTENTION: The application is not functional due to the lack of the calibration data file."),
                        hr()
                      )
                    },
                    
                    p("This application calculates the Urbanicity Gradient Index (UGI), providing a continuous measure 
                of urbanicity from 0-100, overcoming the limitations of traditional binary urban-rural classifications."),
                    
                    h4("What is the UGI?"),
                    p("The UGI is based on four main components:"),
                    tags$ul(
                      tags$li("Population Size (40 points max): Uses a sigmoid function"),
                      tags$li("Population Density (10 points max): Uses an exponential function"),
                      tags$li("Distance to Urban Center (10 points max): Linear decay function"),
                      tags$li("Infrastructure Development (40 points max): Weighted sum of 34 variables")
                    ),
                    
                    h4("Interpretation"),
                    tags$ul(
                      tags$li("Scores > 75: Highly Urban"),
                      tags$li("Scores 51-75: Urban"),
                      tags$li("Scores 26-50: Semi-Rural"),
                      tags$li("Scores ≤ 25: Rural")
                    ),
                    
                    if (data_load_success) {
                      div(
                        h4("How to Use"),
                        p("1. Go to the 'Calculate UGI' tab"),
                        p("2. Enter basic locality information"),
                        p("3. Complete the infrastructure assessment"),
                        p("4. View your results in the 'Results' tab")
                      )
                    } else {
                      div(
                        h4("Status"),
                        p(style = "color: red;", "Application unavailable - required data file not found.")
                      )
                    },
                    
                    br(),
                    p(strong("Reference:"), "X, Y, Z (2025) 'Beyond Binary Urban-Rural Classifications: A Continuous Urbanicity Gradient Index'")
                )
              )
      ),
      
      # Calculator Tab
      tabItem(tabName = "calculator",
              if (!data_load_success) {
                fluidRow(
                  box(width = 12, status = "danger", solidHeader = TRUE,
                        title = "Calculator Unavailable",
                      div(class = "error-box",
                          h4("Unable to use calculator"),
                          p("The calibration data file was not loaded."),
                          p("Please fix the data file issue before using the calculator.")
                      )
                  )
                )
              } else {
                list(
                  fluidRow(
                    box(width = 6, status = "primary", solidHeader = TRUE,
                        title = "Basic Information",
                        textInput("locality_name", "Locality Name:", placeholder = "Enter locality name"),
                        numericInput("pop_size", "Population Size:", value = 1000, min = 1),
                        numericInput("pop_density", "Population Density (people/km²):", value = 100, min = 0.1, step = 0.1),
                        numericInput("distance", "Distance to Urban Center (km):", value = 10, min = 0, step = 0.1)
                    ),
                    
                    box(width = 6, status = "info", solidHeader = TRUE,
                        title = "Quick Preview",
                        withSpinner(plotlyOutput("preview_plot", height = "300px"))
                    )
                  ),
                  
                  fluidRow(
                    box(width = 12, status = "primary", solidHeader = TRUE,
                        title = "Infrastructure Assessment",
                        p("For each infrastructure item, select whether it is present (Yes) or absent (No) in your locality:"),
                        
                        # Create dynamic tabs for each infrastructure category
                        do.call(tabsetPanel, c(
                          list(id = "infra_tabs"),
                          lapply(names(ugi_calc$infrastructure_categories), function(cat_name) {
                            short_name <- gsub(" ", "", gsub("&", "", cat_name))
                            category_vars <- ugi_calc$infrastructure_categories[[cat_name]]
                            
                            tabPanel(short_name,
                                     fluidRow(
                                       lapply(names(category_vars), function(var) {
                                         description <- category_vars[[var]]
                                         column(6, 
                                                switchInput(
                                                  inputId = var_to_id(var),
                                                  label = paste0(var, " - ", description),
                                                  value = FALSE,
                                                  size = "small",
                                                  onLabel = "Yes",
                                                  offLabel = "No"
                                                )
                                         )
                                       })
                                     )
                            )
                          })
                        ))
                    )
                  ),
                  
                  fluidRow(
                    column(12, align = "center",
                           br(),
                           actionButton("calculate_ugi", "Calculate UGI Score", 
                                        class = "btn-primary btn-lg", 
                                        style = "padding: 15px 30px; font-size: 18px;")
                    )
                  )
                )
              }
      ),
      
      # Results Tab  
      tabItem(tabName = "results",
              fluidRow(
                column(12,
                       if (!data_load_success) {
                         box(width = 12, status = "danger", solidHeader = TRUE,
                             title = "Results Unavailable",
                             div(class = "error-box",
                                 p("Cannot display results without calibration data.")
                             )
                         )
                       } else {
                         list(
                           conditionalPanel(
                             condition = "output.show_results == true",
                             
                             # Main UGI Score Display
                             fluidRow(
                               column(12,
                                      div(class = "score-box",
                                          h2("UGI Score"),
                                          h1(textOutput("ugi_score_display"), style = "font-size: 48px; margin: 10px 0;"),
                                          h3(textOutput("classification_display"))
                                      )
                               )
                             ),
                             
                             # Component Breakdown
                             fluidRow(
                               column(3,
                                      div(class = "component-box",
                                          h4("Population"),
                                          h3(textOutput("pop_score_display")),
                                          p("/ 40 points")
                                      )
                               ),
                               column(3,
                                      div(class = "component-box",
                                          h4("Density"),
                                          h3(textOutput("density_score_display")),
                                          p("/ 10 points")
                                      )
                               ),
                               column(3,
                                      div(class = "component-box",
                                          h4("Distance"),
                                          h3(textOutput("distance_score_display")),
                                          p("/ 10 points")
                                      )
                               ),
                               column(3,
                                      div(class = "component-box",
                                          h4("Infrastructure"),
                                          h3(textOutput("infra_score_display")),
                                          p("/ 40 points")
                                      )
                               )
                             ),
                             
                             # Charts
                             fluidRow(
                               box(width = 6, status = "primary", solidHeader = TRUE,
                                   title = "Component Breakdown",
                                   withSpinner(plotlyOutput("component_chart"))
                               ),
                               
                               box(width = 6, status = "info", solidHeader = TRUE,
                                   title = "Infrastructure by Category",
                                   withSpinner(plotlyOutput("infra_chart"))
                               )
                             ),
                             
                             # Tables
                             fluidRow(
                               box(width = 6, status = "primary", solidHeader = TRUE,
                                   title = "Input Summary",
                                   tableOutput("input_summary")
                               ),
                               
                               box(width = 6, status = "info", solidHeader = TRUE,
                                   title = "Infrastructure Summary",
                                   DT::dataTableOutput("infra_summary")
                               )
                             ),
                             
                             # Download
                             fluidRow(
                               column(12, align = "center",
                                      br(),
                                      downloadButton("download_results", "Download Results (JSON)", 
                                                     class = "btn-success"),
                                      br(), br()
                               )
                             )
                           ),
                           
                           conditionalPanel(
                             condition = "output.show_results != true",
                             box(width = 12, status = "warning",
                                 h3("No Results Yet"),
                                 p("Please go to the 'Calculate UGI' tab and enter your locality information to see results here."),
                                 actionButton("go_to_calculator", "Go to Calculator", class = "btn-primary")
                             )
                           )
                         )
                       }
                )
              )
      ),
      
      # Methodology Tab
      tabItem(tabName = "methodology",
              fluidRow(
                box(width = 12, status = "primary", solidHeader = TRUE,
                    title = "UGI Methodology",
                    
                    h4("Objective"),
                    p("The Urbanicity Gradient Index (UGI) provides a continuous measure of urbanicity 
                from 0 to 100, overcoming the limitations of traditional binary urban-rural classifications."),
                    
                    h4("Scientific Basis"),
                    tags$ul(
                      tags$li("Based on Principal Component Analysis (PCA) of 34 infrastructure variables"),
                      tags$li("Validated on localities spanning rural to major metropolitan areas"),
                      tags$li("Published research with Cohen's kappa = 1.00 (perfect classification)")
                    ),
                    
                    h4("Mathematical Formulation"),
                    
                    h5("1. Population Component (40 points max)"),
                    p("Uses a sigmoid function:"),
                    withMathJax("$$S_N = \\frac{W_N}{1 + e^{-\\alpha[\\log_{10}(N) - \\log_{10}(R_N)]}}$$"),
                    p("Where N = population size, R_N = 2000 (inflection point), α = 2 (steepness)"),
                    
                    h5("2. Density Component (10 points max)"),
                    p("Uses an exponential function:"),
                    withMathJax("$$S_D = W_D \\times (1 - e^{-\\beta \\times D})$$"),
                    p("Where D = population density, β = 0.001 (decay rate)"),
                    
                    h5("3. Distance Component (10 points max)"),
                    p("Uses linear decay:"),
                    withMathJax("$$S_L = W_L \\times \\frac{\\max(0, L_{max} - L)}{L_{max}}$$"),
                    p("Where L = distance to urban center, L_max = 50km (threshold)"),
                    
                    h5("4. Infrastructure Component (40 points max)"),
                    p("Uses weighted sum:"),
                    withMathJax("$$S_I = \\sum_{i=1}^{34} w_i \\times I_i$$"),
                    p("Where w_i = PCA-derived weights, I_i = infrastructure presence (0/1)"),
                    
                    h5("5. Final UGI Score"),
                    withMathJax("$$UGI = S_N + S_D + S_L + S_I$$"),
                    
                    h4("Interpretation Scale"),
                    tags$ul(
                      tags$li("76-100: Highly Urban (Major metropolitan characteristics)"),
                      tags$li("51-75: Urban (Urban characteristics)"),
                      tags$li("26-50: Semi-Rural (Transitional/peri-urban characteristics)"),
                      tags$li("0-25: Rural (Rural characteristics)")
                    ),
                    
                    h4("Reference"),
                    p(strong("X, Y, Z (2025)"), "'Beyond Binary Urban-Rural Classifications: A Continuous Urbanicity Gradient Index'")
                )
              )
      ),
      
      # Weights Tab
      tabItem(tabName = "weights",
              fluidRow(
                if (!data_load_success) {
                  box(width = 12, status = "danger", solidHeader = TRUE,
                      title = "Pesos Indisponíveis",
                      div(class = "error-box",
                          p("Não é possível mostrar os pesos das variáveis sem os dados de calibração.")
                      )
                  )
                } else {
                  box(width = 12, status = "primary", solidHeader = TRUE,
                      title = "Infrastructure Variable Weights",
                      p("Weights calculated using Principal Component Analysis (PCA):"),
                      DT::dataTableOutput("weights_table")
                  )
                }
              )
      )
    )
  )
)

# Define Server
server <- function(input, output, session) {
  
  # Check if the app can function
  app_functional <- reactive({
    data_load_success && ugi_calc$is_calibrated
  })
  
  # Reactive values for results
  results <- reactiveValues(
    calculated = FALSE,
    ugi_score = NULL,
    components = NULL,
    infrastructure_data = NULL,
    locality_name = NULL,
    pop_size = NULL,
    pop_density = NULL,
    distance = NULL
  )
  
  # Calculate UGI
  observeEvent(input$calculate_ugi, {
    if (!app_functional()) {
      showNotification("Erro: Dados de calibração não disponíveis", type = "error")
      return()
    }
    
    req(input$locality_name, input$pop_size, input$pop_density, input$distance)
    
    # Collect infrastructure data
    infra_data <- list()
    for(var in ugi_calc$infrastructure_variables) {
      input_id <- var_to_id(var)
      infra_data[[var]] <- ifelse(is.null(input[[input_id]]), 0, as.numeric(input[[input_id]]))
    }
    
    # Calculate UGI
    components <- ugi_calc$calculate_ugi_components(
      input$pop_size, input$pop_density, input$distance, infra_data
    )
    
    # Store results
    results$calculated <- TRUE
    results$ugi_score <- components$total
    results$components <- components
    results$infrastructure_data <- infra_data
    results$locality_name <- input$locality_name
    results$pop_size <- input$pop_size
    results$pop_density <- input$pop_density
    results$distance <- input$distance
    
    # Switch to results tab
    updateTabItems(session, "tabs", "results")
  })
  
  # Show/hide results
  output$show_results <- reactive({
    results$calculated && app_functional()
  })
  outputOptions(output, "show_results", suspendWhenHidden = FALSE)
  
  # Display outputs
  output$ugi_score_display <- renderText({
    req(results$calculated, app_functional())
    round(results$ugi_score, 1)
  })
  
  output$classification_display <- renderText({
    req(results$calculated, app_functional())
    ugi_calc$get_classification(results$ugi_score)
  })
  
  output$pop_score_display <- renderText({
    req(results$calculated, app_functional())
    round(results$components$population, 1)
  })
  
  output$density_score_display <- renderText({
    req(results$calculated, app_functional())
    round(results$components$density, 1)
  })
  
  output$distance_score_display <- renderText({
    req(results$calculated, app_functional())
    round(results$components$distance, 1)
  })
  
  output$infra_score_display <- renderText({
    req(results$calculated, app_functional())
    round(results$components$infrastructure, 1)
  })
  
  # Preview plot
  output$preview_plot <- renderPlotly({
    if (!app_functional()) {
      # Show empty plot with error message
      p <- ggplot() + 
        annotate("text", x = 0, y = 0, label = "Dados de calibração\nnão disponíveis", 
                 size = 6, color = "red") +
        theme_void()
      return(ggplotly(p))
    }
    
    pop_size <- if(is.null(input$pop_size) || is.na(input$pop_size)) 1000 else input$pop_size
    pop_density <- if(is.null(input$pop_density) || is.na(input$pop_density)) 100 else input$pop_density
    distance <- if(is.null(input$distance) || is.na(input$distance)) 10 else input$distance
    
    # Calculate basic components preview
    pop_score <- if(pop_size <= 0) {
      0
    } else {
      log_pop <- log10(pop_size)
      log_ref <- log10(ugi_calc$R_N)
      score <- ugi_calc$W_N / (1 + exp(-ugi_calc$alpha * (log_pop - log_ref)))
      min(score, ugi_calc$W_N)
    }
    
    density_score <- if(pop_density <= 0) {
      0
    } else {
      score <- ugi_calc$W_D * (1 - exp(-ugi_calc$beta * pop_density))
      min(score, ugi_calc$W_D)
    }
    
    distance_score <- if(distance >= ugi_calc$distance_threshold) {
      0
    } else {
      score <- ugi_calc$W_L * (ugi_calc$distance_threshold - distance) / ugi_calc$distance_threshold
      max(0, min(score, ugi_calc$W_L))
    }
    
    # Calculate infrastructure score in real-time
    infra_score <- 0
    if(ugi_calc$is_calibrated) {
      for(var in ugi_calc$infrastructure_variables) {
        input_id <- var_to_id(var)
        presence <- ifelse(is.null(input[[input_id]]), 0, as.numeric(input[[input_id]]))
        weight <- ifelse(var %in% names(ugi_calc$infrastructure_weights), 
                         ugi_calc$infrastructure_weights[[var]], 0)
        infra_score <- infra_score + presence * weight
      }
      infra_score <- min(infra_score, ugi_calc$W_I)
    }
    
    preview_data <- data.frame(
      Component = c("Population", "Density", "Distance", "Infrastructure"),
      Score = c(pop_score, density_score, distance_score, infra_score),
      Max = c(ugi_calc$W_N, ugi_calc$W_D, ugi_calc$W_L, ugi_calc$W_I)
    )
    
    p <- ggplot(preview_data, aes(x = Component, y = Score, fill = Component)) +
      geom_col(alpha = 0.7) +
      geom_text(aes(label = round(Score, 1)), vjust = -0.5, size = 3) +
      scale_fill_viridis_d() +
      labs(title = "Preview: Basic Components",
           subtitle = "*Infrastructure calculated after assessment",
           y = "Score") +
      theme_minimal() +
      theme(legend.position = "none")
    
    ggplotly(p, tooltip = c("x", "y"))
  })
  
  # Component breakdown chart
  output$component_chart <- renderPlotly({
    req(results$calculated, app_functional())
    
    component_data <- data.frame(
      Component = c("Population", "Density", "Distance", "Infrastructure"),
      Score = c(results$components$population, 
                results$components$density,
                results$components$distance, 
                results$components$infrastructure),
      Maximum = c(ugi_calc$W_N, ugi_calc$W_D, ugi_calc$W_L, ugi_calc$W_I)
    )
    
    p <- ggplot(component_data, aes(x = Component, y = Score, fill = Component)) +
      geom_col(alpha = 0.8) +
      geom_text(aes(label = paste0(round(Score, 1), "/", Maximum)), 
                vjust = -0.5, fontface = "bold") +
      scale_fill_viridis_d() +
      labs(title = "UGI Component Scores",
           x = "Component", 
           y = "Score") +
      theme_minimal() +
      theme(legend.position = "none",
            plot.title = element_text(hjust = 0.5, size = 14, face = "bold"))
    
    ggplotly(p, tooltip = c("x", "y"))
  })
  
  # Infrastructure by category chart
  output$infra_chart <- renderPlotly({
    req(results$calculated, app_functional())
    
    infra_summary <- ugi_calc$get_infrastructure_summary(results$infrastructure_data)
    
    p <- ggplot(infra_summary, aes(x = reorder(Category, Percentage), y = Percentage, fill = Category)) +
      geom_col(alpha = 0.8) +
      geom_text(aes(label = paste0(Present, "/", Total, " (", Percentage, "%)")), 
                hjust = -0.1, size = 3) +
      coord_flip() +
      scale_fill_viridis_d() +
      labs(title = "Infrastructure Availability by Category",
           x = "Category", 
           y = "Percentage (%)") +
      theme_minimal() +
      theme(legend.position = "none",
            plot.title = element_text(hjust = 0.5, size = 14, face = "bold"))
    
    ggplotly(p, tooltip = c("x", "y"))
  })
  
  # Input summary table
  output$input_summary <- renderTable({
    req(results$calculated, app_functional())
    
    data.frame(
      Parameter = c("Locality Name", "Population Size", "Population Density", "Distance to Urban Center"),
      Value = c(results$locality_name,
                format(results$pop_size, big.mark = ","),
                paste0(format(results$pop_density, digits = 2), " people/km²"),
                paste0(results$distance, " km")),
      stringsAsFactors = FALSE
    )
  }, striped = TRUE, hover = TRUE)
  
  # Infrastructure summary table
  output$infra_summary <- DT::renderDataTable({
    req(results$calculated, app_functional())
    
    infra_summary <- ugi_calc$get_infrastructure_summary(results$infrastructure_data)
    infra_summary$Percentage <- paste0(infra_summary$Percentage, "%")
    
    DT::datatable(infra_summary, 
                  options = list(pageLength = 10, searching = FALSE),
                  rownames = FALSE) %>%
      DT::formatStyle("Percentage",
                      background = DT::styleColorBar(c(0, 100), "lightblue"),
                      backgroundSize = "100% 90%",
                      backgroundRepeat = "no-repeat",
                      backgroundPosition = "center")
  })
  
  # Weights table
  output$weights_table <- DT::renderDataTable({
    req(app_functional())
    weights_data <- ugi_calc$get_weights_table()
    req(weights_data)
    
    DT::datatable(weights_data, 
                  options = list(pageLength = 15, searching = TRUE),
                  rownames = FALSE) %>%
      DT::formatRound("Weight", 3) %>%
      DT::formatStyle("Weight",
                      background = DT::styleColorBar(weights_data$Weight, "lightgreen"),
                      backgroundSize = "100% 90%",
                      backgroundRepeat = "no-repeat",
                      backgroundPosition = "center")
  })
  
  # Download results
  output$download_results <- downloadHandler(
    filename = function() {
      paste0("ugi_results_", Sys.Date(), "_", gsub("[^A-Za-z0-9]", "_", results$locality_name), ".json")
    },
    content = function(file) {
      if (!app_functional()) {
        showNotification("Erro: Não é possível baixar resultados sem dados de calibração", type = "error")
        return()
      }
      
      results_data <- list(
        locality_name = results$locality_name,
        calculation_date = Sys.time(),
        input_data = list(
          population_size = results$pop_size,
          population_density = results$pop_density,
          distance_to_urban_center = results$distance,
          infrastructure = results$infrastructure_data
        ),
        results = list(
          ugi_score = round(results$ugi_score, 2),
          classification = ugi_calc$get_classification(results$ugi_score),
          component_scores = list(
            population = round(results$components$population, 2),
            density = round(results$components$density, 2),
            distance = round(results$components$distance, 2),
            infrastructure = round(results$components$infrastructure, 2)
          )
        ),
        infrastructure_summary = ugi_calc$get_infrastructure_summary(results$infrastructure_data),
        methodology = list(
          parameters = list(
            W_N = ugi_calc$W_N,
            W_D = ugi_calc$W_D,
            W_L = ugi_calc$W_L,
            W_I = ugi_calc$W_I,
            R_N = ugi_calc$R_N,
            alpha = ugi_calc$alpha,
            beta = ugi_calc$beta,
            distance_threshold = ugi_calc$distance_threshold
          )
        )
      )
      
      write_json(results_data, file, pretty = TRUE)
    }
  )
  
  # Navigation button
  observeEvent(input$go_to_calculator, {
    updateTabItems(session, "tabs", "calculator")
  })
}

# Run the application
shinyApp(ui = ui, server = server)