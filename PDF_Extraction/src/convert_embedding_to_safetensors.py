"""Convert a SentenceTransformer model to safetensors format.

Usage:
    python src/convert_embedding_to_safetensors.py \
      --source-model BAAI/bge-m3 \
      --output-dir models/bge-m3-safetensors
"""

from __future__ import annotations

import argparse
import sys

import torch
from sentence_transformers import SentenceTransformer


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-model", type=str, default="BAAI/bge-m3")
    parser.add_argument("--output-dir", type=str, required=True)
    args = parser.parse_args()

    major, minor = torch.__version__.split(".")[:2]
    if (int(major), int(minor)) < (2, 6):
        print(
            f"ERROR: torch>={{2.6}} required for safe model loading in this pipeline. "
            f"Current torch={torch.__version__}"
        )
        return 1

    print(f"Loading source model: {args.source_model}")
    model = SentenceTransformer(args.source_model)
    print(f"Saving safetensors model to: {args.output_dir}")
    model.save(args.output_dir, safe_serialization=True)
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
