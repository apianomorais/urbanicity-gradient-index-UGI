/* Duas coisas nesta página: pontuar um CSV inteiro de uma vez, e refazer a
   calibração por PCA com dados do próprio usuário. As duas rodam no
   navegador, sem enviar nada para servidor nenhum. */

(function () {
  'use strict';
  var I = window.IGU, D = I.D;
  var COL_NOME = 'Localities', COL_POP = 'Population Size',
      COL_DENS = 'Population Density', COL_DIST = 'Distance to Town';
  var INFRA = I.VARS.map(function (v) { return v.id; });
  var resultadoLote = null, pesosNovos = null;

  I.cabecalho('lote.html');
  I.rodape();

  function ligaSolta(caixa, entrada, trata) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      caixa.addEventListener(ev, function (e) {
        e.preventDefault(); caixa.classList.add('sobre');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      caixa.addEventListener(ev, function (e) {
        e.preventDefault(); caixa.classList.remove('sobre');
      });
    });
    caixa.addEventListener('drop', function (e) {
      var f = e.dataTransfer.files[0];
      if (f) leArquivo(f, trata);
    });
    entrada.addEventListener('change', function () {
      if (entrada.files[0]) leArquivo(entrada.files[0], trata);
    });
  }

  function leArquivo(f, trata) {
    var r = new FileReader();
    r.onload = function () { trata(I.leCSV(String(r.result)), f.name); };
    r.readAsText(f, 'utf-8');
  }

  function faltando(colunas, exigidas) {
    return exigidas.filter(function (c) { return colunas.indexOf(c) < 0; });
  }

  // ------------------------------------------------------------------
  // lote
  // ------------------------------------------------------------------
  function trataLote(csv) {
    var recado = document.getElementById('recado-lote');
    var falta = faltando(csv.colunas, [COL_POP, COL_DENS, COL_DIST]);
    if (falta.length) {
      recado.textContent = I.t('col_falta') + ' ' + falta.join(', ');
      return;
    }
    var pesos = I.pesosGuardados() || I.PESO_PADRAO;
    resultadoLote = csv.linhas.map(function (l) {
      var marc = {};
      INFRA.forEach(function (v) { marc[v] = Number(l[v]) ? 1 : 0; });
      var e = I.escores(Number(l[COL_POP]) || 0, Number(l[COL_DENS]) || 0,
                        Number(l[COL_DIST]) || 0, marc, pesos, true);
      return {
        nome: l[COL_NOME] !== undefined ? l[COL_NOME] : '',
        pop: Number(l[COL_POP]) || 0, e: e,
      };
    });
    recado.textContent = csv.linhas.length + ' ' + I.t('lin') + '.';

    var cab = document.getElementById('cab-lote');
    cab.textContent = '';
    var nomes = I.idioma() === 'pt'
      ? ['Localidade', 'População', 'Pop.', 'Dens.', 'Dist.', 'Infra.', 'IGU', 'Classe']
      : ['Locality', 'Population', 'Pop.', 'Dens.', 'Dist.', 'Infra.', 'UGI', 'Class'];
    nomes.forEach(function (n, i) {
      var th = I.el(cab, 'th', '', n);
      if (i > 0) th.style.textAlign = 'right';
    });
    var corpo = document.getElementById('corpo-lote');
    corpo.textContent = '';
    resultadoLote.slice(0, 500).forEach(function (r) {
      var tr = I.el(corpo, 'tr');
      I.el(tr, 'td', '', String(r.nome));
      I.el(tr, 'td', 'n', I.num(r.pop, 0));
      [r.e.sN, r.e.sD, r.e.sL, r.e.sI, r.e.total].forEach(function (x) {
        I.el(tr, 'td', 'n', I.num(x, 2));
      });
      var c = I.el(tr, 'td', 'n', I.t(r.e.total > 50 ? 'classe_u' : 'classe_r'));
      c.style.color = r.e.total > 50 ? 'var(--urbano)' : 'var(--rural)';
    });
    document.getElementById('rolagem-lote').style.display = '';
    document.getElementById('baixar-lote').disabled = false;
  }

  document.getElementById('baixar-lote').addEventListener('click', function () {
    if (!resultadoLote) return;
    var linhas = ['locality,population,S_N,S_D,S_L,S_I,UGI,class'];
    resultadoLote.forEach(function (r) {
      linhas.push('"' + String(r.nome).replace(/"/g, '""') + '",' + r.pop + ','
        + r.e.sN.toFixed(4) + ',' + r.e.sD.toFixed(4) + ',' + r.e.sL.toFixed(4) + ','
        + r.e.sI.toFixed(4) + ',' + r.e.total.toFixed(4) + ','
        + (r.e.total > 50 ? 'urban' : 'rural'));
    });
    I.baixa('ugi_resultados.csv', linhas.join('\n'), 'text/csv;charset=utf-8');
  });

  document.getElementById('modelo').addEventListener('click', function () {
    var cab = [COL_NOME, COL_POP, COL_DENS, COL_DIST].concat(INFRA);
    var exemplo = D.localidades[0];
    var linha = ['"' + exemplo.nome + '"', exemplo.pop, exemplo.dens, exemplo.dist]
      .concat(INFRA.map(function () { return 0; }));
    I.baixa('ugi_modelo.csv',
      cab.map(function (c) { return '"' + c + '"'; }).join(',') + '\n' + linha.join(',') + '\n',
      'text/csv;charset=utf-8');
  });

  // ------------------------------------------------------------------
  // recalibração
  // ------------------------------------------------------------------
  function trataCal(csv) {
    var recado = document.getElementById('recado-cal');
    var exigidas = [COL_POP, COL_DENS, COL_DIST].concat(INFRA);
    var falta = faltando(csv.colunas, exigidas);
    if (falta.length) {
      recado.textContent = I.t('col_falta') + ' ' + falta.slice(0, 6).join(', ')
        + (falta.length > 6 ? ' (+' + (falta.length - 6) + ')' : '');
      document.getElementById('saida-cal').style.display = 'none';
      return;
    }
    if (csv.linhas.length < 20) {
      recado.textContent = I.idioma() === 'pt'
        ? 'São ' + csv.linhas.length + ' linhas. A PCA precisa de mais localidades: o artigo recomenda pelo menos 50.'
        : 'Only ' + csv.linhas.length + ' rows. PCA needs more localities: the paper recommends at least 50.';
      document.getElementById('saida-cal').style.display = 'none';
      return;
    }
    var colunas = exigidas;
    var M = csv.linhas.map(function (l) {
      return colunas.map(function (c) { return Number(l[c]) || 0; });
    });
    var cal = I.calibra(M, colunas, INFRA);
    pesosNovos = cal.pesos;

    recado.textContent = csv.linhas.length + ' ' + I.t('lin') + '. '
      + 'PC1 ' + I.num(cal.pc1 * 100, 1) + ' %, PC2 ' + I.num(cal.pc2 * 100, 1) + ' %.';

    var corpo = document.getElementById('corpo-cal');
    corpo.textContent = '';
    I.VARS.slice().sort(function (a, b) { return pesosNovos[b.id] - pesosNovos[a.id]; })
      .forEach(function (v) {
        var tr = I.el(corpo, 'tr');
        I.el(tr, 'td', '', I.idioma() === 'pt' ? v.pt : v.en);
        I.el(tr, 'td', 'n', I.num(pesosNovos[v.id], 2));
        I.el(tr, 'td', 'n', I.num(v.peso, 2));
      });
    document.getElementById('saida-cal').style.display = '';
    desenhaCal();
    estado();
  }

  function desenhaCal() {
    if (!pesosNovos) return;
    var tela = document.getElementById('grafico-cal');
    var W = Math.max(280, Math.round(tela.getBoundingClientRect().width));
    var H = Math.round(W * 0.85), dpr = window.devicePixelRatio || 1;
    tela.width = W * dpr; tela.height = H * dpr; tela.style.height = H + 'px';
    var c = tela.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    var m = 44, lim = 0;
    I.VARS.forEach(function (v) { lim = Math.max(lim, v.peso, pesosNovos[v.id]); });
    lim = Math.ceil(lim * 2) / 2;
    function px(x) { return m + x / lim * (W - m - 12); }
    function py(y) { return H - m - y / lim * (H - m - 12); }

    c.strokeStyle = '#dfe6ec'; c.fillStyle = '#5a6775';
    c.font = '12px system-ui, sans-serif';
    for (var g = 0; g <= lim + 1e-9; g += 0.5) {
      c.beginPath(); c.moveTo(px(g), py(0)); c.lineTo(px(g), py(lim)); c.stroke();
      c.beginPath(); c.moveTo(px(0), py(g)); c.lineTo(px(lim), py(g)); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'top';
      c.fillText(I.num(g, 1), px(g), py(0) + 6);
      c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText(I.num(g, 1), px(0) - 6, py(g));
    }
    c.strokeStyle = '#c2601c'; c.setLineDash([5, 4]);
    c.beginPath(); c.moveTo(px(0), py(0)); c.lineTo(px(lim), py(lim)); c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(45,79,114,.6)';
    I.VARS.forEach(function (v) {
      c.beginPath(); c.arc(px(v.peso), py(pesosNovos[v.id]), 4.5, 0, 2 * Math.PI); c.fill();
    });
  }

  function estado() {
    var p = I.pesosGuardados();
    document.getElementById('estado-pesos').textContent =
      I.t(p ? 'usando_proprios' : 'usando_artigo');
  }

  document.getElementById('usar-cal').addEventListener('click', function () {
    if (pesosNovos) { I.guardaPesos(pesosNovos); estado(); }
  });
  document.getElementById('voltar-cal').addEventListener('click', function () {
    I.guardaPesos(null); estado();
  });

  ligaSolta(document.getElementById('solta-lote'), document.getElementById('arq-lote'), trataLote);
  ligaSolta(document.getElementById('solta-cal'), document.getElementById('arq-cal'), trataCal);

  window.IGU_PAGINA = { idioma: function () { desenhaCal(); estado(); } };
  window.addEventListener('resize', desenhaCal);
  I.aplicaIdioma();
  estado();
}());
