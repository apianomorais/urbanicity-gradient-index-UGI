#!/usr/bin/env python3
"""Regenera docs/assets/js/dados.js a partir de data/complete_data.csv.

Roda a mesma calibração dos scripts de linha de comando (PCA sobre as
variáveis padronizadas, importância de segunda ordem, normalização para 40
pontos) e grava, para a página web:

  * os 34 pesos de infraestrutura,
  * os nomes das variáveis em português e inglês, por domínio,
  * o IGU das 100 localidades de calibração, para o gráfico de comparação.

Use-o sempre que data/complete_data.csv mudar, senão o site passa a discordar
dos scripts.
"""

import json
import os

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENTRADA = os.path.join(RAIZ, 'data', 'complete_data.csv')
SAIDA = os.path.join(RAIZ, 'docs', 'assets', 'js', 'dados.js')

BASE = ['Population Size', 'Population Density', 'Distance to Town']
AEROPORTOS = ['Local Airport (<10 km)', 'Medium Airport (<20 km)',
              'Large Airport (< 30 km)']

# (id no CSV, nome em português, nome em inglês), por domínio
CATEGORIAS = [
    ('economia', 'Infraestrutura econômica', 'Economic infrastructure', [
        ('Factory', 'Fábrica', 'Factory'),
        ('Supermarket', 'Supermercado', 'Supermarket'),
        ('Public Market', 'Mercado público', 'Public market'),
        ('Street Market', 'Feira livre', 'Street market'),
        ('Grocery/Corner shop', 'Mercearia, venda', 'Grocery or corner shop'),
        ('Bank', 'Banco', 'Bank'),
        ('Drugstore', 'Farmácia', 'Drugstore')]),
    ('saude', 'Serviços de saúde', 'Health services', [
        ('Hospital', 'Hospital', 'Hospital'),
        ('ICU', 'UTI', 'Intensive care unit'),
        ('Health Centre', 'Posto de saúde', 'Health centre'),
        ('Mobile Medical Service', 'Atendimento médico móvel', 'Mobile medical service'),
        ('Private Health Service', 'Serviço de saúde privado', 'Private health service')]),
    ('transporte', 'Transporte', 'Transport', [
        ('Local Airport (<10 km)', 'Aeroporto local (até 10 km)', 'Local airport (under 10 km)'),
        ('Medium Airport (<20 km)', 'Aeroporto médio (até 20 km)', 'Medium airport (under 20 km)'),
        ('Large Airport (< 30 km)', 'Aeroporto grande (até 30 km)', 'Large airport (under 30 km)'),
        ('Public transportation', 'Transporte público', 'Public transport'),
        ('Private transportantion', 'Transporte privado, táxi', 'Private transport, taxi'),
        ('Paved roads', 'Estrada pavimentada', 'Paved roads')]),
    ('saneamento', 'Saneamento e utilidades', 'Sanitation and utilities', [
        ('Treated Water', 'Água tratada', 'Treated water'),
        ('Sewage Treatment', 'Tratamento de esgoto', 'Sewage treatment'),
        ('Waste Collection', 'Coleta de lixo', 'Waste collection'),
        ('Power grid', 'Rede elétrica', 'Power grid')]),
    ('comunicacao', 'Comunicação', 'Communication', [
        ('Internet Service', 'Internet', 'Internet service'),
        ('High-Speed Internet', 'Internet de alta velocidade', 'High-speed internet'),
        ('Mobile Service', 'Telefonia móvel', 'Mobile telephony'),
        ('Postal Service', 'Correios', 'Postal service')]),
    ('social', 'Infraestrutura social', 'Social infrastructure', [
        ('Recreation Facilities', 'Área de lazer', 'Recreation facilities'),
        ('Gastronomy Facilities', 'Restaurantes', 'Gastronomy facilities'),
        ('Sports Facilities', 'Equipamento esportivo', 'Sports facilities'),
        ('Religious Centres', 'Centro religioso', 'Religious centre'),
        ('Security Infrastructure', 'Segurança pública', 'Security infrastructure')]),
    ('educacao', 'Educação', 'Education', [
        ('Elementary School', 'Ensino fundamental', 'Elementary school'),
        ('Secondary School', 'Ensino médio', 'Secondary school'),
        ('University', 'Universidade', 'University')]),
]


def calibra(d, infra):
    variaveis = BASE + infra
    X = StandardScaler().fit_transform(d[variaveis])
    pca = PCA().fit(X)
    s1, s2 = pca.explained_variance_ratio_[:2]
    imp = {v: s1 * abs(pca.components_[0][i]) + s2 * abs(pca.components_[1][i])
           for i, v in enumerate(variaveis) if v in infra}
    total = sum(imp.values())
    return {v: 40 * imp[v] / total for v in imp}, s1, s2


def igu(linha, pesos, infra):
    N = linha['Population Size']
    D = linha['Population Density']
    L = linha['Distance to Town']
    sN = min(40 / (1 + np.exp(-2 * (np.log10(N) - np.log10(2000)))), 40) if N > 0 else 0
    sD = min(10 * (1 - np.exp(-0.001 * D)), 10) if D > 0 else 0
    sL = max(0.0, 10 * (50 - L) / 50) if L < 50 else 0.0

    # só a maior categoria de aeroporto presente pontua (secção 2.5 do artigo)
    maior = None
    for a in reversed(AEROPORTOS):
        if linha.get(a, 0) == 1:
            maior = a
            break
    sI = sum(linha.get(v, 0) * pesos[v] for v in infra
             if v not in AEROPORTOS or v == maior)
    return sN + sD + sL + min(sI, 40)


def main():
    d = pd.read_csv(ENTRADA)
    infra = [c for c in d.columns if c not in ['Localities'] + BASE]
    catalogado = [v for _, _, _, vs in CATEGORIAS for v, _, _ in vs]
    faltando = set(infra) ^ set(catalogado)
    if faltando:
        raise SystemExit('variáveis sem tradução ou inexistentes: %s' % sorted(faltando))

    pesos, s1, s2 = calibra(d, infra)
    localidades = [{'nome': r['Localities'], 'pop': int(r['Population Size']),
                    'dens': float(r['Population Density']),
                    'dist': float(r['Distance to Town']),
                    'igu': round(float(igu(r, pesos, infra)), 2)}
                   for _, r in d.iterrows()]

    dados = {
        'pc1': round(float(s1), 6), 'pc2': round(float(s2), 6),
        'categorias': [{'id': i, 'pt': pt, 'en': en,
                        'vars': [{'id': v, 'pt': p, 'en': e, 'peso': round(pesos[v], 4)}
                                 for v, p, e in vs]}
                       for i, pt, en, vs in CATEGORIAS],
        'aeroportos': AEROPORTOS,
        'localidades': localidades,
        'colunas': ['Localities'] + BASE + infra,
    }
    with open(SAIDA, 'w', encoding='utf-8') as f:
        f.write('// Gerado por tools/make_site_data.py a partir de '
                'data/complete_data.csv.\n'
                '// Não editar à mão: os pesos vêm da PCA sobre as localidades '
                'de calibração.\n'
                'window.IGU_DADOS = ')
        json.dump(dados, f, ensure_ascii=False, indent=1)
        f.write(';\n')
    print('%s: %d localidades, %d variáveis, PC1 %.1f %%, PC2 %.1f %%'
          % (os.path.relpath(SAIDA, RAIZ), len(localidades), len(infra),
             s1 * 100, s2 * 100))


if __name__ == '__main__':
    main()
