import { FinancialReportData, Transaction } from "../types";

export type Language = 'en' | 'pt';

interface DemoData {
  metrics: FinancialReportData['metrics'];
  breakdown_50_30_20: FinancialReportData['breakdown_50_30_20'];
  subscriptions: FinancialReportData['subscriptions'];
  categories: FinancialReportData['categories'];
  insights: FinancialReportData['insights'];
  transactions: FinancialReportData['transactions'];
}

export const translations = {
  en: {
    sidebar: {
      dashboard: 'Dashboard',
      upload: 'Upload CSV',
      audits: 'History',
      reports: 'Deep Analysis',
      settings: 'Settings',
      credits: 'Credits',
      topUp: 'Add Funds',
      signOut: 'Sign Out',
    },
    anamnesis: {
      title: "Financial Profile",
      subtitle: "Help our AI understand your context for a personalized analysis.",
      step1: "Personal Info",
      step2: "Assets",
      step3: "Goals",
      labels: {
        age: "Age",
        occupation: "Occupation / Job Title",
        invested: "Total Currently Invested",
        family: "Family Status",
        goals: "Primary Financial Goals"
      },
      options: {
        single: "Single",
        married: "Married",
        married_kids: "Married with Kids",
        single_parent: "Single Parent",
        goal_retirement: "Early Retirement",
        goal_debt: "Debt Free",
        goal_house: "Buy Property",
        goal_travel: "Travel / Lifestyle",
        goal_emergency: "Build Emergency Fund"
      },
      next: "Next Step",
      analyze: "Start AI Analysis",
      useSaved: "Skip & Use Saved Profile",
      savedProfileFound: "We found a previously saved profile."
    },
    login: {
      tagline: 'AI Financial Auditor 2.0',
      heroTitle: 'Master your money',
      heroSubtitle: 'without the stress.',
      heroDesc: 'Upload your bank statements and let our advanced Gemini AI analyze patterns, detect subscriptions, and calculate your financial health score in seconds.',
      features: [
        'Deep analysis of 12+ spending categories',
        'Subscription hunting & waste detection',
        'Personalized 50/30/20 rule breakdown',
        'Data privacy first - processed in memory'
      ],
      welcome: 'Welcome back',
      enterDetails: 'Please enter your details to sign in.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'name@company.com',
      passwordLabel: 'Password',
      forgotPass: 'Forgot password?',
      signInBtn: 'Sign In to Dashboard',
      orContinue: 'Or continue with',
      google: 'Google',
      apple: 'Apple',
      needAccount: 'Need an account?',
      requestAccess: 'Request Access'
    },
    dashboard: {
      title: 'Financial Overview',
      subtitle: "Welcome back. Here is your financial health status.",
      timeFilters: {
        days30: "30 Days",
        months3: "3 Months",
        year: "Year"
      },
      cards: {
        health: "Financial Health Score",
        income: "Total Income",
        expenses: "Total Expenses",
        cashflow: "Cash Flow Trend",
        subscriptions: "Recurring Charges",
        aiTip: "AI Strategic Insight"
      },
      healthStatus: {
        excellent: "Excellent Condition",
        good: "Healthy Condition",
        poor: "Needs Attention",
        desc: "Your financial habits are performing better than {percent}% of users."
      },
      vsLastMonth: "vs last month",
      lessThanLast: "Lower than previous period",
      viewAll: "View Details",
      addCredits: "Add Credits"
    },
    uploadPage: {
      title: 'New Analysis',
      welcome: "Upload a new bank statement to generate a comprehensive report.",
      complete: 'Analysis complete. Review your health score below.',
      loadDemo: 'Load Demo Data',
      addCredits: 'Add Credits',
      analyzeNew: 'Analyze New File',
      uploadTitle: 'Upload Bank Statement',
      uploadDesc: 'Drag & drop your CSV file here, or click to browse.',
      supportedBanks: 'Optimized for standard bank exports (Chase, Nubank, Itaú, etc)',
      aiWorking: 'AI Auditor is analyzing your finances...',
      steps: [
        "Reading CSV Structure...",
        "Processing Profile & Context...",
        "Identifying Recurring Subscriptions...",
        "Benchmarking against National Averages...",
        "Generating Strategic Insights..."
      ],
      securedBy: 'Processing secured by Gemini Flash'
    },
    upload: {
      active: "Drop the file to start!",
      passive: "Upload Bank Statement",
      desc: "Drag & drop your CSV file here, or click to browse.",
      supports: "Supports .csv files from major banks.",
      selectBtn: "Select File"
    },
    report: {
      analysisComplete: "Analysis Complete",
      titlePrefix: "Report",
      detectedPeriod: "Statement Period",
      printBtn: "Print Report",
      aiAnalysisTitle: "Executive AI Summary",
      anomalyTitle: "Anomaly Detected",
      actionsTitle: "Recommended Actions",
      subscriptionTitle: "Subscription Hunter",
      subscriptionDesc: "We detected {count} recurring charges. Optimizing these could significantly impact your annual savings.",
      annualCost: "Projected Annual Cost",
      perYear: "/ year",
      healthScore: "Health Score",
      burnRate: "Spending Pace",
      spendingMix: "Category Split",
      transactionsTitle: "Categorized Transactions",
      viewAll: "View Full List",
      table: {
        transaction: "Transaction",
        category: "Category",
        date: "Date",
        value: "Amount"
      },
      scores: {
        excellent: "Excellent",
        good: "Good",
        needsWork: "Needs Work"
      },
      defaults: {
        actions: [],
        transactions: []
      }
    },
    reportsPage: {
      title: "Deep Dive Analysis",
      subtitle: "A comprehensive look at the insights generated by Gemini based on your latest upload.",
      noData: "No analysis found. Please upload a CSV first.",
      sections: {
        metrics: "Key Financial Metrics",
        strategy: "Strategic Financial Advice",
        budget: "50/30/20 Rule Breakdown",
        waste: "Potential Waste / Small Leaks",
        anomalies: "Anomalies & Security Flags",
        categories: "Spending by Category",
        subscriptions: "Subscription Audit",
        actions: "Recommended Next Steps"
      },
      metrics: {
        runway: "Runway Estimate",
        runwayDesc: "Days you can survive on current funds without income.",
        savingsRate: "Savings Rate",
        savingsDesc: "Percentage of total income saved.",
        discretionary: "Discretionary Spending",
        discretionaryDesc: "Percentage spent on 'wants' vs 'needs'."
      },
      budgetLabels: {
        needs: "Needs (50%)",
        wants: "Wants (30%)",
        savings: "Savings (20%)",
        ideal: "Target",
        actual: "Actual"
      },
      wasteDesc: "Recurring small expenses that accumulate over time.",
      anomalyDesc: "Unusual spending patterns or outliers detected.",
      largestCat: "Largest Spending Category"
    },
    settings: {
      title: "System Settings",
      subtitle: "Manage your personal information, billing, and system preferences.",
      tabs: {
        profile: "Profile & Security",
        credits: "Plan & Credits"
      },
      profile: {
        avatarTitle: "Your Avatar",
        avatarDesc: "This will be displayed on your profile.",
        upload: "Upload New",
        delete: "Delete",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        save: "Save Changes",
        aiPreferences: "AI Auditor Personality",
        aiDesc: "Adjust how strict the AI auditor should be with your spending habits.",
        modeConservative: "Supportive Coach",
        modeBrutal: "Brutal CFO",
        modeDesc: "The Brutal CFO mode will not hold back on criticizing bad financial habits."
      },
      credits: {
        balance: "Available Balance",
        history: "Transaction History",
        date: "Date",
        amount: "Amount",
        status: "Status",
        invoice: "Invoice"
      }
    },
    error404: {
      title: "404 - Page Not Found",
      message: "The path you are looking for does not exist. Let's get you back on track.",
      backBtn: "Back to Dashboard"
    },
    emptyState: {
      title: "No data available",
      desc: "You haven't uploaded a bank statement yet. Start your first analysis to unlock insights.",
      action: "Upload First File"
    },
    checkout: {
      title: "Add Credits",
      planLabel: "Select a Package",
      oneCredit: "1 Credit",
      fiveCredits: "5 Credits",
      oneTime: "One-time payment",
      bestValue: "BEST VALUE",
      save: "Save up to 30%",
      methodLabel: "Payment Method",
      pix: "PIX (Instant)",
      card: "Credit Card",
      scanPix: "Scan with your bank app",
      copyPix: "Copy PIX Code",
      cardNumber: "Card Number",
      expiry: "Expiry",
      cvc: "CVC",
      cardholder: "Cardholder Name",
      total: "Total",
      confirm: "Confirm Payment",
      successTitle: "Payment Successful!",
      successDescOne: "1 Credit has been added to your account.",
      successDescFive: "5 Credits have been added to your account.",
      successDescTen: "10 Credits have been added to your account.",
      tenCredits: "10 Credits",
      popular: "MOST POPULAR",
    },
    history: {
      title: "Audit History",
      subtitle: "Review past financial reports and track your score over time.",
      search: "Search by filename...",
      filterAll: "All Time",
      table: {
        date: "Date",
        file: "Arquivo",
        score: "Score",
        value: "Despesa Total",
        actions: "Ações"
      },
      showing: "Showing results"
    },
    common: {
      loading: 'Loading...'
    }
  },
  pt: {
    sidebar: {
      dashboard: 'Painel Principal',
      upload: 'Nova Análise',
      audits: 'Histórico',
      reports: 'Relatórios IA',
      settings: 'Configurações',
      credits: 'Meus Créditos',
      topUp: 'Comprar Créditos',
      signOut: 'Sair da Conta',
    },
    anamnesis: {
      title: "Perfil Financeiro",
      subtitle: "Ajude nossa IA a entender seu contexto para uma análise personalizada.",
      step1: "Dados Pessoais",
      step2: "Patrimônio",
      step3: "Objetivos",
      labels: {
        age: "Idade",
        occupation: "Profissão / Cargo",
        invested: "Total Investido Atualmente (R$)",
        family: "Estado Civil / Família",
        goals: "Principais Objetivos"
      },
      options: {
        single: "Solteiro(a)",
        married: "Casado(a)",
        married_kids: "Casado(a) com filhos",
        single_parent: "Mãe/Pai Solo",
        goal_retirement: "Aposentadoria Cedo",
        goal_debt: "Quitar Dívidas",
        goal_house: "Comprar Imóvel",
        goal_travel: "Viagens / Lifestyle",
        goal_emergency: "Reserva de Emergência"
      },
      next: "Próximo Passo",
      analyze: "Iniciar Análise IA",
      useSaved: "Pular e Usar Perfil Salvo",
      savedProfileFound: "Encontramos um perfil salvo anteriormente."
    },
    login: {
      tagline: 'Auditoria Financeira com IA 2.0',
      heroTitle: 'Domine suas finanças',
      heroSubtitle: 'sem complicações.',
      heroDesc: 'Envie seus extratos bancários e deixe nossa IA Gemini analisar padrões, detectar assinaturas ocultas e calcular sua saúde financeira em segundos.',
      features: [
        'Análise detalhada de 12+ categorias de gastos',
        'Detecção de assinaturas e "gastos fantasmas"',
        'Análise da regra 50/30/20 personalizada',
        'Privacidade total - dados processados em memória'
      ],
      welcome: 'Bem-vindo(a) de volta',
      enterDetails: 'Insira seus dados para acessar.',
      emailLabel: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      passwordLabel: 'Senha',
      forgotPass: 'Esqueci minha senha',
      signInBtn: 'Acessar Painel',
      orContinue: 'Ou continue com',
      google: 'Google',
      apple: 'Apple',
      needAccount: 'Não tem conta?',
      requestAccess: 'Criar conta'
    },
    dashboard: {
      title: 'Visão Geral Financeira',
      subtitle: "Olá. Aqui está o raio-x da sua saúde financeira hoje.",
      timeFilters: {
        days30: "30 Dias",
        months3: "3 Meses",
        year: "Ano"
      },
      cards: {
        health: "Score de Saúde Financeira",
        income: "Receita Total",
        expenses: "Despesas Totais",
        cashflow: "Fluxo de Caixa",
        subscriptions: "Assinaturas Recorrentes",
        aiTip: "Insight da IA"
      },
      healthStatus: {
        excellent: "Condição Excelente",
        good: "Condição Saudável",
        poor: "Atenção Necessária",
        desc: "Seus hábitos financeiros estão melhores que {percent}% dos usuários."
      },
      vsLastMonth: "vs mês anterior",
      lessThanLast: "Menor que o período anterior",
      viewAll: "Ver Detalhes",
      addCredits: "Adicionar Créditos"
    },
    uploadPage: {
      title: 'Nova Análise',
      welcome: "Envie um novo extrato bancário (CSV) para gerar um relatório atualizado.",
      complete: 'Análise finalizada. Confira seu score e insights abaixo.',
      loadDemo: 'Carregar Demo',
      addCredits: 'Comprar Créditos',
      analyzeNew: 'Analisar Novo Arquivo',
      uploadTitle: 'Upload de Extrato',
      uploadDesc: 'Arraste seu arquivo CSV aqui ou clique para selecionar.',
      supportedBanks: 'Compatível com Nubank, Itaú, Bradesco, Inter, Santander e outros.',
      aiWorking: 'O Auditor IA está analisando suas finanças...',
      steps: [
        "Lendo estrutura do arquivo CSV...",
        "Processando Perfil e Contexto...",
        "Identificando assinaturas recorrentes...",
        "Comparando com média nacional...",
        "Gerando consultoria estratégica personalizada..."
      ],
      securedBy: 'Processamento seguro via Gemini Flash'
    },
    upload: {
      active: "Pode soltar o arquivo!",
      passive: "Enviar Extrato Bancário",
      desc: "Arraste e solte seu arquivo CSV aqui.",
      supports: "Suporta arquivos .csv da maioria dos bancos.",
      selectBtn: "Selecionar Arquivo"
    },
    report: {
      analysisComplete: "Análise Concluída",
      titlePrefix: "Relatório",
      detectedPeriod: "Período Analisado",
      printBtn: "Imprimir / PDF",
      aiAnalysisTitle: "Parecer Executivo da IA",
      anomalyTitle: "Anomalia Detectada",
      actionsTitle: "Ações Recomendadas",
      subscriptionTitle: "Caçador de Assinaturas",
      subscriptionDesc: "Detectamos {count} cobranças recorrentes. Otimizar estes serviços pode gerar uma economia significativa anual.",
      annualCost: "Custo Anual Projetado",
      perYear: "/ ano",
      healthScore: "Score de Saúde",
      burnRate: "Ritmo de Gastos",
      spendingMix: "Divisão por Categoria",
      transactionsTitle: "Transações Categorizadas",
      viewAll: "Ver Lista Completa",
      table: {
        transaction: "Descrição",
        category: "Categoria",
        date: "Data",
        value: "Valor"
      },
      scores: {
        excellent: "Excelente",
        good: "Bom",
        needsWork: "Atenção"
      },
      defaults: {
        actions: [],
        transactions: []
      }
    },
    reportsPage: {
      title: "Análise Detalhada",
      subtitle: "Um mergulho profundo nos insights gerados pelo Gemini com base no seu último envio.",
      noData: "Nenhuma análise encontrada. Por favor, envie um CSV primeiro.",
      sections: {
        metrics: "Métricas Financeiras",
        strategy: "Consultoria Estratégica",
        budget: "Análise da Regra 50/30/20",
        waste: "Vazamentos e Desperdícios",
        anomalies: "Anomalias e Segurança",
        categories: "Gastos por Categoria",
        subscriptions: "Auditoria de Assinaturas",
        actions: "Próximos Passos Recomendados"
      },
      metrics: {
        runway: "Estimativa de Runway",
        runwayDesc: "Dias que você sobreviveria com o saldo atual sem renda.",
        savingsRate: "Taxa de Poupança",
        savingsDesc: "Porcentagem da renda total destinada a economias.",
        discretionary: "Gastos Discricionários",
        discretionaryDesc: "Porcentagem gasta em 'desejos' vs 'necessidades'."
      },
      budgetLabels: {
        needs: "Necessidades (50%)",
        wants: "Desejos (30%)",
        savings: "Poupança (20%)",
        ideal: "Meta",
        actual: "Real"
      },
      wasteDesc: "Pequenas despesas recorrentes que acumulam grandes valores.",
      anomalyDesc: "Padrões de gastos incomuns ou fora do perfil detectados.",
      largestCat: "Maior Categoria de Gastos"
    },
    settings: {
      title: "Configurações do Sistema",
      subtitle: "Gerencie suas informações, plano e preferências da IA.",
      tabs: {
        profile: "Perfil e Segurança",
        credits: "Plano e Créditos"
      },
      profile: {
        avatarTitle: "Seu Avatar",
        avatarDesc: "Esta imagem será exibida no seu perfil.",
        upload: "Alterar Foto",
        delete: "Remover",
        firstName: "Nome",
        lastName: "Sobrenome",
        email: "E-mail",
        save: "Salvar Alterações",
        aiPreferences: "Personalidade do Auditor IA",
        aiDesc: "Ajuste o quão rigoroso o auditor deve ser nas análises.",
        modeConservative: "Consultor Amigável",
        modeBrutal: "CFO Brutal",
        modeDesc: "O modo CFO Brutal fará críticas ácidas e diretas sobre maus hábitos."
      },
      credits: {
        balance: "Saldo Disponível",
        history: "Histórico de Transações",
        date: "Data",
        amount: "Valor",
        status: "Status",
        invoice: "Fatura"
      }
    },
    error404: {
      title: "404 - Página não encontrada",
      message: "O caminho que você tentou acessar não existe. Vamos voltar para o painel.",
      backBtn: "Voltar ao Painel"
    },
    emptyState: {
      title: "Nenhum dado disponível",
      desc: "Você ainda não enviou nenhum extrato. Comece sua primeira análise para ver a mágica acontecer.",
      action: "Enviar Primeiro Arquivo"
    },
    checkout: {
      title: "Adicionar Créditos",
      planLabel: "Selecione um Pacote",
      oneCredit: "1 Crédito",
      fiveCredits: "5 Créditos",
      oneTime: "Pagamento único",
      bestValue: "MELHOR VALOR",
      save: "Economize até 30%",
      methodLabel: "Método de Pagamento",
      pix: "PIX (Instantâneo)",
      card: "Cartão de Crédito",
      scanPix: "Escaneie no app do banco",
      copyPix: "Copiar Código PIX",
      cardNumber: "Número do Cartão",
      expiry: "Validade",
      cvc: "CVC",
      cardholder: "Nome no Cartão",
      total: "Total",
      confirm: "Ir para Pagamento",
      successTitle: "Pagamento Aprovado!",
      successDescOne: "1 Crédito foi adicionado à sua conta.",
      successDescFive: "5 Créditos foram adicionados à sua conta.",
      successDescTen: "10 Créditos foram adicionados à sua conta.",
      tenCredits: "10 Créditos",
      popular: "MAIS POPULAR",
    },
    history: {
      title: "Histórico de Auditorias",
      subtitle: "Revise relatórios passados e acompanhe sua evolução.",
      search: "Buscar por nome do arquivo...",
      filterAll: "Todo o período",
      table: {
        date: "Data",
        file: "Arquivo",
        score: "Score",
        value: "Despesa Total",
        actions: "Ações"
      },
      showing: "Exibindo resultados"
    },
    common: {
      loading: 'Carregando...'
    }
  }
};