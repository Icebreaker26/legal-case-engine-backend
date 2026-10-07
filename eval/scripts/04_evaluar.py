#!/usr/bin/env python
"""eval/scripts/04_evaluar.py — métricas formales con ranx (#76).

nDCG@10 (primaria), Recall@5/10, MRR@10. Significancia con el test de
randomización de Fisher (ranx), corrección de Holm-Bonferroni para
comparaciones múltiples (ranx no la aplica — se implementa acá), e
intervalos de confianza por bootstrap (percentil, resampleo por consulta).

Uso (dev, screening — nunca requiere confirmación):
    eval/.venv/Scripts/python.exe eval/scripts/04_evaluar.py \
        --subset dev \
        --runs minilm-filtro=eval/data/runs/pool-minilm-ponderado.trec \
               e5-filtro=eval/data/runs/pool-e5-ponderado.trec \
               e5-sin-filtro=eval/data/runs/pool-e5-ponderado-normalizado.trec

Uso en el split de TEST (reservado para la corrida confirmatoria
pre-registrada de #77 — exige el flag explícito):
    ... --subset test --confirmo-uso-de-test
"""
import argparse
import io
import json
import sys
from pathlib import Path

# Windows + consola cp1252 no puede imprimir ✓/✗ ni tildes en algunos
# terminales — forzar utf-8 en stdout/stderr evita UnicodeEncodeError sin
# tener que evitar acentos en los mensajes.
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import numpy as np
from ranx import Qrels, Run, evaluate
from ranx.statistical_tests.fisher_randomization_test import fisher_randomization_test

METRICAS_DEFAULT = ["recall@5", "recall@10", "ndcg@10", "mrr@10"]


def leer_qids_test(ruta_split):
    datos = json.loads(Path(ruta_split).read_text(encoding="utf-8"))
    return set(datos["test"])


def resolver_subset(qrels_completo, qids_test, subset):
    todas = set(qrels_completo.keys())
    if subset == "test":
        return todas & qids_test
    if subset == "dev":
        return todas - qids_test
    return todas  # "all"


def cargar_qrels_filtrado(ruta_qrels, qids_permitidos):
    completo = Qrels.from_file(str(ruta_qrels), kind="trec").to_dict()
    filtrado = {q: d for q, d in completo.items() if q in qids_permitidos}
    return completo, Qrels.from_dict(filtrado)


def cargar_run_filtrado(ruta_run, qids_permitidos, nombre):
    completo = Run.from_file(str(ruta_run), kind="trec").to_dict()
    filtrado = {q: d for q, d in completo.items() if q in qids_permitidos}
    run = Run.from_dict(filtrado)
    run.name = nombre
    return run


def verificar_sin_duplicados(ruta_run):
    """Un documento repetido para la misma consulta en un archivo TREC no es
    inofensivo: ranx no lo cuenta dos veces, pero en
    ranx/data_structures/run.py:285 (`run[q_id][doc_id] = float(rel)`,
    ejecutado en orden de archivo) se queda con el score de la ÚLTIMA
    aparición, no la mejor — corrompe el ranking de ese documento en
    silencio (#113, erratum de la afirmación "ranx es inmune" de #104/#76).
    Devuelve la lista de (qid, docid) repetidos, vacía si el run está limpio."""
    vistos_por_qid = {}
    duplicados = []
    with open(ruta_run, encoding="utf-8") as f:
        for linea in f:
            partes = linea.split()
            if len(partes) < 3:
                continue
            qid, docid = partes[0], partes[2]
            vistos = vistos_por_qid.setdefault(qid, set())
            if docid in vistos:
                duplicados.append((qid, docid))
            vistos.add(docid)
    return duplicados


def puntajes_por_query(qrels, run, metricas):
    """Devuelve {metrica: {qid: score}} — nunca confía en el orden implícito
    del array que entrega ranx, lo re-indexa por qid explícitamente."""
    resultado = evaluate(qrels, run, metricas, return_mean=False, save_results_in_run=True)
    if len(metricas) == 1:
        resultado = {metricas[0]: resultado}
    qids = run.get_query_ids()
    return {m: dict(zip(qids, arr)) for m, arr in resultado.items()}


def bootstrap_ci(valores, n_resamples, ci, seed):
    rng = np.random.default_rng(seed)
    valores = np.asarray(valores, dtype=np.float64)
    n = len(valores)
    medias = np.empty(n_resamples)
    for i in range(n_resamples):
        idx = rng.integers(0, n, n)
        medias[i] = valores[idx].mean()
    alpha = (1 - ci) / 2
    lo, hi = np.quantile(medias, [alpha, 1 - alpha])
    return float(lo), float(hi)


