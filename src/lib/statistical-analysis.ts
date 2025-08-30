/**
 * Statisztikai elemzési eszközök és matematikai számítások
 * Fejlett statisztikai módszerek a pontosabb előrejelzésekhez
 */

export interface StatisticalMetrics {
  mean: number;
  median: number;
  standardDeviation: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  confidenceInterval95: [number, number];
  outliers: number[];
}

export interface CorrelationMatrix {
  [key: string]: { [key: string]: number };
}

export interface RegressionAnalysis {
  coefficients: number[];
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValues: number[];
  standardErrors: number[];
  residuals: number[];
}

/**
 * Statisztikai számítások osztálya
 */
export class StatisticalCalculator {
  
  /**
   * Alapstatisztikák számítása
   */
  static calculateDescriptiveStats(data: number[]): StatisticalMetrics {
    if (data.length === 0) {
      throw new Error('Üres adatsor');
    }

    const sortedData = [...data].sort((a, b) => a - b);
    const n = data.length;
    
    // Átlag
    const mean = data.reduce((sum, x) => sum + x, 0) / n;
    
    // Medián
    const median = n % 2 === 0 
      ? (sortedData[n / 2 - 1] + sortedData[n / 2]) / 2
      : sortedData[Math.floor(n / 2)];
    
    // Variancia és szórás
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1);
    const standardDeviation = Math.sqrt(variance);
    
    // Ferdeség (skewness)
    const skewness = this.calculateSkewness(data, mean, standardDeviation);
    
    // Csúcsosság (kurtosis)
    const kurtosis = this.calculateKurtosis(data, mean, standardDeviation);
    
    // 95%-os konfidencia intervallum
    const marginOfError = 1.96 * (standardDeviation / Math.sqrt(n));
    const confidenceInterval95: [number, number] = [
      mean - marginOfError,
      mean + marginOfError
    ];
    
    // Kiugró értékek (IQR módszer)
    const outliers = this.findOutliers(sortedData);

