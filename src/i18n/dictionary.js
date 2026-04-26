// DEPRECATED — locale JSON files under ./locales are now source of truth.
// Kept for reference / rollback only. No code imports this module after
// the react-i18next migration (Apr 2026).
//
// Brazilian Portuguese (pt-BR) translation dictionary for the
// No Dice Borough investor deck. Previously consumed by the DOM-walking
// translator in Translator.jsx — each trimmed DOM text node was looked
// up here and replaced in place when lang === 'pt-BR'.
//
// Rules:
//   - Brazilian Portuguese (pt-BR): "você", "time", "celular", etc.
//   - Keep brand / place / numeric values unchanged ("No Dice Borough",
//     "Plonk", "Borough Market", "£70,000", "0.76×", "SE1", etc).
//   - "inc VAT" → "inc IVA" (handled via pattern fallback as well).

export const PT_BR = {
  // ---------- Top-level tabs ----------
  'Investor Deck': 'Apresentação',
  'Venue Info': 'Informações do Local',
  'Business Explorer': 'Explorador do Negócio',
  'Plonk': 'Plonk',

  // ---------- Shell / header ----------
  'No Dice Borough Ltd': 'No Dice Borough Ltd',
  'No Dice': 'No Dice',
  'Borough': 'Borough',
  'CONFIDENTIAL · BOROUGH MARKET SE1': 'CONFIDENCIAL · BOROUGH MARKET SE1',
  'Generated April 2026 · Confidential · No Dice Borough Ltd':
    'Gerado em abril de 2026 · Confidencial · No Dice Borough Ltd',
  'Plonk Golf': 'Plonk Golf',
  'IP & Licensing · Marketing Engine · dev section':
    'IP e Licenciamento · Motor de Marketing · seção de desenvolvimento',

  // ---------- Slide nav ----------
  '01  Cover': '01  Capa',
  '02  Investment Summary': '02  Resumo do Investimento',
  '03  Use of Funds': '03  Uso dos Fundos',
  '04  Market Context': '04  Contexto de Mercado',
  '05  Waterfall Returns': '05  Retornos em Cascata',
  '06  Growth & Risks': '06  Crescimento e Riscos',
  '07  Investment Case': '07  Case de Investimento',

  // ---------- Password gate ----------
  'Investor Presentation · Confidential': 'Apresentação para Investidores · Confidencial',
  'Enter access code': 'Digite o código de acesso',
  'Enter': 'Entrar',
  'Incorrect access code': 'Código de acesso incorreto',
  'For investor use only · Borough Market SE1': 'Uso exclusivo de investidores · Borough Market SE1',

  // ---------- Cover slide ----------
  'Series A · Seed Investment · April 2026': 'Série A · Investimento Seed · Abril de 2026',
  'A proven Borough Market experience venue — mini golf, bar, pool, arcades and board games.\n          Generating £741,644 verified 2025 revenue, acquired at distressed pricing.':
    'Um local de experiência consolidado no Borough Market — minigolfe, bar, sinuca, fliperamas e jogos de tabuleiro. Gerando £741,644 de receita verificada em 2025, adquirido a preço de ativo em dificuldades.',
  'A proven Borough Market experience venue — mini golf, bar, pool, arcades and board games. Generating £741,644 verified 2025 revenue, acquired at distressed pricing.':
    'Um local de experiência consolidado no Borough Market — minigolfe, bar, sinuca, fliperamas e jogos de tabuleiro. Gerando £741,644 de receita verificada em 2025, adquirido a preço de ativo em dificuldades.',
  'Seeking': 'Busca',
  '2025 Verified Revenue': 'Receita Verificada 2025',
  'Year 1 Investor Return': 'Retorno do Investidor no Ano 1',
  'Distribution Model': 'Modelo de Distribuição',
  'Forecast Revenue': 'Receita Projetada',
  'Valuation Entry': 'Entrada de Valuation',
  '50% equity · 50% retained by founder': '50% de equity · 50% retido pelo fundador',
  'Real trading history — not a projection': 'Histórico real de operação — não é projeção',
  '88.6% cash-on-cash · payback 1.13 yrs': '88,6% cash-on-cash · payback 1,13 anos',
  'Pro-rata': 'Pro-rata',
  'All shareholders paid by equity % at the same time':
    'Todos os acionistas recebem pelo % de equity ao mesmo tempo',
  'Base case +15% · May 2026–Apr 2027': 'Cenário base +15% · Mai 2026–Abr 2027',
  'EBITDA · distressed acquisition pricing': 'EBITDA · preço de aquisição em dificuldades',
  'Borough Market SE1': 'Borough Market SE1',
  '· Arches B C D And E, Montague Close · London Bridge':
    '· Arches B C D And E, Montague Close · London Bridge',

  // ---------- Investment Summary ----------
  'Investment Summary': 'Resumo do Investimento',
  'At-a-glance deal structure, returns and financials':
    'Estrutura do acordo, retornos e dados financeiros em um olhar',
  'Conservative': 'Conservador',
  'Base Case': 'Cenário Base',
  'Optimistic': 'Otimista',
  '+10% on 2025': '+10% sobre 2025',
  '+15% on 2025': '+15% sobre 2025',
  '+25% on 2025': '+25% sobre 2025',
  '🏢 Deal Structure': '🏢 Estrutura do Acordo',
  '📊 Financial Performance': '📊 Desempenho Financeiro',
  '💰 Investor Returns': '💰 Retornos do Investidor',
  'Investor Equity': 'Equity do Investidor',
  'Founder Equity': 'Equity do Fundador',
  'Pre-Money Valuation': 'Valuation Pré-Money',
  'Post-Money Valuation': 'Valuation Pós-Money',
  'Valuation Multiple': 'Múltiplo de Valuation',
  '2025 Actual Revenue': 'Receita Real 2025',
  'Revenue Growth': 'Crescimento da Receita',
  'Forecast Op Profit': 'Lucro Operacional Projetado',
  '2025 EBITDA': 'EBITDA 2025',
  'Pro-rata · no tiers': 'Pro-rata · sem níveis',
  'Total Year 1 Return': 'Retorno Total no Ano 1',
  'Cash-on-Cash': 'Cash-on-Cash',
  'Payback Period': 'Período de Payback',
  'Top 3 Investment Highlights': 'Top 3 Destaques do Investimento',
  'Explore Your Return': 'Explore seu Retorno',
  'Investment Amount': 'Valor do Investimento',
  '£70,000 · 50% equity cap': '£70,000 · teto de 50% de equity',
  'A Shares · Full Voting Rights': 'Ações Classe A · Direito de Voto Total',
  'B Shares · Economic Rights Only': 'Ações Classe B · Apenas Direitos Econômicos',
  'equity': 'de equity',
  'Ownership': 'Participação',
  'Equity Dividend': 'Dividendo de Equity',
  'Total Year 1': 'Total Ano 1',
  'Cash-on-Cash:': 'Cash-on-Cash:',
  'Payback:': 'Payback:',
  'Minimum for A shares:': 'Mínimo para ações Classe A:',

  // ---------- Use of Funds ----------
  'Use of Investment Funds': 'Uso dos Fundos de Investimento',
  'Where Your £70,000 Goes': 'Para Onde Vão Seus £70,000',
  'Every pound deployed on Day 1 of reopening — no funds held in reserve outside the business':
    'Cada libra empregada no Dia 1 da reabertura — nenhum fundo retido em reserva fora do negócio',
  'Fund Allocation — Visual Breakdown': 'Alocação dos Fundos — Detalhamento Visual',
  'Rent Deposit (3 months)': 'Caução de Aluguel (3 meses)',
  'Hardware from Liquidators': 'Hardware de Liquidação',
  'IP License Fee': 'Taxa de Licença de IP',
  'Stock & Supplier Restart': 'Estoque e Retomada com Fornecedores',
  'Working Capital Buffer': 'Reserva de Capital de Giro',
  'Security deposit held by landlord covering May, Jun, Jul 2026.':
    'Caução mantida pelo proprietário cobrindo maio, junho e julho de 2026.',
  'Physical bar & kitchen equipment — purchased at liquidation pricing. Operational on Day 1.':
    'Equipamentos físicos de bar e cozinha — comprados a preço de liquidação. Operacionais no Dia 1.',
  'Brand + gaming IP licence — was a £72,000 inc VAT Plonk IP & Goodwill purchase under the old deal.':
    'Licença de IP de marca e gaming — era uma compra de Plonk IP e Goodwill de £72,000 inc IVA no acordo antigo.',
  'Opening stock, supplier agreements and software subscriptions to trade from Day 1.':
    'Estoque inicial, contratos com fornecedores e assinaturas de software para operar desde o Dia 1.',
  'Staged into business per cash flow model. Covers early trading before revenue covers costs.':
    'Aplicado ao negócio conforme o modelo de fluxo de caixa. Cobre a operação inicial até a receita cobrir os custos.',
  'TOTAL INVESTMENT': 'INVESTIMENTO TOTAL',
  '£70,000 inc VAT': '£70,000 inc IVA',
  '£70,000 INC VAT TOTAL · 100% DEPLOYED DAY 1':
    '£70,000 INC IVA TOTAL · 100% EMPREGADO NO DIA 1',
  'VAT on startup costs (~£5,833) reclaimed in Q1 — credited against first HMRC VAT return (August 2026)':
    'IVA sobre custos de startup (~£5,833) recuperado no 1º trimestre — creditado na primeira declaração de IVA junto à HMRC (agosto de 2026)',
  'Day 1 Deployed': 'Empregado no Dia 1',
  'Working Capital': 'Capital de Giro',
  'VAT Reclaim': 'Recuperação de IVA',
  'Startup costs paid immediately': 'Custos de startup pagos imediatamente',
  'Staged per cash flow model': 'Aplicado conforme o modelo de fluxo de caixa',
  'Recovered Q1 — August 2026': 'Recuperado no 1º trimestre — agosto de 2026',

  // ---------- Market Context ----------
  'Market Context': 'Contexto de Mercado',
  'Investment Case & Market Positioning': 'Case de Investimento e Posicionamento de Mercado',
  'Sourced from CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality — 2024/25':
    'Fontes: CLFI, Houlihan Lokey, Moore Kingston Smith, UKHospitality — 2024/25',
  'Market Benchmarks — EBITDA Multiples': 'Benchmarks de Mercado — Múltiplos de EBITDA',
  'UK Mid-Market Average (EBITDA multiple)':
    'Média do Mid-Market do Reino Unido (múltiplo de EBITDA)',
  'Hospitality & Leisure Sector Average': 'Média do Setor de Hospitalidade e Lazer',
  'Small Single-Site Venues (<£200k EBITDA)':
    'Pequenos Locais de Site Único (<£200k de EBITDA)',
  'Distressed Asset Range (liquidation)': 'Faixa de Ativos em Dificuldades (liquidação)',
  'No Dice Borough — This Deal': 'No Dice Borough — Este Acordo',
  'Above this deal': 'Acima deste acordo',
  'Broadly in line': 'Em grande parte alinhado',
  'In range': 'Dentro da faixa',
  'Above — priced for risk': 'Acima — precificado por risco',
  '→ Entry point': '→ Ponto de entrada',
  'Sources: CLFI M&A Monitor H1 2025 · Houlihan Lokey Hospitality H1 2025 · Moore Kingston Smith 2025':
    'Fontes: CLFI M&A Monitor S1 2025 · Houlihan Lokey Hospitality S1 2025 · Moore Kingston Smith 2025',
  '→ The Deal in One Line': '→ O Acordo em Uma Linha',
  '0.76× EBITDA': '0.76× EBITDA',
  'pure pro-rata on operating profit': 'pro-rata puro sobre o lucro operacional',
  'cash flow — not exit dependency': 'fluxo de caixa — sem dependência de saída',
  '✓ Not a multiple expansion bet': '✓ Não é uma aposta em expansão de múltiplo',
  '✓ Cash-yielding from Day 1': '✓ Gera caixa desde o Dia 1',
  '✓ All 3 scenarios positive': '✓ Os 3 cenários são positivos',
  'Returns driven by operating cash flow': 'Retornos impulsionados pelo fluxo de caixa operacional',
  'Distributions begin at end of Year 1': 'Distribuições começam no final do Ano 1',
  'Conservative through Optimistic': 'De Conservador a Otimista',
  'Sector Reality — Honest Context': 'Realidade do Setor — Contexto Honesto',
  'Why This Business is Different': 'Por Que Este Negócio é Diferente',
  'Employer NICs rose from 13.8% → 15% (April 2025)':
    'NICs do empregador subiram de 13,8% → 15% (abril de 2025)',
  'Labour cost increases are built into the forecast model — not hidden':
    'Aumentos de custo de mão de obra estão no modelo de projeção — não escondidos',
  'National Minimum Wage up 6.7% to £12.21/hr (April 2025)':
    'Salário Mínimo Nacional subiu 6,7% para £12,21/h (abril de 2025)',
  'Wage inflation modelled at 2025 actual base — no optimistic assumption':
    'Inflação salarial modelada sobre a base real de 2025 — sem premissa otimista',
  'Business rates relief cut from 75% → 40% (2025/26)':
    'Alívio de business rates reduzido de 75% → 40% (2025/26)',
  'Cost environment is baked in — not a pre-cost-shock baseline':
    'Ambiente de custo já incorporado — não é uma base pré-choque de custos',
  'UK hospitality recording ~2 site closures per day (2025)':
    'Hospitalidade no Reino Unido registrando ~2 fechamentos por dia (2025)',
  'Sector pressure creates acquisition opportunity at realistic pricing':
    'Pressão setorial cria oportunidade de aquisição a preços realistas',
  'Consumer behaviour shifting toward experience-led, low-alcohol spend':
    'Comportamento do consumidor migrando para gastos voltados a experiências e baixo álcool',
  "No Dice Borough's experience model directly aligns with this shift":
    'O modelo de experiência do No Dice Borough está diretamente alinhado a essa mudança',
  'PE firms cautious on single-country consumer exposure':
    'Fundos de PE cautelosos com exposição a consumidor de um único país',
  'Smaller investor opportunity — less institutional competition for deal':
    'Oportunidade para investidor menor — menos concorrência institucional pelo acordo',
  'Proven Revenue Base': 'Base de Receita Comprovada',
  '£741,644 verified 2025 actuals. Not a projection — real trading history.':
    '£741,644 em números reais verificados de 2025. Não é projeção — histórico real de operação.',
  'Prime London Location': 'Localização Premium em Londres',
  'Borough Market SE1: top footfall destination. 77,801 organic search sessions in 2025. Organic Search is the primary acquisition channel — Borough Market search terms actively maintained.':
    'Borough Market SE1: destino de grande fluxo de pessoas. 77,801 sessões de busca orgânica em 2025. Busca Orgânica é o principal canal de aquisição — termos de busca do Borough Market mantidos ativamente.',
  'Experience-Led Format': 'Formato Voltado a Experiências',
  'Pool, board games, mini golf, DJ nights. Directly aligned with fastest-growing hospitality sub-sector.':
    'Sinuca, jogos de tabuleiro, minigolfe, noites de DJ. Diretamente alinhado ao subsetor de hospitalidade que mais cresce.',
  'Multiple Revenue Streams': 'Múltiplas Fontes de Receita',
  'Bar + activity pricing + events + corporate hire. Less dependent on drink-only margins.':
    'Bar + ingressos de atividades + eventos + locação corporativa. Menos dependente de margens só de bebidas.',
  'Brand IP Acquired': 'IP de Marca Adquirido',
  'Plonk trading name, customer data and goodwill purchased. Not starting from zero.':
    'Nome comercial Plonk, base de clientes e goodwill adquiridos. Não começa do zero.',
  'Digital Acquisition': 'Aquisição Digital',
  'Organic Search: 77,801 sessions in 2025 — the primary acquisition channel. Google Ads restarted Nov 2025 with proper tracking: 105 conversions, £0.32 CPC, £5.53 per conversion. Highly efficient when measured correctly.':
    'Busca Orgânica: 77,801 sessões em 2025 — o principal canal de aquisição. Google Ads reiniciado em nov/2025 com tracking adequado: 105 conversões, £0.32 CPC, £5.53 por conversão. Altamente eficiente quando medido corretamente.',

  // ---------- Waterfall Returns ----------
  'Investor Returns': 'Retornos do Investidor',
  'Pure pro-rata — all shareholders paid at the same time by equity %. No preferred return, no priority tiers.':
    'Pro-rata puro — todos os acionistas recebem ao mesmo tempo pelo % de equity. Sem retorno preferencial, sem níveis de prioridade.',
  'Bear Case −10%': 'Cenário Pessimista −10%',
  'Base Case +15%': 'Cenário Base +15%',
  'Bull Case +25%': 'Cenário Otimista +25%',
  'Distribution Waterfall': 'Cascata de Distribuição',
  'Operating Profit': 'Lucro Operacional',
  'Investor Summary': 'Resumo do Investidor',
  'Total Investor Return': 'Retorno Total do Investidor',
  'Cash-on-Cash Return': 'Retorno Cash-on-Cash',
  'Distribution timing': 'Momento da distribuição',
  'Same as founder': 'Igual ao fundador',
  'Founder Position': 'Posição do Fundador',
  'Paid': 'Pago',
  'Alongside investor, pro-rata': 'Junto com o investidor, pro-rata',
  'Cash-flow driven — no exit required for investor to receive full return.\n            Payback from Year 1 trading distributions only.':
    'Orientado por fluxo de caixa — não é necessária saída para o investidor receber o retorno total. Payback somente pelas distribuições de operação do Ano 1.',
  'Cash-flow driven — no exit required for investor to receive full return. Payback from Year 1 trading distributions only.':
    'Orientado por fluxo de caixa — não é necessária saída para o investidor receber o retorno total. Payback somente pelas distribuições de operação do Ano 1.',

  // ---------- Growth & Risks ----------
  'Growth & Risks': 'Crescimento e Riscos',
  'Upside drivers not in the base case · Risk register with mitigations':
    'Drivers de upside fora do cenário base · Registro de riscos com mitigações',
  'Upside Drivers (not in base case)': 'Drivers de Upside (fora do cenário base)',
  'Risk Register': 'Registro de Riscos',
  'Overall Risk Profile': 'Perfil Geral de Risco',
  'Four low risks, two medium. No high risks identified. Investor return flexes with the\n              business — pro-rata on operating profit means upside and downside sit on the same side\n              of the table as the founder.':
    'Quatro riscos baixos, dois médios. Nenhum risco alto identificado. O retorno do investidor varia com o negócio — pro-rata sobre o lucro operacional significa que upside e downside ficam do mesmo lado da mesa que o fundador.',
  'Four low risks, two medium. No high risks identified. Investor return flexes with the business — pro-rata on operating profit means upside and downside sit on the same side of the table as the founder.':
    'Quatro riscos baixos, dois médios. Nenhum risco alto identificado. O retorno do investidor varia com o negócio — pro-rata sobre o lucro operacional significa que upside e downside ficam do mesmo lado da mesa que o fundador.',
  'Low': 'Baixo',
  'Medium': 'Médio',
  'High': 'Alto',
  'Strategic': 'Estratégico',

  // Growth drivers
  'SEO Rebuild from Day 1': 'Reconstrução de SEO desde o Dia 1',
  'Organic traffic dropped 32% due to brand change (Plonk→No Dice). Lithos SEO programme restores rankings under No Dice Borough — compounding year-on-year. 301 redirect preserves domain authority.':
    'Tráfego orgânico caiu 32% devido à mudança de marca (Plonk→No Dice). O programa de SEO da Lithos restaura o ranqueamento sob No Dice Borough — com ganho composto ano a ano. Redirecionamento 301 preserva a autoridade do domínio.',
  'Google Ads at Scale': 'Google Ads em Escala',
  'Proven £0.32 CPC and 5.7% conversion rate from Nov–Dec 2025 campaign. 105 conversions in 37 days at £580 spend. Scale to £600/mth = ~107 conversions/month with verified unit economics.':
    'CPC comprovado de £0.32 e taxa de conversão de 5,7% na campanha de nov–dez/2025. 105 conversões em 37 dias com £580 investidos. Escalando para £600/mês = ~107 conversões/mês com unit economics verificados.',
  'Corporate Events Pipeline': 'Pipeline de Eventos Corporativos',
  'Private hire revenue £44,999 in 2025. Bookings manager focusing on corporate team days, exclusive hires and Christmas parties. High-margin, pre-paid bookings with minimal incremental cost.':
    'Receita de locação privada de £44,999 em 2025. Gerente de reservas focado em team days corporativos, locações exclusivas e festas de Natal. Reservas pré-pagas de alta margem com custo incremental mínimo.',
  'DJ Nights Programme': 'Programação de Noites de DJ',
  'Friday and Saturday late events incremental to walk-in trade. High-margin bar revenue with zero additional fixed cost. Borough Market location draws natural footfall.':
    'Eventos de sexta e sábado à noite, incrementais ao público espontâneo. Receita de bar de alta margem sem custo fixo adicional. Localização no Borough Market atrai fluxo natural.',
  'Gaming Repricing': 'Reprecificação dos Jogos',
  '+£1 across pool and mini golf affects 100k+ annual plays. Minimal customer resistance. Direct P&L impact with zero cost increase.':
    '+£1 em sinuca e minigolfe afeta mais de 100 mil partidas anuais. Resistência mínima do cliente. Impacto direto no P&L sem aumento de custos.',
  'Second Site Optionality': 'Opcionalidade de Segundo Local',
  'Proven operating model, experienced team and Borough Market brand can be replicated. Future fundraise at higher multiple is plausible once Year 1 returns are demonstrated.':
    'Modelo operacional comprovado, time experiente e marca Borough Market podem ser replicados. Captação futura em múltiplo mais alto é plausível quando os retornos do Ano 1 forem demonstrados.',

  // Risks
  'Reopening timeline delay': 'Atraso no cronograma de reabertura',
  'Lease secured, hardware acquired from liquidation, staff network retained. Target May 2026.':
    'Contrato de locação assegurado, hardware adquirido em liquidação, rede de funcionários mantida. Meta: maio de 2026.',
  'Revenue below base case forecast': 'Receita abaixo da projeção do cenário base',
  'Base case is +15% on verified 2025 actuals. Pro-rata dividend flexes with whatever operating profit the venue delivers.':
    'O cenário base é +15% sobre os números reais verificados de 2025. O dividendo pro-rata varia com o lucro operacional que o local entregar.',
  'Wage inflation': 'Inflação salarial',
  'NMW modelled at 2025 actuals. No optimistic wage assumption. Wage calculator models scenarios.':
    'NMW (salário mínimo nacional) modelado sobre os números reais de 2025. Sem premissa salarial otimista. Calculadora de salários modela cenários.',
  'Brand transition (Plonk→No Dice)': 'Transição de marca (Plonk→No Dice)',
  'SEO redirect preserves domain authority. Existing customer database retained. Location unchanged.':
    'Redirecionamento de SEO preserva a autoridade do domínio. Base de clientes existente mantida. Localização inalterada.',
  'Marketing variability': 'Variabilidade de marketing',
  'Google Ads proven at £0.32 CPC with live conversion tracking. SEO programme starts Day 1.':
    'Google Ads comprovado a £0.32 CPC com tracking de conversão ativo. Programa de SEO começa no Dia 1.',
  'Key person dependency': 'Dependência de pessoas-chave',
  'Bookings manager and experienced bar staff retained. Operating procedures documented.':
    'Gerente de reservas e equipe de bar experiente mantidos. Procedimentos operacionais documentados.',

  // ---------- Investment Case ----------
  'The Investment Case': 'O Case de Investimento',
  'Why No Dice Borough · Six reasons to invest · Upside drivers · Risk mitigation':
    'Por que No Dice Borough · Seis motivos para investir · Drivers de upside · Mitigação de riscos',
  'Six Core Strengths': 'Seis Pontos Fortes Centrais',
  'Proven Trading History': 'Histórico de Operação Comprovado',
  'Defensible Location': 'Localização Defensável',
  'Distressed Entry Pricing': 'Preço de Entrada em Dificuldades',
  'Aligned Distribution Model': 'Modelo de Distribuição Alinhado',
  'No Exit Required': 'Saída Não Necessária',
  'Risks & Mitigations': 'Riscos e Mitigações',
  'Bar spend (49%), online golf tickets (28%), bookings & events (14%), private hires (6%), pool tickets and service charge. No single point of failure.':
    'Gastos no bar (49%), ingressos online de golfe (28%), reservas e eventos (14%), locações privadas (6%), ingressos de sinuca e taxa de serviço. Sem ponto único de falha.',
  'Reopening timeline': 'Cronograma de reabertura',
  'Lease secured, hardware acquired, staff retained. Target May 2026.':
    'Contrato de locação assegurado, hardware adquirido, equipe mantida. Meta: maio de 2026.',
  'Revenue below forecast': 'Receita abaixo da projeção',
  'Base case is +15% on verified 2025 actuals. Investor dividend is pro-rata on whatever operating profit the venue produces.':
    'O cenário base é +15% sobre os números reais verificados de 2025. O dividendo do investidor é pro-rata sobre qualquer lucro operacional que o local produzir.',
  'NMW modelled at 2025 actuals — no optimistic assumption. Wage calculator available for scenario testing.':
    'NMW modelado sobre os números reais de 2025 — sem premissa otimista. Calculadora de salários disponível para teste de cenários.',
  'Brand transition (Plonk → No Dice)': 'Transição de marca (Plonk → No Dice)',
  'SEO redirect preserves domain authority. Existing customer database retained. Borough Market location unchanged.':
    'Redirecionamento de SEO preserva a autoridade do domínio. Base de clientes existente mantida. Localização no Borough Market inalterada.',
  'for': 'por',
  'Year 1 return': 'Retorno no Ano 1',
  'Payback': 'Payback',
  'Cash-flow driven — no exit required.': 'Orientado por fluxo de caixa — saída não necessária.',

  // ---------- Financial Performance (embedded in Business Explorer) ----------
  'Income · Jan–Dec 2025': 'Receita · Jan–Dez 2025',
  'verified': 'verificado',
  'Spend at Bar': 'Gastos no Bar',
  'Online Golf Tickets': 'Ingressos Online de Golfe',
  'Bookings & Events': 'Reservas e Eventos',
  'Private Hires': 'Locações Privadas',
  'Service Charge': 'Taxa de Serviço',
  'Pool Tickets': 'Ingressos de Sinuca',
  'Total Income': 'Receita Total',
  'Monthly Income — Stacked by Source': 'Receita Mensal — Empilhada por Fonte',
  'Operating Costs · Jan–Dec 2025': 'Custos Operacionais · Jan–Dez 2025',
  'categorised': 'categorizado',
  'Wages': 'Salários',
  'Fixed Costs': 'Custos Fixos',
  'Drinks & Gas': 'Bebidas e Gás',
  'VAT (Net)': 'IVA (Líquido)',
  'Cleaning': 'Limpeza',
  'Arcades': 'Fliperamas',
  'Food': 'Comida',
  'Google/Digital': 'Google/Digital',
  'Card Charges': 'Taxas de Cartão',
  'Rent, rates, electricity, insurance, internet, PRS':
    'Aluguel, taxas, eletricidade, seguro, internet, PRS',
  'Net VAT paid to HMRC — VAT collected minus VAT reclaimed on purchases':
    'IVA líquido pago à HMRC — IVA arrecadado menos IVA recuperado nas compras',
  '2025 historical Lithos/Google spend · under new IP & Licensing model all ad/SEO spend sits with Plonk Golf from 2026':
    'Gasto histórico de Lithos/Google em 2025 · sob o novo modelo de IP e Licenciamento todo gasto com anúncios/SEO fica com a Plonk Golf a partir de 2026',
  'Total Costs': 'Custos Totais',
  'Monthly Costs — Stacked': 'Custos Mensais — Empilhados',
  'Ticket Revenue Breakdown': 'Detalhamento de Receita de Ingressos',
  'Borough 2025 · Online portal (actual) vs Office/till (imputed at list price)':
    'Borough 2025 · Portal online (real) vs Escritório/caixa (imputado a preço de tabela)',
  'combined': 'combinado',
  'Online Portal': 'Portal Online',
  'Office / Till': 'Escritório / Caixa',
  'Combined': 'Combinado',
  'Online · by SKU': 'Online · por SKU',
  'Office · by SKU': 'Escritório · por SKU',
  'Status = complete': 'Status = completo',
  'Status = external · imputed at list price': 'Status = externo · imputado a preço de tabela',
  'Monthly Ticket Revenue — Online + Office Stacked':
    'Receita Mensal de Ingressos — Online + Escritório Empilhados',
  'Online': 'Online',
  'Office (imputed)': 'Escritório (imputado)',
  'IP & Licensing': 'IP e Licenciamento',

  // ---------- Marketing Engine ----------
  'Digital Marketing': 'Marketing Digital',
  'GA4-verified actuals (Windsor.ai) · Two-year analysis · 2026 spend plan':
    'Números reais verificados por GA4 (Windsor.ai) · Análise de dois anos · Plano de gastos 2026',
  'Key insight:': 'Insight principal:',
  '50× more traffic': '50× mais tráfego',
  '2025 Google Ads — GA4 Verified': 'Google Ads 2025 — Verificado no GA4',
  '2024:': '2024:',
  '£9,353 spent': '£9,353 investidos',
  'Active period': 'Período ativo',
  '5 Nov – 11 Dec 2025 (37 days)': '5 nov – 11 dez 2025 (37 dias)',
  'Total ad spend': 'Gasto total em anúncios',
  'Total clicks': 'Total de cliques',
  'Average CPC': 'CPC médio',
  'Conversions': 'Conversões',
  'Cost per conversion': 'Custo por conversão',
  'Organic Search — Primary Channel': 'Busca Orgânica — Canal Principal',
  '2024 Organic Sessions': 'Sessões Orgânicas 2024',
  '2025 Organic Sessions': 'Sessões Orgânicas 2025',
  'Plonk Golf brand active all year': 'Marca Plonk Golf ativa o ano todo',
  '−32% · brand changing to No Dice Borough':
    '−32% · marca mudando para No Dice Borough',
  '2026 Digital Marketing Budget': 'Orçamento de Marketing Digital 2026',
  'Website Maintenance': 'Manutenção do Site',
  'SEO + Outreach + Business Listings': 'SEO + Outreach + Listagens de Negócio',
  'Google Ads (PPC spend)': 'Google Ads (gasto em PPC)',
  'plonkgolf.co.uk · cloud server · redirecting to nodiceborough.co.uk':
    'plonkgolf.co.uk · servidor em nuvem · redirecionando para nodiceborough.co.uk',
  '3 articles/mth + 10 business listings · run all 12 months from Day 1':
    '3 artigos/mês + 10 listagens de negócio · executado nos 12 meses a partir do Dia 1',
  '~1,875 clicks/mth · ~107 conversions/mth at verified £0.32 CPC':
    '~1.875 cliques/mês · ~107 conversões/mês a CPC verificado de £0.32',
  'Total Digital Marketing': 'Marketing Digital Total',
  '2.5% of £852k forecast revenue · Studio hosting removed (new provider)':
    '2,5% da receita projetada de £852k · Hospedagem do Studio removida (novo fornecedor)',

  // ---------- Venue Info — tab labels ----------
  'Catchment': 'Área de Captação',
  'Location': 'Localização',
  'Floor Plan': 'Planta Baixa',
  'Venue Gallery': 'Galeria do Local',
  'Course Gallery': 'Galeria do Circuito',
  'Drinks Gallery': 'Galeria de Bebidas',
  'Licence': 'Licença',
  'Development': 'Desenvolvimento',

  // ---------- Venue gallery captions ----------
  'Main bar and entrance area': 'Bar principal e área de entrada',
  'Mini golf course overview': 'Visão geral do circuito de minigolfe',
  'Pool table area': 'Área de mesa de sinuca',
  'Bar seating and lounge': 'Assentos do bar e lounge',
  'Event space setup': 'Montagem do espaço de eventos',
  'DJ booth and dance floor': 'Cabine de DJ e pista de dança',
  'Air hockey and LED games': 'Aero hóquei e jogos de LED',
  'Hole 5': 'Buraco 5',
  'The bar arch': 'O arco do bar',
  'London landmarks course': 'Circuito de pontos turísticos de Londres',
  'London Eye hole': 'Buraco London Eye',
  'Red telephone box feature hole': 'Buraco temático da cabine telefônica vermelha',
  'A London Thing': 'Uma coisa de Londres',
  'Camden Town Brewery draught': 'Chope Camden Town Brewery',
  'Cloudwater craft beer selection': 'Seleção de cervejas artesanais Cloudwater',
  'Mondo Brewing IPA on tap': 'IPA Mondo Brewing no chope',
  'Tropical cocktail': 'Coquetel tropical',
  'Negroni on the rocks': 'Negroni on the rocks',
  'Rose petal martini': 'Martini de pétalas de rosa',
  'Espresso martini': 'Espresso martini',
  'Borough craft beer range': 'Linha de cervejas artesanais Borough',
  'Signature cocktail menu': 'Menu de coquetéis autorais',

  // ---------- Catchment ----------
  'LONDON BRIDGE FOOTFALL': 'FLUXO DE PESSOAS EM LONDON BRIDGE',
  'BOROUGH MARKET VISITORS': 'VISITANTES DO BOROUGH MARKET',
  'SE1 MEDIAN INCOME': 'RENDA MEDIANA DO SE1',
  'AGE 25–44': 'IDADE 25–44',
  'VENUE PAGE VIEWS 2025': 'VISUALIZAÇÕES DA PÁGINA DO LOCAL 2025',
  'ORGANIC SEARCH SHARE': 'PARTICIPAÇÃO DE BUSCA ORGÂNICA',
  'daily station passengers': 'passageiros diários da estação',
  'annual visitors to the area': 'visitantes anuais na região',
  'household income': 'renda domiciliar',
  'of SE1 residents': 'dos residentes do SE1',
  'verified GA4': 'verificado no GA4',
  'of all traffic': 'do tráfego total',
  'TfL 2024': 'TfL 2024',
  'Borough Market Trust': 'Borough Market Trust',
  'ONS 2024': 'ONS 2024',
  'Census 2021': 'Censo 2021',
  'Google Analytics': 'Google Analytics',
  'GA4 2025': 'GA4 2025',
  'Catchment Strengths': 'Pontos Fortes da Área de Captação',
  'CITY WORKER PROXIMITY': 'PROXIMIDADE DE TRABALHADORES DA CITY',
  'The Square Mile is within 10-minute walking distance. Corporate lunch, after-work and team-building bookings are a core revenue opportunity.':
    'A Square Mile fica a 10 minutos a pé. Reservas de almoço corporativo, after-work e team-building são uma oportunidade central de receita.',
  'YOUNG PROFESSIONAL BASE': 'BASE DE JOVENS PROFISSIONAIS',
  '48% of SE1 residents are aged 25–44 — the primary spending demographic for experience-led hospitality.':
    '48% dos residentes do SE1 têm entre 25 e 44 anos — o perfil demográfico primário de gastos em hospitalidade voltada a experiências.',
  'INTERNATIONAL TOURISM': 'TURISMO INTERNACIONAL',
  'Borough Market and The Shard draw millions of international visitors annually. No Dice Borough is a natural tourist magnet — an experience venue with no paid acquisition cost.':
    'Borough Market e The Shard atraem milhões de visitantes internacionais por ano. O No Dice Borough é um ímã natural para turistas — um local de experiência sem custo de aquisição paga.',
  'EVENING ECONOMY': 'ECONOMIA NOTURNA',
  'London Bridge is a major night economy hub. Friday and Saturday footfall is exceptional with no enforced curfew on experience venues.':
    'London Bridge é um grande polo de economia noturna. O fluxo de sexta e sábado é excepcional, sem toque de recolher imposto a locais de experiência.',

  // ---------- Location ----------
  'London Bridge Station': 'Estação London Bridge',
  'Borough Market': 'Borough Market',
  'The Shard': 'The Shard',
  'Southwark Station': 'Estação Southwark',
  'Borough Station': 'Estação Borough',
  'Tate Modern': 'Tate Modern',
  'City of London': 'City of London',
  'South Bank': 'South Bank',
  'Transport': 'Transporte',
  'Footfall': 'Fluxo de Pessoas',
  'Adjacent': 'Adjacente',
  'Landmark': 'Ponto Turístico',
  'Cultural': 'Cultural',
  'Business': 'Negócios',
  'Tourism': 'Turismo',
  'NORTHERN LINE': 'LINHA NORTHERN',
  'JUBILEE LINE': 'LINHA JUBILEE',
  'SOUTHEASTERN RAIL': 'SOUTHEASTERN RAIL',
  'THAMES CLIPPER': 'THAMES CLIPPER',
  'BUS ROUTES': 'ROTAS DE ÔNIBUS',
  'London Bridge': 'London Bridge',
  'Southwark': 'Southwark',
  'London Bridge City Pier': 'London Bridge City Pier',
  'Borough High St': 'Borough High St',
  'Transport Links': 'Conexões de Transporte',
  'Nearby Landmarks': 'Pontos de Referência Próximos',
  'Opening Hours': 'Horário de Funcionamento',
  'Mon–Fri': 'Seg–Sex',
  'Saturday': 'Sábado',
  'Sunday': 'Domingo',
  'Tourist Destination': 'Destino Turístico',
  "15–20M annual visitors · One of Europe's most visited food destinations":
    '15–20 milhões de visitantes anuais · Um dos destinos gastronômicos mais visitados da Europa',
  'Jubilee · Northern · Southeastern': 'Jubilee · Northern · Southeastern',
  'London-themed golf course ties to Tate, Shard & South Bank day outs':
    'Circuito de golfe temático de Londres conecta passeios por Tate, Shard e South Bank',

  // ---------- Floor Plan ----------
  'Floor Plan — Arches B C D And E, Montague Close SE1':
    'Planta Baixa — Arches B C D And E, Montague Close SE1',
  'Click to expand ⤢': 'Clique para expandir ⤢',
  'Click anywhere to close': 'Clique em qualquer lugar para fechar',
  'Venue floor plan': 'Planta baixa do local',
  'UPSTAIRS': 'ANDAR SUPERIOR',
  'DOWNSTAIRS': 'ANDAR INFERIOR',
  'SPACE CURRENTLY USED FOR STORES, CELLAR & KITCHEN':
    'ESPAÇO ATUALMENTE USADO PARA DEPÓSITOS, ADEGA E COZINHA',
  'LICENSE': 'LICENÇA',
  'CAPACITY': 'CAPACIDADE',
  'TOILETS': 'BANHEIROS',
  'FIRE EXITS': 'SAÍDAS DE EMERGÊNCIA',
  'PLANNING': 'PLANEJAMENTO',
  'E Class': 'Classe E',

  // ---------- Licence ----------
  'Part 1 — Premises Details': 'Parte 1 — Detalhes do Imóvel',
  'Premises Licence': 'Licença do Imóvel',
  'Licensing Act 2003 · Southwark Council':
    'Licensing Act 2003 · Conselho de Southwark',
  'Licence Number': 'Número da Licença',
  'Premises': 'Imóvel',
  'Post Code': 'CEP',
  'OS Map Reference': 'Referência de Mapa OS',
  'Part 2 — Licence Holder': 'Parte 2 — Titular da Licença',
  'Licence Holder': 'Titular da Licença',
  'Plonk Golf Ltd': 'Plonk Golf Ltd',
  'Registered Address': 'Endereço Registrado',
  'Company Number': 'Número da Empresa',
  'Issue Date': 'Data de Emissão',
  'DPS': 'DPS',
  'Personal Licence No.': 'Nº de Licença Pessoal',
  'Issuing Authority': 'Autoridade Emissora',
  'L.B Tower Hamlets': 'L.B Tower Hamlets',
  'Opening Hours — 07:00 to 23:30 all days':
    'Horário de Funcionamento — 07:00 às 23:30 todos os dias',
  'Licensed Activity Hours — 11:00 to 23:00 all days':
    'Horário das Atividades Licenciadas — 11:00 às 23:00 todos os dias',
  'Films — Indoors': 'Filmes — Espaços Internos',
  'Indoor Sporting Event': 'Evento Esportivo em Espaço Interno',
  'Alcohol — On Premises': 'Álcool — No Imóvel',
  'Annex 1 — Mandatory Conditions': 'Anexo 1 — Condições Obrigatórias',
  'Annex 2 — Operating Schedule Conditions':
    'Anexo 2 — Condições do Cronograma Operacional',
  'Mon': 'Seg',
  'Tue': 'Ter',
  'Wed': 'Qua',
  'Thu': 'Qui',
  'Fri': 'Sex',
  'Sat': 'Sáb',
  'Sun': 'Dom',

  // ---------- Development ----------
  'Venue Expansion · Borough Market SE1': 'Expansão do Local · Borough Market SE1',
  'Basement Space': 'Espaço do Porão',
  'The venue sits above 300m² of undeveloped basement space with full rights to sublet and carry out works. Expansion is structural upside already embedded in the lease.':
    'O local fica sobre 300m² de porão não desenvolvido, com pleno direito de sublocar e realizar obras. A expansão é um upside estrutural já incorporado ao contrato de locação.',
  'Short Term Opportunity': 'Oportunidade de Curto Prazo',
  'Basement Below Bar & Arcade Arch': 'Porão Abaixo do Bar e do Arco de Fliperamas',
  'Long Term Opportunity': 'Oportunidade de Longo Prazo',
  'Full Basement & TfL Tunnel Access': 'Porão Completo e Acesso ao Túnel da TfL',
  'The basement represents significant embedded upside — it is not speculative. The rights exist, the space exists, and the structural costs are not borne by No Dice Borough Ltd.':
    'O porão representa um upside embutido significativo — não é especulativo. Os direitos existem, o espaço existe, e os custos estruturais não são arcados pela No Dice Borough Ltd.',
  'Lease-Backed Rights': 'Direitos Garantidos por Contrato',
  'Structural Costs: Landlord': 'Custos Estruturais: Proprietário',
  '400m² Total Potential': '400m² de Potencial Total',
  'External Space · Conditional Opportunity': 'Espaço Externo · Oportunidade Condicional',
  'Yard Space & External Capacity': 'Espaço do Pátio e Capacidade Externa',
  'A significant external yard at the front of the venue is currently used by Boro Bistro under a landlord agreement. The opportunity to reclaim this space is live and represents a material uplift in capacity and bar revenue.':
    'Um pátio externo significativo na frente do local é atualmente usado pelo Boro Bistro mediante acordo com o proprietário. A oportunidade de reaver esse espaço está em aberto e representa um ganho material em capacidade e receita de bar.',
  'Current Status': 'Status Atual',
  'Boro Bistro — Final Warning': 'Boro Bistro — Aviso Final',
  "Situation is live — outcome subject to Boro Bistro's next infraction":
    'Situação em aberto — resultado condicionado à próxima infração do Boro Bistro',
  'If Reclaimed': 'Se Reavido',
  'Large Capacity & Bar Revenue Upside': 'Ampla Capacidade e Upside de Receita de Bar',
  'The yard is not speculative pipeline — it is an active situation. If Boro Bistro commit one further breach of their agreement, the opportunity to take back this space becomes available immediately.':
    'O pátio não é um pipeline especulativo — é uma situação ativa. Se o Boro Bistro cometer mais uma violação do acordo, a oportunidade de retomar esse espaço fica imediatamente disponível.',
  'Private Land — No Licensing Barrier': 'Terreno Privado — Sem Barreira de Licenciamento',
  'Landlord: Southwark Cathedral': 'Proprietário: Southwark Cathedral',
  'Conditional on Boro Bistro Breach': 'Condicionado à Violação do Boro Bistro',
  'Premises Licence No. 888057 · Southwark Council':
    'Licença do Imóvel Nº 888057 · Conselho de Southwark',
  'Licence Development': 'Desenvolvimento da Licença',
  'The current premises licence was granted for a golf-led activity venue. Four targeted variations would materially increase revenue potential. Zero enforcement history and an activity-led format are strong grounds for all four applications.':
    'A licença atual do imóvel foi concedida para um local de atividades focado em golfe. Quatro variações direcionadas aumentariam materialmente o potencial de receita. Histórico zero de sanções e um formato voltado a atividades são fundamentos sólidos para as quatro solicitações.',
  'Target: 1am Initially · 2am Long Term': 'Meta: 1h inicialmente · 2h no longo prazo',
  'Extended Trading Hours': 'Horário de Operação Estendido',
  'Currently: Alcohol to 11pm · Premises closes 11:30pm':
    'Atualmente: Álcool até 23h · Imóvel fecha às 23h30',
  'Highest Likelihood · Apply First': 'Maior Probabilidade · Aplicar Primeiro',
  'Activity-Led Alcohol Access': 'Acesso ao Álcool Vinculado a Atividades',
  'Currently: Alcohol tied to golf ticket or arcade token purchase':
    'Atualmente: Álcool vinculado à compra de ingresso de golfe ou fichas de fliperama',
  'International Matches Only': 'Apenas Partidas Internacionais',
  'Live International Sports': 'Esportes Internacionais ao Vivo',
  'Currently: No live sports screenings permitted (Condition 353)':
    'Atualmente: Sem transmissões ao vivo de esportes permitidas (Condição 353)',
  'Recommended Approach': 'Abordagem Recomendada',
  'How to Maximise Success': 'Como Maximizar o Sucesso',
  'To 1am': 'Até 1h',
  'To 2am': 'Até 2h',
  'Likelihood': 'Probabilidade',
  'International only': 'Apenas internacional',
  'Full removal': 'Remoção completa',
  'Do not apply for all four variations simultaneously — this signals a venue seeking to transform its character. Sequence the applications. A clean zero-incident trading record in SE1 is the strongest asset in every application.':
    'Não solicite as quatro variações ao mesmo tempo — isso sinaliza um local buscando transformar seu perfil. Sequencie as solicitações. Um histórico de operação sem incidentes no SE1 é o maior ativo em todas as solicitações.',
  'Remove Golf-Drink Link 65–75%': 'Remover Vínculo Golfe-Bebida 65–75%',
  'Hours to 1am 35–45%': 'Horário até 1h 35–45%',
  'Sports Screening 40–55%': 'Transmissão de Esportes 40–55%',
  'Hours to 2am 20–30%': 'Horário até 2h 20–30%',
  'This analysis is for information only and does not constitute legal advice. Engage a licensed specialist solicitor before submitting any variation application to Southwark Council.':
    'Esta análise é apenas informativa e não constitui aconselhamento jurídico. Contrate um solicitor especialista licenciado antes de enviar qualquer solicitação de variação ao Conselho de Southwark.',
  'Venue Information · Arches B C D And E, Montague Close SE1':
    'Informações do Local · Arches B C D And E, Montague Close SE1',

  // ---------- Business Explorer — tabs ----------
  'Overview': 'Visão Geral',
  '2025 Performance': 'Desempenho 2025',
  '2026 Performance': 'Desempenho 2026',
  'Scenarios': 'Cenários',

  // ---------- Business Explorer — Overview ----------
  'INVESTMENT ASK': 'APORTE SOLICITADO',
  'FY2025 ACTUAL REVENUE': 'RECEITA REAL EXERCÍCIO 2025',
  'FORECAST REVENUE Y1': 'RECEITA PROJETADA ANO 1',
  'for 50% equity': 'por 50% de equity',
  'Verified financial model': 'Modelo financeiro verificado',
  '+15.0% on prior year': '+15,0% sobre o ano anterior',
  'Monthly Revenue & EBITDA Forecast · May 2026 – Apr 2027':
    'Projeção Mensal de Receita e EBITDA · Mai 2026 – Abr 2027',
  'Revenue': 'Receita',
  'EBITDA': 'EBITDA',
  'Revenue Split': 'Divisão de Receita',
  'Bar & Drinks': 'Bar e Bebidas',
  'Activities': 'Atividades',
  'Events & Hire': 'Eventos e Locação',
  'Y1 Forecast EBITDA': 'EBITDA Projetado Ano 1',
  '22.4% EBITDA margin': '22,4% de margem EBITDA',
  'Base Case Returns': 'Retornos do Cenário Base',
  '52.1% CoC': '52,1% CoC',
  'Cash-on-cash return Year 1': 'Retorno cash-on-cash Ano 1',
  'Business Explorer · Borough Market SE1': 'Explorador do Negócio · Borough Market SE1',

  // ---------- Business Explorer — 2026 Performance ----------
  '2026 Performance · Scenario-adjusted forecast':
    'Desempenho 2026 · Projeção ajustada por cenário',
  'Aggregate of the four growth levers in Scenarios (Bar · Golf · Hires · Events). Dragging this slider snaps all four to the same value. Wages +10%, Fixed +10%, Drinks = 30% of bar, Hosting fixed, everything else scales.':
    'Agregado das quatro alavancas de crescimento em Cenários (Bar · Golfe · Locações · Eventos). Arrastar este controle iguala as quatro ao mesmo valor. Salários +10%, Fixos +10%, Bebidas = 30% do bar, Hospedagem fixa, tudo o mais escala proporcionalmente.',
  'Reset all four levers to +15% (Base)': 'Redefinir as quatro alavancas para +15% (Base)',
  'Bear': 'Pessimista',
  '2025': '2025',
  'Base': 'Base',
  'Bull': 'Otimista',
  'Adjusted Revenue': 'Receita Ajustada',
  'Adjusted EBITDA': 'EBITDA Ajustado',
  'margin': 'de margem',
  'Income · 2026 Forecast': 'Receita · Projeção 2026',
  'Operating Costs · 2026 Forecast': 'Custos Operacionais · Projeção 2026',
  'Monthly Income 2026 — Scaled': 'Receita Mensal 2026 — Escalada',
  'Monthly Costs 2026 — Scaled': 'Custos Mensais 2026 — Escalados',
  'Rent, rates, utilities, insurance, internet, PRS · +10% on 2025':
    'Aluguel, taxas, utilidades, seguro, internet, PRS · +10% sobre 2025',
  '30% of bar revenue (2025 actual was 22.5%)':
    '30% da receita do bar (real de 2025 foi 22,5%)',
  'Scales with aggregate revenue': 'Escala com a receita agregada',
  'Fixed — SEO/Ads now owned by Plonk Golf':
    'Fixo — SEO/Anúncios agora de responsabilidade da Plonk Golf',
  'Other': 'Outros',
  'Reset to default': 'Restaurar padrão',

  // ---------- Business Explorer — Scenarios ----------
  'Build Custom Scenario': 'Construir Cenário Personalizado',
  'These four levers also drive the main 2026 Performance slider':
    'Essas quatro alavancas também controlam o controle principal de Desempenho 2026',
  'Reset to +15%': 'Redefinir para +15%',
  'New:': 'Novo:',
  'CONSERVATIVE': 'CONSERVADOR',
  'BASE CASE': 'CENÁRIO BASE',
  'OPTIMISTIC': 'OTIMISTA',
  'CUSTOM': 'PERSONALIZADO',
  'Op Profit': 'Lucro Operacional',
  'Investor Return': 'Retorno do Investidor',

  // ---------- Business Explorer — Market Context tab ----------
  'Experience Leisure Growth': 'Crescimento de Lazer de Experiência',
  '2025 YoY — fastest growing hospitality sub-sector':
    '2025 YoY — subsetor de hospitalidade que mais cresce',
  'Borough Market Visitors': 'Visitantes do Borough Market',
  'Annual visitors to the area': 'Visitantes anuais na região',
  'London Bridge Commuters': 'Passageiros de London Bridge',
  'Daily station passengers — primary catchment':
    'Passageiros diários da estação — área primária de captação',
  'SE1 Demographics': 'Demografia do SE1',
  'Aged 25–44': 'Idade 25–44',
  'Median HH Income': 'Renda Familiar Mediana',
  'Uni-educated': 'Com formação universitária',
  'Office workers': 'Trabalhadores de escritório',
  'Tailwinds & Positioning': 'Ventos Favoráveis e Posicionamento',
  'Social Media Discovery': 'Descoberta em Redes Sociais',
  'Experiential venues generate organic UGC at 5× the rate of traditional hospitality. Plonk’s visual format drives free acquisition.':
    'Locais experienciais geram UGC orgânico a uma taxa 5× maior que a hospitalidade tradicional. O formato visual da Plonk impulsiona aquisição gratuita.',
  'Corporate Demand': 'Demanda Corporativa',
  'Post-pandemic, team-building and offsites are structural demand. City of London proximity means Plonk Borough targets this without incremental spend.':
    'Pós-pandemia, team-building e offsites viraram demanda estrutural. A proximidade com a City of London faz com que a Plonk Borough atenda esse público sem gasto incremental.',
  'Recession Resilience': 'Resiliência a Recessão',
  'Domestic leisure spend is sticky. Experience venues priced below £30/head replace overseas alternatives during economic downturns.':
    'Gasto doméstico com lazer é aderente. Locais de experiência precificados abaixo de £30/pessoa substituem alternativas no exterior em períodos de desaceleração econômica.',
  'Occasions & Celebrations': 'Ocasiões e Celebrações',
  'Birthday, hen and stag parties are high-value bookings with structured spend. Activity venues capture the full occasion — entry, drinks and food.':
    'Aniversários, despedidas de solteira e de solteiro são reservas de alto valor com gasto estruturado. Locais de atividade capturam a ocasião inteira — entrada, bebidas e comida.',
  'Repeat Visit Model': 'Modelo de Visitação Recorrente',
  'Multi-activity format with regular event programme drives repeat visitation. Bar-led experience venues see 2–3× the repeat rate of single-activity venues.':
    'Formato multi-atividades com programação regular de eventos impulsiona a visitação recorrente. Locais de experiência focados em bar veem taxa de retorno 2–3× maior que a de locais de atividade única.',
  'Pricing Power': 'Poder de Precificação',
  '+£1 across pool and golf at current volumes generates ~£15K incremental annual profit. Zero capex, zero churn risk at this price point.':
    '+£1 em sinuca e golfe nos volumes atuais gera ~£15 mil de lucro incremental por ano. Zero capex, zero risco de churn nesse ponto de preço.',

  // ---------- Business Explorer — Wages tab ----------
  'Total Wage Bill 2025': 'Folha Salarial Total 2025',
  'Verified rota data': 'Dados de escala verificados',
  'Total Hours Worked': 'Total de Horas Trabalhadas',
  '10,043 hrs': '10.043 h',
  '23 employees · fully tagged roles': '23 funcionários · cargos totalmente tagueados',
  'Wages as % Revenue': 'Salários como % da Receita',
  '£242,370 ÷ £741,644 · target ≤22%': '£242,370 ÷ £741,644 · meta ≤22%',
  'Sliding Wage Rate Calculator — 2026 Planning':
    'Calculadora Deslizante de Taxa Salarial — Planejamento 2026',
  'Bar Staff': 'Equipe de Bar',
  'Supervisor': 'Supervisor',
  'Asst Manager': 'Gerente Assistente',
  'Manager': 'Gerente',
  'hrs': 'h',
  'Annual:': 'Anual:',
  'Projected Wage Bill': 'Folha Salarial Projetada',
  'Delta vs 2025': 'Delta vs 2025',
  'Wages % Forecast': 'Salários % Projetado',

  // ---------- Plonk — Cover ----------
  'Plonk Golf · Overview': 'Plonk Golf · Visão Geral',
  'Plonk Crazy Golf': 'Plonk Crazy Golf',
  'The ultimate destination for competitive socialising in the capital — and now, the IP and operating system behind the courses our partners run in their own venues.':
    'O destino supremo para socialização competitiva na capital — e agora, o IP e o sistema operacional por trás dos circuitos que nossos parceiros operam em seus próprios locais.',
  'Customers': 'Clientes',
  'Across every site since 2013': 'Em todos os sites desde 2013',
  'Pop-Up Sites': 'Sites Pop-Up',
  'Over 50': 'Mais de 50',
  'UK & Europe': 'Reino Unido e Europa',
  'Specialists': 'Especialistas',
  'Design + Hospitality': 'Design + Hospitalidade',
  'Set-design roots · hospitality-run': 'Raízes em design de cenários · operado por hospitalidade',
  'Opportunity': 'Oportunidade',
  'Unique Franchise': 'Franquia Única',
  'IP + hardware + maintenance': 'IP + hardware + manutenção',
  'Our Story': 'Nossa História',
  'Founded': 'Fundação',
  'Plonk Crazy Golf is founded by a troop of set designers from the film industry who band together to build the greatest Crazy Golf courses imaginable — and plonk them down around the capital.':
    'A Plonk Crazy Golf é fundada por uma trupe de cenógrafos vindos da indústria cinematográfica que se unem para construir os maiores circuitos de Crazy Golf imagináveis — e espalhá-los pela capital.',
  'First Course · Haggerston': 'Primeiro Circuito · Haggerston',
  'Our first permanent course opens in Haggerston, London — built from 100% up-cycled materials rescued from the streets of Hackney.':
    'Nosso primeiro circuito permanente abre em Haggerston, Londres — construído com 100% de materiais reaproveitados resgatados das ruas de Hackney.',
  '50+ Pop-Up Sites': 'Mais de 50 Sites Pop-Up',
  'Increasingly ambitious courses appear across the UK and Europe. Beer gardens, forgotten basements, old warehouses, nightclubs, markets, museums, festivals and shopping centres.':
    'Circuitos cada vez mais ambiciosos surgem pelo Reino Unido e pela Europa. Beer gardens, porões esquecidos, armazéns antigos, boates, mercados, museus, festivais e shoppings.',
  'Owned Venues Era': 'Era dos Locais Próprios',
  'Plonk begins operating its own venues — each housing a unique Crazy Golf course alongside arcade machines, pool tables, pinball, board games and a fully stocked bar with draught beer, cocktails and canned craft.':
    'A Plonk começa a operar seus próprios locais — cada um abrigando um circuito de Crazy Golf único ao lado de fliperamas, mesas de sinuca, pinball, jogos de tabuleiro e um bar totalmente abastecido com chope, coquetéis e cerveja artesanal em lata.',
  'Back to the Roots': 'De Volta às Raízes',
  "Plonk reverts to its original model — Plonk @ other companies' venues. Plonk Golf provides the IP, course design, hardware and digital funnel. Venues run the day-to-day and pay a franchise commission plus a hardware purchase fee.":
    'A Plonk volta ao seu modelo original — Plonk @ locais de outras empresas. A Plonk Golf fornece o IP, o design do circuito, o hardware e o funil digital. Os locais cuidam do dia a dia e pagam uma comissão de franquia mais uma taxa de compra de hardware.',
  'Continue to How It Works, IP & Licensing or Marketing Engine →':
    'Continue para Como Funciona, IP e Licenciamento ou Motor de Marketing →',

  // ---------- Plonk — tabs ----------
  'Cover': 'Capa',
  'How It Works': 'Como Funciona',
  'Marketing Engine': 'Motor de Marketing',
  'SEO Marketing': 'Marketing de SEO',

  // ---------- Plonk How It Works ----------
  'How It Works · Plonk Golf × No Dice Borough':
    'Como Funciona · Plonk Golf × No Dice Borough',
  'What the franchise saves the venue': 'O que a franquia economiza para o local',
  'Under the franchise model with No Dice Borough, Plonk Golf takes on the digital funnel, payment processing, group bookings, hosting, and SEO for all crazy golf tickets. All money goes directly into the franchisee account, with Plonk taking a direct debit post payment for their commission. A small one-off fee is paid upfront for use of the name.':
    'Sob o modelo de franquia com a No Dice Borough, a Plonk Golf assume o funil digital, o processamento de pagamentos, as reservas em grupo, a hospedagem e o SEO para todos os ingressos de crazy golf. Todo o dinheiro vai direto para a conta do franqueado, com a Plonk recolhendo sua comissão por débito direto após o pagamento. Uma pequena taxa única é paga antecipadamente pelo uso do nome.',
  'Annual savings': 'Economia anual',
  'Recurring per year': 'Recorrente por ano',
  'One-off IP saving': 'Economia única de IP',
  '£50,000 + VAT': '£50,000 + IVA',
  'vs. the previous £72,000 IP & Goodwill purchase under the old deal':
    'vs. a compra anterior de £72,000 em IP e Goodwill do acordo antigo',
  'Year 1 total saving': 'Economia total no Ano 1',
  'Annual + one-off (ex VAT on the IP line)':
    'Anual + único (ex-IVA na linha de IP)',
  'What comes off the venue P&L': 'O que sai do P&L do local',
  'Online payment fees': 'Taxas de pagamento online',
  '1.5% of online ticket gross — Plonk Golf absorbs this via its Stripe account.':
    '1,5% do bruto de ingressos online — a Plonk Golf absorve via sua conta Stripe.',
  'Web hosting (Lithos)': 'Hospedagem web (Lithos)',
  'Plonk Golf runs the website and booking system — venue no longer needs its own Lithos plan.':
    'A Plonk Golf opera o site e o sistema de reservas — o local não precisa mais do próprio plano Lithos.',
  'Bookings manager wage': 'Salário do gerente de reservas',
  'Online chatbot + AI booking replace the office bookings role. Group bookings 12+ are handled by venue management directly.':
    'Chatbot online + reserva por IA substituem o cargo de reservas do escritório. Reservas em grupo de 12+ são tratadas diretamente pela gerência do local.',
  'SEO management': 'Gestão de SEO',
  'Plonk Golf runs a non-venue-specific SEO programme at its own cost. No venue-level SEO retainer required.':
    'A Plonk Golf executa um programa de SEO não específico do local, por conta própria. Não é necessário contrato de SEO no nível do local.',
  'per year': 'por ano',
  'IP purchase — replaced with IP License Fee':
    'Compra de IP — substituída por Taxa de Licença de IP',
  'Original deal included £72,000 Plonk IP & Goodwill. Under the franchise model the venue licenses the IP for a fraction of that upfront, saving ~£50,000 + VAT on the initial capital stack.':
    'O acordo original incluía £72,000 em Plonk IP e Goodwill. Sob o modelo de franquia, o local licencia o IP por uma fração desse valor adiantado, economizando ~£50,000 + IVA no stack de capital inicial.',
  'one-off + VAT': 'único + IVA',
  'vs. old Use of Funds': 'vs. Uso dos Fundos antigo',
  'What the venue gives back in return': 'O que o local dá em troca',
  'The New Model · 2026 & On': 'O Novo Modelo · 2026 em Diante',
  'Plonk Golf licenses the IP, sells the hardware, and runs the digital funnel. Venues run the day-to-day. Three commercial levers:':
    'A Plonk Golf licencia o IP, vende o hardware e opera o funil digital. Os locais cuidam do dia a dia. Três alavancas comerciais:',
  'Franchise Commission': 'Comissão de Franquia',
  'A % on golf ticket sales routed through the Plonk online booking system — and, optionally, on office-handled bookings if Plonk Golf provides a bookings manager. Pool tables, private events and group bookings 12+ remain venue-managed.':
    'Uma % sobre vendas de ingressos de golfe que passam pelo sistema de reservas online da Plonk — e, opcionalmente, sobre reservas tratadas pelo escritório se a Plonk Golf fornecer um gerente de reservas. Mesas de sinuca, eventos privados e reservas em grupo de 12+ permanecem geridas pelo local.',
  'Recurring': 'Recorrente',
  'Hardware Purchase Fee': 'Taxa de Compra de Hardware',
  'One-off fee for the Plonk course and equipment — built bespoke for the venue, delivered and installed. Hardware is bought outright by the venue.':
    'Taxa única pelo circuito e equipamentos Plonk — feitos sob medida para o local, entregues e instalados. O hardware é comprado totalmente pelo local.',
  'One-off': 'Único',
  'Maintenance Plan (optional)': 'Plano de Manutenção (opcional)',
  '£400 / month for London-based venues — includes one on-site day per month. Plan holders also unlock discounts on all new hardware and equipment orders.':
    '£400 / mês para locais em Londres — inclui um dia de atendimento presencial por mês. Assinantes do plano também obtêm descontos em todos os novos pedidos de hardware e equipamentos.',
  '£400 / mo': '£400 / mês',
  'Maintenance & Warranty Terms': 'Termos de Manutenção e Garantia',
  'Warranty': 'Garantia',
  'Valid only while a Maintenance Plan is active. No maintenance plan = no warranty cover.':
    'Válida apenas enquanto um Plano de Manutenção estiver ativo. Sem plano de manutenção = sem cobertura de garantia.',
  'Maintenance visit': 'Visita de manutenção',
  '1 on-site day per month · London venues · £400 / month':
    '1 dia presencial por mês · Locais em Londres · £400 / mês',
  'Hardware discounts': 'Descontos em hardware',
  'Plan holders get discounted rates on all new hardware and equipment.':
    'Assinantes do plano obtêm tarifas com desconto em todos os novos hardwares e equipamentos.',
  'Vandalism': 'Vandalismo',
  "Not covered under warranty or maintenance plan — venue's responsibility.":
    'Não coberto pela garantia ou plano de manutenção — responsabilidade do local.',

  // ---------- IP & Licensing ----------
  'IP & Licensing — dev sheet (Borough 2025, split by channel)':
    'IP e Licenciamento — planilha de desenvolvimento (Borough 2025, separado por canal)',
  'Source:': 'Fonte:',
  'ALL DMN 2025 transactions': 'TODAS as transações DMN de 2025',
  'Online Tickets': 'Ingressos Online',
  'of volume': 'do volume',
  'Online Revenue': 'Receita Online',
  'of total £ · actual': 'do £ total · real',
  'Office Tickets': 'Ingressos de Escritório',
  'Office Revenue': 'Receita de Escritório',
  'of total £ · imputed': 'do £ total · imputado',
  'Combined Borough 2025 revenue': 'Receita combinada do Borough em 2025',

  'Section A · Online Portal (Status = complete)':
    'Seção A · Portal Online (Status = completo)',
  'Customer books + pays through the online system. Booking fee (10%) added on top, retained by Plonk Golf. Commission charged to venue on online golf sales only (see slider below).':
    'O cliente reserva + paga pelo sistema online. Taxa de reserva (10%) adicionada por cima, retida pela Plonk Golf. Comissão cobrada do local apenas em vendas online de golfe (veja o controle abaixo).',
  'Section B · Office / External (Status = external)':
    'Seção B · Escritório / Externo (Status = externo)',
  "Bookings taken by the office/bookings team. Payment is settled at the venue till. Revenue column is IMPUTED at SKU list price (qty × price). Booking fee column is £0 because till sales don't carry the online booking fee.":
    'Reservas feitas pelo time de escritório/reservas. O pagamento é realizado no caixa do local. A coluna de receita é IMPUTADA ao preço de tabela do SKU (qtd × preço). A coluna de taxa de reserva é £0 porque vendas no caixa não carregam a taxa de reserva online.',
  'SKU': 'SKU',
  'Tokens': 'Fichas',
  'Gross Price': 'Preço Bruto',
  'Token Value (no VAT)': 'Valor da Ficha (sem IVA)',
  'Booking Fee (10%)': 'Taxa de Reserva (10%)',
  'Customer Pays': 'Cliente Paga',
  'Units 2025': 'Unidades 2025',
  'Revenue 2025': 'Receita 2025',
  'TOTAL': 'TOTAL',
  'tickets': 'ingressos',
  'Commission % — Online golf sales': 'Comissão % — Vendas online de golfe',
  'Applied to online GOLF ticket sales only. Pool tables, events, group bookings 12+ and specials are venue-managed — no Plonk Golf commission on those.':
    'Aplicado apenas a vendas online de ingressos de GOLFE. Mesas de sinuca, eventos, reservas em grupo de 12+ e promoções são geridos pelo local — sem comissão da Plonk Golf nesses itens.',
  "Excluded from commission: Pool Table Reservation, Doubles Pool Tournament, Extra Arcade Tokens, Valentine's Day Deal.":
    "Excluídos da comissão: Reserva de Mesa de Sinuca, Torneio de Duplas de Sinuca, Fichas Extras de Fliperama, Oferta do Dia dos Namorados.",
  'Commission % — Office golf sales (if Plonk Golf provides bookings manager)':
    'Comissão % — Vendas de golfe de escritório (se a Plonk Golf fornecer gerente de reservas)',
  'Conditional scenario: if Plonk Golf provides a bookings manager for the venue, it earns a commission on office/till-settled golf sales. Set to 0% to model venue-handles-own-bookings.':
    'Cenário condicional: se a Plonk Golf fornecer um gerente de reservas para o local, recebe comissão sobre vendas de golfe liquidadas no caixa/escritório. Defina 0% para modelar o cenário em que o próprio local faz as reservas.',
  'Same golf-only scope as online. Office-channel revenue is imputed at SKU list price — Plonk Golf commission on it is a modelled scenario, not a current revenue stream.':
    'Mesmo escopo de apenas golfe do canal online. A receita do canal de escritório é imputada ao preço de tabela do SKU — a comissão da Plonk Golf sobre ela é um cenário modelado, não uma fonte de receita atual.',
  'Golf revenue (commissionable)': 'Receita de golfe (comissionável)',
  'Non-golf (excluded)': 'Não-golfe (excluído)',
  'Monthly Channel Split — Revenue 2025': 'Divisão Mensal por Canal — Receita 2025',
  'Blue = online portal revenue (actual) · Grey = office revenue (imputed at SKU list price, till-settled).':
    'Azul = receita do portal online (real) · Cinza = receita do escritório (imputada ao preço de tabela do SKU, liquidada no caixa).',
  'Total:': 'Total:',
  'Plonk Golf × Venue — Interactive Model': 'Plonk Golf × Local — Modelo Interativo',
  'Commission rates come from the golf-only sliders under Sections A & B. Booking fee (10%) is locked — applied to ALL online sales at checkout. Uplift and cost sliders below are scenario inputs.':
    'As taxas de comissão vêm dos controles exclusivos de golfe nas Seções A e B. A taxa de reserva (10%) é fixa — aplicada a TODAS as vendas online no checkout. Os controles de uplift e custos abaixo são entradas de cenário.',
  'Volume uplift (vs 2025 online)': 'Uplift de volume (vs online 2025)',
  'Website + booking system': 'Site + sistema de reservas',
  'SEO (non-venue-specific)': 'SEO (não específico do local)',
  'Chatbot / AI booking': 'Chatbot / reserva por IA',
  'Accountancy fees': 'Honorários de contabilidade',
  'Plonk Golf P&L (Borough)': 'P&L da Plonk Golf (Borough)',
  'Gross online sales (all SKUs)': 'Vendas online brutas (todos os SKUs)',
  '↳ of which online golf (commissionable)':
    '↳ dos quais golfe online (comissionável)',
  '↳ of which office golf — imputed (commissionable)':
    '↳ dos quais golfe de escritório — imputado (comissionável)',
  '+ Booking fees collected (10% on all online)':
    '+ Taxas de reserva recolhidas (10% sobre todo o online)',
  '= Plonk Golf revenue': '= Receita da Plonk Golf',
  '− Maintenance (12 × £250)': '− Manutenção (12 × £250)',
  '− Website + booking system': '− Site + sistema de reservas',
  '− SEO': '− SEO',
  '− Chatbot / AI booking': '− Chatbot / reserva por IA',
  '− Accountancy fees': '− Honorários de contabilidade',
  '= Total Plonk Golf costs': '= Custos totais da Plonk Golf',
  'NET to Plonk Golf': 'LÍQUIDO para a Plonk Golf',
  'Venue view (Borough DMN — online only)':
    'Visão do local (Borough DMN — apenas online)',
  'Gross online sales': 'Vendas online brutas',
  '− Token cost (4 × £0.325 per tokened ticket)':
    '− Custo de fichas (4 × £0.325 por ingresso com fichas)',
  'NET to venue (online)': 'LÍQUIDO para o local (online)',
  'Margin on Plonk Golf rev:': 'Margem sobre a receita da Plonk Golf:',
  'Office commission assumes Plonk Golf provides the bookings manager. Set slider B to 0% to model the "venue self-serves office bookings" scenario.':
    'A comissão de escritório pressupõe que a Plonk Golf forneça o gerente de reservas. Defina o controle B para 0% para modelar o cenário "o próprio local faz as reservas de escritório".',
  'Booking fee (10%) is paid by customer on top — venue never sees it.':
    'A taxa de reserva (10%) é paga pelo cliente por cima — o local nunca a vê.',
  'Pool tables, private events and group bookings 12+ are venue-managed — Plonk Golf takes no commission on those.':
    'Mesas de sinuca, eventos privados e reservas em grupo de 12+ são geridos pelo local — a Plonk Golf não recebe comissão sobre isso.',
  'Assumptions & open questions': 'Premissas e questões em aberto',
  'Channel split:': 'Divisão por canal:',
  'Office revenue is imputed': 'A receita de escritório é imputada',
  'Online total': 'Total online',
  'Booking fee 10%:': 'Taxa de reserva 10%:',
  'Commission %:': 'Comissão %:',
  'Payment processing 1.5%:': 'Processamento de pagamento 1,5%:',
  'Token stripping:': 'Remoção de fichas:',
  'Not yet modelled:': 'Ainda não modelado:',

  // ---------- Plonk SEO Marketing ----------
  'SEO Marketing · Funnel Model': 'Marketing de SEO · Modelo de Funil',
  'Ads → clicks → customers → revenue': 'Anúncios → cliques → clientes → receita',
  'Interactive model for the paid digital funnel Plonk Golf runs centrally. Move the sliders to test budget, CPC, conversion rate and average ticket spend — outputs update in real time.':
    'Modelo interativo para o funil digital pago que a Plonk Golf opera centralmente. Mova os controles para testar orçamento, CPC, taxa de conversão e gasto médio por ingresso — os resultados atualizam em tempo real.',
  'Marketing Model Inputs': 'Entradas do Modelo de Marketing',
  'Weekly Ad Budget': 'Orçamento Semanal de Anúncios',
  'Cost Per Click': 'Custo por Clique',
  'Conversion Rate': 'Taxa de Conversão',
  'Avg Spend / Customer': 'Gasto Médio / Cliente',
  'Annual Budget': 'Orçamento Anual',
  'Paying Customers': 'Clientes Pagantes',
  'ROAS': 'ROAS',
  'Net Marketing Profit': 'Lucro Líquido de Marketing',
}

