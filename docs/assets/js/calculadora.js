/* A calculadora de uma localidade. Tudo é recalculado a cada tecla e a cada
   marcação: não há botão de calcular, porque a graça do índice contínuo é ver
   quanto cada item de infraestrutura move o resultado. */

(function () {
  'use strict';
  var I = window.IGU, D = I.D;
  var marcadas = {}, pesos = I.pesosGuardados() || I.PESO_PADRAO;

  I.cabecalho('index.html');
  I.rodape();

  // ---- caixas de infraestrutura, por domínio ----
  var raiz = document.getElementById('dominios');
  D.categorias.forEach(function (cat) {
    var box = I.el(raiz, 'section', 'dominio');
    var h = I.el(box, 'h3');
    var tit = I.el(h, 'span');
    tit.setAttribute('data-tpt', cat.pt); tit.setAttribute('data-ten', cat.en);
    var conta = I.el(h, 'span', 'conta');
    conta.id = 'conta-' + cat.id;
    var itens = I.el(box, 'div', 'itens');
    cat.vars.forEach(function (v) {
      var r = I.el(itens, 'label', 'item');
      var c = I.el(r, 'input');
      c.type = 'checkbox'; c.value = v.id;
      var nome = I.el(r, 'span');
      nome.setAttribute('data-tpt', v.pt); nome.setAttribute('data-ten', v.en);
      var p = I.el(r, 'span', 'peso');
      p.id = 'peso-' + cat.vars.indexOf(v) + '-' + cat.id;
      p.dataset.var = v.id;
      c.addEventListener('change', function () {
        marcadas[v.id] = c.checked ? 1 : 0;
        r.classList.toggle('ligado', c.checked);
        atualiza();
      });
    });
  });

  function campos() {
    return {
      nome: document.getElementById('nome').value.trim(),
      pop: Number(document.getElementById('pop').value) || 0,
      dens: Number(document.getElementById('dens').value) || 0,
      dist: Number(document.getElementById('dist').value) || 0,
    };
  }

  function atualiza() {
    var c = campos();
    var e = I.escores(c.pop, c.dens, c.dist, marcadas, pesos, true);
    var urbano = e.total > 50;

    document.getElementById('valor').textContent = I.num(e.total, 1);
    document.getElementById('marcador').className = 'marcador ' + (urbano ? 'urbano' : 'rural');
    document.getElementById('classe').textContent = I.t(urbano ? 'classe_u' : 'classe_r');
    document.getElementById('agulha').style.left = Math.max(0, Math.min(100, e.total)) + '%';

    var chave = e.total > 75 ? 'i_muito_alta' : e.total > 50 ? 'i_alta'
      : e.total > 25 ? 'i_baixa' : 'i_muito_baixa';
    document.getElementById('interpretacao').textContent = I.t(chave);

    var linhas = [['p_pop', e.sN, I.P.WN], ['p_dens', e.sD, I.P.WD],
                  ['p_dist', e.sL, I.P.WL], ['p_infra', e.sI, I.P.WI]];
    var corpo = document.getElementById('parcelas');
    corpo.textContent = '';
    linhas.forEach(function (l) {
      var tr = I.el(corpo, 'tr');
      var td = I.el(tr, 'td', '', I.t(l[0]));
      var b = I.el(td, 'div', 'barrinha');
      I.el(b, 'i').style.width = (100 * l[1] / l[2]) + '%';
      I.el(tr, 'td', 'n', I.num(l[1], 2));
      I.el(tr, 'td', 'n', String(l[2]));
    });
    var tt = I.el(corpo, 'tr', 'total');
    I.el(tt, 'td', '', I.t('p_total'));
    I.el(tt, 'td', 'n', I.num(e.total, 2));
    I.el(tt, 'td', 'n', '100');

    // pesos mostrados ao lado de cada item, e contagem por domínio
    document.querySelectorAll('.peso').forEach(function (p) {
      p.textContent = I.num(pesos[p.dataset.var] || 0, 2);
    });
    D.categorias.forEach(function (cat) {
      var n = cat.vars.filter(function (v) { return marcadas[v.id]; }).length;
      document.getElementById('conta-' + cat.id).textContent = n + '/' + cat.vars.length;
    });

    document.getElementById('fonte-pesos').textContent =
      I.t(pesos === I.PESO_PADRAO ? 'usando_artigo' : 'usando_proprios');

    I.desenhaMapa(document.getElementById('mapa'), { pop: c.pop, igu: e.total });
    return e;
  }

  ['nome', 'pop', 'dens', 'dist'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', atualiza);
  });

  document.getElementById('limpar').addEventListener('click', function () {
    document.querySelectorAll('#dominios input').forEach(function (c) {
      c.checked = false; c.parentNode.classList.remove('ligado');
    });
    marcadas = {};
    document.getElementById('nome').value = '';
    document.getElementById('pop').value = 0;
    document.getElementById('dens').value = 0;
    document.getElementById('dist').value = 0;
    atualiza();
  });

  /* O exemplo é uma localidade real do conjunto de calibração, sorteada a
     cada clique: mostra de saída que a escala cobre dos povoados às capitais. */
  document.getElementById('exemplo').addEventListener('click', function () {
    var l = D.localidades[Math.floor(Math.random() * D.localidades.length)];
    document.getElementById('nome').value = l.nome;
    document.getElementById('pop').value = l.pop;
    document.getElementById('dens').value = l.dens;
    document.getElementById('dist').value = l.dist;
    // reconstrói a infraestrutura que reproduz o IGU publicado da localidade
    var alvo = l.igu;
    document.querySelectorAll('#dominios input').forEach(function (c) {
      c.checked = false; c.parentNode.classList.remove('ligado');
    });
    marcadas = {};
    var e = I.escores(l.pop, l.dens, l.dist, {}, pesos, true);
    var falta = alvo - e.total;
    var ordenadas = I.VARS.slice().sort(function (a, b) { return pesos[b.id] - pesos[a.id]; });
    ordenadas.forEach(function (v) {
      if (falta <= 0.005) return;
      if (pesos[v.id] <= falta + 0.08) {
        marcadas[v.id] = 1; falta -= pesos[v.id];
        var c = document.querySelector('#dominios input[value="' + CSS.escape(v.id) + '"]');
        if (c) { c.checked = true; c.parentNode.classList.add('ligado'); }
      }
    });
    atualiza();
  });

  document.getElementById('json').addEventListener('click', function () {
    var c = campos(), e = atualiza();
    var saida = {
      indice: 'UGI', referencia: 'https://doi.org/10.1007/s44243-026-00089-2',
      calculado_em: new Date().toISOString(),
      localidade: c.nome || null,
      entrada: {
        populacao: c.pop, densidade: c.dens, distancia_km: c.dist,
        infraestrutura: I.VARS.reduce(function (o, v) {
          o[v.id] = marcadas[v.id] ? 1 : 0; return o;
        }, {}),
      },
      pesos_infraestrutura: pesos === I.PESO_PADRAO ? 'publicados' : pesos,
      escores: {
        populacao: +e.sN.toFixed(4), densidade: +e.sD.toFixed(4),
        distancia: +e.sL.toFixed(4), infraestrutura: +e.sI.toFixed(4),
        ugi: +e.total.toFixed(4),
      },
      classificacao: e.total > 50 ? 'urban' : 'rural',
    };
    I.baixa('ugi_' + (c.nome || 'localidade').replace(/\W+/g, '_').toLowerCase() + '.json',
      JSON.stringify(saida, null, 2), 'application/json');
  });

  window.IGU_PAGINA = { idioma: function () { atualiza(); } };
  window.addEventListener('resize', function () {
    I.desenhaMapa(document.getElementById('mapa'),
      { pop: campos().pop, igu: Number(document.getElementById('valor').textContent.replace(',', '.')) });
  });

  I.aplicaIdioma();
  atualiza();
}());
