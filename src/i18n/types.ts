/**
 * i18n Type Definitions
 * Complete schema for bilingual English (LTR) and Persian (RTL) localization.
 */

export type Locale = 'en' | 'fa';
export type TextDirection = 'ltr' | 'rtl';

export interface TranslationSchema {
  common: {
    appName: string;
    appTagline: string;
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    reset: string;
    edit: string;
    confirm: string;
    back: string;
    next: string;
    status: string;
    ready: string;
    unconfigured: string;
    offline: string;
    error: string;
    success: string;
    warning: string;
    viewDetails: string;
    hideDetails: string;
    copy: string;
    copied: string;
    close: string;
    download: string;
    refresh: string;
    search: string;
    all: string;
    actions: string;
    active: string;
    completed: string;
    pending: string;
    learnMore: string;
    retry: string;
    clear: string;
    preview: string;
    export: string;
    dismiss: string;
    required: string;
    optional: string;
    step: string;
    of: string;
    foundationReady: string;
    aiStudioSubhead: string;
    footerCopyright: string;
    footerHighlights: string;
  };

  navigation: {
    home: string;
    workflow: string;
    repoAnalysis: string;
    settings: string;
    architecture: string;
    domainModels: string;
    systemHealth: string;
    providerStatus: string;
    phase1Scope: string;
  };

  home: {
    badgePrefix: string;
    badgeSuffix: string;
    readyTitle: string;
    readySubtitle: string;
    quickActions: string;
    auditExistingRepo: string;
    startNewHarness: string;
    resumeStage: string;
    currentProjectOverview: string;
    projectType: string;
    stage: string;
    harnessLevel: string;
    validationStatus: string;
    validationPassed: string;
    validationIssues: string;
    activeEngines: string;
    noActiveEngines: string;
    changeSettings: string;
    quickWorkflowOverview: string;
    recentActivity: string;
    localFirstNotice: string;
    noTelemetryNotice: string;
    multiAgentNotice: string;
    untitledProject: string;
  };

  wizard: {
    title: string;
    subtitle: string;
    stepPrefix: string;
    stepOf: string;
    activeStepBadge: string;
    completedBadge: string;
    pendingBadge: string;
    nextStepBtn: string;
    prevStepBtn: string;
    finishExportBtn: string;
    generatingPlan: string;
    generatingFiles: string;
    analyzingWithAi: string;
    validatingInvariants: string;
    cannotProceedError: string;
    fillRequiredFields: string;
    progressiveDisclosureToggleShow: string;
    progressiveDisclosureToggleHide: string;
    expertSettingsNote: string;
    beginnerFriendlyBadge: string;
    expertBadge: string;
    stepList: {
      1: { title: string; desc: string };
      2: { title: string; desc: string };
      3: { title: string; desc: string };
      4: { title: string; desc: string };
      5: { title: string; desc: string };
      6: { title: string; desc: string };
      7: { title: string; desc: string };
      8: { title: string; desc: string };
    };
  };

