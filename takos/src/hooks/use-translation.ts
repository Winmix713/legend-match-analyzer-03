import React from "react";

// This is a simplified translation hook that would normally use i18next or react-intl
export const useTranslation = () => {
  // In a real app, this would come from the i18n library and user's locale settings
  const locale = 'hu-HU';
  
  const translations = {
    en: {
      common: {
        notAvailable: 'N/A'
      },
      resultsFeedback: {
        title: 'Results Feedback',
        subtitle: 'Record match outcomes and evaluate prediction accuracy',
        refreshData: 'Refresh Data',
        totalPredictions: 'Total Predictions',
        accuracyRate: 'Accuracy Rate',
        averageROI: 'Average ROI',
        bestMarket: 'Best Market',
        tabsAriaLabel: 'Results Feedback Options',
        tabs: {
          pending: 'Pending Results',
          completed: 'Completed Results',
          analytics: 'Performance Analytics',
          learning: 'Model Learning'
        },
        pendingResults: {
          title: 'Pending Match Results',
          subtitle: 'Record outcomes for recommended matches',
          noResults: 'No pending results to record'
        },
        completedResults: {
          title: 'Completed Match Results',
          subtitle: 'Historical prediction performance',
          noResults: 'No completed results available'
        },
        analytics: {
          accuracyByMarket: 'Prediction Accuracy by Market',
          accuracyByMarketSubtitle: 'Performance across different markets',
          roiPerformance: 'ROI Performance',
          roiPerformanceSubtitle: 'Expected vs. Actual ROI',
          marketBreakdown: 'Market Performance Breakdown',
          marketBreakdownSubtitle: 'Detailed analysis by market type'
        },
        learning: {
          title: 'Model Learning & Improvement',
          subtitle: 'How feedback improves prediction accuracy',
          feedbackLoop: 'Feedback Loop Process',
          metrics: 'Learning Metrics',
          retrainButton: 'Retrain Models with New Data',
          lastUpdate: 'Last model update: {{days}} days ago',
          steps: {
            prediction: {
              title: '1. Prediction Generation',
              description: 'System generates predictions with confidence scores'
            },
            recording: {
              title: '2. Result Recording',
              description: 'Actual outcomes are recorded in the system'
            },
            analysis: {
              title: '3. Performance Analysis',
              description: 'System analyzes prediction accuracy and patterns'
            },
            retraining: {
              title: '4. Model Retraining',
              description: 'Models are updated with new data and insights'
            }
          },
          metricLabels: {
            improvement: 'Model Improvement Rate',
            errorReduction: 'Error Reduction',
            roiOptimization: 'ROI Optimization',
            confidenceCalibration: 'Confidence Calibration'
          }
        }
      },
      tables: {
        match: 'Match',
        date: 'Date',
        market: 'Market',
        prediction: 'Prediction',
        confidence: 'Confidence',
        odds: 'Odds',
        expectedROI: 'Expected ROI',
        actualResult: 'Actual Result',
        accuracy: 'Accuracy',
        roi: 'ROI',
        correct: 'Correct',
        incorrect: 'Incorrect'
      },
      markets: {
        '1X2': '1X2 Market',
        'O/U': 'Over/Under 2.5 Market',
        'BTTS': 'BTTS Market',
        'HT/FT': 'HT/FT Market'
      },
      success: {
        resultUpdated: 'Result Updated',
        resultUpdatedDescription: 'Match result for {{match}} has been recorded'
      },
      errors: {
        loadingFailed: 'Failed to Load Data',
        updateFailed: 'Failed to Update Result',
        tryAgainLater: 'Please try again later'
      }
    },
    hu: {
      common: {
        notAvailable: 'N/A'
      },
      resultsFeedback: {
        title: 'Eredmény Visszajelzés',
        subtitle: 'Mérkőzés eredmények rögzítése és előrejelzési pontosság értékelése',
        refreshData: 'Adatok frissítése',
        totalPredictions: 'Összes előrejelzés',
        accuracyRate: 'Pontossági arány',
        averageROI: 'Átlagos ROI',
        bestMarket: 'Legjobb piac',
        tabsAriaLabel: 'Eredmény visszajelzési lehetőségek',
        tabs: {
          pending: 'Függőben lévő eredmények',
          completed: 'Befejezett eredmények',
          analytics: 'Teljesítmény elemzés',
          learning: 'Modell tanulás'
        },
        pendingResults: {
          title: 'Függőben lévő mérkőzés eredmények',
          subtitle: 'Rögzítse az ajánlott mérkőzések eredményeit',
          noResults: 'Nincs rögzítendő függőben lévő eredmény'
        },
        completedResults: {
          title: 'Befejezett mérkőzés eredmények',
          subtitle: 'Előrejelzési teljesítmény története',
          noResults: 'Nincs elérhető befejezett eredmény'
        },
        analytics: {
          accuracyByMarket: 'Előrejelzési pontosság piaconként',
          accuracyByMarketSubtitle: 'Teljesítmény különböző piacokon',
          roiPerformance: 'ROI teljesítmény',
          roiPerformanceSubtitle: 'Várt vs. Tényleges ROI',
          marketBreakdown: 'Piaci teljesítmény lebontás',
          marketBreakdownSubtitle: 'Részletes elemzés piactípusonként'
        },
        learning: {
          title: 'Modell tanulás és fejlesztés',
          subtitle: 'Hogyan javítja a visszajelzés az előrejelzési pontosságot',
          feedbackLoop: 'Visszajelzési folyamat',
          metrics: 'Tanulási metrikák',
          retrainButton: 'Modellek újratanítása új adatokkal',
          lastUpdate: 'Utolsó modell frissítés: {{days}} napja',
          steps: {
            prediction: {
              title: '1. Előrejelzés generálás',
              description: 'A rendszer előrejelzéseket generál megbízhatósági pontszámokkal'
            },
            recording: {
              title: '2. Eredmény rögzítés',
              description: 'A tényleges eredmények rögzítésre kerülnek a rendszerben'
            },
            analysis: {
              title: '3. Teljesítmény elemzés',
              description: 'A rendszer elemzi az előrejelzési pontosságot és mintákat'
            },
            retraining: {
              title: '4. Modell újratanítás',
              description: 'A modellek frissülnek az új adatokkal és meglátásokkal'
            }
          },
          metricLabels: {
            improvement: 'Modell fejlődési ráta',
            errorReduction: 'Hibaarány csökkenés',
            roiOptimization: 'ROI optimalizálás',
            confidenceCalibration: 'Megbízhatósági kalibráció'
          }
        }
      },
      tables: {
        match: 'Mérkőzés',
        date: 'Dátum',
        market: 'Piac',
        prediction: 'Előrejelzés',
        confidence: 'Megbízhatóság',
        odds: 'Odds',
        expectedROI: 'Várt ROI',
        actualResult: 'Tényleges eredmény',
        accuracy: 'Pontosság',
        roi: 'ROI',
        correct: 'Helyes',
        incorrect: 'Helytelen'
      },
      markets: {
        '1X2': '1X2 Piac',
        'O/U': 'Gólszám 2.5 Piac',
        'BTTS': 'BTTS Piac',
        'HT/FT': 'HT/FT Piac'
      },
      success: {
        resultUpdated: 'Eredmény frissítve',
        resultUpdatedDescription: 'A(z) {{match}} mérkőzés eredménye rögzítve'
      },
      errors: {
        loadingFailed: 'Adatok betöltése sikertelen',
        updateFailed: 'Eredmény frissítése sikertelen',
        tryAgainLater: 'Kérjük, próbálja újra később'
      }
    }
  };

  // Get the current language translations
  const currentLanguage = locale.startsWith('hu') ? 'hu' : 'en';
  const currentTranslations = translations[currentLanguage];

  // Translation function
  const t = React.useCallback((key: string, params: Record<string, any> = {}) => {
    // Split the key by dots to navigate the translations object
    const keys = key.split('.');
    let value = currentTranslations;
    
    // Navigate through the translations object
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    // If no translation is found, return the key
    if (!value || typeof value !== 'string') return key;
    
    // Replace parameters in the translation
    return Object.entries(params).reduce((str, [param, val]) => {
      return str.replace(new RegExp(`{{${param}}}`, 'g'), val);
    }, value);
  }, [currentTranslations]);

  // Format date according to locale
  const formatDate = React.useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale);
  }, [locale]);

  return { t, formatDate, locale };
};
