#!/usr/bin/env python3
"""
Calculadora do Índice de Gradiente de Urbanicidade (IGU) - Versão Interativa

Este programa implementa a metodologia do Índice de Gradiente de Urbanicidade com
uma interface amigável para adicionar novas localidades.

Baseado em: "Além das Classificações Binárias Urbano-Rural: Um Índice Contínuo de Gradiente de Urbanicidade"
Autores: JML Rangel, AF Morais, MA Ramos
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import matplotlib.pyplot as plt
import seaborn as sns
import warnings
import os
import json
from datetime import datetime
warnings.filterwarnings('ignore')

class IndiceGradienteUrbanicidade:
    """
    Calculadora do Índice de Gradiente de Urbanicidade com Interface Interativa
    """
    
    def __init__(self):
        """Inicializa a calculadora IGU com parâmetros padrão."""
        # Parâmetros do IGU (do artigo de pesquisa)
        self.W_N = 40  # Peso do tamanho populacional
        self.W_D = 10  # Peso da densidade populacional  
        self.W_L = 10  # Peso da distância
        self.W_I = 40  # Peso da infraestrutura
        
        # Parâmetros sigmoid do tamanho populacional
        self.R_N = 2000    # Ponto de inflexão
        self.alpha = 2     # Inclinação da curva
        
        # Parâmetro exponencial da densidade populacional
        self.beta = 0.001  # Taxa de decaimento
        
        # Limiar de distância (km)
        self.limiar_distancia = 50
        
        # Variáveis de infraestrutura organizadas por categoria
        self.categorias_infraestrutura = {
            'Infraestrutura Econômica': {
                'Factory': 'Instalações industriais presentes',
                'Supermarket': 'Grandes lojas de varejo',
                'Public Market': 'Mercados municipais/públicos',
                'Street Market': 'Feiras/mercados periódicos',
                'Grocery/Corner shop': 'Pequenas lojas locais',
                'Bank': 'Serviços bancários',
                'Drugstore': 'Farmácias/drogarias'
            },
            'Serviços de Saúde': {
                'Hospital': 'Instalações hospitalares',
                'ICU': 'Unidades de Terapia Intensiva',
                'Health Centre': 'Centros básicos de saúde',
                'Mobile Medical Service': 'Serviços médicos móveis',
                'Private Health Service': 'Serviços privados de saúde'
            },
            'Transporte': {
                'Local Airport (<10 km)': 'Aeroporto pequeno até 10km',
                'Medium Airport (<20 km)': 'Aeroporto médio até 20km',
                'Large Airport (< 30 km)': 'Aeroporto grande até 30km',
                'Public transportation': 'Ônibus, metrô, transporte público',
                'Private transportantion': 'Táxis, serviços de transporte',
                'Paved roads': 'Acesso por estradas pavimentadas'
            },
            'Saneamento e Utilidades': {
                'Treated Water': 'Abastecimento de água tratada',
                'Sewage Treatment': 'Sistema de tratamento de esgoto',
                'Waste Collection': 'Serviço de coleta de lixo',
                'Power grid': 'Conexão à rede elétrica'
            },
            'Comunicação': {
                'Internet Service': 'Conectividade à internet',
                'High-Speed Internet': 'Internet de alta velocidade (banda larga)',
                'Mobile Service': 'Cobertura de telefonia móvel',
                'Postal Service': 'Serviços postais/correios'
            },
            'Infraestrutura Social': {
                'Recreation Facilities': 'Parques, áreas recreativas',
                'Gastronomy Facilities': 'Restaurantes, serviços alimentares',
                'Sports Facilities': 'Complexos esportivos, academias',
                'Religious Centres': 'Igrejas, instalações religiosas',
                'Security Infrastructure': 'Polícia, serviços de segurança'
            },
            'Educação': {
                'Elementary School': 'Instalações de ensino fundamental',
                'Secondary School': 'Instalações de ensino médio',
                'University': 'Instituições de ensino superior'
            }
        }
        
        # Lista achatada de variáveis de infraestrutura
        self.variaveis_infraestrutura = []
        for categoria in self.categorias_infraestrutura.values():
            self.variaveis_infraestrutura.extend(categoria.keys())
        
        # Armazenamento para dados de calibração e pesos
        self.dados_calibracao = None
        self.pesos_infraestrutura = None
        self.modelo_pca = None
        self.escalonador = None
        self.esta_calibrado = False
        
    def exibir_boas_vindas(self):
        """Exibe mensagem de boas-vindas e instruções."""
        print("\n" + "="*80)
        print("🏙️  CALCULADORA DO ÍNDICE DE GRADIENTE DE URBANICIDADE (IGU)")
        print("="*80)
        print("📄 Baseado em: 'Além das Classificações Binárias Urbano-Rural:'")
        print("   'Um Índice Contínuo de Gradiente de Urbanicidade'")
        print("👥 Autores: JML Rangel, AF Morais, MA Ramos")
        print("="*80)
        print("\n📊 Esta ferramenta calcula pontuações de urbanicidade (0-100) usando:")
        print("   • Tamanho e densidade populacional")
        print("   • Distância até centros urbanos")  
        print("   • Desenvolvimento de infraestrutura (37 variáveis)")
        print("\n🎯 Pontuações > 50 = Características urbanas")
        print("🎯 Pontuações ≤ 50 = Características rurais")
        print("="*80)

    def carregar_dados_calibracao(self, caminho_arquivo='data/complete_data.csv'):
        """Carrega e prepara o conjunto de dados de calibração."""
        print("\n📂 CARREGANDO CONJUNTO DE DADOS DE CALIBRAÇÃO")
        print("-" * 50)
        
        if not os.path.exists(caminho_arquivo):
            print(f"❌ Arquivo de calibração '{caminho_arquivo}' não encontrado.")
            print("Por favor, certifique-se de que o conjunto de dados de calibração esteja disponível.")
            return False
            
        try:
            # Tentar diferentes separadores para detectar o formato correto
            if caminho_arquivo.endswith('.csv'):
                # Primeiro tentar separador de vírgula
                try:
                    self.dados_calibracao = pd.read_csv(caminho_arquivo, sep=',', decimal='.', encoding='utf-8')
                    # Verificar se os dados foram lidos corretamente (deve ter múltiplas colunas)
                    if len(self.dados_calibracao.columns) == 1:
                        # Tentar separador de ponto e vírgula
                        self.dados_calibracao = pd.read_csv(caminho_arquivo, sep=';', decimal='.', encoding='utf-8')
                except:
                    # Fallback para separador de ponto e vírgula
                    self.dados_calibracao = pd.read_csv(caminho_arquivo, sep=';', decimal='.', encoding='utf-8')
            else:
                self.dados_calibracao = pd.read_csv(caminho_arquivo, sep='\t', encoding='utf-8')
            
            print(f"📋 Colunas disponíveis: {list(self.dados_calibracao.columns)}")
            
            # Validar colunas obrigatórias
            colunas_obrigatorias = ['Localities', 'Population Size', 'Population Density', 'Distance to Town']
            colunas_faltantes = []
            
            # Verificar cada coluna obrigatória
            for col in colunas_obrigatorias:
                if col not in self.dados_calibracao.columns:
                    colunas_faltantes.append(col)
            
            if colunas_faltantes:
                print(f"❌ Colunas obrigatórias ausentes: {colunas_faltantes}")
                print("📋 Por favor, certifique-se de que seu CSV tenha estes nomes de colunas exatos:")
                for col in colunas_obrigatorias:
                    print(f"   • {col}")
                return False
            
            # Adicionar colunas de infraestrutura ausentes como zeros
            for var in self.variaveis_infraestrutura:
                if var not in self.dados_calibracao.columns:
                    self.dados_calibracao[var] = 0
                    
            print(f"✅ Carregadas {len(self.dados_calibracao)} localidades para calibração")
            print(f"✅ Encontradas {len([c for c in self.dados_calibracao.columns if c in self.variaveis_infraestrutura])} variáveis de infraestrutura")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao carregar dados de calibração: {e}")
            return False

    def calibrar_modelo(self):
        """Calibra o modelo IGU usando PCA."""
        print("\n⚙️  CALIBRANDO MODELO IGU")
        print("-" * 50)
        
        if self.dados_calibracao is None:
            print("❌ Nenhum dado de calibração carregado.")
            return False
            
        # Preparar dados para PCA
        variaveis_pca = ['Population Size', 'Population Density', 'Distance to Town'] + self.variaveis_infraestrutura
        dados_pca = self.dados_calibracao[variaveis_pca].copy()
        
        # Padronizar os dados
        self.escalonador = StandardScaler()
        dados_pca_padronizados = self.escalonador.fit_transform(dados_pca)
        
        # Executar PCA
        self.modelo_pca = PCA()
        self.modelo_pca.fit(dados_pca_padronizados)
        
        # Obter cargas e variância explicada
        cargas_pc1 = self.modelo_pca.components_[0]
        cargas_pc2 = self.modelo_pca.components_[1]
        variancia_explicada = self.modelo_pca.explained_variance_ratio_
        sigma1, sigma2 = variancia_explicada[0], variancia_explicada[1]
        
        print(f"✅ PC1 explica {sigma1*100:.1f}% da variância")
        print(f"✅ PC2 explica {sigma2*100:.1f}% da variância")
        print(f"✅ Combinado: {(sigma1+sigma2)*100:.1f}% da variância")
        
        # Calcular pesos da infraestrutura
        self.pesos_infraestrutura = {}
        importancia_infra = {}
        
        for i, var in enumerate(variaveis_pca):
            if var in self.variaveis_infraestrutura:
                importancia = sigma1 * abs(cargas_pc1[i]) + sigma2 * abs(cargas_pc2[i])
                importancia_infra[var] = importancia
        
        # Normalizar pesos para somar W_I (40 pontos)
        importancia_total = sum(importancia_infra.values())
        for var in importancia_infra:
            self.pesos_infraestrutura[var] = self.W_I * (importancia_infra[var] / importancia_total)
            
        self.esta_calibrado = True
        print(f"✅ Modelo calibrado com {len(importancia_infra)} variáveis de infraestrutura")
        
        return True

    def obter_entrada_informacoes_basicas(self):
        """Obtém informações demográficas básicas do usuário."""
        print("\n📝 INSERIR INFORMAÇÕES DA LOCALIDADE")
        print("-" * 50)
        
        # Obter nome da localidade
        while True:
            nome_localidade = input("🏘️  Nome da localidade: ").strip()
            if nome_localidade:
                break
            print("Por favor, insira um nome válido para a localidade.")
        
        # Obter tamanho populacional
        while True:
            try:
                tamanho_pop = input("👥 Tamanho populacional: ").strip()
                tamanho_pop = int(tamanho_pop.replace(',', '').replace('.', ''))
                if tamanho_pop > 0:
                    break
                print("O tamanho populacional deve ser maior que 0.")
            except ValueError:
                print("Por favor, insira um número válido para o tamanho populacional.")
        
        # Obter densidade populacional
        while True:
            try:
                densidade_pop = input("🏠 Densidade populacional (pessoas/km²): ").strip()
                densidade_pop = float(densidade_pop.replace(',', '.'))
                if densidade_pop > 0:
                    break
                print("A densidade populacional deve ser maior que 0.")
            except ValueError:
                print("Por favor, insira um número válido para a densidade populacional.")
        
        # Obter distância até centro urbano
        while True:
            try:
                distancia = input("📏 Distância até o centro urbano mais próximo (km): ").strip()
                distancia = float(distancia.replace(',', '.'))
                if distancia >= 0:
                    break
                print("A distância não pode ser negativa.")
            except ValueError:
                print("Por favor, insira um número válido para a distância.")
        
        return nome_localidade, tamanho_pop, densidade_pop, distancia

    def obter_entrada_infraestrutura(self):
        """Obtém informações de infraestrutura do usuário com categorias organizadas."""
        print("\n🏗️  AVALIAÇÃO DA INFRAESTRUTURA")
        print("-" * 50)
        print("Para cada item de infraestrutura, digite:")
        print("• '1' ou 'sim' se presente")
        print("• '0' ou 'não' se ausente")
        print("• Pressione Enter para 'não'")
        print("-" * 50)
        
        dados_infraestrutura = {}
        
        for nome_categoria, variaveis in self.categorias_infraestrutura.items():
            print(f"\n📋 {nome_categoria.upper()}")
            print("─" * 40)
            
            for var, descricao in variaveis.items():
                while True:
                    resposta = input(f"   {var} ({descricao}): ").strip().lower()
                    
                    if resposta in ['', '0', 'não', 'nao', 'n']:
                        dados_infraestrutura[var] = 0
                        break
                    elif resposta in ['1', 'sim', 's']:
                        dados_infraestrutura[var] = 1
                        break
                    else:
                        print("     Por favor, digite '1'/'sim' para presente ou '0'/'não' para ausente")
        
        return dados_infraestrutura

    def calcular_componentes_igu(self, tamanho_pop, densidade_pop, distancia, dados_infraestrutura):
        """Calcula componentes individuais do IGU."""
        # Pontuação populacional (sigmoid)
        if tamanho_pop <= 0:
            pontuacao_pop = 0
        else:
            log_pop = np.log10(tamanho_pop)
            log_ref = np.log10(self.R_N)
            pontuacao_pop = self.W_N / (1 + np.exp(-self.alpha * (log_pop - log_ref)))
            pontuacao_pop = min(pontuacao_pop, self.W_N)
        
        # Pontuação de densidade (exponencial)
        if densidade_pop <= 0:
            pontuacao_densidade = 0
        else:
            pontuacao_densidade = self.W_D * (1 - np.exp(-self.beta * densidade_pop))
            pontuacao_densidade = min(pontuacao_densidade, self.W_D)
        
        # Pontuação de distância (decaimento linear)
        if distancia >= self.limiar_distancia:
            pontuacao_distancia = 0
        else:
            pontuacao_distancia = self.W_L * (self.limiar_distancia - distancia) / self.limiar_distancia
            pontuacao_distancia = max(0, min(pontuacao_distancia, self.W_L))
        
        # Pontuação de infraestrutura (soma ponderada)
        pontuacao_infra = 0
        for var in self.variaveis_infraestrutura:
            presenca = dados_infraestrutura.get(var, 0)
            peso = self.pesos_infraestrutura.get(var, 0)
            pontuacao_infra += presenca * peso
        
        pontuacao_infra = min(pontuacao_infra, self.W_I)
        
        return pontuacao_pop, pontuacao_densidade, pontuacao_distancia, pontuacao_infra

    def exibir_resultados_detalhados(self, nome_localidade, tamanho_pop, densidade_pop, distancia, 
                                   dados_infraestrutura, pontuacao_pop, pontuacao_densidade, pontuacao_distancia, 
                                   pontuacao_infra, pontuacao_igu):
        """Exibe resultados detalhados com análise."""
        classificacao = "Urbano" if pontuacao_igu > 50 else "Rural"
        
        print("\n" + "="*80)
        print(f"📊 RESULTADOS DA ANÁLISE IGU PARA: {nome_localidade.upper()}")
        print("="*80)
        
        print(f"\n🎯 PONTUAÇÃO FINAL DO IGU: {pontuacao_igu:.2f}/100")
        print(f"🏷️  CLASSIFICAÇÃO: {classificacao}")
        
        print(f"\n📈 DETALHAMENTO DOS COMPONENTES:")
        print("─" * 50)
        print(f"👥 Pontuação Tamanho Populacional:  {pontuacao_pop:6.2f}/{self.W_N} ({pontuacao_pop/self.W_N*100:.1f}%)")
        print(f"🏠 Pontuação Densidade Populacional: {pontuacao_densidade:6.2f}/{self.W_D} ({pontuacao_densidade/self.W_D*100:.1f}%)")
        print(f"📏 Pontuação Distância:            {pontuacao_distancia:6.2f}/{self.W_L} ({pontuacao_distancia/self.W_L*100:.1f}%)")
        print(f"🏗️  Pontuação Infraestrutura:       {pontuacao_infra:6.2f}/{self.W_I} ({pontuacao_infra/self.W_I*100:.1f}%)")
        print("─" * 50)
        print(f"🎯 PONTUAÇÃO TOTAL DO IGU:         {pontuacao_igu:6.2f}/100")
        
        print(f"\n📋 RESUMO DOS DADOS DE ENTRADA:")
        print("─" * 50)
        print(f"Tamanho Populacional:     {tamanho_pop:,} habitantes")
        print(f"Densidade Populacional:   {densidade_pop:.1f} pessoas/km²")
        print(f"Distância até Centro Urbano: {distancia:.1f} km")
        
        # Mostrar resumo da infraestrutura por categoria
        print(f"\n🏗️  RESUMO DA INFRAESTRUTURA:")
        print("─" * 50)
        for nome_categoria, variaveis in self.categorias_infraestrutura.items():
            contagem_presente = sum(dados_infraestrutura.get(var, 0) for var in variaveis.keys())
            contagem_total = len(variaveis)
            percentual = (contagem_presente / contagem_total) * 100
            print(f"{nome_categoria:<25}: {contagem_presente:2d}/{contagem_total:2d} ({percentual:5.1f}%)")
        
        # Mostrar interpretação
        print(f"\n💡 INTERPRETAÇÃO:")
        print("─" * 50)
        if pontuacao_igu > 75:
            print("🏙️  Alta urbanicidade - Características de grande centro urbano")
        elif pontuacao_igu > 50:
            print("🏘️  Urbanicidade moderada - Características urbanas/transicionais") 
        elif pontuacao_igu > 25:
            print("🏡 Baixa urbanicidade - Características semi-rurais/peri-urbanas")
        else:
            print("🌾 Urbanicidade muito baixa - Características rurais")
            
        print("="*80)

    def salvar_resultados_arquivo(self, nome_localidade, dados_resultados):
        """Salva resultados em um arquivo."""
        nome_arquivo = f"resultados_igu_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(nome_arquivo, 'w', encoding='utf-8') as f:
                json.dump(dados_resultados, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Resultados salvos em: {nome_arquivo}")
        except Exception as e:
            print(f"❌ Erro ao salvar resultados: {e}")

    def executar_modo_interativo(self):
        """Executa a calculadora IGU interativa."""
        self.exibir_boas_vindas()
        
        # Carregar dados de calibração
        if not self.carregar_dados_calibracao():
            print("\n❌ Não é possível prosseguir sem dados de calibração.")
            return
        
        # Calibrar modelo
        if not self.calibrar_modelo():
            print("\n❌ Calibração do modelo falhou.")
            return
        
        print("\n✅ Calculadora IGU pronta!")
        
        while True:
            print("\n" + "="*80)
            print("🎮 MENU PRINCIPAL")
            print("="*80)
            print("1. Calcular IGU para uma nova localidade")
            print("2. Ver pesos das variáveis de infraestrutura")
            print("3. Sobre a metodologia IGU") 
            print("4. Sair")
            
            escolha = input("\n🔢 Selecione uma opção (1-4): ").strip()
            
            if escolha == '1':
                self.calcular_nova_localidade()
            elif escolha == '2':
                self.exibir_pesos()
            elif escolha == '3':
                self.exibir_info_metodologia()
            elif escolha == '4':
                print("\n👋 Obrigado por usar a Calculadora IGU!")
                break
            else:
                print("❌ Opção inválida. Por favor, escolha 1-4.")

    def calcular_nova_localidade(self):
        """Calcula IGU para uma nova localidade com interação completa."""
        print("\n" + "🔄"*80)
        print("CALCULANDO IGU PARA NOVA LOCALIDADE")
        print("🔄"*80)
        
        # Obter informações básicas
        nome_localidade, tamanho_pop, densidade_pop, distancia = self.obter_entrada_informacoes_basicas()
        
        # Obter informações de infraestrutura
        dados_infraestrutura = self.obter_entrada_infraestrutura()
        
        # Calcular componentes do IGU
        pontuacao_pop, pontuacao_densidade, pontuacao_distancia, pontuacao_infra = self.calcular_componentes_igu(
            tamanho_pop, densidade_pop, distancia, dados_infraestrutura
        )
        
        # Calcular pontuação final do IGU
        pontuacao_igu = pontuacao_pop + pontuacao_densidade + pontuacao_distancia + pontuacao_infra
        
        # Exibir resultados
        self.exibir_resultados_detalhados(
            nome_localidade, tamanho_pop, densidade_pop, distancia, dados_infraestrutura,
            pontuacao_pop, pontuacao_densidade, pontuacao_distancia, pontuacao_infra, pontuacao_igu
        )
        
        # Perguntar se o usuário quer salvar os resultados
        escolha_salvar = input("\n💾 Salvar resultados em arquivo? (s/n): ").strip().lower()
        if escolha_salvar in ['s', 'sim']:
            dados_resultados = {
                'nome_localidade': nome_localidade,
                'data_calculo': datetime.now().isoformat(),
                'dados_entrada': {
                    'tamanho_populacional': tamanho_pop,
                    'densidade_populacional': densidade_pop,
                    'distancia_centro_urbano': distancia,
                    'infraestrutura': dados_infraestrutura
                },
                'resultados': {
                    'pontuacao_igu': pontuacao_igu,
                    'classificacao': "Urbano" if pontuacao_igu > 50 else "Rural",
                    'pontuacoes_componentes': {
                        'populacional': pontuacao_pop,
                        'densidade': pontuacao_densidade,
                        'distancia': pontuacao_distancia,
                        'infraestrutura': pontuacao_infra
                    }
                }
            }
            self.salvar_resultados_arquivo(nome_localidade, dados_resultados)

    def exibir_pesos(self):
        """Exibe pesos das variáveis de infraestrutura."""
        print("\n📊 PESOS DAS VARIÁVEIS DE INFRAESTRUTURA")
        print("="*80)
        print("Os pesos são calculados usando Análise de Componentes Principais")
        print("Pesos maiores = indicadores mais fortes de urbanicidade")
        print("="*80)
        
        # Ordenar pesos por valor
        pesos_ordenados = sorted(self.pesos_infraestrutura.items(), 
                              key=lambda x: x[1], reverse=True)
        
        print(f"\n{'Rank':<4} {'Variável':<35} {'Peso':<8} {'Categoria'}")
        print("-" * 80)
        
        for rank, (var, peso) in enumerate(pesos_ordenados, 1):
            # Encontrar categoria para esta variável
            categoria = "Desconhecida"
            for nome_cat, variaveis in self.categorias_infraestrutura.items():
                if var in variaveis:
                    categoria = nome_cat
                    break
            
            print(f"{rank:<4} {var:<35} {peso:<8.3f} {categoria}")

    def exibir_info_metodologia(self):
        """Exibe informações sobre a metodologia IGU."""
        print("\n📚 SOBRE A METODOLOGIA IGU")
        print("="*80)
        print("O Índice de Gradiente de Urbanicidade (IGU) fornece uma medida contínua")
        print("de urbanicidade de 0-100, superando limitações das classificações")  
        print("binárias urbano-rurais.")
        print("\n🔬 BASE CIENTÍFICA:")
        print("• Baseado em Análise de Componentes Principais de 37 variáveis de infraestrutura")
        print("• Validado em 100 localidades do rural aos grandes centros metropolitanos")
        print("• Pesquisa publicada com kappa de Cohen = 1,00 (classificação perfeita)")
        print("\n📊 COMPONENTES DO IGU:")
        print(f"• Tamanho Populacional (máx {self.W_N} pontos): Função sigmoid")
        print(f"• Densidade Populacional (máx {self.W_D} pontos): Função exponencial")
        print(f"• Distância até Centro Urbano (máx {self.W_L} pontos): Decaimento linear")
        print(f"• Desenvolvimento de Infraestrutura (máx {self.W_I} pontos): Soma ponderada")
        print("\n🎯 INTERPRETAÇÃO:")
        print("• Pontuações > 50: Características urbanas")
        print("• Pontuações ≤ 50: Características rurais")
        print("• Escala contínua captura transições graduais")
        print("\n📄 REFERÊNCIA:")
        print("Rangel, J.M.L., Morais, A.F. & Ramos, M.A.2")
        print("Beyond binary urban-rural classifications: a continuous urbanicity gradient index.")
        print("Front. Urban Rural Plan. 4, 18 (2026)")
        print("https://doi.org/10.1007/s44243-026-00089-2")
        print("="*80)


def main():
    """Função principal para executar a Calculadora IGU."""
    calculadora_igu = IndiceGradienteUrbanicidade()
    calculadora_igu.executar_modo_interativo()


if __name__ == "__main__":
    main()