def holm_bonferroni(pares_pvalor):
    """pares_pvalor: lista de (clave, p). Devuelve {clave: p_ajustado},
    monótono por construcción (Holm paso-a-paso estándar)."""
    m = len(pares_pvalor)
    if m == 0:
        return {}
    ordenados = sorted(pares_pvalor, key=lambda kv: kv[1])
    ajustado_prev = 0.0
    resultado = {}
    for rango, (clave, p) in enumerate(ordenados, start=1):
        ajustado = min((m - rango + 1) * p, 1.0)
        ajustado_prev = max(ajustado_prev, ajustado)
        resultado[clave] = ajustado_prev
    return resultado


def validar_a_mano(qrels_dict, run_dict, qid_muestra, k=5):
    """Recall@k calculado sin ranx, para una sola consulta — cruce manual
    exigido por #76 antes de confiar en los resultados masivos."""
    relevantes = {d for d, g in qrels_dict.get(qid_muestra, {}).items() if g > 0}
    if not relevantes:
        return None
    ranking = run_dict.get(qid_muestra, {})
    top_k = [d for d, _ in sorted(ranking.items(), key=lambda kv: kv[1], reverse=True)[:k]]
    recuperados = len(relevantes & set(top_k))
    return recuperados / len(relevantes)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--qrels", default="eval/data/qrels.trec")
    ap.add_argument("--split", default="eval/data/split.json")
    ap.add_argument("--subset", choices=["dev", "test", "all"], default="dev")
    ap.add_argument("--confirmo-uso-de-test", action="store_true",
                     help="obligatorio con --subset test — ver advertencia en el issue #76/#79")
    ap.add_argument("--runs", nargs="+", required=True, metavar="nombre=ruta.trec")
    ap.add_argument("--metrics", nargs="+", default=METRICAS_DEFAULT)
    ap.add_argument("--n-permutations", type=int, default=2000)
    ap.add_argument("--max-p", type=float, default=0.05)
    ap.add_argument("--bootstrap", type=int, default=2000)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="eval/data")
    ap.add_argument("--out-prefix", default=None, help="default: metricas_<subset>")
    args = ap.parse_args()

    if args.subset == "test" and not args.confirmo_uso_de_test:
        print(
            "[evaluar] El split de TEST está congelado para la corrida confirmatoria "
            "pre-registrada de #77 — no para exploración. Si esta corrida ES esa "
            "corrida confirmatoria (pre-registrada antes de ver resultados), repetí "
            "el comando con --confirmo-uso-de-test.",
            file=sys.stderr,
        )
        sys.exit(1)

    qids_test = leer_qids_test(args.split)
    qrels_completo_dict = Qrels.from_file(args.qrels, kind="trec").to_dict()
    qids_subset = resolver_subset(qrels_completo_dict, qids_test, args.subset)
    _, qrels = cargar_qrels_filtrado(args.qrels, qids_subset)
    print(f"[evaluar] subset={args.subset} ({len(qids_subset)} consultas con al menos 1 juicio de relevancia)")

    runs_specs = []
    for spec in args.runs:
        if "=" not in spec:
            sys.exit(f"[evaluar] --runs espera nombre=ruta.trec, recibí: {spec}")
        nombre, ruta = spec.split("=", 1)
        runs_specs.append((nombre, ruta))

    runs = {}
    runs_dict_crudo = {}
    for nombre, ruta in runs_specs:
        duplicados = verificar_sin_duplicados(ruta)
        if duplicados:
            ejemplos = ", ".join(f"{q}/{d}" for q, d in duplicados[:5])
            sys.exit(
                f"[evaluar] RECHAZADO: {nombre} ({ruta}) tiene {len(duplicados)} pares "
                f"(consulta, documento) repetidos — ej: {ejemplos}. ranx se queda con el "
                "score de la ultima aparicion en el archivo, no la mejor (#113). "
                "Dedupea por documento en el generador del run (ROW_NUMBER PARTITION BY "
                "documento_id, como 00_ablation.js) antes de medir."
            )
        run = cargar_run_filtrado(ruta, qids_subset, nombre)
        runs[nombre] = run
        runs_dict_crudo[nombre] = Run.from_file(ruta, kind="trec").to_dict()
        faltantes = qids_subset - set(run.get_query_ids())
        if faltantes:
            print(f"[evaluar] AVISO: {nombre} no tiene {len(faltantes)} de las {len(qids_subset)} consultas del subset "
                  f"(sin resultados para esas queries) — ej: {sorted(faltantes)[:3]}", file=sys.stderr)

    # ── Validación cruzada manual (#76, checklist) ──────────────────────────
    qrels_dict_subset = qrels.to_dict()
    muestra = sorted(qids_subset)[:3]
    print("\n[evaluar] Validación cruzada manual (recall@5, sin ranx) vs. ranx:")
    primer_nombre = runs_specs[0][0]
    puntajes_primero = puntajes_por_query(qrels, runs[primer_nombre], ["recall@5"])
    for qid in muestra:
        manual = validar_a_mano(qrels_dict_subset, runs[primer_nombre].to_dict(), qid, k=5)
        de_ranx = puntajes_primero["recall@5"].get(qid)
        if manual is None or de_ranx is None:
            print(f"  {qid}: sin relevantes o sin resultados en {primer_nombre}, se omite")
            continue
        ok = abs(manual - de_ranx) < 1e-9
        print(f"  {qid}: manual={manual:.4f}  ranx={de_ranx:.4f}  {'✓' if ok else '✗ DISCREPANCIA'}")
        if not ok:
            sys.exit("[evaluar] la validación cruzada falló — no confiar en los resultados masivos hasta investigar.")

    # ── Métricas por run ─────────────────────────────────────────────────────
    puntajes = {nombre: puntajes_por_query(qrels, run, args.metrics) for nombre, run in runs.items()}

    tabla = {}
    for nombre in runs:
        tabla[nombre] = {}
        for m in args.metrics:
            valores = np.array([puntajes[nombre][m].get(q, 0.0) for q in sorted(qids_subset)])
            media = float(valores.mean())
            lo, hi = bootstrap_ci(valores, args.bootstrap, 0.95, args.seed)
            tabla[nombre][m] = {"media": media, "ci95_lo": lo, "ci95_hi": hi, "n": len(valores)}

    # ── Significancia pareada por métrica, con Holm dentro de cada métrica ──
    nombres = list(runs.keys())
    significancia = {}
    for m in args.metrics:
        pares_p = []
        detalle = {}
        for i, a in enumerate(nombres):
            for b in nombres[i + 1:]:
                qids_comunes = sorted(set(puntajes[a][m]) & set(puntajes[b][m]))
                arr_a = np.array([puntajes[a][m][q] for q in qids_comunes])
                arr_b = np.array([puntajes[b][m][q] for q in qids_comunes])
                p_crudo, _ = fisher_randomization_test(arr_a, arr_b, args.n_permutations, args.max_p, args.seed)
                clave = f"{a} vs {b}"
                pares_p.append((clave, float(p_crudo)))
                detalle[clave] = {"p_crudo": float(p_crudo), "n": len(qids_comunes)}
        ajustados = holm_bonferroni(pares_p)
        for clave, p_adj in ajustados.items():
            detalle[clave]["p_holm"] = p_adj
            detalle[clave]["significativo_holm"] = p_adj <= args.max_p
        significancia[m] = detalle

    # ── Salida ───────────────────────────────────────────────────────────────
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    prefix = args.out_prefix or f"metricas_{args.subset}"

    resultado_json = {
        "subset": args.subset,
        "n_queries": len(qids_subset),
        "metricas": args.metrics,
        "stat_test": "fisher",
        "n_permutations": args.n_permutations,
        "max_p": args.max_p,
        "correccion_multiple": "holm-bonferroni (por métrica)",
        "bootstrap_resamples": args.bootstrap,
        "seed": args.seed,
        "runs": {n: r for n, r in runs_specs},
        "tabla": tabla,
        "significancia": significancia,
    }
    ruta_json = out_dir / f"{prefix}.json"
    ruta_json.write_text(json.dumps(resultado_json, indent=2, ensure_ascii=False), encoding="utf-8")

    lineas_md = [f"# Métricas formales — subset `{args.subset}` ({len(qids_subset)} consultas)", ""]
    lineas_md.append("Test de significancia: Fisher's Randomization (`ranx`), corrección de Holm-Bonferroni por métrica. "
                      f"IC 95% por bootstrap ({args.bootstrap} resamples, semilla {args.seed}).")
    lineas_md.append("")
    encabezado = ["Sistema"] + [m for m in args.metrics]
    lineas_md.append("| " + " | ".join(encabezado) + " |")
    lineas_md.append("|" + "---|" * len(encabezado))
    for nombre in nombres:
        fila = [nombre]
        for m in args.metrics:
            t = tabla[nombre][m]
            fila.append(f"{t['media']:.3f} [{t['ci95_lo']:.3f}, {t['ci95_hi']:.3f}]")
        lineas_md.append("| " + " | ".join(fila) + " |")
    lineas_md.append("")
    lineas_md.append("## Significancia pareada (p ajustado por Holm, dentro de cada métrica)")
    for m in args.metrics:
        lineas_md.append(f"\n**{m}**\n")
        for clave, d in significancia[m].items():
            marca = "**significativo**" if d["significativo_holm"] else "no significativo"
            lineas_md.append(f"- {clave}: p_crudo={d['p_crudo']:.4f}, p_holm={d['p_holm']:.4f} → {marca}")
    ruta_md = out_dir / f"{prefix}.md"
    ruta_md.write_text("\n".join(lineas_md) + "\n", encoding="utf-8")

    print(f"\n[evaluar] {ruta_md}")
    print(f"[evaluar] {ruta_json}")


if __name__ == "__main__":
    main()
