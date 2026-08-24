export interface Regressor {
  name: string;
  fit(X: number[][], y: number[]): void;
  predict(x: number[]): number;
}

export class MedianBaseline implements Regressor {
  name = "Median Baseline";
  private value = 0;

  fit(_X: number[][], y: number[]): void {
    const sorted = [...y].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    this.value = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  predict(_x: number[]): number {
    return this.value;
  }
}

export class MovingAverageBaseline implements Regressor {
  name = "Moving Average";
  private window: number;

  constructor(window = 5) {
    this.window = window;
  }

  fit(_X: number[][], y: number[]): void {
    const recent = y.slice(Math.max(0, y.length - this.window));
    this.value = recent.reduce((a, b) => a + b, 0) / recent.length;
  }
  private value = 0;

  predict(_x: number[]): number {
    return this.value;
  }
}

function solveOLS(X: number[][], y: number[]): number[] | null {
  const n = X.length;
  const p = X[0].length + 1;
  const A: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  const b: number[] = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    const row = [1, ...X[i]];
    for (let j = 0; j < p; j++) {
      for (let k = 0; k < p; k++) A[j][k] += row[j] * row[k];
      b[j] += row[j] * y[i];
    }
  }
  for (let j = 0; j < p; j++) A[j][j] += 1e-8;
  const m = p;
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < m; col++) {
    let pivot = col;
    for (let r = col + 1; r < m; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col])) pivot = r;
    }
    if (Math.abs(aug[pivot][col]) < 1e-12) return null;
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    for (let r = 0; r < m; r++) {
      if (r === col) continue;
      const factor = aug[r][col] / aug[col][col];
      for (let c = col; c <= m; c++) aug[r][c] -= factor * aug[col][c];
    }
  }
  return aug.map((row, i) => row[m] / row[i]);
}

export class LinearRegressionModel implements Regressor {
  name = "Linear Regression";
  private coef: number[] | null = null;
  private mu: number[] = [];
  private sigma: number[] = [];

  fit(X: number[][], y: number[]): void {
    const n = X.length;
    const p = X[0].length;
    this.mu = new Array(p).fill(0);
    this.sigma = new Array(p).fill(0);
    for (let j = 0; j < p; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += X[i][j];
      this.mu[j] = s / n;
      let v = 0;
      for (let i = 0; i < n; i++) v += (X[i][j] - this.mu[j]) ** 2;
      this.sigma[j] = Math.sqrt(v / n) || 1;
    }
    const norm = X.map((row) => row.map((v, j) => (v - this.mu[j]) / this.sigma[j]));
    this.coef = solveOLS(norm, y);
    if (!this.coef) {
      const avg = y.reduce((a, b) => a + b, 0) / n;
      this.coef = null;
      this.fallback = avg;
    }
  }
  private fallback = 0;

  predict(x: number[]): number {
    if (!this.coef) return this.fallback;
    let result = this.coef[0];
    for (let j = 0; j < x.length; j++) {
      result += this.coef[j + 1] * ((x[j] - this.mu[j]) / this.sigma[j]);
    }
    return result;
  }
}

export class RandomForestModel implements Regressor {
  name = "Random Forest";
  private forest: import("ml-random-forest").RandomForestRegression | null = null;

  async prepare(): Promise<void> {
    if (!this.forest) {
      const mod = await import("ml-random-forest");
      this.forest = new mod.RandomForestRegression({
        nEstimators: 40,
        maxDepth: 6,
        minNumSamples: 2,
        seed: 42,
      });
    }
  }

  fit(X: number[][], y: number[]): void {
    if (!this.forest) throw new Error("call prepare() first");
    const padded = X.map((row) => (row.length < 2 ? [row[0] ?? 0, 0] : row));
    this.forest.train(padded, y);
  }

  predict(x: number[]): number {
    if (!this.forest) throw new Error("not trained");
    const padded = x.length < 2 ? [x[0] ?? 0, 0] : x;
    const pred = this.forest.predict([padded]);
    return pred[0];
  }
}
