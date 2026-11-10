/* Índice de Gradiente de Urbanicidade (IGU / UGI)
   Rangel, Morais e Ramos, Front. Urban Rural Plan. 4, 18 (2026).
   https://doi.org/10.1007/s44243-026-00089-2

   Este arquivo tem três partes: a matemática do índice, a PCA usada para
   recalibrar com dados próprios, e a montagem das páginas. Nada aqui depende
   de servidor: a página inteira roda no navegador de quem acessa. */

(function (global) {
  'use strict';

  var D = global.IGU_DADOS;

  // ------------------------------------------------------------------
  // 1. Parâmetros e escores
  // ------------------------------------------------------------------
  var P = { WN: 40, WD: 10, WL: 10, WI: 40, RN: 2000, alfa: 2, beta: 0.001, limiar: 50 };

  var VARS = [];
  D.categorias.forEach(function (c) { c.vars.forEach(function (v) { VARS.push(v); }); });
  var PESO_PADRAO = {};
  VARS.forEach(function (v) { PESO_PADRAO[v.id] = v.peso; });

  /* Entre as três categorias de aeroporto conta apenas a maior presente:
     um aeroporto grande também satisfaz os critérios de médio e de local, e
     somar os três pontuaria o mesmo aeroporto três vezes. */
  function maiorAeroporto(marcadas) {
    for (var i = D.aeroportos.length - 1; i >= 0; i--)
      if (marcadas[D.aeroportos[i]]) return D.aeroportos[i];
    return null;
  }

  function escores(pop, dens, dist, marcadas, pesos, regraArtigo) {
    pesos = pesos || PESO_PADRAO;
    var sN = pop > 0
      ? Math.min(P.WN / (1 + Math.exp(-P.alfa * (Math.log10(pop) - Math.log10(P.RN)))), P.WN) : 0;
    var sD = dens > 0 ? Math.min(P.WD * (1 - Math.exp(-P.beta * dens)), P.WD) : 0;
    var sL = dist < P.limiar ? Math.max(0, P.WL * (P.limiar - dist) / P.limiar) : 0;

    var maior = regraArtigo === false ? undefined : maiorAeroporto(marcadas);
    var sI = 0;
    VARS.forEach(function (v) {
      if (!marcadas[v.id]) return;
      if (regraArtigo !== false && D.aeroportos.indexOf(v.id) >= 0 && v.id !== maior) return;
      sI += pesos[v.id] || 0;
    });
    sI = Math.min(sI, P.WI);
    return { sN: sN, sD: sD, sL: sL, sI: sI, total: sN + sD + sL + sI };
  }

  // ------------------------------------------------------------------
  // 2. PCA: matriz de correlação e Jacobi
  // ------------------------------------------------------------------
  function padroniza(M) {
    var n = M.length, p = M[0].length, Z = [], j, i, m, s;
    for (i = 0; i < n; i++) Z.push(M[i].slice());
    for (j = 0; j < p; j++) {
      m = 0; for (i = 0; i < n; i++) m += M[i][j]; m /= n;
      s = 0; for (i = 0; i < n; i++) s += (M[i][j] - m) * (M[i][j] - m);
      s = Math.sqrt(s / n) || 1;
      for (i = 0; i < n; i++) Z[i][j] = (M[i][j] - m) / s;
    }
    return Z;
  }

  function correlacao(Z) {
    var n = Z.length, p = Z[0].length, R = [], i, j, k, s;
    for (i = 0; i < p; i++) R.push(new Array(p).fill(0));
    for (i = 0; i < p; i++)
      for (j = i; j < p; j++) {
        s = 0; for (k = 0; k < n; k++) s += Z[k][i] * Z[k][j];
        R[i][j] = R[j][i] = s / n;
      }
    return R;
  }

  /* Jacobi cíclico: a matriz é simétrica e pequena (algumas dezenas de
     variáveis), então as rotações convergem em poucas varreduras. */
  function jacobi(A0, varreduras) {
    var p = A0.length, A = A0.map(function (r) { return r.slice(); }), V = [], i, j, k, s;
    for (i = 0; i < p; i++) { V.push(new Array(p).fill(0)); V[i][i] = 1; }
    for (var it = 0; it < (varreduras || 100); it++) {
      var fora = 0;
      for (i = 0; i < p - 1; i++) for (j = i + 1; j < p; j++) fora += A[i][j] * A[i][j];
      if (Math.sqrt(fora) < 1e-12) break;
      for (i = 0; i < p - 1; i++) for (j = i + 1; j < p; j++) {
        if (Math.abs(A[i][j]) < 1e-14) continue;
        var theta = (A[j][j] - A[i][i]) / (2 * A[i][j]);
        var t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        var c = 1 / Math.sqrt(t * t + 1), sn = t * c;
        for (k = 0; k < p; k++) {
          var aik = A[i][k], ajk = A[j][k];
          A[i][k] = c * aik - sn * ajk; A[j][k] = sn * aik + c * ajk;
        }
        for (k = 0; k < p; k++) {
          var aki = A[k][i], akj = A[k][j];
          A[k][i] = c * aki - sn * akj; A[k][j] = sn * aki + c * akj;
        }
        for (k = 0; k < p; k++) {
          var vki = V[k][i], vkj = V[k][j];
          V[k][i] = c * vki - sn * vkj; V[k][j] = sn * vki + c * vkj;
        }
      }
    }
    var ordem = [];
    for (i = 0; i < p; i++) ordem.push(i);
    ordem.sort(function (a, b) { return A[b][b] - A[a][a]; });
    return {
      valores: ordem.map(function (i2) { return A[i2][i2]; }),
      vetores: ordem.map(function (i2) {
        return V.map(function (lin) { return lin[i2]; });
      }),
    };
  }

  /* Reproduz a calibração do artigo: PCA sobre as variáveis padronizadas,
     importância de segunda ordem w = s1|x| + s2|y|, e normalização para que
     os pesos de infraestrutura somem 40 pontos. */
  function calibra(matriz, colunas, infraCols) {
    var e = jacobi(correlacao(padroniza(matriz)));
    var soma = e.valores.reduce(function (a, b) { return a + Math.max(b, 0); }, 0);
    var s1 = e.valores[0] / soma, s2 = e.valores[1] / soma;
    var imp = {}, total = 0;
    infraCols.forEach(function (v) {
      var i = colunas.indexOf(v);
      var x = Math.abs(e.vetores[0][i]), y = Math.abs(e.vetores[1][i]);
      imp[v] = s1 * x + s2 * y; total += imp[v];
    });
    var pesos = {};
    infraCols.forEach(function (v) { pesos[v] = P.WI * imp[v] / total; });
    return { pesos: pesos, pc1: s1, pc2: s2 };
  }

  // ------------------------------------------------------------------
  // 3. Idioma
  // ------------------------------------------------------------------
  var T = {
    pt: {
      sigla: 'IGU', nome: 'Índice de Gradiente de Urbanicidade',
      menu_calc: 'Calculadora', menu_met: 'Metodologia', menu_lote: 'Lote e calibração',
      outro: 'English',
      t_calc: 'Calcule o IGU de uma localidade',
      sub_calc: 'Informe a população, a densidade, a distância até a sede urbana mais próxima e marque a infraestrutura presente. O resultado aparece ao lado, e muda a cada marcação.',
      h_demo: 'Dados demográficos e espaciais',
      l_nome: 'Nome da localidade', l_pop: 'População (habitantes)',
      l_dens: 'Densidade (hab/km²)', l_dist: 'Distância até a sede urbana (km)',
      n_pop: 'inflexão em 2000 habitantes', n_dens: 'saturação lenta, até 10 pontos',
      n_dist: 'acima de 50 km não pontua',
      h_infra: 'Infraestrutura presente',
      sub_infra: 'Marque o que existe na localidade. O número à direita é o peso do item, obtido por PCA sobre as 100 localidades de calibração.',
      h_result: 'Resultado', classe_u: 'Urbano', classe_r: 'Rural',
      c_parcela: 'Parcela', c_pontos: 'Pontos', c_max: 'Máx.',
      p_pop: 'População', p_dens: 'Densidade', p_dist: 'Distância', p_infra: 'Infraestrutura',
      p_total: 'IGU', b_limpar: 'Limpar', b_exemplo: 'Exemplo', b_json: 'Baixar JSON',
      h_mapa: 'Onde esta localidade cai',
      leg_mapa: 'Os 100 pontos são as localidades de calibração do artigo. A linha tracejada é o limiar 50, que separa rural de urbano. O losango é a sua localidade.',
      i_muito_alta: 'Urbanicidade alta: características de grande centro urbano.',
      i_alta: 'Urbanicidade moderada: características urbanas ou de transição.',
      i_baixa: 'Urbanicidade baixa: características peri-urbanas ou semirrurais.',
      i_muito_baixa: 'Urbanicidade muito baixa: características rurais.',
      t_met: 'Metodologia', t_lote: 'Lote e calibração',
      sel_todos: 'marcar tudo', sel_nenhum: 'limpar',
      aero_aviso: 'Entre os três aeroportos conta apenas a maior categoria marcada, como no artigo.',
      h_lote: 'Calcular várias localidades de uma vez',
      sub_lote: 'Solte um CSV com uma linha por localidade. As colunas exigidas são as mesmas do conjunto de calibração: nome, população, densidade, distância e as 34 variáveis de infraestrutura como 0 ou 1.',
      solte: 'Solte o arquivo CSV aqui, ou clique para escolher',
      b_modelo: 'Baixar CSV modelo', b_resultado: 'Baixar resultados',
      h_recal: 'Recalibrar com os seus próprios dados',
      sub_recal: 'Se você levantou um conjunto próprio de localidades, a página refaz a PCA no seu navegador e deriva novos pesos. Use pelo menos 50 localidades cobrindo toda a faixa de urbanização da sua região.',
      b_usar: 'Usar estes pesos na calculadora', b_voltar: 'Voltar aos pesos do artigo',
      usando_proprios: 'A calculadora está usando pesos recalibrados por você.',
      usando_artigo: 'A calculadora está usando os pesos publicados no artigo.',
      lin: 'linhas lidas', col_falta: 'Coluna ausente no arquivo:',
    },
    en: {
      sigla: 'UGI', nome: 'Urbanicity Gradient Index',
      menu_calc: 'Calculator', menu_met: 'Methodology', menu_lote: 'Batch and calibration',
      outro: 'Português',
      t_calc: 'Compute the UGI of a locality',
      sub_calc: 'Enter population, density and distance to the nearest urban seat, then tick the infrastructure that is present. The score updates with every tick.',
      h_demo: 'Demographic and spatial data',
      l_nome: 'Locality name', l_pop: 'Population (inhabitants)',
      l_dens: 'Density (people/km²)', l_dist: 'Distance to urban centre (km)',
      n_pop: 'inflection at 2000 inhabitants', n_dens: 'slow saturation, up to 10 points',
      n_dist: 'beyond 50 km it scores zero',
      h_infra: 'Infrastructure present',
      sub_infra: 'Tick what exists in the locality. The number on the right is the weight of the item, derived by PCA over the 100 calibration localities.',
      h_result: 'Result', classe_u: 'Urban', classe_r: 'Rural',
      c_parcela: 'Component', c_pontos: 'Points', c_max: 'Max',
      p_pop: 'Population', p_dens: 'Density', p_dist: 'Distance', p_infra: 'Infrastructure',
      p_total: 'UGI', b_limpar: 'Clear', b_exemplo: 'Example', b_json: 'Download JSON',
      h_mapa: 'Where this locality falls',
      leg_mapa: 'The 100 points are the calibration localities of the paper. The dashed line is the 50-point threshold separating rural from urban. The diamond is your locality.',
      i_muito_alta: 'High urbanicity: large urban centre characteristics.',
      i_alta: 'Moderate urbanicity: urban or transitional characteristics.',
      i_baixa: 'Low urbanicity: peri-urban or semi-rural characteristics.',
      i_muito_baixa: 'Very low urbanicity: rural characteristics.',
      t_met: 'Methodology', t_lote: 'Batch and calibration',
      sel_todos: 'tick all', sel_nenhum: 'clear',
      aero_aviso: 'Among the three airports only the highest category ticked is counted, as in the paper.',
      h_lote: 'Score many localities at once',
      sub_lote: 'Drop a CSV with one row per locality. The required columns are the ones of the calibration set: name, population, density, distance and the 34 infrastructure variables as 0 or 1.',
      solte: 'Drop the CSV file here, or click to choose one',
      b_modelo: 'Download template CSV', b_resultado: 'Download results',
      h_recal: 'Recalibrate with your own data',
      sub_recal: 'If you surveyed your own set of localities, this page redoes the PCA in your browser and derives new weights. Use at least 50 localities spanning the full urbanization range of your region.',
      b_usar: 'Use these weights in the calculator', b_voltar: 'Back to the published weights',
      usando_proprios: 'The calculator is using weights you recalibrated.',
      usando_artigo: 'The calculator is using the weights published in the paper.',
      lin: 'rows read', col_falta: 'Column missing from the file:',
    },
  };

  function idioma() {
    var g;
    try { g = localStorage.getItem('igu_idioma'); } catch (e) { g = null; }
    if (g === 'pt' || g === 'en') return g;
    return (navigator.language || 'pt').slice(0, 2) === 'en' ? 'en' : 'pt';
  }

  function trocaIdioma() {
    var novo = idioma() === 'pt' ? 'en' : 'pt';
    try { localStorage.setItem('igu_idioma', novo); } catch (e) { /* janela privada */ }
    aplicaIdioma();
  }

  function t(chave) { return T[idioma()][chave] || chave; }

  function aplicaIdioma() {
    var L = idioma();
    document.documentElement.lang = L === 'pt' ? 'pt-BR' : 'en';
    document.querySelectorAll('[data-t]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-t'));
    });
    document.querySelectorAll('[data-tpt]').forEach(function (el) {
      el.textContent = el.getAttribute(L === 'pt' ? 'data-tpt' : 'data-ten');
    });
    rodape();
    if (global.IGU_PAGINA && global.IGU_PAGINA.idioma) global.IGU_PAGINA.idioma(L);
  }

  // ------------------------------------------------------------------
  // 4. Pedaços de página
  // ------------------------------------------------------------------
  function el(pai, tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto !== undefined) e.textContent = texto;
    if (pai) pai.appendChild(e);
    return e;
  }

  function num(x, casas) {
    return x.toLocaleString(idioma() === 'pt' ? 'pt-BR' : 'en-US',
      { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  function cabecalho(pagina) {
    var topo = document.querySelector('.topo .envoltorio');
    if (!topo) return;
    var paginas = [['index.html', 'menu_calc'], ['metodologia.html', 'menu_met'],
                   ['lote.html', 'menu_lote']];
    var marca = el(topo, 'a', 'marca');
    marca.href = 'index.html';
    var img = el(marca, 'img'); img.src = 'assets/img/lfca.png'; img.alt = 'LFCA';
    var nome = el(marca, 'strong'); nome.setAttribute('data-t', 'sigla');
    var menu = el(topo, 'nav', 'menu');
    paginas.forEach(function (p) {
      var a = el(menu, 'a', p[0] === pagina ? 'aqui' : '');
      a.href = p[0]; a.setAttribute('data-t', p[1]);
    });
    var b = el(topo, 'button', 'idioma');
    b.setAttribute('data-t', 'outro');
    b.addEventListener('click', trocaIdioma);
  }

  function rodape() {
    var r = document.querySelector('.rodape .envoltorio');
    if (!r) return;
    r.textContent = '';
    var i1 = el(r, 'img'); i1.src = 'assets/img/urca.png'; i1.alt = 'URCA';
    var p = el(r, 'div');
    p.innerHTML = 'Rangel, J. M. L., Morais, A. F. &amp; Ramos, M. A. '
      + '<em>Beyond binary urban-rural classifications: a continuous urbanicity gradient index.</em> '
      + 'Frontiers of Urban and Rural Planning <strong>4</strong>, 18 (2026). '
      + '<a href="https://doi.org/10.1007/s44243-026-00089-2">10.1007/s44243-026-00089-2</a>'
      + '<br>' + (idioma() === 'pt' ? 'Código, dados e esta página: ' : 'Code, data and this page: ')
      + '<a href="https://github.com/apianomorais/urbanicity-gradient-index-UGI">github.com/apianomorais/urbanicity-gradient-index-UGI</a>'
      + (idioma() === 'pt'
        ? ' · Laboratório de Física Computacional Aplicada, Universidade Regional do Cariri'
        : ' · Applied Computational Physics Laboratory, Universidade Regional do Cariri');
  }

  // ------------------------------------------------------------------
  // 5. Gráfico IGU contra população
  // ------------------------------------------------------------------
  function desenhaMapa(tela, ponto) {
    var r = tela.getBoundingClientRect();
    var W = Math.max(320, Math.round(r.width)), H = Math.round(W * 0.52);
    var dpr = global.devicePixelRatio || 1;
    tela.width = W * dpr; tela.height = H * dpr;
    tela.style.height = H + 'px';
    var c = tela.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);

    var mE = 56, mD = 14, mT = 14, mB = 42;
    var x0 = Math.log10(5), x1 = Math.log10(4e7);
    function px(p) { return mE + (Math.log10(Math.max(p, 5)) - x0) / (x1 - x0) * (W - mE - mD); }
    function py(u) { return H - mB - (u / 100) * (H - mT - mB); }

    c.strokeStyle = '#dfe6ec'; c.fillStyle = '#5a6775';
    c.font = '12px system-ui, sans-serif'; c.lineWidth = 1;
    for (var u = 0; u <= 100; u += 25) {
      c.beginPath(); c.moveTo(mE, py(u)); c.lineTo(W - mD, py(u)); c.stroke();
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(String(u), mE - 8, py(u));
    }
    var mil = idioma() === 'pt' ? ' mil' : 'k', mi = idioma() === 'pt' ? ' mi' : 'M';
    var marcas = [10, 100, 1000, 1e4, 1e5, 1e6, 1e7];
    var rot = ['10', '100', '1' + mil, '10' + mil, '100' + mil, '1' + mi, '10' + mi];
    if (W < 460) {   // em tela estreita os rótulos se encavalam
      marcas = [10, 1000, 1e5, 1e7];
      rot = ['10', '1' + mil, '100' + mil, '10' + mi];
    }
    c.textAlign = 'center'; c.textBaseline = 'top';
    marcas.forEach(function (m, i) {
      c.beginPath(); c.moveTo(px(m), H - mB); c.lineTo(px(m), H - mB + 4); c.stroke();
      c.fillText(rot[i], px(m), H - mB + 7);
    });
    c.fillText(idioma() === 'pt' ? 'população' : 'population', (mE + W - mD) / 2, H - 15);
    c.save(); c.translate(14, (mT + H - mB) / 2); c.rotate(-Math.PI / 2);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(t('sigla'), 0, 0); c.restore();

    c.strokeStyle = '#c2601c'; c.setLineDash([6, 4]);
    c.beginPath(); c.moveTo(mE, py(50)); c.lineTo(W - mD, py(50)); c.stroke();
    c.setLineDash([]);

    D.localidades.forEach(function (l) {
      c.beginPath(); c.arc(px(l.pop), py(l.igu), 4, 0, 2 * Math.PI);
      c.fillStyle = l.igu > 50 ? 'rgba(45,79,114,.55)' : 'rgba(47,125,90,.55)';
      c.fill();
    });

    if (ponto && ponto.pop > 0) {
      var X = px(ponto.pop), Y = py(ponto.igu);
      c.beginPath();
      c.moveTo(X, Y - 9); c.lineTo(X + 9, Y); c.lineTo(X, Y + 9); c.lineTo(X - 9, Y);
      c.closePath();
      c.fillStyle = '#16202b'; c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke();
    }
  }

  // ------------------------------------------------------------------
  // 6. CSV
  // ------------------------------------------------------------------
  function leCSV(texto) {
    var sep = (texto.split('\n')[0].split(';').length > texto.split('\n')[0].split(',').length)
      ? ';' : ',';
    var linhas = texto.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); });
    var cab = linhas[0].split(sep).map(function (s) { return s.trim(); });
    var dados = linhas.slice(1).map(function (l) {
      var campos = l.split(sep), o = {};
      cab.forEach(function (c2, i) {
        var v = (campos[i] || '').trim();
        var n = Number(v.replace(',', '.'));
        o[c2] = (v !== '' && isFinite(n)) ? n : v;
      });
      return o;
    });
    return { colunas: cab, linhas: dados };
  }

  function baixa(nome, conteudo, tipo) {
    var b = new Blob([conteudo], { type: tipo || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  // ------------------------------------------------------------------
  function pesosGuardados() {
    try {
      var s = localStorage.getItem('igu_pesos');
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }
  function guardaPesos(p) {
    try {
      if (p) localStorage.setItem('igu_pesos', JSON.stringify(p));
      else localStorage.removeItem('igu_pesos');
    } catch (e) { /* janela privada: segue com os pesos do artigo */ }
  }

  global.IGU = {
    P: P, D: D, VARS: VARS, PESO_PADRAO: PESO_PADRAO,
    escores: escores, calibra: calibra, jacobi: jacobi,
    idioma: idioma, t: t, aplicaIdioma: aplicaIdioma, trocaIdioma: trocaIdioma,
    el: el, num: num, cabecalho: cabecalho, rodape: rodape,
    desenhaMapa: desenhaMapa, leCSV: leCSV, baixa: baixa,
    pesosGuardados: pesosGuardados, guardaPesos: guardaPesos,
  };
}(window));
