# AniMatch AI - Context-Aware Anime Recommender
**English** | [日本語 (For Japanese description)](./README.ja.md)

![Status](https://img.shields.io/badge/Status-Prototype-blue) ![Tech](https://img.shields.io/badge/Tech-Next.js_TypeScript-black) ![Logic](https://img.shields.io/badge/Logic-Vector_Space_Model-purple)

## 📖 Overview
**AniMatch** is a logic-focused AI assistant designed to solve the "Choice Paralysis" problem. Instead of filtering by traditional genres, it recommends Anime based on the user's **emotional context** (e.g., *"I want something intense but not too complex"*).

This project demonstrates the application of **Vector Space Models** and **Cosine Similarity** to build a personalized recommendation engine from scratch.

---

## 🚀 How It Works (The Core Logic)

The system treats every Anime and User Preference as a vector in a 5-dimensional space:
$$V = [Romance, Action, Drama, Complexity, Visuals]$$

To find the best match, i calculate the **Cosine Similarity** between the User Vector ($A$) and each Anime Vector ($B$):

$$Similarity = \cos(\theta) = \frac{A \cdot B}{\|A\| \|B\|}$$

* **Dot Product ($A \cdot B$):** Measures the overlap in direction (feature alignment).
* **Magnitude ($\|A\| \|B\|$):** Normalizes the vectors. This ensures that users who drag sliders to the absolute max don't get different results from users who keep them moderate, as long as the *ratio* between features is the same.

---

## 💡 Key Engineering & UX Decisions

### 1. Input Quantization (The "0.25 Step" Rule)
* **Problem:** Initially, I allowed continuous slider inputs (e.g., 0.1, 0.12). I realized this caused a "False Precision" issue where users couldn't distinguish between 0.9 and 1.0, yet the system produced different results, leading to a confusing UX.
* **Solution:** I implemented **Input Quantization** by locking the sliders to **0.25 steps** (0.0, 0.25, 0.5, 0.75, 1.0).
* **Benefit:** This aligns the mathematical model with the user's mental model (Low, Mild, Balanced, High, Max) and ensures consistent, explainable results.

### 2. Manual Embeddings
* **Approach:** Since this is a cold-start system with no historical data, I manually engineered the feature vectors for the dataset.
* **Trade-off:** While this introduces subjective bias, it allows the system to function immediately without a training phase (Zero-shot recommendation).

---

## 🛠️ Tech Stack & Architecture

I chose a modern, type-safe stack to emphasize code quality and maintainability.

* **Language:** TypeScript (Strict typing for vector interfaces).
* **Frontend:** Next.js + Tailwind CSS (For real-time visualization).
* **Logic:** Pure JavaScript/Math (Custom implementation of linear algebra functions).

### Project Structure
```bash
src/
├── types/       # Data Contracts (Interfaces for Anime & Vectors)
├── data/        # Mock Database (Manual Feature Engineering)
├── utils/       # The "Brain" (Math functions: dotProduct, cosineSimilarity)
└── app/         # Presentation Layer (UI with Semantic Mapping)

```

---

## ⚠️ Limitations

1. **Subjective Bias:** The feature vectors are currently based on personal assessment. In a real-world scenario, these should be aggregated from community tags or NLP analysis of reviews.
2. **Scalability:** The current search complexity is $O(N)$ . For a dataset >10,000 items, we would need to implement **Approximate Nearest Neighbors (ANN)** or use a Vector Database like Pinecone.

---

## 🏃‍♂️ How to Run

1. **Install dependencies:**
```bash
npm install

```


2. **Run the development server:**
```bash
npm run dev

```


3. Open [http://localhost:3000] to view the application.