// ---------- Patterns for dynamic strings (with numbers etc.) ----------
const PATTERNS_PT_BR = [
  // VAT handling
  { from: /^inc VAT$/, to: 'inc IVA' },
  { from: /^£([\d,]+(?:\.\d+)?) inc VAT$/, to: '£$1 inc IVA' },
  { from: /^(.+) inc VAT$/, to: '$1 inc IVA' },

  // Year N / Ano N
  { from: /^Year (\d+)$/, to: 'Ano $1' },
  { from: /^Year (\d+) (.+)$/, to: 'Ano $1 $2' },

  // Generic "N min walk" / "N-minute walk"
  { from: /^(\d+) min walk$/, to: '$1 min a pé' },
  { from: /^(\d+) minute walk$/, to: '$1 minutos a pé' },

  // Sources dated
  { from: /^Sources: (.+)$/, to: 'Fontes: $1' },
  { from: /^Source: (.+)$/, to: 'Fonte: $1' },

  // "N years" / "N yrs" / "N year"
  { from: /^(\d+(?:\.\d+)?) years$/, to: '$1 anos' },
  { from: /^(\d+(?:\.\d+)?) year$/, to: '$1 ano' },
  { from: /^(\d+(?:\.\d+)?) yrs$/, to: '$1 anos' },

  // "N / Y" image counters — pass through unchanged
  { from: /^\d+ \/ \d+$/, to: (m) => m },
]

export function translate(src, lang) {
  if (lang !== 'pt-BR' || typeof src !== 'string') return src
  const trimmed = src.trim()
  if (!trimmed) return src
  const leading = src.match(/^\s*/)[0]
  const trailing = src.match(/\s*$/)[0]

  // 1. Exact match
  if (Object.prototype.hasOwnProperty.call(PT_BR, trimmed)) {
    return leading + PT_BR[trimmed] + trailing
  }

  // 2. Pattern match
  for (const p of PATTERNS_PT_BR) {
    if (p.from.test(trimmed)) {
      const replaced =
        typeof p.to === 'function'
          ? trimmed.replace(p.from, p.to)
          : trimmed.replace(p.from, p.to)
      return leading + replaced + trailing
    }
  }
  return src
}