  workflow: {
    title: string;
    subtitle: string;
    steps: {
      intake: string;
      intakeDesc: string;
      analysis: string;
      analysisDesc: string;
      specification: string;
      specificationDesc: string;
      planning: string;
      planningDesc: string;
    };

    projectTypes: {
      web: string;
      desktop: string;
      mobile: string;
      api: string;
      cli: string;
      library: string;
      service: string;
      other: string;
    };

    form: {
      projectName: string;
      projectNamePlaceholder: string;
      projectNameHelp: string;
      projectType: string;
      projectTypeHelp: string;
      description: string;
      descriptionPlaceholder: string;
      descriptionHelp: string;
      targetUsers: string;
      targetUsersPlaceholder: string;
      targetUsersHelp: string;
      preferredTechnology: string;
      preferredTechnologyPlaceholder: string;
      preferredTechnologyHelp: string;
      primaryGoals: string;
      primaryGoalsPlaceholder: string;
      primaryGoalsHelp: string;
      coreFeatures: string;
      coreFeaturesPlaceholder: string;
      coreFeaturesHelp: string;
      advancedSectionTitle: string;
      advancedSectionSubtitle: string;
      constraints: string;
      constraintsPlaceholder: string;
      constraintsHelp: string;
      technicalRequirements: string;
      technicalRequirementsPlaceholder: string;
      technicalRequirementsHelp: string;
      securityRequirements: string;
      securityRequirementsPlaceholder: string;
      securityRequirementsHelp: string;
      testingExpectations: string;
      testingExpectationsPlaceholder: string;
      testingExpectationsHelp: string;
      definitionOfDone: string;
      definitionOfDonePlaceholder: string;
      definitionOfDoneHelp: string;
      multiAgent: string;
      multiAgentDesc: string;
      runAnalysisBtn: string;
      saveDraftBtn: string;
      resetBtn: string;
    };

    analysis: {
      title: string;
      subtitle: string;
      analyzingNotice: string;
      understoodTitle: string;
      missingTitle: string;
      ambiguitiesTitle: string;
      assumptionsTitle: string;
      suggestedFieldsTitle: string;
      questionsTitle: string;
      recommendedLevel: string;
      confidence: string;
      applySuggestion: string;
      applied: string;
      answerPrompt: string;
      answerPlaceholder: string;
      submitAnswer: string;
      proceedToSpec: string;
      proceedToConfig: string;
      reRunAnalysis: string;
      noGapsFound: string;
    };

    specification: {
      title: string;
      subtitle: string;
      harnessSelectionTitle: string;
      harnessSelectionDesc: string;
      specOverviewTitle: string;
      exportSpecJson: string;
      downloadSpecBtn: string;
      savedNotice: string;
    };

    harnessConfig: {
      title: string;
      subtitle: string;
      levelSelectionTitle: string;
      levelSelectionDesc: string;
      recommendedTag: string;
      rationaleTitle: string;
      subsystemsTitle: string;
      subsystemsDesc: string;
      multiAgentTitle: string;
      multiAgentDesc: string;
      proceedToPlanReview: string;
    };

    planReview: {
      title: string;
      subtitle: string;
      overviewTitle: string;
      directoryStructureTitle: string;
      selectedArtifactsTitle: string;
      generationOrderTitle: string;
      customRulesTitle: string;
      addRulePlaceholder: string;
      addRuleBtn: string;
      rulesEmptyState: string;
      artifactCountLabel: string;
      proceedToGeneration: string;
    };

    generateStructure: {
      title: string;
      subtitle: string;
      generatingNotice: string;
      generatedSuccessTitle: string;
      artifactExplorerTitle: string;
      allCategories: string;
      filePreviewTitle: string;
      copyContentBtn: string;
      downloadAllJsonBtn: string;
      proceedToValidation: string;
      fileStats: string;
      noFileSelected: string;
    };

    validateResult: {
      title: string;
      subtitle: string;
      allPassedTitle: string;
      issuesFoundTitle: string;
      invariantsListTitle: string;
      recheckBtn: string;
      proceedToExport: string;
      repairHint: string;
      gateEvaluationsTitle: string;
    };

    exportDestination: {
      title: string;
      subtitle: string;
      chooseDestination: string;
      zipTab: string;
      localFsTab: string;
      githubTab: string;
      exportSummary: string;
      finishNotice: string;
      congratulationsTitle: string;
      restartWorkflowBtn: string;
    };

    planView: {
      title: string;
      subtitle: string;
      generatePlanBtn: string;
      replanBtn: string;
      planOverview: string;
      subsystemsTitle: string;
      subsystemsDesc: string;
      artifactsTree: string;
      filePreview: string;
      validationReport: string;
      validationPassed: string;
      validationIssues: string;
      copyFileContent: string;
      fileCopied: string;
      downloadAllJson: string;
      generationOrderTitle: string;
    };
  };

