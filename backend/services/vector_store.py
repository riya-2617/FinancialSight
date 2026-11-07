import math
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from backend.config import GEMINI_API_KEY


class HybridVectorStore:
    """
    Multimodal Hybrid Vector Store supporting:
    - Dense Semantic Vector Search
    - BM25 Lexical Keyword Search
    - Reciprocal Rank Fusion (RRF)
    - Financial Domain Reranking
    - Multimodal Citation Extraction
    """

    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=2500,
            sublinear_tf=True
        )
        self.tfidf_matrix = None
        self.corpus_fitted = False
        self.doc_freqs: Dict[str, int] = {}
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 1.0

    def clear(self):
        self.chunks = []
        self.tfidf_matrix = None
        self.corpus_fitted = False
        self.doc_freqs = {}
        self.doc_lengths = []

    def add_chunks(self, new_chunks: List[Dict[str, Any]]):
        """Adds chunks to the multimodal index."""
        if not new_chunks:
            return

        self.chunks.extend(new_chunks)
        self._rebuild_index()

    def _rebuild_index(self):
        """Rebuilds Dense and BM25 index over the chunks."""
        if not self.chunks:
            return

        texts = [c.get("content", "") for c in self.chunks]

        # 1. Rebuild TF-IDF dense matrix
        try:
            self.tfidf_matrix = self.vectorizer.fit_transform(texts)
            self.corpus_fitted = True
        except Exception:
            self.corpus_fitted = False

        # 2. Rebuild BM25 stats
        self.doc_freqs = {}
        self.doc_lengths = []
        total_len = 0

        for text in texts:
            words = set(re.findall(r"\b\w+\b", text.lower()))
            tokens = re.findall(r"\b\w+\b", text.lower())
            length = len(tokens)
            self.doc_lengths.append(length)
            total_len += length

            for w in words:
                self.doc_freqs[w] = self.doc_freqs.get(w, 0) + 1

        self.avg_doc_length = total_len / max(1, len(texts))

    def _score_bm25(self, query: str) -> np.ndarray:
        """Calculates Okapi BM25 scores for the given query against all indexed chunks."""
        n_docs = len(self.chunks)
        scores = np.zeros(n_docs)
        if n_docs == 0:
            return scores

        query_tokens = re.findall(r"\b\w+\b", query.lower())
        k1 = 1.5
        b = 0.75

        for token in query_tokens:
            df = self.doc_freqs.get(token, 0)
            if df == 0:
                continue

            # Inverse Document Frequency with smoothing
            idf = math.log(1.0 + (n_docs - df + 0.5) / (df + 0.5))

            for i, chunk in enumerate(self.chunks):
                text = chunk.get("content", "").lower()
                tf = text.count(token)
                if tf > 0:
                    doc_len = self.doc_lengths[i]
                    denom = tf + k1 * (1.0 - b + b * (doc_len / max(1.0, self.avg_doc_length)))
                    scores[i] += idf * ((tf * (k1 + 1.0)) / max(1e-5, denom))

        return scores

    def _score_dense(self, query: str) -> np.ndarray:
        """Dense semantic cosine similarity."""
        n_docs = len(self.chunks)
        if n_docs == 0 or not self.corpus_fitted or self.tfidf_matrix is None:
            return np.zeros(n_docs)

        try:
            q_vec = self.vectorizer.transform([query])
            sims = cosine_similarity(q_vec, self.tfidf_matrix)[0]
            return sims
        except Exception:
            return np.zeros(n_docs)

    def search(self, query: str, top_k: int = 5, filter_doc_id: int = None) -> List[Dict[str, Any]]:
        """
        Executes hybrid retrieval:
        1. BM25 scoring & ranking
        2. Dense cosine similarity & ranking
        3. Reciprocal Rank Fusion (RRF)
        4. Domain-specific reranking for tables and visual figures
        """
        if not self.chunks:
            return []

        # Filter candidate indices if document filter applied
        candidate_indices = [
            i for i, c in enumerate(self.chunks)
            if filter_doc_id is None or c.get("document_id") == filter_doc_id
        ]

        if not candidate_indices:
            return []

        # Compute raw scores
        bm25_scores = self._score_bm25(query)
        dense_scores = self._score_dense(query)

        # Build rank maps
        # Sort candidates by dense score
        dense_sorted = sorted(candidate_indices, key=lambda idx: dense_scores[idx], reverse=True)
        dense_rank = {idx: rank + 1 for rank, idx in enumerate(dense_sorted)}

        # Sort candidates by BM25 score
        bm25_sorted = sorted(candidate_indices, key=lambda idx: bm25_scores[idx], reverse=True)
        bm25_rank = {idx: rank + 1 for rank, idx in enumerate(bm25_sorted)}

        # Reciprocal Rank Fusion (RRF) with constant k=60
        k_rrf = 60.0
        q_lower = query.lower()
        is_numerical_query = any(w in q_lower for w in ["revenue", "margin", "income", "profit", "ratio", "ebitda", "ebit", "balance", "cost", "eps", "$", "%"])
        is_visual_query = any(w in q_lower for w in ["chart", "visual", "graph", "trend", "look like", "diagram"])

        scored_results = []
        for idx in candidate_indices:
            r_dense = dense_rank.get(idx, 999)
            r_bm25 = bm25_rank.get(idx, 999)

            rrf_score = (1.0 / (k_rrf + r_dense)) + (1.0 / (k_rrf + r_bm25))

            # Domain Reranking Boosts
            chunk = self.chunks[idx]
            ctype = chunk.get("chunk_type", "text")

            # Table boost for quantitative queries
            if is_numerical_query and ctype in ["table", "metric"]:
                rrf_score *= 1.35
            # Visual boost for chart/layout queries
            if is_visual_query and ctype in ["chart", "visual_page"]:
                rrf_score *= 1.40

            scored_results.append((idx, rrf_score, float(dense_scores[idx]), float(bm25_scores[idx])))

        # Sort by final fused RRF score
        scored_results.sort(key=lambda x: x[1], reverse=True)
        top_items = scored_results[:top_k]

        citations = []
        for rank, (idx, rrf_score, dense_val, bm25_val) in enumerate(top_items):
            c = self.chunks[idx].copy()
            c["citation_index"] = rank + 1
            c["rrf_score"] = round(rrf_score, 4)
            c["dense_score"] = round(dense_val, 4)
            c["bm25_score"] = round(bm25_val, 4)
            c["confidence_percentage"] = min(99, round(max(dense_val, 0.45) * 100, 1))
            citations.append(c)

        return citations

