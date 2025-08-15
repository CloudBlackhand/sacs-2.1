from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal, Optional, List, Dict, Any
import re
import uvicorn
import os
import unicodedata

app = FastAPI(title="SACS Python Service")

NEGATIVE_PATTERNS = [
    r"\binternet\s+pessima\b",
    r"\besta\s+pessima\b",
    r"\bcaiu\s+(ha|a)\s+dias\b",
    r"\bcaiu\b",
    r"\boscila\b|\boscilando\b",
    r"\blenta\b|\bmuito\s+ruim\b|\bruim\b",
    r"\binstavel\b|\binstabilidade\b",
    r"\bmerda\b|\blixo\b|\bporcaria\b|\bpiora\b",
    r"\bsem\s+internet\b|\bnao\s+funciona\b|\btravando\b",
]
POSITIVE_PATTERNS = [
    r"\binternet\s+otima\b",
    r"\besta\s+otima\b|\besta\s+boa\b|\bmuito\s+boa\b|\bmuito\s+bom\b",
    r"\bexcelente\b|\bperfeita\b|\bmaravilhosa\b",
    r"\btop\b|\bshow\b|\bfuncionando\s+bem\b",
]

class ClassifyIn(BaseModel):
    text: str

class ClassifyOut(BaseModel):
    sentiment: Literal['negative', 'positive', 'neutral']
    matched_pattern: Optional[str] = None
    auto_reply: str

class ExcelIn(BaseModel):
    file_path: str

@app.post('/classify', response_model=ClassifyOut)
def classify(payload: ClassifyIn):
    raw = payload.text or ''
    text = strip_accents(raw).lower().strip()
    for pat in NEGATIVE_PATTERNS:
        if re.search(pat, text):
            return ClassifyOut(
                sentiment='negative',
                matched_pattern=pat,
                auto_reply='Sentimos muito pelos problemas. Nosso suporte já foi acionado e retornará em breve.'
            )
    for pat in POSITIVE_PATTERNS:
        if re.search(pat, text):
            return ClassifyOut(
                sentiment='positive',
                matched_pattern=pat,
                auto_reply='Ficamos felizes que esteja tudo ótimo! Estamos à disposição.'
            )
    return ClassifyOut(
        sentiment='neutral',
        matched_pattern=None,
        auto_reply='Obrigado pelo contato! Em que posso ajudar?'
    )

@app.post('/process-excel')
def process_excel(payload: ExcelIn):
    """Processa planilha Excel e tenta extrair `number` e `message` com heurística.
    Aceita qualquer nomenclatura comum (telefone/celular/whatsapp | mensagem/msg/texto/obs/descrição),
    percorre todas as abas e retorna as primeiras 50 linhas válidas.
    """
    try:
        import pandas as pd  # import tardio para evitar dependência obrigatória
    except Exception:
        raise HTTPException(status_code=503, detail='Processamento de Excel indisponível (pandas não instalado)')

    path = payload.file_path
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f'Arquivo não encontrado: {path}')

    # conjuntos de sinônimos
    phone_keys = {
        'telefone','celular','whatsapp','fone','tel','contato','numero','número','telefone1','telefone2','telefone_1','telefone_2'
    }
    message_keys = {
        'mensagem','msg','texto','observacao','observação','descricao','descrição','obs','notas','comentario','comentário'
    }

    def choose_phone_column(df):
        cols = list(df.columns)
        # 1) por nome normalizado
        for c in cols:
            nc = normalize_column_name(c)
            if any(k in nc for k in phone_keys):
                return c
        # 2) por conteúdo (coluna com maioria de valores numéricos com 10+ dígitos)
        best = None
        best_score = 0
        for c in cols:
            s = df[c].astype(str).str.replace(r'\D','', regex=True)
            score = (s.str.len() >= 10).sum()
            if score > best_score:
                best = c
                best_score = score
        return best

    def choose_message_column(df):
        cols = list(df.columns)
        for c in cols:
            nc = normalize_column_name(c)
            if any(k in nc for k in message_keys):
                return c
        # fallback: se houver 'obs' ou 'descricao' já pegaria acima; se não, tenta 'cliente' / 'nome'
        for key in ('observacao','obs','descricao','descrição','mensagem'):
            for c in cols:
                if key in normalize_column_name(c):
                    return c
        for key in ('cliente','nome'):
            for c in cols:
                if key in normalize_column_name(c):
                    return c
        return None

    rows = []
    try:
        xl = pd.ExcelFile(path, engine='openpyxl')
        sheet_names = xl.sheet_names
    except Exception:
        # arquivo simples com uma única aba
        df = pd.read_excel(path)
        sheet_names = [None]
        xl = None

    for sheet in sheet_names:
        try:
            df = pd.read_excel(path, sheet_name=sheet) if sheet is not None else df
            if df is None or df.empty:
                continue
            phone_col = choose_phone_column(df)
            msg_col = choose_message_column(df)
            if phone_col is None:
                continue
            ser_phone = df[phone_col].astype(str).str.replace(r'\D','', regex=True)
            if msg_col is None:
                ser_msg = df.apply(lambda r: ' '.join(str(x) for x in r.values if isinstance(x, str))[:200], axis=1)
            else:
                ser_msg = df[msg_col].astype(str)
            for number, message in zip(ser_phone, ser_msg):
                number = number.strip()
                message = (message or '').strip()
                if len(number) < 10:
                    continue
                if not message:
                    message = 'Mensagem'
                rows.append({'number': number, 'message': message})
        except Exception:
            continue

    return {'count': len(rows), 'rows': rows[:50]}

