// Gerado por tools/make_site_data.py a partir de data/complete_data.csv.
// Não editar à mão: os pesos vêm da PCA sobre as localidades de calibração.
window.IGU_DADOS = {
 "pc1": 0.474609,
 "pc2": 0.082547,
 "categorias": [
  {
   "id": "economia",
   "pt": "Infraestrutura econômica",
   "en": "Economic infrastructure",
   "vars": [
    {
     "id": "Factory",
     "pt": "Fábrica",
     "en": "Factory",
     "peso": 1.3237
    },
    {
     "id": "Supermarket",
     "pt": "Supermercado",
     "en": "Supermarket",
     "peso": 1.486
    },
    {
     "id": "Public Market",
     "pt": "Mercado público",
     "en": "Public market",
     "peso": 1.5085
    },
    {
     "id": "Street Market",
     "pt": "Feira livre",
     "en": "Street market",
     "peso": 1.4566
    },
    {
     "id": "Grocery/Corner shop",
     "pt": "Mercearia, venda",
     "en": "Grocery or corner shop",
     "peso": 0.9333
    },
    {
     "id": "Bank",
     "pt": "Banco",
     "en": "Bank",
     "peso": 1.3569
    },
    {
     "id": "Drugstore",
     "pt": "Farmácia",
     "en": "Drugstore",
     "peso": 1.5037
    }
   ]
  },
  {
   "id": "saude",
   "pt": "Serviços de saúde",
   "en": "Health services",
   "vars": [
    {
     "id": "Hospital",
     "pt": "Hospital",
     "en": "Hospital",
     "peso": 1.4604
    },
    {
     "id": "ICU",
     "pt": "UTI",
     "en": "Intensive care unit",
     "peso": 1.5393
    },
    {
     "id": "Health Centre",
     "pt": "Posto de saúde",
     "en": "Health centre",
     "peso": 1.2785
    },
    {
     "id": "Mobile Medical Service",
     "pt": "Atendimento médico móvel",
     "en": "Mobile medical service",
     "peso": 1.0785
    },
    {
     "id": "Private Health Service",
     "pt": "Serviço de saúde privado",
     "en": "Private health service",
     "peso": 1.3695
    }
   ]
  },
  {
   "id": "transporte",
   "pt": "Transporte",
   "en": "Transport",
   "vars": [
    {
     "id": "Local Airport (<10 km)",
     "pt": "Aeroporto local (até 10 km)",
     "en": "Local airport (under 10 km)",
     "peso": 0.347
    },
    {
     "id": "Medium Airport (<20 km)",
     "pt": "Aeroporto médio (até 20 km)",
     "en": "Medium airport (under 20 km)",
     "peso": 0.4144
    },
    {
     "id": "Large Airport (< 30 km)",
     "pt": "Aeroporto grande (até 30 km)",
     "en": "Large airport (under 30 km)",
     "peso": 1.2055
    },
    {
     "id": "Public transportation",
     "pt": "Transporte público",
     "en": "Public transport",
     "peso": 1.2462
    },
    {
     "id": "Private transportantion",
     "pt": "Transporte privado, táxi",
     "en": "Private transport, taxi",
     "peso": 0.5006
    },
    {
     "id": "Paved roads",
     "pt": "Estrada pavimentada",
     "en": "Paved roads",
     "peso": 1.2925
    }
   ]
  },
  {
   "id": "saneamento",
   "pt": "Saneamento e utilidades",
   "en": "Sanitation and utilities",
   "vars": [
    {
     "id": "Treated Water",
     "pt": "Água tratada",
     "en": "Treated water",
     "peso": 1.0498
    },
    {
     "id": "Sewage Treatment",
     "pt": "Tratamento de esgoto",
     "en": "Sewage treatment",
     "peso": 0.6094
    },
    {
     "id": "Waste Collection",
     "pt": "Coleta de lixo",
     "en": "Waste collection",
     "peso": 1.2191
    },
    {
     "id": "Power grid",
     "pt": "Rede elétrica",
     "en": "Power grid",
     "peso": 0.4356
    }
   ]
  },
  {
   "id": "comunicacao",
   "pt": "Comunicação",
   "en": "Communication",
   "vars": [
    {
     "id": "Internet Service",
     "pt": "Internet",
     "en": "Internet service",
     "peso": 0.762
    },
    {
     "id": "High-Speed Internet",
     "pt": "Internet de alta velocidade",
     "en": "High-speed internet",
     "peso": 0.8959
    },
    {
     "id": "Mobile Service",
     "pt": "Telefonia móvel",
     "en": "Mobile telephony",
     "peso": 1.2483
    },
    {
     "id": "Postal Service",
     "pt": "Correios",
     "en": "Postal service",
     "peso": 1.5253
    }
   ]
  },
  {
   "id": "social",
   "pt": "Infraestrutura social",
   "en": "Social infrastructure",
   "vars": [
    {
     "id": "Recreation Facilities",
     "pt": "Área de lazer",
     "en": "Recreation facilities",
     "peso": 1.4936
    },
    {
     "id": "Gastronomy Facilities",
     "pt": "Restaurantes",
     "en": "Gastronomy facilities",
     "peso": 1.4936
    },
    {
     "id": "Sports Facilities",
     "pt": "Equipamento esportivo",
     "en": "Sports facilities",
     "peso": 1.3804
    },
    {
     "id": "Religious Centres",
     "pt": "Centro religioso",
     "en": "Religious centre",
     "peso": 0.8035
    },
    {
     "id": "Security Infrastructure",
     "pt": "Segurança pública",
     "en": "Security infrastructure",
     "peso": 1.4301
    }
   ]
  },
  {
   "id": "educacao",
   "pt": "Educação",
   "en": "Education",
   "vars": [
    {
     "id": "Elementary School",
     "pt": "Ensino fundamental",
     "en": "Elementary school",
     "peso": 1.2826
    },
    {
     "id": "Secondary School",
     "pt": "Ensino médio",
     "en": "Secondary school",
     "peso": 1.52
    },
    {
     "id": "University",
     "pt": "Universidade",
     "en": "University",
     "peso": 1.5499
    }
   ]
  }
 ],
 "aeroportos": [
  "Local Airport (<10 km)",
  "Medium Airport (<20 km)",
  "Large Airport (< 30 km)"
 ],
 "localidades": [
  {
   "nome": "Salvador-BA",
   "pop": 2900000,
   "dens": 4704.0,
   "dist": 0.0,
   "igu": 99.08
  },
  {
   "nome": "Aracaju-SE",
   "pop": 657000,
   "dens": 2307.0,
   "dist": 0.0,
   "igu": 97.19
  },
  {
   "nome": "Maceio-AL",
   "pop": 957916,
   "dens": 1729.0,
   "dist": 0.0,
   "igu": 97.28
  },
  {
   "nome": "Natal-RN",
   "pop": 896708,
   "dens": 4829.47,
   "dist": 0.0,
   "igu": 98.96
  },
  {
   "nome": "São Luís-MA",
   "pop": 1037775,
   "dens": 1183.4,
   "dist": 0.0,
   "igu": 96.0
  },
  {
   "nome": "Teresina-PI",
   "pop": 868075,
   "dens": 1337.56,
   "dist": 0.0,
   "igu": 95.62
  },
  {
   "nome": "Milagres-CE",
   "pop": 13556,
   "dens": 3595.2,
   "dist": 0.0,
   "igu": 86.44
  },
  {
   "nome": "João Pessoa-PB",
   "pop": 833932,
   "dens": 3400.82,
   "dist": 0.0,
   "igu": 98.69
  },
  {
   "nome": "Recife-PE",
   "pop": 1488920,
   "dens": 6816.3,
   "dist": 0.0,
   "igu": 99.1
  },
  {
   "nome": "Ipaporanga-CE",
   "pop": 4136,
   "dens": 777.443609,
   "dist": 0.0,
   "igu": 69.58
  },
  {
   "nome": "Cratéus-CE",
   "pop": 52644,
   "dens": 3188.612962,
   "dist": 0.0,
   "igu": 94.51
  },
  {
   "nome": "Juazeiro do Norte-CE",
   "pop": 249939,
   "dens": 7190.42,
   "dist": 0.0,
   "igu": 97.24
  },
  {
   "nome": "Crato-CE",
   "pop": 100916,
   "dens": 3223.123603,
   "dist": 0.0,
   "igu": 96.16
  },
  {
   "nome": "Ararendá-CE",
   "pop": 4906,
   "dens": 892.0,
   "dist": 0.0,
   "igu": 72.46
  },
  {
   "nome": "Aiuaba-CE",
   "pop": 3951,
   "dens": 485.9778598,
   "dist": 0.0,
   "igu": 68.73
  },
  {
   "nome": "Jardim-CE",
   "pop": 8994,
   "dens": 902.106319,
   "dist": 0.0,
   "igu": 76.38
  },
  {
   "nome": "Fortaleza-CE",
   "pop": 2452185,
   "dens": 7786.52,
   "dist": 0.0,
   "igu": 99.15
  },
  {
   "nome": "Taua-CE",
   "pop": 55716,
   "dens": 3660.709593,
   "dist": 0.0,
   "igu": 92.62
  },
  {
   "nome": "Poranga-CE",
   "pop": 7798,
   "dens": 1438.745387,
   "dist": 0.0,
   "igu": 78.82
  },
  {
   "nome": "Mulungu-CE",
   "pop": 4198,
   "dens": 4418.947368,
   "dist": 0.0,
   "igu": 70.99
  },
  {
   "nome": "Palmacia-CE",
   "pop": 4957,
   "dens": 3965.6,
   "dist": 0.0,
   "igu": 75.01
  },
  {
   "nome": "Caucaia-CE",
   "pop": 325441,
   "dens": 7223.99556,
   "dist": 0.0,
   "igu": 98.15
  },
  {
   "nome": "Água Branca (Ipaporanga-CE)",
   "pop": 359,
   "dens": 1049.86,
   "dist": 14.0,
   "igu": 35.75
  },
  {
   "nome": "Sítio Araras (Ipaporanga-CE)",
   "pop": 365,
   "dens": 520.88,
   "dist": 30.0,
   "igu": 27.42
  },
  {
   "nome": "Buriti dos Brás (Ipaporanga-CE)",
   "pop": 136,
   "dens": 771.51,
   "dist": 26.0,
   "igu": 20.64
  },
  {
   "nome": "Palmeiras (Ipaporanga-CE)",
   "pop": 43,
   "dens": 62.58,
   "dist": 28.0,
   "igu": 9.91
  },
  {
   "nome": "Cachoeria (Ipaporanga-CE)",
   "pop": 19,
   "dens": 72.98,
   "dist": 31.0,
   "igu": 7.79
  },
  {
   "nome": "Teotonio (Ipaporanga-CE)",
   "pop": 12,
   "dens": 27.52,
   "dist": 45.0,
   "igu": 4.37
  },
  {
   "nome": "Guaramiranga-CE",
   "pop": 2495,
   "dens": 831.66,
   "dist": 0.0,
   "igu": 61.19
  },
  {
   "nome": "Aratuba-CE",
   "pop": 3769,
   "dens": 5384.0,
   "dist": 0.0,
   "igu": 68.92
  },
  {
   "nome": "Sobral-CE",
   "pop": 166310,
   "dens": 2329.98,
   "dist": 0.0,
   "igu": 95.34
  },
  {
   "nome": "Horizonte (Jardim-CE)",
   "pop": 2800,
   "dens": 493.83,
   "dist": 20.0,
   "igu": 46.65
  },
  {
   "nome": "Santo André-PB",
   "pop": 2622,
   "dens": 13.26,
   "dist": 0.0,
   "igu": 60.05
  },
  {
   "nome": "Sítio Cutia (Ferreiros-PE)",
   "pop": 180,
   "dens": 56.96,
   "dist": 7.0,
   "igu": 17.3
  },
  {
   "nome": "Barra de Mamanguape (Rio Tinto - PB)",
   "pop": 1438,
   "dens": 33.44,
   "dist": 26.0,
   "igu": 37.66
  },
  {
   "nome": "Framataia (Marcação - PB)",
   "pop": 300,
   "dens": 483.89,
   "dist": 8.0,
   "igu": 38.6
  },
  {
   "nome": "Lagoa do Junco (Santana do Ipanema - AL)",
   "pop": 512,
   "dens": 1347.37,
   "dist": 2.0,
   "igu": 42.33
  },
  {
   "nome": "Kiriri do Rio Verde (Caldas-MG)",
   "pop": 80,
   "dens": 181.81,
   "dist": 7.0,
   "igu": 25.54
  },
  {
   "nome": "Kiriri de Muquém (Muquém do São Francisco - BA)",
   "pop": 100,
   "dens": 69.93,
   "dist": 5.0,
   "igu": 28.08
  },
  {
   "nome": "Serra Grande (Lagoa do Ouro - PE)",
   "pop": 328,
   "dens": 117.56,
   "dist": 10.0,
   "igu": 24.05
  },
  {
   "nome": "Quilombo do Fonseca (Manaíra - PB)",
   "pop": 652,
   "dens": 672.16,
   "dist": 7.0,
   "igu": 27.45
  },
  {
   "nome": "Betânia - PI",
   "pop": 6210,
   "dens": 10.74,
   "dist": 0.0,
   "igu": 66.79
  },
  {
   "nome": "Quilombo Baixão (Betânia - PI)",
   "pop": 76,
   "dens": 115.15,
   "dist": 7.0,
   "igu": 13.63
  },
  {
   "nome": "Quincuncá (Farias Brito - CE)",
   "pop": 978,
   "dens": 584.81,
   "dist": 11.0,
   "igu": 47.31
  },
  {
   "nome": "Chã das Mulatas (Buenos Aires - PE)",
   "pop": 320,
   "dens": 296.29,
   "dist": 10.0,
   "igu": 29.89
  },
  {
   "nome": "Ribeira (Cabaceiras - PB)",
   "pop": 180,
   "dens": 562.5,
   "dist": 15.0,
   "igu": 37.91
  },
  {
   "nome": "Sítio da Boa Vista (Cabaceiras - PB)",
   "pop": 120,
   "dens": 413.79,
   "dist": 16.0,
   "igu": 23.16
  },
  {
   "nome": "Quilombo de São Sebtastião dos Pretos (Bacabal-MA)",
   "pop": 230,
   "dens": 851.51,
   "dist": 16.0,
   "igu": 28.97
  },
  {
   "nome": "Engenho Limeirinha (Nazaré da Mata - PE)",
   "pop": 88,
   "dens": 236.27,
   "dist": 14.0,
   "igu": 25.21
  },
  {
   "nome": "Raíz (Juscelino Kubitschek-MG)",
   "pop": 400,
   "dens": 74.57,
   "dist": 7.0,
   "igu": 27.49
  },
  {
   "nome": "Pé de Serra (Buenópolis-MG)",
   "pop": 600,
   "dens": 153.84,
   "dist": 46.0,
   "igu": 20.89
  },
  {
   "nome": "Santa Rita (Diamantina-MG)",
   "pop": 400,
   "dens": 191.38,
   "dist": 17.0,
   "igu": 23.28
  },
  {
   "nome": "Mata dos Crioulos (Dimantina-MG)",
   "pop": 800,
   "dens": 262.29,
   "dist": 37.0,
   "igu": 23.22
  },
  {
   "nome": "Corrente (Jardim-CE)",
   "pop": 500,
   "dens": 694.44,
   "dist": 18.0,
   "igu": 40.49
  },
  {
   "nome": "Tokyo",
   "pop": 37732000,
   "dens": 4584.0,
   "dist": 0.0,
   "igu": 99.13
  },
  {
   "nome": "Delhi",
   "pop": 32226000,
   "dens": 13748.0,
   "dist": 0.0,
   "igu": 97.57
  },
  {
   "nome": "Shanghai",
   "pop": 24073000,
   "dens": 5556.0,
   "dist": 0.0,
   "igu": 99.19
  },
  {
   "nome": "São Paulo",
   "pop": 23086000,
   "dens": 6327.0,
   "dist": 0.0,
   "igu": 99.21
  },
  {
   "nome": "Mexico City",
   "pop": 21804000,
   "dens": 8618.0,
   "dist": 0.0,
   "igu": 99.22
  },
  {
   "nome": "Cairo",
   "pop": 20296000,
   "dens": 10098.0,
   "dist": 0.0,
   "igu": 99.23
  },
  {
   "nome": "Mumbai",
   "pop": 24973000,
   "dens": 25587.0,
   "dist": 0.0,
   "igu": 97.57
  },
  {
   "nome": "Beijing",
   "pop": 18522000,
   "dens": 4324.0,
   "dist": 0.0,
   "igu": 99.09
  },
  {
   "nome": "Dhaka",
   "pop": 18627000,
   "dens": 30092.0,
   "dist": 0.0,
   "igu": 99.22
  },
  {
   "nome": "Osaka",
   "pop": 15126000,
   "dens": 5009.0,
   "dist": 0.0,
   "igu": 99.15
  },
  {
   "nome": "New York City",
   "pop": 21509000,
   "dens": 1779.0,
   "dist": 0.0,
   "igu": 97.54
  },
  {
   "nome": "Tehran",
   "pop": 14148000,
   "dens": 8303.0,
   "dist": 0.0,
   "igu": 99.22
  },
  {
   "nome": "Karachi",
   "pop": 15738000,
   "dens": 14002.0,
   "dist": 0.0,
   "igu": 97.56
  },
  {
   "nome": "Buenos Aires",
   "pop": 16710000,
   "dens": 4862.0,
   "dist": 0.0,
   "igu": 99.15
  },
  {
   "nome": "Chongqing",
   "pop": 12135000,
   "dens": 7680.0,
   "dist": 0.0,
   "igu": 99.21
  },
  {
   "nome": "Istanbul",
   "pop": 14441000,
   "dens": 9817.0,
   "dist": 0.0,
   "igu": 99.22
  },
  {
   "nome": "Kolkata",
   "pop": 21747000,
   "dens": 16085.0,
   "dist": 0.0,
   "igu": 97.57
  },
  {
   "nome": "Manila",
   "pop": 24922000,
   "dens": 13041.0,
   "dist": 0.0,
   "igu": 99.23
  },
  {
   "nome": "Lagos",
   "pop": 16637000,
   "dens": 8462.0,
   "dist": 0.0,
   "igu": 98.61
  },
  {
   "nome": "Rio de Janeiro",
   "pop": 12592000,
   "dens": 6234.0,
   "dist": 0.0,
   "igu": 99.2
  },
  {
   "nome": "Maracanaú-CE",
   "pop": 209057,
   "dens": 1877.75,
   "dist": 0.0,
   "igu": 97.02
  },
  {
   "nome": "Quixadá-CE",
   "pop": 57485,
   "dens": 1583.35,
   "dist": 0.0,
   "igu": 92.42
  },
  {
   "nome": "Iguatu-CE",
   "pop": 74627,
   "dens": 2201.0,
   "dist": 0.0,
   "igu": 93.42
  },
  {
   "nome": "Granjeiro2",
   "pop": 1370,
   "dens": 2446.0,
   "dist": 0.0,
   "igu": 64.78
  },
  {
   "nome": "Várzea Alegre-CE",
   "pop": 23893,
   "dens": 2111.91,
   "dist": 0.0,
   "igu": 87.72
  },
  {
   "nome": "Missão Velha-CE",
   "pop": 15416,
   "dens": 1732.0,
   "dist": 0.0,
   "igu": 85.64
  },
  {
   "nome": "Santana do Cariri-CE",
   "pop": 8822,
   "dens": 4028.31,
   "dist": 0.0,
   "igu": 84.27
  },
  {
   "nome": "Catunda-CE",
   "pop": 5395,
   "dens": 1074.7,
   "dist": 0.0,
   "igu": 66.71
  },
  {
   "nome": "Belo Horizonte-MG",
   "pop": 2316000,
   "dens": 6988.18,
   "dist": 0.0,
   "igu": 99.14
  },
  {
   "nome": "Vitória-ES",
   "pop": 322869,
   "dens": 3827.0,
   "dist": 0.0,
   "igu": 97.75
  },
  {
   "nome": "Curitiba-PR",
   "pop": 1773718,
   "dens": 5278.0,
   "dist": 0.0,
   "igu": 98.29
  },
  {
   "nome": "Florianópolis-SC",
   "pop": 537211,
   "dens": 796.1,
   "dist": 0.0,
   "igu": 93.63
  },
  {
   "nome": "Porto Alegre-RS",
   "pop": 1332570,
   "dens": 2690.0,
   "dist": 0.0,
   "igu": 98.42
  },
  {
   "nome": "Brasília-DF",
   "pop": 2817381,
   "dens": 489.1,
   "dist": 0.0,
   "igu": 91.71
  },
  {
   "nome": "Campo Grande-MS",
   "pop": 898100,
   "dens": 5235.0,
   "dist": 0.0,
   "igu": 98.2
  },
  {
   "nome": "Cuiabá-MT",
   "pop": 682932,
   "dens": 197.8,
   "dist": 0.0,
   "igu": 89.99
  },
  {
   "nome": "Goiania-GO",
   "pop": 1494599,
   "dens": 2049.4,
   "dist": 0.0,
   "igu": 97.03
  },
  {
   "nome": "Palmas-TO",
   "pop": 302692,
   "dens": 145.9,
   "dist": 0.0,
   "igu": 89.23
  },
  {
   "nome": "Belém-PA",
   "pop": 1398531,
   "dens": 1320.0,
   "dist": 0.0,
   "igu": 95.03
  },
  {
   "nome": "Manaus-AM",
   "pop": 2279686,
   "dens": 468.0,
   "dist": 0.0,
   "igu": 90.44
  },
  {
   "nome": "Macapá-AP",
   "pop": 442933,
   "dens": 5401.0,
   "dist": 0.0,
   "igu": 95.42
  },
  {
   "nome": "Porto Velho-RO",
   "pop": 460434,
   "dens": 10962.0,
   "dist": 0.0,
   "igu": 96.37
  },
  {
   "nome": "Rio Branco-AC",
   "pop": 364756,
   "dens": 4192.0,
   "dist": 0.0,
   "igu": 96.29
  },
  {
   "nome": "Boa Vista-RR",
   "pop": 413486,
   "dens": 3534.0,
   "dist": 0.0,
   "igu": 97.7
  },
  {
   "nome": "Tamboril-CE",
   "pop": 14202,
   "dens": 2184.0,
   "dist": 0.0,
   "igu": 83.72
  },
  {
   "nome": "Baturité-CE",
   "pop": 24437,
   "dens": 1221.0,
   "dist": 0.0,
   "igu": 86.4
  }
 ],
 "colunas": [
  "Localities",
  "Population Size",
  "Population Density",
  "Distance to Town",
  "Factory",
  "Supermarket",
  "Public Market",
  "Street Market",
  "Grocery/Corner shop",
  "Bank",
  "Drugstore",
  "Hospital",
  "ICU",
  "Health Centre",
  "Mobile Medical Service",
  "Private Health Service",
  "Local Airport (<10 km)",
  "Medium Airport (<20 km)",
  "Large Airport (< 30 km)",
  "Public transportation",
  "Private transportantion",
  "Paved roads",
  "Treated Water",
  "Sewage Treatment",
  "Waste Collection",
  "Power grid",
  "Internet Service",
  "High-Speed Internet",
  "Mobile Service",
  "Postal Service",
  "Recreation Facilities",
  "Gastronomy Facilities",
  "Sports Facilities",
  "Religious Centres",
  "Security Infrastructure",
  "Elementary School",
  "Secondary School",
  "University"
 ]
};