  settings: {
    title: string;
    subtitle: string;
    tabs: {
      aiProviders: string;
      github: string;
      privacy: string;
      language: string;
      credentials: string;
      diagnostics: string;
    };
    ai: {
      title: string;
      desc: string;
      activeProviderBadge: string;
      setActiveBtn: string;
      geminiTitle: string;
      geminiDesc: string;
      geminiKeyLabel: string;
      geminiKeyPlaceholder: string;
      testGeminiBtn: string;
      geminiConfiguredNotice: string;
      localTitle: string;
      localDesc: string;
      localEndpointLabel: string;
      localModelLabel: string;
      testLocalBtn: string;
      ollamaCorsNotice: string;
      customTitle: string;
      customDesc: string;
      customEndpointLabel: string;
      customModelLabel: string;
      customKeyLabel: string;
      testCustomBtn: string;
      safeFallbackTitle: string;
      safeFallbackDesc: string;
    };
    github: {
      title: string;
      desc: string;
      tokenLabel: string;
      tokenPlaceholder: string;
      tokenHelp: string;
      showTokenBtn: string;
      hideTokenBtn: string;
      testGithubBtn: string;
      accountTitle: string;
      userLabel: string;
      rateLimitLabel: string;
      scopesLabel: string;
      connectionError: string;
    };
    privacy: {
      title: string;
      desc: string;
      localFirstTitle: string;
      localFirstDesc: string;
      noTelemetryTitle: string;
      noTelemetryDesc: string;
      secretScrubbingTitle: string;
      secretScrubbingDesc: string;
    };
    language: {
      title: string;
      desc: string;
      selectLocale: string;
      englishOption: string;
      persianOption: string;
      rtlNotice: string;
      fontPreviewTitle: string;
      fontPreviewText: string;
    };
    credentials: {
      title: string;
      desc: string;
      vaultTitle: string;
      storedKeysCount: string;
      purgeBtn: string;
      purgeModalTitle: string;
      purgeModalDesc: string;
      purgeConfirmBtn: string;
      purgeCancelBtn: string;
      purgeSuccessNotice: string;
    };
    diagnostics: {
      title: string;
      desc: string;
      runAllTestsBtn: string;
      allPassedNotice: string;
      failuresNotice: string;
      serviceCol: string;
      statusCol: string;
      latencyCol: string;
      detailsCol: string;
    };
  };

  export: {
    modalTitle: string;
    modalSubtitle: string;
    zip: {
      tabTitle: string;
      title: string;
      desc: string;
      downloadBtn: string;
      downloadingBtn: string;
      successNotice: string;
      fileCountLabel: string;
      sizeLabel: string;
    };
    localFs: {
      tabTitle: string;
      title: string;
      desc: string;
      selectDirBtn: string;
      exportingBtn: string;
      successNotice: string;
      browserSupportNotice: string;
    };
    github: {
      tabTitle: string;
      title: string;
      desc: string;
      repoSelectLabel: string;
      selectRepoPlaceholder: string;
      refreshReposBtn: string;
      branchLabel: string;
      createNewBranchCheckbox: string;
      commitMessageLabel: string;
      previewDiffBtn: string;
      changePreviewTitle: string;
      previewNotice: string;
      pathCol: string;
      statusCol: string;
      conflictCol: string;
      actionCol: string;
      resolutionKeep: string;
      resolutionOverwrite: string;
      resolutionRename: string;
      confirmCheckboxLabel: string;
      commitBtn: string;
      committingBtn: string;
      commitSuccessNotice: string;
      viewOnGithubBtn: string;
    };
  };

  layers: {
    presentation: string;
    presentationDesc: string;
    application: string;
    applicationDesc: string;
    domain: string;
    domainDesc: string;
    infrastructure: string;
    infrastructureDesc: string;
    providers: string;
    providersDesc: string;
  };

  harness: {
    levels: {
      basic: { title: string; desc: string };
      medium: { title: string; desc: string };
      advanced: { title: string; desc: string };
      dynamic: { title: string; desc: string };
    };
    principles: {
      instructions: string;
      state: string;
      scope: string;
      verification: string;
      sessionLifecycle: string;
      observability: string;
    };
  };

  foundation: {
    phase1Title: string;
    phase1Subtitle: string;
    activePhaseNotice: string;
    strictBoundariesTitle: string;
    strictBoundariesDesc: string;
    inspectArchitecture: string;
    inspectDomain: string;
    inspectSystemHealth: string;
    storageStatus: string;
    credentialsStatus: string;
    validationStatus: string;
    i18nStatus: string;
    readyForPhase2: string;
  };

  validation: {
    passed: string;
    failed: string;
    warnings: string;
    errors: string;
    invariantsTitle: string;
    noIssuesNotice: string;
  };

  errors: {
    validationFailed: string;
    unknownError: string;
    storageUnavailable: string;
  };

  repoAnalysis: {
    title: string;
    subtitle: string;
    scanSource: string;
    localFiles: string;
    githubRepo: string;
    sampleFixtures: string;
    selectFixture: string;
    scanBtn: string;
    scanning: string;
    auditMatrix: string;
    detectedStack: string;
    inventory: string;
    gaps: string;
    risks: string;
    remediationTitle: string;
    remediationDesc: string;
    adoptRemediation: string;
    readOnlyNotice: string;
    dimensionPresent: string;
    dimensionPartial: string;
    dimensionMissing: string;
    maturityScoreLabel: string;
    gapsIdentified: string;
  };
}