if __name__ == '__main__':
    port = int(os.getenv('PORT', '8001'))
    uvicorn.run('app.main:app', host='0.0.0.0', port=port, reload=True)

# ==========================
# Normalização de Planilhas
# ==========================

HEADER_HINTS = {"data","sa","cliente","técnico","tecnico","status","cidade","documento","telefone","obs"}

def strip_accents(text: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFKD', text) if not unicodedata.combining(c))

def normalize_column_name(column_name: str) -> str:
    name = strip_accents(str(column_name)).strip().lower()
    name = re.sub(r"\s+", " ", name)
    return name

def guess_header_row(df: Any, max_look: int = 10) -> int:
    for i in range(min(max_look, len(df))):
        row_values = [normalize_column_name(v) for v in df.iloc[i].tolist()]
        hits = sum(1 for v in row_values if any(h in v for h in HEADER_HINTS))
        if hits >= 2:
            return i
    return 0

def parse_dates_series(series: Any) -> Any:
    try:
        import pandas as pd  # import tardio
    except Exception:
        return series
    s_str = series.astype(str).str.strip()
    dt_txt = pd.to_datetime(s_str, errors='coerce', dayfirst=True)
    s_num = pd.to_numeric(s_str.str.replace(',', '.', regex=False), errors='coerce')
    mask = s_num.between(20000, 60000)
    import pandas as pd  # garantir pd.Series
    dt_num = pd.Series(pd.NaT, index=s_num.index)
    if mask.any():
        dt_num.loc[mask] = pd.to_datetime(s_num.loc[mask], unit='D', origin='1899-12-30', errors='coerce')
    return dt_txt.fillna(dt_num)

def standardize_columns(columns: List[str]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for c in columns:
        nc = normalize_column_name(c)
        if nc == 'data' or nc.startswith('data'):
            mapping[c] = 'data'
        elif nc in ('sa','s.a'):
            mapping[c] = 'sa'
        elif 'cliente' in nc:
            mapping[c] = 'cliente'
        elif 'telefone' in nc or nc == 'fone':
            mapping[c] = 'telefone'
        elif 'cidade' in nc or 'city' in nc:
            mapping[c] = 'cidade'
        elif 'status' in nc:
            mapping[c] = 'status'
        elif 'tecnico' in nc or 'técnico' in nc:
            mapping[c] = 'tecnico'
        else:
            mapping[c] = nc
    return mapping

def extract_sa(df: Any) -> Any:
    if 'sa' in df.columns:
        base = df['sa'].astype(str)
        extracted = base.str.upper().str.extract(r'(SA-\d+)', expand=False)
        extracted = extracted.fillna(
            base.str.upper().str.extract(r'(SA\s*-?\s*\d+)', expand=False)
        )
        if extracted.notna().any():
            return (
                extracted.str.replace(r'\s*', '', regex=True)
                .str.replace('SA', 'SA-', regex=False)
                .str.replace('SA--','SA-', regex=False)
            )
    # tenta extrair de qualquer coluna textual
    candidates = []
    for c in df.columns:
        if df[c].dtype == object:
            cand = df[c].astype(str).str.upper().str.extract(r'(SA\s*-?\s*\d+)', expand=False)
            if cand.notna().sum() > 0:
                candidates.append(cand)
    if candidates:
        merged = pd.concat(candidates, axis=1)
        sa = merged.bfill(axis=1).iloc[:,0]
        return (
            sa.str.replace(r'\s*', '', regex=True)
              .str.replace('SA', 'SA-', regex=False)
              .str.replace('SA--','SA-', regex=False)
        )
    return pd.Series([None]*len(df))

def read_sheet(xl: Any, sheet_name: str) -> Any:
    raw = xl.parse(sheet_name, header=None)
    hdr_row = guess_header_row(raw)
    df = xl.parse(sheet_name, header=hdr_row)
    if sum(str(c).startswith('Unnamed') for c in df.columns) > len(df.columns)//2 and len(df) > 0:
        df = pd.DataFrame(df.values[1:], columns=df.iloc[0].tolist())
    df = df.loc[:, ~df.columns.duplicated()]
    df = df.dropna(how='all')
    mapping = standardize_columns(list(df.columns))
    df = df.rename(columns=mapping)
    if 'data' in df.columns:
        df['data_parsed'] = parse_dates_series(df['data'])
    else:
        df['data_parsed'] = pd.NaT
    df['sa_norm'] = extract_sa(df)
    df['sheet'] = sheet_name
    return df

def normalize_workbook(path: str) -> Any:
    try:
        import pandas as pd
    except Exception:
        raise HTTPException(status_code=503, detail='Normalização indisponível (pandas não instalado)')
    xl = pd.ExcelFile(path, engine='openpyxl')
    tables: List[pd.DataFrame] = []
    for sheet in xl.sheet_names:
        try:
            tables.append(read_sheet(xl, sheet))
        except Exception:
            continue
    if not tables:
        return pd.DataFrame()
    df = pd.concat(tables, ignore_index=True)
    return df

class NormalizeIn(BaseModel):
    file_path: str
    date_from: Optional[str] = None  # 'YYYY-MM-DD'
    date_to: Optional[str] = None    # 'YYYY-MM-DD'
    limit: Optional[int] = 1000

@app.post('/normalize-excel')
def normalize_excel(payload: NormalizeIn):
    path = payload.file_path
    if not os.path.exists(path):
        return { 'error': 'Arquivo não encontrado', 'file_path': path }
    df = normalize_workbook(path)
    total = int(df.shape[0])

    # filtros por data
    if payload.date_from:
        df = df[df['data_parsed'] >= pd.to_datetime(payload.date_from)]
    if payload.date_to:
        df = df[df['data_parsed'] < pd.to_datetime(payload.date_to)]

    # linhas válidas por regra (tem SA e tem data)
    df_valid = df[df['sa_norm'].notna() & df['data_parsed'].notna()].copy()

    # distribuição por mês
    by_month = (
        df_valid['data_parsed']
        .dt.to_period('M')
        .value_counts()
        .sort_index()
    )
    month_dist = { str(k): int(v) for k,v in by_month.to_dict().items() }

    # monta linhas básicas para retorno
    cols_keep = [c for c in ['sa_norm','data_parsed','cliente','telefone','cidade','status','tecnico','sheet'] if c in df_valid.columns]
    out_rows: List[Dict[str, Any]] = []
    for _, row in df_valid[cols_keep].head(payload.limit or 1000).iterrows():
        try:
            import pandas as pd  # garantir referência local
        except Exception:
            pd = None
        item = {}
        for k in cols_keep:
            val = row[k]
            if k == 'data_parsed' and val is not None and hasattr(val, 'date'):
                try:
                    val = str(val.date())
                except Exception:
                    val = str(val)
            item[k] = (val if (pd is None or (hasattr(pd, 'notna') and pd.notna(val))) else None)
        out_rows.append(item)

    # mapeia para os nomes esperados pelo frontend
    mapped_rows: List[Dict[str, Any]] = []
    for r in out_rows:
        mapped_rows.append({
            'sa': r.get('sa_norm'),
            'nome': r.get('cliente'),
            'telefone': r.get('telefone'),
            'cidade': r.get('cidade'),
            'technician': r.get('tecnico'),
            'data': r.get('data_parsed'),
            'sheet': r.get('sheet'),
        })

    return {
        'file_path': path,
        'total_rows': total,
        'valid_rows': int(df_valid.shape[0]),
        'month_distribution': month_dist,
        'rows': mapped_rows,
    }