    return {
      mean,
      median,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      confidenceInterval95,
      outliers
    };
  }

  /**
   * Ferdeség számítása
   */
  private static calculateSkewness(data: number[], mean: number, stdDev: number): number {
    const n = data.length;
    const sum = data.reduce((acc, x) => acc + Math.pow((x - mean) / stdDev, 3), 0);
    return (n / ((n - 1) * (n - 2))) * sum;
  }

  /**
   * Csúcsosság számítása
   */
  private static calculateKurtosis(data: number[], mean: number, stdDev: number): number {
    const n = data.length;
    const sum = data.reduce((acc, x) => acc + Math.pow((x - mean) / stdDev, 4), 0);
    return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum - 
           (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  }

  /**
   * Kiugró értékek keresése IQR módszerrel
   */
  private static findOutliers(sortedData: number[]): number[] {
    const n = sortedData.length;
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    
    const q1 = sortedData[q1Index];
    const q3 = sortedData[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return sortedData.filter(x => x < lowerBound || x > upperBound);
  }

  /**
   * Korrelációs mátrix számítása
   */
  static calculateCorrelationMatrix(data: { [key: string]: number[] }): CorrelationMatrix {
    const keys = Object.keys(data);
    const matrix: CorrelationMatrix = {};
    
    for (const key1 of keys) {
      matrix[key1] = {};
      for (const key2 of keys) {
        matrix[key1][key2] = this.calculatePearsonCorrelation(data[key1], data[key2]);
      }
    }
    
    return matrix;
  }

  /**
   * Pearson korreláció számítása
   */
  static calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Hibás adatsorok a korrelációhoz');
    }

    const n = x.length;
    const sumX = x.reduce((sum, xi) => sum + xi, 0);
    const sumY = y.reduce((sum, yi) => sum + yi, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Többváltozós lineáris regresszió
   */
  static multipleLinearRegression(
    independentVars: number[][],
    dependentVar: number[]
  ): RegressionAnalysis {
    const n = dependentVar.length;
    const k = independentVars[0].length;
    
    // X mátrix (intercept oszlop hozzáadása)
    const X: number[][] = independentVars.map(row => [1, ...row]);
    
    // Normálegyenlet: β = (X'X)^-1 * X'y
    const XTranspose = this.transposeMatrix(X);
    const XTX = this.matrixMultiply(XTranspose, X);
    const XTXInverse = this.matrixInverse(XTX);
    const XTy = this.matrixVectorMultiply(XTranspose, dependentVar);
    const coefficients = this.matrixVectorMultiply(XTXInverse, XTy);
    
    // Előrejelzések számítása
    const predictions = X.map(row => 
      row.reduce((sum, xi, i) => sum + xi * coefficients[i], 0)
    );
    
    // Residuals
    const residuals = dependentVar.map((yi, i) => yi - predictions[i]);
    
    // R-négyzet
    const yMean = dependentVar.reduce((sum, y) => sum + y, 0) / n;
    const totalSumSquares = dependentVar.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const residualSumSquares = residuals.reduce((sum, r) => sum + r * r, 0);
    const rSquared = 1 - (residualSumSquares / totalSumSquares);
    
    // Adjusted R-négyzet
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - k - 1);
    
    // F-statisztika
    const msr = (totalSumSquares - residualSumSquares) / k;
    const mse = residualSumSquares / (n - k - 1);
    const fStatistic = msr / mse;
    
    // Standard hibák és p-értékek (egyszerűsített)
    const mseMatrix = Array(k + 1).fill(Math.sqrt(mse));
    const standardErrors = coefficients.map((_, i) => 
      Math.sqrt(XTXInverse[i][i] * mse)
    );
    
    const pValues = coefficients.map((coeff, i) => {
      const tStat = Math.abs(coeff / standardErrors[i]);
      return this.calculateTTestPValue(tStat, n - k - 1);
    });

    return {
      coefficients,
      rSquared,
      adjustedRSquared,
      fStatistic,
      pValues,
      standardErrors,
      residuals
    };
  }

  /**
   * Mátrix transzponálás
   */
  private static transposeMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const transposed: number[][] = [];
    
    for (let j = 0; j < cols; j++) {
      transposed[j] = [];
      for (let i = 0; i < rows; i++) {
        transposed[j][i] = matrix[i][j];
      }
    }
    
    return transposed;
  }

  /**
   * Mátrix szorzás
   */
  private static matrixMultiply(a: number[][], b: number[][]): number[][] {
    const rowsA = a.length;
    const colsA = a[0].length;
    const colsB = b[0].length;
    const result: number[][] = [];
    
    for (let i = 0; i < rowsA; i++) {
      result[i] = [];
      for (let j = 0; j < colsB; j++) {
        let sum = 0;
        for (let k = 0; k < colsA; k++) {
          sum += a[i][k] * b[k][j];
        }
        result[i][j] = sum;
      }
    }
    
    return result;
  }

  /**
   * Mátrix-vektor szorzás
   */
  private static matrixVectorMultiply(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => 
      row.reduce((sum, element, i) => sum + element * vector[i], 0)
    );
  }

  /**
   * Mátrix inverz (Gauss-Jordan)
   */
  private static matrixInverse(matrix: number[][]): number[][] {
    const n = matrix.length;
    const augmented: number[][] = [];
    
    // Kiterjesztett mátrix létrehozása
    for (let i = 0; i < n; i++) {
      augmented[i] = [...matrix[i], ...Array(n).fill(0)];
      augmented[i][n + i] = 1;
    }
    
    // Gauss-Jordan elimináció
    for (let i = 0; i < n; i++) {
      // Pivot keresése
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = k;
        }
      }
      
      // Sorok cseréje
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      
      // Normalizálás
      const pivot = augmented[i][i];
      for (let j = 0; j < 2 * n; j++) {
        augmented[i][j] /= pivot;
      }
      
      // Elimináció
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = augmented[k][i];
          for (let j = 0; j < 2 * n; j++) {
            augmented[k][j] -= factor * augmented[i][j];
          }
        }
      }
    }
    
    // Inverz mátrix kinyerése
    const inverse: number[][] = [];
    for (let i = 0; i < n; i++) {
      inverse[i] = augmented[i].slice(n);
    }
    
    return inverse;
  }

  /**
   * T-teszt p-érték közelítés
   */
  private static calculateTTestPValue(tStat: number, df: number): number {
    // Egyszerűsített közelítés
    if (tStat > 2.576) return 0.01;   // 1%
    if (tStat > 1.96) return 0.05;    // 5%
    if (tStat > 1.645) return 0.10;   // 10%
    return 0.20; // Nem szignifikáns
  }

  /**
   * Idősor trend elemzés
   */
  static analyzeTrend(timeSeries: { date: Date; value: number }[]): {
    trend: 'increasing' | 'decreasing' | 'stable';
    slope: number;
    rsquared: number;
    seasonality: number;
  } {
    if (timeSeries.length < 3) {
      throw new Error('Túl kevés adatpont a trend elemzéshez');
    }

    // Lineáris trend számítása
    const x = timeSeries.map((_, i) => i);
    const y = timeSeries.map(item => item.value);
    
    const regression = this.simpleLinearRegression(x, y);
    
    // Szezonalitás detektálás (egyszerűsített)
    const seasonality = this.detectSeasonality(y);
    
    const trend = regression.slope > 0.01 ? 'increasing' : 
                 regression.slope < -0.01 ? 'decreasing' : 'stable';

    return {
      trend,
      slope: regression.slope,
      rsquared: regression.rSquared,
      seasonality
    };
  }

  /**
   * Egyszerű lineáris regresszió
   */
  private static simpleLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    rSquared: number;
  } {
    const n = x.length;
    const sumX = x.reduce((sum, xi) => sum + xi, 0);
    const sumY = y.reduce((sum, yi) => sum + yi, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // R-négyzet
    const yMean = sumY / n;
    const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const predictedY = x.map(xi => slope * xi + intercept);
    const residualSumSquares = y.reduce((sum, yi, i) => 
      sum + Math.pow(yi - predictedY[i], 2), 0
    );
    const rSquared = 1 - (residualSumSquares / totalSumSquares);

    return { slope, intercept, rSquared };
  }

  /**
   * Szezonalitás detektálás
   */
  private static detectSeasonality(data: number[]): number {
    if (data.length < 12) return 0;
    
    // Autocorreláció számítása 12-es lag-gel (havi szezonalitás)
    const lag = Math.min(12, Math.floor(data.length / 3));
    
    const mean = data.reduce((sum, x) => sum + x, 0) / data.length;
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / data.length;
    
    let autocovariance = 0;
    const validPairs = data.length - lag;
    
    for (let i = 0; i < validPairs; i++) {
      autocovariance += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    autocovariance /= validPairs;
    
    return variance === 0 ? 0 : autocovariance / variance;
  }

  /**
   * Outlier detektálás Z-score módszerrel
   */
  static detectOutliersZScore(data: number[], threshold: number = 2.5): {
    outliers: number[];
    indices: number[];
    zScores: number[];
  } {
    const stats = this.calculateDescriptiveStats(data);
    const zScores = data.map(x => Math.abs((x - stats.mean) / stats.standardDeviation));
    
    const outlierIndices: number[] = [];
    const outliers: number[] = [];
    
    zScores.forEach((z, i) => {
      if (z > threshold) {
        outlierIndices.push(i);
        outliers.push(data[i]);
      }
    });

    return {
      outliers,
      indices: outlierIndices,
      zScores
    };
  }

  /**
   * Adatok normalizálása
   */
  static normalizeData(data: number[], method: 'minmax' | 'zscore' = 'zscore'): number[] {
    if (method === 'minmax') {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      return data.map(x => range === 0 ? 0 : (x - min) / range);
    } else {
      const stats = this.calculateDescriptiveStats(data);
      return data.map(x => stats.standardDeviation === 0 ? 0 : (x - stats.mean) / stats.standardDeviation);
    }
  }
}